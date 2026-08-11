const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

const inputPath = `C:\\Users\\aksal\\.gemini\\antigravity-ide\\brain\\31116a06-f16c-4222-86b4-cdc3b0bcba00\\hd_character_solid_white_1786427540239.png`;
const outputPath = path.join(__dirname, '..', 'assets', 'images', 'onboarding_character.png');

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function () {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];

        // Convert white/near-white background pixels to transparent
        if (r > 235 && g > 235 && b > 235) {
          this.data[idx + 3] = 0; // Alpha = 0
        }
      }
    }

    this.pack()
      .pipe(fs.createWriteStream(outputPath))
      .on('finish', () => {
        console.log('Successfully created HD transparent PNG!');
      });
  });
