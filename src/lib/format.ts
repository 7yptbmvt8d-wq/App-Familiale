const DAY = 86_400_000;

/** « à l'instant », « il y a 5 min », « il y a 2 h », « hier », « 14 mars ». */
export function relativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts;
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < DAY) return `il y a ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 2 * DAY) return 'hier';
  if (diff < 7 * DAY) return `il y a ${Math.floor(diff / DAY)} j`;
  return formatDate(ts);
}

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export function formatDateLong(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')}`;
}

/** Début du jour courant (00:00) en ms — un événement disparaît le lendemain. */
export function startOfToday(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Date longue capitalisée pour les en-têtes (« Vendredi 20 juin »). */
export function headerDate(ts = Date.now()): string {
  const d = new Date(ts);
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const j = jours[d.getDay()];
  return `${j[0].toUpperCase()}${j.slice(1)} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/** Nombre d'années entières écoulées depuis une date (anniversaire calendaire). */
export function yearsAgo(ts: number, now = Date.now()): number {
  const a = new Date(ts);
  const b = new Date(now);
  let y = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && b.getDate() < a.getDate())) y--;
  return y;
}

/** Libellé d'ancienneté d'un souvenir (« il y a 3 ans », « cette année »). */
export function souvenirLabel(memoryDate: number, now = Date.now()): string {
  const y = yearsAgo(memoryDate, now);
  if (y <= 0) return 'cette année';
  if (y === 1) return 'il y a 1 an';
  return `il y a ${y} ans`;
}
