"use strict";

// set pino
const pino = require("pino");
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "SYS:standard",
      ignore: "hostname,pid",
      singleLine: false,
      colorize: true,
      levelFirst: true,
      append: true, // the file is opened with the 'a' flag
    },
  },
  // level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  level: "debug",
});

module.exports = logger;
