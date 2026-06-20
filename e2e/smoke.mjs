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

// Bruit réseau externe (police de caractères via CDN) — non bloquant.
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
  await shot('02-home');

  // Carte temps réel
  await page.getByRole('button', { name: 'Carte' }).click();
  await page.getByText('État du foyer').waitFor({ timeout: 8000 });
  await page.waitForTimeout(1500);
  await shot('03-map');

  // Agenda / Albums / Arbre
  await page.getByRole('button', { name: 'Agenda' }).click();
  await page.getByText('Anniversaires').waitFor({ timeout: 8000 });
  await shot('04-agenda');
  await page.getByRole('button', { name: 'Albums' }).click();
  await page.waitForTimeout(400);
  await shot('05-albums');
  await page.getByRole('button', { name: 'Arbre' }).click();
  await page.waitForTimeout(400);
  await shot('06-tree');

  // Publication dans le fil
  await page.getByRole('button', { name: 'Accueil' }).click();
  await page.getByRole('button', { name: /Partager un moment/ }).click();
  await page.getByRole('button', { name: 'Note' }).click();
  await page.locator('textarea').fill('Test end-to-end.');
  await page.getByRole('button', { name: 'Publier dans le fil' }).click();
  await page.waitForTimeout(600);
  await shot('07-after-post');

  // Verrou de partage d'un compte mineur
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Entrer comme Léa/ }).click();
  await page.getByText('Bonjour Léa').waitFor({ timeout: 8000 });
  await page.locator('header button[aria-label="Réglages"]').click();
  await page.getByText('Obligatoire et non désactivable', { exact: false }).waitFor({ timeout: 8000 });
  await shot('08-minor-lock');

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
