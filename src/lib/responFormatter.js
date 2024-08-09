class ResponFormatter {
  constructor() {
    this.lines = [];
    this.footer = "";
    this.quoted = false;
    this.image = null;
  }

  // new line
  line(text = "") {
    this.lines.push(text);
    return this;
  }

  // bold
  bold(text = "") {
    this.lines.push(`*${text}*`);
    return this;
  }

  italic(text = "") {
    this.lines.push(`_${text}_`);
    return this;
  }

  quoted() {
    this.quoted = true;
    return this;
  }

//   addImage(url = null) {
//     this.image = { url: url };
//     return this;
//   }

  convertLines() {
    return this.lines.join("\n");
  }

  footer(footer = "") {
    this.footer = footer;
    return this;
  }

  responAsText() {
    return JSON.stringify({
      text: this.convertLines(),
      quoted: this.quoted,
    });
  }

  responAsMedia(url = "", type = "image", filename = null) {
    return JSON.stringify({
      type: type, // image, video, document, or audio
      url: url,
      filename: filename, // optional
      caption: this.convertLines(),
    });
  }

  responAsAudio(url = "", ptt = true) {
    const message = {
      audio: { url: url },
      ptt: ptt,
      mimetype: "audio/mpeg",
      caption: this.convertLines(),
    };
    return JSON.stringify(message);
  }
}

module.exports = ResponFormatter;
