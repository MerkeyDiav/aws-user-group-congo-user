import { TIMEZONE } from './events.js';

/** Identifiant d'une vidéo YouTube (youtube.com/watch?v=, youtu.be/, /shorts/, /embed/), ou null. */
export function youtubeId(url = '') {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export const isVideoPost = (post) => post.type === 'video';

/** « Publié le 9 novembre 2026 » */
export function formatPublishDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TIMEZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** Premières phrases du texte, pour les cartes. */
export function excerpt(post, max = 160) {
  const text = (post.body || []).join(' ');
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}

/** Image à montrer sur une carte : la photo, sinon la miniature YouTube. */
export function postThumbnail(post) {
  if (post.image) return post.image;
  const id = youtubeId(post.youtubeUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}

/**
 * Appel à l'action en bas de chaque publication : inscription à l'événement lié (souvent Meetup),
 * sinon la page Meetup du groupe.
 */
export function registrationTarget(post, events, site) {
  const event = post.eventId ? events.find((e) => e.id === post.eventId) : null;
  const eventUrl = event?.registrationUrl && event.registrationUrl !== '#' ? event.registrationUrl : '';
  const url = eventUrl || site.social?.meetup || '';
  return { event, url, onMeetup: /meetup\.com/i.test(url) };
}
