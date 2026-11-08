// Draws the app icon (a dumbbell in the app's volt green on near-black) and writes everything the
// browser and phones need into public/: favicon.ico, logo192.png, logo512.png, apple-touch-icon.png
// and maskable-512.png. Usage: npm run app-icons   (re-run after changing the drawing below)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public');

const BG = '#0a0c10'; // same as --bg in the dark theme and theme-color
const VOLT = '#c6ff3d'; // same as --accent

// The dumbbell, drawn on a 512 x 512 canvas and centred on (256, 256).
const dumbbell = `
  <rect x="140" y="236" width="232" height="40" rx="10" fill="${VOLT}"/>
  <rect x="100" y="150" width="48" height="212" rx="16" fill="${VOLT}"/>
  <rect x="364" y="150" width="48" height="212" rx="16" fill="${VOLT}"/>
  <rect x="52" y="194" width="38" height="124" rx="13" fill="${VOLT}"/>
  <rect x="422" y="194" width="38" height="124" rx="13" fill="${VOLT}"/>`;

// A bolder version for tiny sizes (browser tab favicons), where thin plates would blur together.
const chunkyDumbbell = `
  <rect x="100" y="224" width="312" height="64" rx="12" fill="${VOLT}"/>
  <rect x="92" y="104" width="84" height="304" rx="22" fill="${VOLT}"/>
  <rect x="336" y="104" width="84" height="304" rx="22" fill="${VOLT}"/>
  <rect x="32" y="168" width="48" height="176" rx="16" fill="${VOLT}"/>
  <rect x="432" y="168" width="48" height="176" rx="16" fill="${VOLT}"/>`;

// `radius` rounds the corners (0 = full square, which phones and the maskable icon want, because the
// system applies its own shape). `scale` shrinks the dumbbell to leave a safe margin.
const icon = (radius: number, scale = 1, shape = dumbbell): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">` +
  `<rect width="512" height="512" rx="${radius}" fill="${BG}"/>` +
  `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${shape}</g></svg>`;

const png = (svg: string, size: number): Promise<Buffer> =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// An .ico file is a small header followed by the images; modern browsers accept PNG images inside it.
const ico = (images: { size: number; data: Buffer }[]): Buffer => {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, at); // width
    header.writeUInt8(size >= 256 ? 0 : size, at + 1); // height
    header.writeUInt8(0, at + 2); // palette colours
    header.writeUInt8(0, at + 3); // reserved
    header.writeUInt16LE(1, at + 4); // colour planes
    header.writeUInt16LE(32, at + 6); // bits per pixel
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
};

const rounded = icon(112);
const square = icon(0);
const maskable = icon(0, 0.8); // content stays inside the circle phones may crop to
const tiny = icon(112, 1, chunkyDumbbell);

fs.mkdirSync(outDir, { recursive: true });
const write = (name: string, data: Buffer) => {
  fs.writeFileSync(path.join(outDir, name), data);
  console.log(`${name}  ${(data.length / 1024).toFixed(1)} KB`);
};

write('logo512.png', await png(rounded, 512));
write('logo192.png', await png(rounded, 192));
write('apple-touch-icon.png', await png(square, 180));
write('maskable-512.png', await png(maskable, 512));
write(
  'favicon.ico',
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size <= 32 ? tiny : rounded, size) }))))
);
