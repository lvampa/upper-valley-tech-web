// One-shot generator for public/og-image.png (1200×630). Run with `npm run gen:og`
// after brand changes; the PNG is committed so builds don't depend on this.
// The mark reproduces the Logo glyph (src/components/brand/Logo.tsx): a dark
// zigzag on the brand-gradient rounded square.
import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#161513"/>
      <stop offset="1" stop-color="#0b0b0a"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff6b5e"/>
      <stop offset="1" stop-color="#ff9a72"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(110,225)">
    <rect width="120" height="120" rx="28" fill="url(#mark)"/>
    <g transform="translate(20,20) scale(5)">
      <path d="M1 13 L5 6 L8 10 L11 4 L15 13" fill="none" stroke="#161513"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
  <text x="112" y="440" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="700" fill="#f4f1ec" letter-spacing="-1.5">Upper Valley Tech</text>
  <text x="114" y="500" font-family="Georgia, 'Times New Roman', serif" font-size="31" fill="#b8b3ab">Monthly tech meetup — New Hampshire &amp; Vermont</text>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
const out = path.join(fileURLToPath(new URL('..', import.meta.url)), 'public', 'og-image.png');
await writeFile(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
