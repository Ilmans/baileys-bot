const { OpenAI } = require("openai");
const { manageMessagesCache } = require("../lib/helper");

class OpenAiLocal {
  static async run(from, message) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    const messages = manageMessagesCache(from, "user", message, false);

    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-3.5-turbo",
      max_tokens: 150,
    });

    const text = completion.choices[0].message.content;
    manageMessagesCache(from, "assistant", text, false);
    return text;
  }
}

module.exports = OpenAiLocal;
