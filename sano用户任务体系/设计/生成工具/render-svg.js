const path = require('path');

const [inputPath, outputPath, moduleRoot] = process.argv.slice(2);
if (!inputPath || !outputPath || !moduleRoot) {
  throw new Error('Usage: node render-svg.js <input.svg> <output.png> <node_modules>');
}

const sharp = require(path.join(moduleRoot, 'sharp'));

sharp(inputPath)
  .png()
  .toFile(outputPath)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
