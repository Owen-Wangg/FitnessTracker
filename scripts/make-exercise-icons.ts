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
const dumbbell = (cx: number, cy: number, rot = 0, fill = ACCENT): string =>
  `<g transform="rotate(${rot} ${cx} ${cy})">` +
  line(cx - 22, cy, cx + 22, cy, { w: 5 }) +
  rect(cx - 30, cy - 12, 10, 24, fill, 3) +
  rect(cx + 20, cy - 12, 10, 24, fill, 3) +
  `</g>`;
// Weight-stack tower with a pulley at (px, py).
const tower = (x: number, top = 22): string =>
  rect(x, top, 26, 150 - top + 0, 'none', 4) +
  [0, 1, 2, 3, 4, 5].map((i) => line(x + 5, top + 24 + i * 16, x + 21, top + 24 + i * 16, { w: 4, c: PAD })).join('');
const pulley = (x: number, y: number): string => circle(x, y, 7, '#fff');

// --- one drawing per exercise id ---------------------------------------------------------------
// Fixed equipment is slate/grey, the moving part is blue, and a grey "ghost" shows where a
// movement starts. Everything stands on the floor line at y = 172.
const ghost = '#e2e8f0';
const post = (x: number, top = 150): string => line(x, top, x, 172);
const base = (x1: number, x2: number): string => line(x1, 172, x2, 172);

