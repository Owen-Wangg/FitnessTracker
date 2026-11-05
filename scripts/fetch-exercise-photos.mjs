// Downloads the photo for each exercise in src/data/fundamentals.ts from the public-domain
// Free Exercise DB (https://github.com/yuhonas/free-exercise-db, Unlicense), shrinks it to a
// thumbnail, and writes public/exercises/<id>.webp so the app can serve it itself.
// Usage: node scripts/fetch-exercise-photos.mjs   (re-run after adding exercises)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Read the ids straight from the source file: importing the .ts module would need a TypeScript runtime.
const FUNDAMENTALS = [...fs.readFileSync(path.join(root, 'src/data/fundamentals.ts'), 'utf8').matchAll(/\bid: '([^']+)'/g)].map(
  (m) => ({ id: m[1] })
);
const outDir = path.join(root, 'public', 'exercises');
const SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const SIZE = 192; // shown at up to 72px, so this covers 2x screens

fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const { id } of FUNDAMENTALS) {
  const res = await fetch(`${SOURCE}/${id}/0.jpg`);
  if (!res.ok) throw new Error(`${id}: download failed (${res.status})`);
  const out = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78 })
    .toFile(path.join(outDir, `${id}.webp`));
  total += out.size;
}
console.log(`Wrote ${FUNDAMENTALS.length} photos, ${(total / 1024).toFixed(0)} KB total, to public/exercises/`);
