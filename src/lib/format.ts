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

/** Date longue capitalisée pour les en-têtes (« Vendredi 20 juin »). */
export function headerDate(ts = Date.now()): string {
  const d = new Date(ts);
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const j = jours[d.getDay()];
  return `${j[0].toUpperCase()}${j.slice(1)} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/** « arrive dans ~12 min » ; au-delà d'une heure, en heures. */
export function etaLabel(minutes: number): string {
  if (minutes <= 1) return "arrive à l'instant";
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `~${h} h ${m}` : `~${h} h`;
}

/** Heure d'arrivée estimée absolue (« vers 18h05 »). */
export function etaClock(minutes: number, now = Date.now()): string {
  return `vers ${formatTime(now + minutes * 60_000)}`;
}
