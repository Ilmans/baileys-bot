const ResponFormatter = require("../lib/responFormatter");

class MessageHandler {
    
  constructor() {
    this.responFormatter = new ResponFormatter();
  }
  async process({ name, from, groupId, text, file, location }) {
    return this.responFormatter.line("Hello World").responAsText();
  }
}

module.exports = MessageHandler;
