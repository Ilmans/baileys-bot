const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  default: makeWASocket,
  Browsers,
  DisconnectReason,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const MAIN_LOGGER = require("../lib/pino");
const { getMediaMessage } = require("../lib/helper");
const logger = MAIN_LOGGER.child({ module: "whatsapp" });
const fs = require("fs");
const Long = require("long");
const { default: axios } = require("axios");
const mime = require("mime-types");

class WhatsappService {
  constructor(NodeCache, messageHandler) {
    this.instanceQr = {
      count: 0,
      qr: "",
    };
    this.nodeCache = NodeCache;
    this.messageHandler = messageHandler;
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
      let quoted = false;
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
        try {
          const result = await this.messageHandler.process(messageRaw);
          let reply =
            typeof result === "string" ? result : JSON.stringify(result);
          reply = reply.replace(/{name}/g, messageRaw.name);
          reply = JSON.parse(reply);

          // if respon webhook expecting to send media

          if ("type" in reply) {
            let ownerJid = this.client.user.id.replace(/:\d+/, "");
            if (reply.type == "audio") {
              return await this.client.sendMessage(messages.key.remoteJid, {
                audio: { url: reply.url },
                ptt: true,
                mimetype: "audio/mpeg",
              });
            }
            // for send media ( document/video or image)
            const generate = await this.prepareMediaMessage({
              caption: reply.caption ? reply.caption : "",
              fileName: reply.filename,
              media: reply.url,
              mediatype:
                reply.type !== "video" && reply.type !== "image"
                  ? "document"
                  : reply.type,
            });

            const message = { ...generate.message };

            const k = await this.client.sendMessage(
              received.key.remoteJid,
              {
                forward: {
                  key: { remoteJid: ownerJid, fromMe: true },
                  message: message,
                },
              },
              {
                quoted: quoted ? messages : null,
              }
            );
            console.log("kkk", k);

            //SEND TEXT MESSAGE
          } else {
            await this.client.sendMessage(received.key.remoteJid, reply, {
              quoted: quoted ? messages : null,
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
    },
  };

  async prepareMediaMessage(mediaMessage) {
    try {
      const prepareMedia = await prepareWAMessageMedia(
        {
          [mediaMessage.mediatype]: { url: mediaMessage.media },
        },
        {
          upload: this.client.waUploadToServer,
        }
      );

      const mediaType = mediaMessage.mediatype + "Message";
      if (mediaMessage.mediatype === "document" && !mediaMessage.fileName) {
        const regex = new RegExp(/.*\/(.+?)\./);
        const arrayMatch = regex.exec(mediaMessage.media);
        mediaMessage.fileName = arrayMatch[1];
      }
      let mimetype = mime.lookup(mediaMessage.media);
      if (!mimetype) {
        const head = await axios.head(mediaMessage.media);
        mimetype = head.headers["content-type"];
      }

      if (mediaMessage.media.includes(".cdr")) {
        mimetype = "application/cdr";
      }

      prepareMedia[mediaType].caption = mediaMessage?.caption;
      prepareMedia[mediaType].mimetype = mimetype;
      prepareMedia[mediaType].fileName = mediaMessage.fileName;

      if (mediaMessage.mediatype === "video") {
        prepareMedia[mediaType].jpegThumbnail = Uint8Array.from(
          fs.readFileSync(
            join(process.cwd(), "public", "images", "video-cover.png")
          )
        );
        prepareMedia[mediaType].gifPlayback = false;
      }

      let ownerJid = this.client.user.id.replace(/:\d+/, "");
      return await generateWAMessageFromContent(
        "",
        { [mediaType]: { ...prepareMedia[mediaType] } },
        { userJid: ownerJid }
      );
    } catch (error) {
      console.log("error prepare", error);
      return false;
    }
  }
}

module.exports = WhatsappService;
