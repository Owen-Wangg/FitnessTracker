import { cloneElement } from 'react';

// jsdom has no layout, so ResponsiveContainer measures 0x0 and draws nothing.
// Give the chart a fixed size so the real SVG renders and can be asserted on.
//   vi.mock('recharts', async (importOriginal) => (await import('../testUtils/rechartsMock')).withFixedSize(importOriginal));
export const withFixedSize = async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="chart">{cloneElement(children, { width: 600, height: 300 })}</div>
    ),
  };
};
