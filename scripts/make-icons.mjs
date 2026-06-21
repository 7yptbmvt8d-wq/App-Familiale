/**
 * Génère les icônes PWA (PNG) à partir d'un SVG, via Chromium (Playwright).
 * Aucune dépendance graphique native requise.
 *
 *   npm run icons
 */
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = fileURLToPath(new URL('../public/icons/', import.meta.url));
mkdirSync(OUT, { recursive: true });

// Étincelle crème (motif « souvenir ») sur dégradé terracotta.
const SPARKLE = 'M12 4c.6 4 1.9 5.4 6 6-4.1.6-5.4 2-6 6-.6-4-1.9-5.4-6-6 4.1-.6 5.4-2 6-6z';

function html(size, glyphRatio) {
  const k = (size * glyphRatio) / 24;
  return `<!doctype html><html><body style="margin:0">
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="g" cx="32%" cy="26%" r="95%">
        <stop offset="0" stop-color="#d4774f"/>
        <stop offset="0.58" stop-color="#b6512f"/>
        <stop offset="1" stop-color="#9c4329"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#g)"/>
    <g transform="translate(${size / 2} ${size / 2}) scale(${k}) translate(-12 -12)" fill="#FBF6EE">
      <path d="${SPARKLE}"/>
    </g>
  </svg></body></html>`;
}

const ICONS = [
  { file: 'icon-192.png', size: 192, glyph: 0.5 },
  { file: 'icon-512.png', size: 512, glyph: 0.5 },
  { file: 'maskable-512.png', size: 512, glyph: 0.38 }, // zone de sécurité maskable
  { file: 'apple-touch-icon.png', size: 180, glyph: 0.5 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, glyph } of ICONS) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, glyph), { waitUntil: 'load' });
  await page.locator('svg').screenshot({ path: `${OUT}${file}`, omitBackground: true });
  console.log('•', file, `${size}×${size}`);
}
await browser.close();
console.log('Icônes générées dans public/icons/');
