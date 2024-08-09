const fs = require("fs");

class SenderManager {
  constructor() {
    this.path = `${__dirname}/../data/senders.json`;
    // create file if not exist
    if (!fs.existsSync(this.path)) {
      fs.writeFileSync(this.path, JSON.stringify([]));
    }
  }

  async load() {
    const fileBuffer = fs.readFileSync(this.path, "utf-8");
    const senders = JSON.parse(fileBuffer);
    return senders;
  }

  async save(sender) {
    const senders = await this.load();
    const newSender = { sender };
    senders.push(newSender);
    fs.writeFileSync(this.path, JSON.stringify(senders));
  }

  async check(sender) {
    const senders = await this.load();
    return senders.find((s) => s.sender === sender);
  }

  async remove(sender) {
    const senders = await this.load();
    const newSenders = senders.filter((s) => s.sender !== sender);
    fs.writeFileSync(this.path, JSON.stringify(newSenders));
  }
}

module.exports = SenderManager;
