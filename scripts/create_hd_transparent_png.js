const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const PNG = require('pngjs').PNG;

const inputPath = `C:\\Users\\aksal\\.gemini\\antigravity-ide\\brain\\31116a06-f16c-4222-86b4-cdc3b0bcba00\\hd_character_solid_white_1786427540239.png`;
const outputPath = path.join(__dirname, '..', 'assets', 'images', 'onboarding_character.png');

console.log('Reading HD image...');
const jpegData = fs.readFileSync(inputPath);
const rawImageData = jpeg.decode(jpegData, { useTArray: true });

console.log(`Image decoded! Dimensions: ${rawImageData.width}x${rawImageData.height}`);

const png = new PNG({
  width: rawImageData.width,
  height: rawImageData.height,
});

for (let y = 0; y < rawImageData.height; y++) {
  for (let x = 0; x < rawImageData.width; x++) {
    const idx = (rawImageData.width * y + x) * 4;
    const r = rawImageData.data[idx];
    const g = rawImageData.data[idx + 1];
    const b = rawImageData.data[idx + 2];

    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;

    // Convert white / off-white background to 100% transparent alpha
    if (r > 230 && g > 230 && b > 230) {
      png.data[idx + 3] = 0; // Transparent
    } else {
      png.data[idx + 3] = 255; // Opaque
    }
  }
}

png.pack()
  .pipe(fs.createWriteStream(outputPath))
  .on('finish', () => {
    console.log('SUCCESS! Created high-definition transparent PNG at assets/images/onboarding_character.png');
  });
