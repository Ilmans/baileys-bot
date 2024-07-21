const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  default: makeWASocket,
  Browsers,
  DisconnectReason,
  getContentType,
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const MAIN_LOGGER = require("../lib/pino");
const { getMediaMessage } = require("../lib/helper");
const logger = MAIN_LOGGER.child({ module: "whatsapp" });
const fs = require("fs");
const Long = require("long");

class WhatsappService {
  constructor(NodeCache) {
    this.instanceQr = {
      count: 0,
      qr: "",
    };
    this.nodeCache = NodeCache;
  }

  async defineAuthState() {
    return await useMultiFileAuthState("./auth");
  }

  async clearAuthState() {
    await fs.promises.rmdir("./auth", { recursive: true });
  }

  async setSocket() {
    this.endSession = false;
    this.authState = await this.defineAuthState();
    const { version } = await fetchLatestBaileysVersion();
    const browser = Browsers.ubuntu("chrome");

    return makeWASocket({
      auth: {
        creds: this.authState.state.creds,
        keys: makeCacheableSignalKeyStore(this.authState.state.keys, logger),
      },
      printQRInTerminal: true,
      logger,
      browser,
      version,
      connectTimeoutMs: 60 * 1000,
      qrTimeout: 30000,
      emitOwnEvents: true,
      msgRetryCounterCache: this.nodeCache,
      generateHighQualityLinkPreview: true,
    });
  }

  async connectToWhatsapp() {
    try {
      this.instanceQr.count = 0;
      this.client = await this.setSocket();
      this.eventHandler();
      return this.client;
    } catch (error) {
      console.log(error);
    }
  }

  async connectionUpdate({ qr, connection, lastDisconnect }) {
    if (qr) {
      console.log("Please scan the QR code");
      if (this.instanceQr.count > 3) {
        this.instanceQr.count = 0;
        this.instanceQr.qr = "";
        this.client.close();
        this.client = await this.setSocket();
      }

      this.instanceQr.count++;
      this.instanceQr.qr = qr;
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      const ErrorType = lastDisconnect.error?.output?.payload?.error;
      if (shouldReconnect) {
        if (
          ErrorType === "Unauthorized" ||
          ErrorType === "Method Not Allowed"
        ) {
          await this.clearAuthState();
        }
        await this.connectToWhatsapp();
      } else {
        this.client?.ws?.close();
        this.client.end(new Error("Close connection"));
      }
    }
    if (connection === "open") {
      console.log(
        `
        ┌──────────────────────────────┐
        │    CONNECTED TO WHATSAPP     │
        └──────────────────────────────┘`.replace(/^ +/gm, "  ")
      );
    }
  }

  async eventHandler() {
    this.client.ev.process((events) => {
      if (events["connection.update"]) {
        this.connectionUpdate(events["connection.update"]);
      }

      if (events["creds.update"]) {
        this.authState.saveCreds();
      }

      if (events["messages.upsert"]) {
        const payload = events["messages.upsert"];
        this.messageHandle["messages.upsert"](payload);
      }
    });
  }

  messageHandle = {
    "messages.upsert": async ({ messages, type }) => {
      for (const received of messages) {
        if (
          type !== "notify" ||
          !received?.message ||
          received.message?.protocolMessage ||
          received.message.senderKeyDistributionMessage
        ) {
          return;
        }

        this.client.sendPresenceUpdate("unavailable");
        if (Long.isLong(received.messageTimestamp)) {
          received.messageTimestamp = received.messageTimestamp?.toNumber();
        }

        const messageRaw = await getMediaMessage(received);
      }
    },
  };
}

module.exports = WhatsappService;
