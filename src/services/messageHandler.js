class MessageHandler {
  async process({ name, from, groupId, text, file, location }) {
    return {
      text: "Hello World!",
    };
  }
}

module.exports = MessageHandler;
