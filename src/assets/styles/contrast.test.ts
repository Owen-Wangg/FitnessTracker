import fs from 'node:fs';

// Keeps the colour palette readable. Small text needs a contrast ratio of at least 4.5 : 1 (WCAG AA)
// against every background it can sit on, in both themes.

const css = fs.readFileSync('src/assets/styles/global.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const variablesIn = (block: string): Record<string, string> =>
  Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

const root = variablesIn(/:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '');
const lightOverrides = variablesIn(/\[data-theme='light'\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '');
const THEMES: Record<string, Record<string, string>> = { dark: root, light: { ...root, ...lightOverrides } };

type Rgba = [number, number, number, number];
const parse = (value: string): Rgba => {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1) as Rgba;
  const rgba = /^rgba?\(([^)]+)\)$/.exec(value);
  if (rgba) {
    const [r, g, b, a = 1] = rgba[1].split(',').map(Number);
    return [r, g, b, a];
  }
  throw new Error(`Unrecognised colour: ${value}`);
};

// Draw a possibly translucent colour over an opaque one.
const over = (top: Rgba, under: Rgba): Rgba => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1) as Rgba;

const luminance = ([r, g, b]: Rgba): number => {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};
const contrast = (a: Rgba, b: Rgba): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = ['text', 'text-muted', 'accent-text', 'pr-text', 'success', 'danger'];
const BACKGROUNDS = ['bg', 'surface', 'surface-2'];

describe.each(Object.keys(THEMES))('%s theme', (name) => {
  const vars = THEMES[name];
  const color = (key: string): Rgba => parse(vars[key]);

  test.each(TEXT.flatMap((fg) => BACKGROUNDS.map((bg) => [fg, bg])))('%s on %s is readable', (fg, bg) => {
    expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
  });

  test('text on the accent colour is readable', () => {
    expect(contrast(color('on-accent'), color('accent'))).toBeGreaterThanOrEqual(4.5);
  });

  test('danger text on its tinted button background is readable', () => {
    const tinted = over(color('danger-soft'), color('surface'));
    expect(contrast(color('danger'), tinted)).toBeGreaterThanOrEqual(4.5);
  });

  test('accent text on its tinted background is readable', () => {
    const tinted = over(color('accent-soft'), color('surface'));
    expect(contrast(color('accent-text'), tinted)).toBeGreaterThanOrEqual(4.5);
  });
});

test('both themes define every colour the checks need', () => {
  for (const vars of Object.values(THEMES)) {
    for (const key of [...TEXT, ...BACKGROUNDS, 'on-accent', 'accent', 'danger-soft', 'accent-soft']) expect(vars[key], key).toBeDefined();
  }
});
