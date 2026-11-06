export const TIMEZONE = 'Africa/Kinshasa';

export const FORMAT_LABELS = {
  online: 'En ligne',
  'in-person': 'Présentiel',
  hybrid: 'Hybride',
};

export function isUpcoming(event, now = new Date()) {
  return new Date(event.end || event.start) >= now;
}

export function splitEvents(events = []) {
  const now = new Date();
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

export function daysUntilLabel(iso) {
  const days = Math.ceil((new Date(iso) - new Date()) / 864e5);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
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
