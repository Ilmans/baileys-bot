// Import Express
const express = require("express");
const WhatsappService = require("./services/whatsappService");
const nodecache = require("node-cache");
const MessageHandler = require("./services/messageHandler");

const app = express();

const messageHandler = new MessageHandler();
const whatsapp = new WhatsappService(null, messageHandler);

const NodeCache = new nodecache();

whatsapp.connectToWhatsapp(NodeCache);
// Start the server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
