export const TIMEZONE = 'Africa/Kinshasa';

export const FORMAT_LABELS = {
  online: 'En ligne',
  'in-person': 'Présentiel',
  hybrid: 'Hybride',
};

// Kinshasa est à UTC+1 toute l'année (pas d'heure d'été).
const KINSHASA_OFFSET_MS = 60 * 60 * 1000;
// Sans heure de fin renseignée, on considère qu'un événement dure 2 heures.
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

const startOf = (event) => new Date(event.start).getTime();
const endOf = (event) => (event.end ? new Date(event.end).getTime() : startOf(event) + DEFAULT_DURATION_MS);

/** 'upcoming' (pas encore commencé), 'live' (en cours) ou 'past' (terminé). */
export function eventStatus(event, now = new Date()) {
  const t = now.getTime();
  if (t > endOf(event)) return 'past';
  if (t >= startOf(event)) return 'live';
  return 'upcoming';
}

export function isUpcoming(event, now = new Date()) {
  return eventStatus(event, now) !== 'past';
}

/** Numéro du jour du calendrier à Kinshasa (pour compter en jours, pas en tranches de 24 h). */
const kinshasaDay = (t) => Math.floor((t + KINSHASA_OFFSET_MS) / 864e5);

/** « Dans 9 jours », « Demain », « Aujourd'hui », « En cours » ou « Terminé ». */
export function countdownLabel(event, now = new Date()) {
  const status = eventStatus(event, now);
  if (status === 'past') return 'Terminé';
  if (status === 'live') return 'En cours';
  const days = kinshasaDay(startOf(event)) - kinshasaDay(now.getTime());
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}

export function splitEvents(events = [], now = new Date()) {
  const upcoming = [];
  const past = [];
  events.forEach((e) => (isUpcoming(e, now) ? upcoming : past).push(e));
  upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));
  past.sort((a, b) => new Date(b.start) - new Date(a.start));
  return { upcoming, past };
}

const fmt = (options) => new Intl.DateTimeFormat('fr-FR', { timeZone: TIMEZONE, ...options });

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatDate(iso) {
  return capitalize(fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)));
}

export function formatTime(iso) {
  return fmt({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso)).replace(':', 'h');
}

export function dateParts(iso) {
  const d = new Date(iso);
  return {
    day: fmt({ day: '2-digit' }).format(d),
    month: fmt({ month: 'short' }).format(d).replace('.', ''),
    year: fmt({ year: 'numeric' }).format(d),
  };
}

const toCalendarDate = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function googleCalendarUrl(event) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toCalendarDate(event.start)}/${toCalendarDate(event.end || event.start)}`,
    details: `${event.summary || ''}\n\n${typeof window !== 'undefined' ? window.location.href : ''}`,
    location: event.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function matchesQuery(event, query) {
  if (!query) return true;
  const haystack = [
    event.title,
    event.summary,
    event.location,
    ...(event.tags || []),
    ...(event.speakers || []).map((s) => s.name),
  ]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
