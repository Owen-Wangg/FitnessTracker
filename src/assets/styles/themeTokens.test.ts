import fs from 'node:fs';

// Guards the two palettes against drifting apart: every color token in the dark theme must have a
// light-theme value, and every var(--x) used anywhere must exist.
const read = (file: string) => fs.readFileSync(`src/assets/styles/${file}`, 'utf8');
const globalCss = read('global.css');

const declarations = (block: string): Record<string, string> =>
  Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));

const rootBlock = globalCss.match(/:root\s*\{([\s\S]*?)\n\}/)![1];
const lightBlock = globalCss.match(/\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/)![1];
const root = declarations(rootBlock);
const light = declarations(lightBlock);

// Tokens that are not colors (shape, spacing, type, layout) are shared by both themes.
const isColor = (value: string) => /^(#|rgba?\()/.test(value);

test('every color token has a light-theme value', () => {
  const missing = Object.entries(root)
    .filter(([name, value]) => isColor(value) && !(name in light))
    .map(([name]) => name);
  expect(missing).toEqual([]);
});

test('the light theme does not invent tokens that the dark theme lacks', () => {
  expect(Object.keys(light).filter((name) => !(name in root) && name !== 'color-scheme')).toEqual([]);
});

test('every var(--token) used in the stylesheets is defined', () => {
  const defined = new Set(Object.keys(root));
  const files = fs.readdirSync('src/assets/styles').filter((f) => f.endsWith('.css'));
  const undefinedUses = [];
  for (const file of files) {
    const css = read(file);
    // --rdp-* are DayPicker variables, set in HistoryScreen.css; --rdp-* defaults come from its own CSS
    for (const [, name] of css.matchAll(/var\((--[\w-]+)/g)) {
      if (!defined.has(name) && !name.startsWith('--rdp-')) undefinedUses.push(`${file}: ${name}`);
    }
  }
  expect([...new Set(undefinedUses)]).toEqual([]);
});

test('the text and chart colors stay readable on a white surface in the light theme', () => {
  // WCAG contrast of a hex color against #ffffff
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  };
  const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

  // text-sized colors need 4.5:1
  for (const token of ['--text', '--text-muted', '--accent-text', '--pr-text', '--success', '--danger']) {
    expect(contrastOnWhite(light[token]), token).toBeGreaterThanOrEqual(4.5);
  }
  // graphics (lines, dots) need 3:1
  for (const token of ['--chart-line', '--pr']) {
    expect(contrastOnWhite(light[token]), token).toBeGreaterThanOrEqual(3);
  }
});

test('text on the accent fill is readable in both themes', () => {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  expect(ratio(root['--accent'], root['--on-accent'])).toBeGreaterThanOrEqual(4.5);
  expect(ratio(light['--accent'], light['--on-accent'])).toBeGreaterThanOrEqual(4.5);
});
