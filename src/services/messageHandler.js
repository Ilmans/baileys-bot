const GeminiAi = require("../external/geminiAi");
const OpenAiLocal = require("../external/openAi");
const StickerWa = require("../external/stickerWa");
const ResponFormatter = require("../lib/responFormatter");
const SenderManager = require("./senderManager");

class MessageHandler {
  constructor() {
    this.responFormatter = new ResponFormatter();
    this.senderManager = new SenderManager();
    this.commands = {
      start: "/start",
      stop: "/stop",
      help: "/help",
      sticker: "/sticker",
    };
  }

  async process({ name, from, groupId, text, file, location }) {
    const isRegistered = await this.senderManager.check(from);

    if (text === this.commands.start) {
      if (!isRegistered) await this.senderManager.save(from);
      return this.responFormatter
        .line("Bot active, happy to use it!")
        .responAsText();
    }

    if (text === this.commands.stop) {
      if (isRegistered) await this.senderManager.remove(from);
      return this.responFormatter
        .line("Bot inactive, see you later!")
        .responAsText();
    }

    if (!isRegistered) return;

    //handle sticker command
    if (text === this.commands.sticker) {
      if (!file)
        return this.responFormatter
          .line("Please send image if using command /sticker")
          .responAsText();
      return this.responFormatter.responSticker(await StickerWa.create(file));
    }

    //handle ai
    try {
      let response;
      if (process.env.BOT_ACTIVE === "openai") {
        response = await OpenAiLocal.run(from, text);
      } else if (process.env.BOT_ACTIVE === "geminiai") {
        response = await GeminiAi.run(from, text);
      } else {
        throw new Error("Invalid BOT_ACTIVE value");
      }

      return this.responFormatter.line(response).responAsText();
    } catch (error) {
      console.log("something went wrong in gemini ai", error);
    }
  }
}

module.exports = MessageHandler;
