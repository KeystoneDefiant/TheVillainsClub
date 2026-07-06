import { Jimp } from 'jimp';
import path from 'path';

const logoPath = path.resolve('public/images/logos/VC Logotype - Color.png');

async function generate() {
  console.log('Reading base logo from:', logoPath);
  const image = await Jimp.read(logoPath);

  console.log('Generating favicon.png (32x32)...');
  await image.clone().contain({ w: 32, h: 32 }).write('public/favicon.png');

  console.log('Generating apple-touch-icon.png (180x180)...');
  await image.clone().contain({ w: 180, h: 180 }).write('public/apple-touch-icon.png');

  console.log('Generating android-chrome-192x192.png (192x192)...');
  await image.clone().contain({ w: 192, h: 192 }).write('public/android-chrome-192x192.png');

  console.log('Generating android-chrome-512x512.png (512x512)...');
  await image.clone().contain({ w: 512, h: 512 }).write('public/android-chrome-512x512.png');

  console.log('All branding assets generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
