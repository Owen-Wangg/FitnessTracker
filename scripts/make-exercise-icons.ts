// Draws a simple equipment illustration (no people) for each exercise in src/data/fundamentals.ts
// and writes public/exercises/<id>.webp, which the app serves itself.
// Usage: npm run icons   (re-run after adding exercises; add a drawing below)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Read the ids straight from the source file rather than importing it (its imports are written for Vite).
const FUNDAMENTALS = [...fs.readFileSync(path.join(root, 'src/data/fundamentals.ts'), 'utf8').matchAll(/\bid: '([^']+)'/g)].map(
  (m) => ({ id: m[1] })
);
const outDir = path.join(root, 'public', 'exercises');
const SIZE = 192;

const INK = '#334155';
const PAD = '#cbd5e1';
const ACCENT = '#2563eb';
const BG = '#f8fafc';

// --- primitives -------------------------------------------------------------------------------
const line = (x1: number, y1: number, x2: number, y2: number, { w = 5, c = INK }: { w?: number; c?: string } = {}): string =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
// A padded bar: dark outline with a light fill.
const pad = (x1: number, y1: number, x2: number, y2: number, w = 14): string => line(x1, y1, x2, y2, { w: w + 6 }) + line(x1, y1, x2, y2, { w, c: PAD });
const circle = (cx: number, cy: number, r: number, fill = 'none'): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="4"/>`;
const rect = (x: number, y: number, w: number, h: number, fill = 'none', r = 3): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="4"/>`;
const floor = (): string => line(14, 172, 178, 172, { w: 4 });
const thin = (points: string): string =>
  `<polyline points="${points}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const arrow = (x1: number, y1: number, x2: number, y2: number): string => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d: number) => `${x2 - 11 * Math.cos(a + d)},${y2 - 11 * Math.sin(a + d)}`;
  return (
    line(x1, y1, x2, y2, { w: 4, c: ACCENT }) +
    `<polyline points="${h(0.5)} ${x2},${y2} ${h(-0.5)}" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
  );
};
const dumbbell = (cx: number, cy: number, rot = 0): string =>
  `<g transform="rotate(${rot} ${cx} ${cy})">` +
  line(cx - 22, cy, cx + 22, cy, { w: 5 }) +
  rect(cx - 30, cy - 12, 10, 24, ACCENT, 3) +
  rect(cx + 20, cy - 12, 10, 24, ACCENT, 3) +
  `</g>`;
// Weight-stack tower with a pulley at (px, py).
const tower = (x: number, top = 22): string =>
  rect(x, top, 26, 150 - top + 0, 'none', 4) +
  [0, 1, 2, 3, 4, 5].map((i) => line(x + 5, top + 24 + i * 16, x + 21, top + 24 + i * 16, { w: 4, c: PAD })).join('');
const pulley = (x: number, y: number): string => circle(x, y, 7, '#fff');

