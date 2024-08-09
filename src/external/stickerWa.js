const fs = require("fs");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
class StickerWa {
  static async create({ filename, stream, ext }) {
    const tempPath = `${__dirname}/../data/temp/test.png`;
    const pathWebp = `${__dirname}/../data/temp/test.webp`;
    fs.writeFileSync(tempPath, stream);
    if (fs.existsSync(pathWebp)) fs.unlinkSync(pathWebp);
    const sticker = new Sticker(tempPath, {
      pack: "MPedia Pack", // The pack name
      author: "M Pedia", // The author name
      type: StickerTypes.CROPPED,
      categories: ["🤩", "🎉"], // The sticker category
      id: "12345", // The sticker id
      quality: 100, // The quality of the output file
      background: "#000000", // The sticker background color (only for full stickers)
    });
    console.log("Sticker created", sticker);

    const converted = await sticker.toFile(pathWebp);
    return pathWebp;
  }
}

module.exports = StickerWa;