const DRAW: Record<string, () => string> = {
  Incline_Dumbbell_Press: () =>
    pad(36, 136, 76, 136, 14) + pad(44, 130, 104, 70, 16) + post(56, 144) + line(92, 86, 112, 172) + base(34, 126) +
    dumbbell(118, 44) + arrow(152, 100, 152, 62),

  Butterfly: () =>
    pad(96, 74, 96, 130, 26) + pad(78, 148, 114, 148, 14) + post(96, 156) + base(72, 120) +
    line(78, 66, 46, 78, { w: 6 }) + line(114, 66, 146, 78, { w: 6 }) + circle(78, 66, 6, '#fff') + circle(114, 66, 6, '#fff') +
    pad(44, 84, 44, 128, 14) + pad(148, 84, 148, 128, 14) +
    arrow(20, 50, 46, 50) + arrow(172, 50, 146, 50),

  Leverage_Chest_Press: () =>
    pad(34, 146, 84, 146, 14) + pad(34, 140, 34, 80, 18) + post(60, 154) + base(24, 100) +
    line(50, 104, 116, 104, { w: 6, c: ACCENT }) + line(116, 88, 116, 120, { w: 9, c: ACCENT }) + circle(50, 104, 6, '#fff') +
    arrow(128, 60, 164, 60),

  'Wide-Grip_Lat_Pulldown': () =>
    line(150, 22, 150, 172, { w: 6 }) + line(60, 22, 150, 22, { w: 6 }) + pulley(96, 36) + line(96, 22, 96, 29, { w: 3 }) +
    thin('90,41 58,72') + thin('102,41 134,72') + line(46, 74, 146, 74, { w: 7, c: ACCENT }) +
    pad(70, 150, 120, 150, 14) + pad(80, 132, 124, 132, 12) + post(96, 158) + base(60, 132) +
    arrow(96, 92, 96, 118),

  Dumbbell_Incline_Row: () =>
    pad(56, 146, 104, 146, 14) + post(80, 154) + base(48, 112) +
    pad(98, 84, 106, 130, 18) + line(106, 130, 106, 146, { w: 6 }) +
    line(118, 112, 152, 112, { w: 6, c: ACCENT }) + line(152, 98, 152, 126, { w: 9, c: ACCENT }) + line(106, 112, 118, 112, { w: 6, c: ACCENT }) +
    arrow(170, 80, 134, 80),

  Dumbbell_Shoulder_Press: () =>
    pad(40, 140, 90, 140, 14) + pad(50, 134, 44, 70, 16) + post(66, 148) + base(36, 96) +
    dumbbell(58, 38) + arrow(124, 100, 124, 58),

  Cable_Seated_Lateral_Raise: () =>
    tower(16) + pulley(62, 152) + thin('62,152 108,134') +
    rect(100, 128, 16, 12, ghost, 4) +
    `<path d="M124 128 A56 56 0 0 0 152 72" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 8"/>` +
    rect(142, 52, 20, 12, ACCENT, 4) + arrow(154, 92, 158, 74) + base(14, 178),

  Cable_Rear_Delt_Fly: () =>
    line(22, 22, 22, 172, { w: 6 }) + line(170, 22, 170, 172, { w: 6 }) + line(22, 22, 170, 22, { w: 6 }) +
    pulley(40, 42) + pulley(152, 42) + thin('40,49 104,108') + thin('152,49 88,108') +
    rect(80, 106, 14, 14, ACCENT, 4) + rect(98, 106, 14, 14, ACCENT, 4) +
    arrow(76, 142, 48, 154) + arrow(116, 142, 144, 154) + base(14, 178),

  Seated_Dumbbell_Curl: () =>
    pad(40, 140, 90, 140, 14) + pad(46, 134, 46, 66, 16) + post(66, 148) + base(36, 96) +
    dumbbell(122, 142, 0, ghost) + dumbbell(122, 86, 0) +
    `<path d="M150 136 A34 34 0 0 0 150 92" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round"/>` +
    `<polyline points="143,94 151,90 154,99" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,

  Machine_Preacher_Curls: () =>
    pad(30, 144, 74, 144, 14) + post(52, 152) + base(26, 80) +
    pad(86, 90, 122, 122, 20) + line(112, 120, 112, 172) + base(92, 140) +
    line(122, 86, 150, 70, { w: 6, c: ACCENT }) + rect(144, 50, 14, 30, ACCENT, 4) +
    arrow(176, 98, 176, 56),

  Triceps_Pushdown: () =>
    tower(24) + line(50, 34, 134, 34, { w: 5 }) + pulley(134, 34) + line(134, 41, 134, 72, { w: 3 }) +
    line(134, 72, 118, 98, { w: 6, c: ACCENT }) + line(134, 72, 150, 98, { w: 6, c: ACCENT }) +
    arrow(172, 74, 172, 128) + base(14, 178),

  Triceps_Overhead_Extension_with_Rope: () =>
    tower(24) + pulley(66, 152) + thin('66,152 108,112 112,62') +
    line(112, 58, 98, 38, { w: 6, c: ACCENT }) + line(112, 58, 128, 38, { w: 6, c: ACCENT }) +
    arrow(166, 92, 166, 42) + base(14, 178),

  Leg_Press: () =>
    line(26, 166, 150, 82, { w: 6 }) + line(150, 82, 164, 172, { w: 5 }) + base(16, 176) +
    pad(36, 146, 66, 125, 16) + pad(52, 160, 88, 160, 12) +
    pad(104, 78, 132, 116, 12) + arrow(118, 132, 146, 112),

  Leg_Extensions: () =>
    pad(36, 140, 92, 140, 16) + pad(36, 134, 36, 70, 18) + post(64, 148) + base(26, 140) +
    line(88, 138, 142, 138, { w: 6, c: ghost }) + line(88, 138, 140, 150, { w: 6, c: ACCENT }) + rect(132, 142, 16, 30, ACCENT, 6) +
    arrow(168, 150, 168, 106),

  Seated_Leg_Curl: () =>
    pad(36, 140, 100, 140, 16) + pad(36, 134, 36, 66, 18) + post(64, 148) + base(26, 150) +
    pad(78, 120, 124, 120, 12) + pad(110, 154, 150, 154, 14) + line(150, 154, 164, 124, { w: 6 }) + circle(164, 120, 6, '#fff') +
    arrow(176, 116, 176, 160),

  Standing_Calf_Raises: () =>
    rect(62, 20, 68, 18, PAD, 6) + line(70, 38, 70, 128, { w: 6 }) + line(122, 38, 122, 128, { w: 6 }) +
    rect(52, 128, 88, 16, ACCENT, 4) + rect(40, 144, 112, 28, PAD, 4) + arrow(166, 108, 166, 64),

  Cable_Crunch: () =>
    tower(24) + line(50, 34, 112, 34, { w: 5 }) + pulley(112, 34) + thin('112,41 112,100') +
    line(112, 100, 96, 122, { w: 6, c: ACCENT }) + line(112, 100, 128, 122, { w: 6, c: ACCENT }) +
    pad(86, 158, 138, 158, 14) + arrow(164, 66, 164, 124) + base(14, 178),

  Hanging_Leg_Raise: () =>
    pad(46, 138, 46, 58, 22) + pad(60, 96, 104, 96, 12) + line(104, 96, 104, 172, { w: 6 }) + post(46, 148) + base(30, 124) +
    rect(62, 112, 14, 56, ghost, 7) + rect(62, 112, 62, 14, ACCENT, 7) +
    arrow(152, 164, 152, 112),
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
