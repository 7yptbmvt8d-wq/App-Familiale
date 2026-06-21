/**
 * Vérification Firebase de bout en bout sur la Emulator Suite.
 * Lancé via `npm run e2e:firebase` (qui l'enveloppe dans `firebase emulators:exec`).
 *
 * Étapes : seed Firestore → build de l'app (mode firebase + émulateur) →
 * preview → parcours navigateur réel (rejoindre via code → publier) → captures.
 */
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';
import { seed } from '../scripts/seed-emulator.mjs';

const PORT = 4174;
const BASE = `http://localhost:${PORT}`;
const OUT = fileURLToPath(new URL('./shots-firebase/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const ENV_LOCAL = `VITE_BACKEND=firebase
VITE_FIREBASE_EMULATOR=true
VITE_FIREBASE_PROJECT_ID=demo-famille
VITE_FIREBASE_API_KEY=demo
VITE_FIREBASE_AUTH_DOMAIN=demo-famille.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=demo-famille.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=demo
VITE_FIREBASE_APP_ID=demo
`;

const IGNORE = [/ERR_CERT_AUTHORITY_INVALID/, /fonts\.g(oogleapis|static)/, /Failed to load resource/];
const errors = [];
let server;
let browser;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {
      /* pas prêt */
    }
    await wait(500);
  }
  throw new Error('Serveur preview indisponible');
}

try {
  console.log('• Seed de l’émulateur Firestore');
  await seed();

  console.log('• Build de l’app (firebase + émulateur)');
  writeFileSync('.env.local', ENV_LOCAL);
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('• Démarrage du preview');
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
  await waitForServer();

  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.some((re) => re.test(m.text()))) errors.push('console: ' + m.text());
  });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const shot = (n) => page.screenshot({ path: `${OUT}${n}.png` });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.getByText('Famille', { exact: false }).first().waitFor();
  await shot('01-auth');

  // Rejoindre via code (Auth anonyme + écritures Firestore réelles)
  await page.getByPlaceholder('LACROIX-2026').fill('LACROIX-2026');
  await page.getByPlaceholder('Camille').fill('Camille');
  await page.getByRole('button', { name: 'Rejoindre la famille' }).click();
  await page.getByText('Bonjour Camille').waitFor({ timeout: 15000 });
  await shot('02-fil');

  // Souvenirs (lecture Firestore : posts seedés + souvenir du jour)
  await page.getByRole('button', { name: 'Souvenirs' }).click();
  await page.getByText('Souvenir du jour').waitFor({ timeout: 10000 });
  await page.waitForTimeout(600);
  await shot('03-souvenirs');

  // Publier un récit → écriture Firestore → doit revenir via onSnapshot
  await page.getByRole('button', { name: 'Fil' }).click();
  await page.getByRole('button', { name: /Partager un souvenir/ }).click();
  await page.getByRole('button', { name: 'Récit' }).click();
  await page.locator('textarea').fill('Bonjour depuis Firestore (émulateur).');
  await page.getByRole('button', { name: 'Ajouter au fil' }).click();
  // Le post doit revenir via onSnapshot dans une carte du fil (≠ le textarea).
  await page.locator('article').filter({ hasText: 'Bonjour depuis Firestore' }).first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);
  await shot('04-after-post');

  console.log(`\nFirebase e2e OK — ${errors.length} erreur(s) applicative(s).`);
  errors.forEach((e) => console.log('  -', e));
} catch (e) {
  console.error('\n❌', e.message);
  errors.push(e.message);
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  try {
    rmSync('.env.local');
  } catch {
    /* déjà absent */
  }
}

process.exit(errors.length ? 1 : 0);
