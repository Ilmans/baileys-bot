const ResponFormatter = require("../lib/responFormatter");

class MessageHandler {
  constructor() {
    this.responFormatter = new ResponFormatter();
  }
  async process({ name, from, groupId, text, file, location }) {
    return this.responFormatter
      .line(`Hello ${name}, you sent me this message: ${text}`)
      .line("I'm a bot, I can't do much yet.")
      .responAsMedia(
        "https://res.cloudinary.com/startup-grind/image/upload/c_scale,w_2560/c_crop,h_640,w_2560,y_0.0_mul_h_sub_0.0_mul_640/c_crop,h_640,w_2560/c_fill,dpr_2.0,f_auto,g_center,q_auto:good/v1/gcs/platform-data-goog/event_banners/gdev-eccosystems-bevy-chapters-background-blue_rCAKIc6.png",
        "image",
        "mpediastore.svg"
      );
  }
}

module.exports = MessageHandler;
