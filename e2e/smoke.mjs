/**
 * Test de fumée end-to-end (Playwright, navigateur réel).
 * Démarre `vite preview`, déroule un parcours complet et capture des captures
 * d'écran dans e2e/shots/. Échoue s'il y a une erreur applicative en console
 * (les erreurs réseau externes — ex. CDN Google Fonts hors-ligne — sont ignorées).
 *
 *   npm run e2e
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT)], { stdio: 'ignore' });
const cleanup = () => {
  try {
    server.kill();
  } catch {
    /* déjà arrêté */
  }
};
process.on('exit', cleanup);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {
      /* pas encore prêt */
    }
    await wait(500);
  }
  throw new Error('Serveur preview indisponible');
}

const IGNORE = [/ERR_CERT_AUTHORITY_INVALID/, /fonts\.g(oogleapis|static)/, /Failed to load resource/];

await waitForServer();

const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', (m) => {
  if (m.type() === 'error' && !IGNORE.some((re) => re.test(m.text()))) errors.push('console: ' + m.text());
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const shot = (n) => page.screenshot({ path: `${OUT}${n}.png` });

try {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.getByText('Famille', { exact: false }).first().waitFor();
  await shot('01-auth');

  // Connexion démo (responsable)
  await page.getByRole('button', { name: /Entrer comme Hélène/ }).click();
  await page.getByText('Bonjour Hélène').waitFor({ timeout: 8000 });
  await shot('02-fil');

  // Souvenirs
  await page.getByRole('button', { name: 'Souvenirs' }).click();
  await page.getByText('Souvenir du jour').waitFor({ timeout: 8000 });
  await shot('03-souvenirs');

  // Famille
  await page.getByRole('button', { name: 'Famille' }).click();
  await page.getByText('Grands-parents').waitFor({ timeout: 8000 });
  await shot('04-famille');

  // Publier un récit dans le fil
  await page.getByRole('button', { name: 'Fil' }).click();
  await page.getByRole('button', { name: /Partager un souvenir/ }).click();
  await page.getByRole('button', { name: 'Récit' }).click();
  await page.locator('textarea').fill('Le mariage de tante Sofia, sous la pluie et heureux quand même.');
  await page.getByRole('button', { name: 'Ajouter au fil' }).click();
  await page.locator('article').filter({ hasText: 'mariage de tante Sofia' }).first().waitFor({ timeout: 8000 });
  await shot('05-recit');

  // Publier une photo : upload réel → redimensionnement canvas → rendu
  await page.getByRole('button', { name: /Partager un souvenir/ }).click();
  await page.setInputFiles('input[type="file"]', 'public/icons/icon-192.png');
  await page.getByPlaceholder("étretat · falaise d'aval").fill('vacances 2019 · le lac');
  await page.getByRole('button', { name: 'Ajouter au fil' }).click();
  await page.locator('article').filter({ hasText: 'vacances 2019' }).first().waitFor({ timeout: 8000 });
  await shot('06-photo');

  console.log(`\nParcours OK — ${errors.length} erreur(s) applicative(s).`);
  errors.forEach((e) => console.log('  -', e));
} catch (e) {
  console.error('\n❌ Échec du parcours :', e.message);
  errors.push(e.message);
} finally {
  await browser.close();
  cleanup();
}

process.exit(errors.length ? 1 : 0);
