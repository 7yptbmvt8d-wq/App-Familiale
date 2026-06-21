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
page.on('dialog', (d) => d.accept()); // confirmations (suppression…)
const shot = (n) => page.screenshot({ path: `${OUT}${n}.png` });

try {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.getByText('Famille', { exact: false }).first().waitFor();
  await shot('01-auth');

  // Connexion démo (responsable)
  await page.getByRole('button', { name: /Entrer comme Hélène/ }).click();
  await page.getByText('Bonjour Hélène').waitFor({ timeout: 8000 });
  await shot('02-fil');

  // Agenda (événements + anniversaires)
  await page.getByRole('button', { name: 'Agenda' }).click();
  await page.getByText('Anniversaires').waitFor({ timeout: 8000 });
  await shot('04-agenda');

  // Souvenirs
  await page.getByRole('button', { name: 'Souvenirs' }).click();
  await page.getByText('Souvenir du jour').waitFor({ timeout: 8000 });
  await shot('05-souvenirs');

  // Famille
  await page.getByRole('button', { name: 'Famille' }).click();
  await page.getByText('Grands-parents').waitFor({ timeout: 8000 });
  await shot('06-famille');

  // Publier un récit
  await page.getByRole('button', { name: 'Fil' }).click();
  await page.getByRole('button', { name: /Partager un souvenir/ }).click();
  await page.getByRole('button', { name: 'Récit' }).click();
  await page.locator('textarea').fill('Le mariage de tante Sofia, sous la pluie et heureux quand même.');
  // La feuille (montée via portail) doit recouvrir la barre d'onglets : le
  // bouton de publication doit être l'élément cliqué à son propre centre, et
  // non masqué par le pied de page.
  await shot('07a-composer');
  const pub = page.getByRole('button', { name: 'Ajouter au fil' });
  const onTop = await pub.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return el.contains(hit);
  });
  if (!onTop) throw new Error('Le bouton de publication est masqué par la barre d’onglets.');
  await pub.click();
  await page.locator('article').filter({ hasText: 'mariage de tante Sofia' }).first().waitFor({ timeout: 8000 });
  await shot('07-recit');

  // Publier un événement
  await page.getByRole('button', { name: /Partager un souvenir/ }).click();
  await page.getByRole('button', { name: 'Événement' }).click();
  await page.locator('input').first().fill('Réunion de famille de juillet');
  await page.getByRole('button', { name: 'Ajouter au fil' }).click();
  await page.locator('article').filter({ hasText: 'Réunion de famille' }).first().waitFor({ timeout: 8000 });
  await shot('08-event');

  // Supprimer l'événement que l'on vient de publier (confirmation auto-acceptée)
  const evt = page.locator('article').filter({ hasText: 'Réunion de famille' }).first();
  await evt.getByRole('button', { name: 'Supprimer' }).click();
  await evt.waitFor({ state: 'detached', timeout: 8000 });
  await shot('08b-delete');

  // Modifier la fiche d'un membre (anniversaire / prénom) — responsable
  await page.getByRole('button', { name: 'Famille' }).click();
  await page.getByText('Grands-parents').waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: /Hélène/ }).first().click();
  await page.getByText('Modifier la fiche').waitFor({ timeout: 8000 });
  await page.getByPlaceholder('Prénom').fill('Hélène-Marie');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.getByText('Hélène-Marie').first().waitFor({ timeout: 8000 });
  await shot('08c-edit-membre');

  // Créer une nouvelle famille (contexte vierge → écran de connexion)
  const ctx2 = await browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  const p2 = await ctx2.newPage();
  p2.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.some((re) => re.test(m.text()))) errors.push('console: ' + m.text());
  });
  p2.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await p2.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p2.getByRole('button', { name: 'Créer ma famille' }).click(); // onglet
  await p2.getByPlaceholder('Famille Martin').fill('Famille Test');
  await p2.getByPlaceholder('Camille').fill('Alex');
  await p2.getByRole('button', { name: 'Créer ma famille' }).last().click(); // valider
  await p2.getByText('Bonjour Alex').waitFor({ timeout: 8000 });
  await p2.screenshot({ path: `${OUT}09-create-family.png` });
  await ctx2.close();

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
