// Import Express
const express = require("express");
const WhatsappService = require("./services/whatsappService");
const nodecache = require("node-cache");

const app = express();

const whatsapp = new WhatsappService();


const NodeCache = new nodecache();

whatsapp.connectToWhatsapp(NodeCache);
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
