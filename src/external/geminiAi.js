const { GoogleGenerativeAI } = require("@google/generative-ai");
const { manageMessagesCache } = require("../lib/helper");
class GeminiAi {
  static async run(from, message) {
    const genAi = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });

    const history = manageMessagesCache(from, "user", message);
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 100 },
    });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    manageMessagesCache(from, "model", text);
    console.log("text", text);

    return text;
  }
}

module.exports = GeminiAi;
