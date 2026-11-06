import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { formatDate, formatTime, isUpcoming } from '../utils/events.js';
import { registrationTarget } from '../utils/posts.js';

/** Encadré en bas de chaque publication : s'inscrire (Meetup) et rejoindre la communauté. */
export default function PostCta({ post, events, site }) {
  const { event, url, onMeetup } = registrationTarget(post, events, site);
  const upcoming = event && isUpcoming(event);

  return (
    <aside className="post-cta">
      <div>
        {upcoming ? (
          <>
            <p className="kicker">Ne manquez pas</p>
            <h2>{event.title}</h2>
            <p>
              {formatDate(event.start)} à {formatTime(event.start)} · {event.location}
            </p>
          </>
        ) : (
          <>
            <p className="kicker">Rejoignez-nous</p>
            <h2>Ne manquez aucun de nos prochains événements</h2>
            <p>Meetups, webinaires et workshops gratuits, ouverts à tous les passionnés du cloud.</p>
          </>
        )}
      </div>
      <div className="post-cta__actions">
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="btn btn--primary">
            {onMeetup ? "S'inscrire sur Meetup" : "S'inscrire"} <Icon name="external" size={16} />
          </a>
        )}
        <Link to="/rejoindre" className="btn btn--outline-light">
          Rejoindre la communauté
        </Link>
        {site.social?.whatsapp && (
          <a href={site.social.whatsapp} target="_blank" rel="noreferrer" className="link-arrow post-cta__wa">
            <Icon name="whatsapp" size={16} /> Groupe WhatsApp
          </a>
        )}
      </div>
    </aside>
  );
}
