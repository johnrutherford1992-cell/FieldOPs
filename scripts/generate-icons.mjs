import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

async function generateIcons() {
  const logoPath = path.join(ROOT, 'public/logos/blackstone-white.png');

  // Get logo metadata
  const meta = await sharp(logoPath).metadata();
  console.log(`Logo dimensions: ${meta.width}x${meta.height}`);

  // The geometric "b" mark occupies roughly the left 30% of the logo
  // Crop tight to exclude any text characters
  const markWidth = Math.round(meta.width * 0.30);
  const markRegion = {
    left: 0,
    top: 0,
    width: markWidth,
    height: meta.height
  };

  console.log(`Extracting mark: ${markRegion.width}x${markRegion.height}`);

  // Extract the "b" mark from the white logo
  const markBuffer = await sharp(logoPath)
    .extract(markRegion)
    .trim() // trim transparent edges
    .toBuffer({ resolveWithObject: true });

  console.log(`Trimmed mark: ${markBuffer.info.width}x${markBuffer.info.height}`);

  // Generate icons at both sizes
  for (const size of [512, 192]) {
    // Calculate padding (20% on each side for maskable safe zone)
    const padding = Math.round(size * 0.15);
    const innerSize = size - (padding * 2);

    // Resize the mark to fit within the inner area
    const resizedMark = await sharp(markBuffer.data)
      .resize(innerSize, innerSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer({ resolveWithObject: true });

    console.log(`Resized mark for ${size}: ${resizedMark.info.width}x${resizedMark.info.height}`);

    // Calculate offsets to center the mark
    const left = Math.round((size - resizedMark.info.width) / 2);
    const top = Math.round((size - resizedMark.info.height) / 2);

    // Create the icon: black background with white mark centered
    const icon = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 255 }
      }
    })
      .composite([{
        input: resizedMark.data,
        left: left,
        top: top
      }])
      .png()
      .toBuffer();

    const outPath = path.join(ROOT, `public/icons/icon-${size}.png`);
    writeFileSync(outPath, icon);
    console.log(`Generated: ${outPath} (${icon.length} bytes)`);
  }

  // Generate favicon sizes (16x16, 32x32, 48x48)
  for (const size of [16, 32, 48]) {
    const padding = Math.round(size * 0.1);
    const innerSize = size - (padding * 2);

    const resizedMark = await sharp(markBuffer.data)
      .resize(innerSize, innerSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer({ resolveWithObject: true });

    const left = Math.round((size - resizedMark.info.width) / 2);
    const top = Math.round((size - resizedMark.info.height) / 2);

    const icon = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 255 }
      }
    })
      .composite([{
        input: resizedMark.data,
        left: left,
        top: top
      }])
      .png()
      .toBuffer();

    const outPath = path.join(ROOT, `public/icons/favicon-${size}.png`);
    writeFileSync(outPath, icon);
    console.log(`Generated: ${outPath} (${icon.length} bytes)`);
  }

  console.log('\nDone! Icons generated successfully.');
}

generateIcons().catch(console.error);
