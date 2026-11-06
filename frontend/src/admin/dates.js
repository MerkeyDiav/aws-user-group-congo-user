// Kinshasa est à UTC+1 toute l'année (pas d'heure d'été) : les heures saisies dans l'admin sont celles de Kinshasa.
const KINSHASA_OFFSET_MS = 60 * 60 * 1000;

/** "2026-11-14T11:00:00+01:00" -> "2026-11-14T11:00" (pour <input type="datetime-local">) */
export function toLocalInput(iso) {
  if (!iso) return '';
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : new Date(t + KINSHASA_OFFSET_MS).toISOString().slice(0, 16);
}

/** "2026-11-14T11:00" (heure de Kinshasa) -> "2026-11-14T11:00:00+01:00" */
export const fromLocalInput = (value) => (value ? `${value}:00+01:00` : '');

/** Date du calendrier à Kinshasa, décalée de `days` jours : "2026-11-14" -> "2026-11-07" pour -7. */
export function kinshasaDate(iso, days = 0) {
  const t = Date.parse(iso) + KINSHASA_OFFSET_MS + days * 864e5;
  return new Date(t).toISOString().slice(0, 10);
}

/** « sam. 14 nov. à 09h00 » (heure de Kinshasa) */
export function shortDateTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Kinshasa',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(':', 'h');
}

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}
