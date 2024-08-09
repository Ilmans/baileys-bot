# WhatsApp AI Bot with Gemini AI & OpenAI

Welcome to the WhatsApp AI Bot project! This bot leverages the power of Gemini AI and OpenAI to bring smart, responsive AI capabilities directly to your WhatsApp chats. Whether you want to create stickers or have a conversation with AI, this bot has got you covered!

This project is built using the following whatsapp tools:
- **WhatsApp Tools**: [@WhiskeySockets/baileys](https://github.com/WhiskeySockets/Baileys)

## Features

- **AI Chat**: Engage in intelligent conversations powered by Gemini AI or OpenAI.
- **Sticker Creation**: Easily convert images into WhatsApp stickers.

## Installation

To get started, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Ilmans/baileys-bot.git
   cd baileys-bot
   ```

2. **Rename and configure `.env` file**:

   - Rename `.env.example` to `.env`.
   - Fill in your `gemini_key` or `openai_key`.
   - Set `bot_active` to either `gemini` or `openai` based on the AI service you want to use.

3. **Install dependencies and start the bot**:

   ```bash
   npm install
   npm run start
   ```

4. **Scan QR Code**:
   - After running the start command, a QR code will appear in your terminal.
   - Scan the QR code using your WhatsApp application to connect.

## Commands

Once the bot is connected, you can use the following commands:

1. **/start**: Start the bot and activate AI features.
2. **/stiker**: Convert an image into a WhatsApp sticker (send the `/stiker` command followed by an image).
3. **/stop**: Stop the bot and deactivate AI features.
4. **AI Responses**: Any message that isn't a command will be handled by the AI (if the bot is started).

## License

This project is licensed under the MIT License.

---

Happy chatting with your new WhatsApp AI bot! 🎉