// --- one drawing per exercise id ---------------------------------------------------------------
const DRAW: Record<string, () => string> = {
  Incline_Dumbbell_Press: () =>
    pad(40, 140, 80, 140, 14) + pad(46, 134, 100, 70, 14) + line(62, 146, 62, 172) + line(40, 172, 86, 172) +
    dumbbell(118, 44) + arrow(150, 100, 150, 66),

  Dumbbell_Incline_Row: () =>
    pad(40, 140, 80, 140, 14) + pad(46, 134, 100, 70, 14) + line(62, 146, 62, 172) + line(40, 172, 86, 172) +
    dumbbell(128, 128, 90) + arrow(160, 150, 160, 112),

  Dumbbell_Shoulder_Press: () =>
    pad(44, 134, 100, 134, 14) + pad(52, 128, 52, 60, 14) + line(72, 142, 72, 172) + line(46, 172, 98, 172) +
    dumbbell(76, 30) + arrow(150, 100, 150, 56),

  Seated_Dumbbell_Curl: () =>
    pad(44, 134, 100, 134, 14) + pad(52, 128, 52, 60, 14) + line(72, 142, 72, 172) + line(46, 172, 98, 172) +
    dumbbell(130, 110, 90) + `<path d="M150 150 A34 34 0 0 0 150 84" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round"/>` +
    `<polyline points="143,86 150,82 152,91" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,

  Butterfly: () =>
    pad(96, 140, 96, 78, 24) + pad(96, 152, 96, 152, 24) + line(96, 160, 96, 172) + line(70, 172, 122, 172) +
    line(76, 110, 44, 66, { w: 6 }) + line(116, 110, 148, 66, { w: 6 }) +
    pad(40, 60, 40, 84, 12) + pad(152, 60, 152, 84, 12) +
    arrow(30, 40, 54, 40) + arrow(162, 40, 138, 40),

  Leverage_Chest_Press: () =>
    pad(36, 138, 36, 70, 18) + pad(36, 146, 84, 146, 14) + line(60, 154, 60, 172) + line(30, 172, 130, 172) +
    line(48, 90, 110, 90, { w: 6 }) + line(110, 76, 110, 104, { w: 8 }) + line(110, 90, 148, 90, { w: 5, c: ACCENT }) +
    arrow(122, 60, 154, 60),

  'Wide-Grip_Lat_Pulldown': () =>
    line(36, 22, 156, 22, { w: 6 }) + line(36, 22, 36, 172, { w: 6 }) + pulley(60, 34) + pulley(132, 34) +
    thin('60,41 54,70') + thin('132,41 138,70') + line(40, 72, 152, 72, { w: 6, c: ACCENT }) +
    pad(82, 150, 114, 150, 14) + pad(70, 126, 128, 126, 12) + line(98, 158, 98, 172) + line(60, 172, 140, 172) +
    arrow(96, 86, 96, 112),

  Cable_Seated_Lateral_Raise: () =>
    tower(24) + pulley(52, 148) + thin('52,148 100,128') + rect(98, 120, 14, 14, ACCENT, 4) +
    `<path d="M112 128 A46 46 0 0 0 150 82" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 8"/>` +
    arrow(138, 96, 152, 70) + floor(),

  Cable_Rear_Delt_Fly: () =>
    line(14, 22, 178, 22, { w: 5 }) + line(14, 22, 14, 172, { w: 5 }) + line(178, 22, 178, 172, { w: 5 }) +
    pulley(34, 36) + pulley(158, 36) + thin('34,43 86,100') + thin('158,43 106,100') +
    rect(80, 98, 14, 14, ACCENT, 4) + rect(98, 98, 14, 14, ACCENT, 4) + arrow(60, 140, 40, 150) + arrow(132, 140, 152, 150) + floor(),

  Machine_Preacher_Curls: () =>
    pad(44, 84, 96, 128, 20) + line(70, 130, 70, 160) + pad(110, 140, 150, 140, 14) +
    line(150, 130, 150, 172, { w: 6 }) + line(96, 172, 164, 172) +
    line(98, 88, 130, 70, { w: 6 }) + rect(130, 56, 14, 28, ACCENT, 4) + arrow(150, 100, 160, 70),

  Triceps_Pushdown: () =>
    tower(26) + line(52, 34, 132, 34, { w: 5 }) + pulley(132, 34) + line(132, 41, 132, 70, { w: 3 }) +
    line(132, 70, 116, 94, { w: 6, c: ACCENT }) + line(132, 70, 148, 94, { w: 6, c: ACCENT }) +
    arrow(172, 74, 172, 126) + floor(),

  Triceps_Overhead_Extension_with_Rope: () =>
    tower(26) + pulley(66, 152) + thin('66,152 108,110 112,60') +
    line(112, 56, 98, 36, { w: 6, c: ACCENT }) + line(112, 56, 128, 36, { w: 6, c: ACCENT }) +
    arrow(164, 90, 164, 40) + floor(),

  Cable_Crunch: () =>
    tower(26) + line(52, 34, 116, 34, { w: 5 }) + pulley(116, 34) + thin('116,41 116,100') +
    line(116, 100, 100, 122, { w: 6, c: ACCENT }) + line(116, 100, 132, 122, { w: 6, c: ACCENT }) +
    pad(100, 160, 100, 160, 22) + arrow(160, 70, 160, 120) + floor(),

  Leg_Press: () =>
    line(30, 160, 150, 70, { w: 6 }) + line(30, 172, 168, 172, { w: 5 }) + line(150, 70, 168, 172, { w: 5 }) +
    pad(44, 148, 62, 116, 16) + pad(56, 156, 90, 156, 14) +
    `<g transform="rotate(-37 118 108)">` + rect(104, 56, 14, 60, PAD, 4) + `</g>` + arrow(100, 90, 130, 70),

  Leg_Extensions: () =>
    pad(36, 132, 36, 66, 18) + pad(36, 140, 92, 140, 16) + line(64, 148, 64, 172) + line(28, 172, 136, 172) +
    line(88, 136, 140, 150, { w: 6 }) + rect(132, 140, 16, 34, ACCENT, 6) + arrow(168, 150, 168, 110),

  Seated_Leg_Curl: () =>
    pad(36, 132, 36, 66, 18) + pad(36, 140, 108, 140, 16) + line(64, 148, 64, 172) + line(28, 172, 150, 172) +
    pad(104, 124, 140, 124, 12) + line(138, 156, 138, 172, { w: 6 }) + rect(122, 150, 36, 14, ACCENT, 6) +
    arrow(168, 120, 168, 164),

  Standing_Calf_Raises: () =>
    rect(62, 20, 68, 18, PAD, 6) + line(70, 38, 70, 128, { w: 6 }) + line(122, 38, 122, 128, { w: 6 }) +
    rect(52, 128, 88, 16, ACCENT, 4) + rect(40, 144, 112, 28, PAD, 4) + arrow(166, 108, 166, 64),

  Hanging_Leg_Raise: () =>
    line(22, 172, 170, 172, { w: 5 }) + pad(52, 150, 52, 54, 22) + line(52, 160, 52, 172, { w: 6 }) +
    pad(78, 100, 128, 100, 12) + line(128, 100, 128, 172, { w: 6 }) +
    line(100, 130, 150, 130, { w: 6, c: ACCENT }) + arrow(164, 150, 164, 100),
};

const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 192 192">` +
  `<rect width="192" height="192" fill="${BG}"/>${body}</svg>`;

fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const { id } of FUNDAMENTALS) {
  if (!DRAW[id]) throw new Error(`${id}: no drawing in scripts/make-exercise-icons.mjs`);
  const out = await sharp(Buffer.from(svg(DRAW[id]())), { density: 192 })
    .resize(SIZE, SIZE)
    .webp({ quality: 90 })
    .toFile(path.join(outDir, `${id}.webp`));
  total += out.size;
}
console.log(`Wrote ${FUNDAMENTALS.length} illustrations, ${(total / 1024).toFixed(0)} KB total, to public/exercises/`);
