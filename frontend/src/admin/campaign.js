import { kinshasaDate } from './dates.js';
import { formatDate, formatTime } from '../utils/events.js';

/** Statut d'une publication : brouillon, programmée (date future) ou en ligne. */
export function postStatus(post, now = Date.now()) {
  if (!post.published) return 'draft';
  return Date.parse(post.publishAt) > now ? 'scheduled' : 'live';
}

export const STATUS_LABELS = { draft: 'Brouillon', scheduled: 'Programmée', live: 'En ligne' };

/**
 * Programme de publication type pour un événement. Chaque étape devient une publication en
 * brouillon, à compléter puis à programmer. Les jours cochés par défaut : J-7, J-6, J-5, J-3, J-1.
 */
export const CAMPAIGN_STEPS = [
  {
    key: 'j7',
    offset: 7,
    label: 'J-7',
    type: 'post',
    checked: true,
    title: (e) => `Bientôt : ${e.title}`,
    body: (e, when) => [
      `Le ${when}, l'AWS User Group Congo-Kinshasa vous donne rendez-vous pour « ${e.title} ».`,
      e.summary || 'Un sujet concret, présenté par la communauté, pour la communauté.',
      "L'événement est gratuit et ouvert à tous : réservez votre place dès maintenant.",
    ],
  },
  {
    key: 'j6',
    offset: 6,
    label: 'J-6',
    type: 'post',
    checked: true,
    title: () => 'Pourquoi ce sujet compte',
    body: (e) => [
      `Avant « ${e.title} », un mot sur l'enjeu : expliquez ici pourquoi ce sujet est important pour les équipes et les entreprises en RDC.`,
      ...(e.highlights?.length ? [`Au programme : ${e.highlights.slice(0, 3).join(' ; ')}.`] : []),
      'Nous en parlerons en détail lors de notre prochain événement : inscrivez-vous pour ne rien manquer.',
    ],
  },
  {
    key: 'j5',
    offset: 5,
    label: 'J-5',
    type: 'video',
    checked: true,
    title: (e) => (e.speakers?.[0]?.name ? `Découvrez notre speaker : ${e.speakers[0].name}` : 'Découvrez notre speaker'),
    body: (e) => [
      `${e.speakers?.[0]?.name || 'Notre speaker'} vous présente en quelques mots le sujet de « ${e.title} » et ce que vous allez apprendre.`,
      'Venez lui poser vos questions en direct : inscrivez-vous gratuitement.',
    ],
  },
  {
    key: 'j3',
    offset: 3,
    label: 'J-3',
    type: 'post',
    checked: true,
    title: () => 'Plus que 3 jours !',
    body: (e, when) => [
      `Plus que 3 jours avant « ${e.title} », le ${when}.`,
      'Invitez vos collègues et amis passionnés du cloud, et réservez votre place.',
    ],
  },
  {
    key: 'j1',
    offset: 1,
    label: 'J-1',
    type: 'post',
    checked: true,
    title: () => "C'est demain !",
    body: (e, when) => [
      `Rendez-vous demain pour « ${e.title} » (${when}).`,
      'Dernier moment pour vous inscrire : on vous attend !',
    ],
  },
  {
    key: 'jourj',
    offset: 0,
    label: 'Jour J',
    type: 'post',
    checked: false,
    title: () => "C'est aujourd'hui !",
    body: (e) => [
      `C'est aujourd'hui à ${formatTime(e.start)} : « ${e.title} ».`,
      'Il est encore temps de nous rejoindre !',
    ],
  },
];

/** Jour de publication à `hour` (heure de Kinshasa) ; le jour J, au plus tard 2 h avant le début. */
function publishTime(event, offset, hour) {
  const iso = `${kinshasaDate(event.start, -offset)}T${hour}:00+01:00`;
  const latest = Date.parse(event.start) - 2 * 3600e3;
  if (Date.parse(iso) <= latest) return iso;
  return `${new Date(latest + 3600e3).toISOString().slice(0, 16)}:00+01:00`;
}

/** Publications (brouillons) générées pour un événement à partir des étapes choisies. */
export function buildCampaign(event, stepKeys, hour = '09:00') {
  const when = `${formatDate(event.start).toLowerCase()} à ${formatTime(event.start)}`;
  return CAMPAIGN_STEPS.filter((s) => stepKeys.includes(s.key)).map((step) => ({
    id: `${event.id}-${step.key}`.slice(0, 100),
    title: step.title(event),
    type: step.type,
    eventId: event.id,
    publishAt: publishTime(event, step.offset, hour),
    published: false,
    image: step.type === 'post' ? event.image || '' : '',
    video: '',
    youtubeUrl: '',
    body: step.body(event, when),
  }));
}
