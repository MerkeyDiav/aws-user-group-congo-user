import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { FORMAT_LABELS, dateParts, daysUntilLabel, formatTime } from '../utils/events.js';

export default function FeaturedEvent({ event }) {
  const url = `/evenements/${event.id}`;
  const { day, month, year } = dateParts(event.start);
  const hasRegistration = event.registrationUrl && event.registrationUrl !== '#';
  const speakers = event.speakers || [];

  const poster = event.image;

  return (
    <article className={`next-event ${poster ? 'next-event--poster' : ''}`}>
      {poster && (
        <Link to={url} className="next-event__poster">
          <img src={poster} alt={`Affiche : ${event.title}`} />
        </Link>
      )}
      <div className="next-event__date">
        <span className="next-event__countdown">{daysUntilLabel(event.start)}</span>
        <span className="next-event__day">{day}</span>
        <span className="next-event__month">
          {month} {year}
        </span>
        <span className="next-event__time">
          {formatTime(event.start)}
          {event.end && ` – ${formatTime(event.end)}`}
        </span>
      </div>

      <div className="next-event__body">
        <p className="kicker">
          {FORMAT_LABELS[event.format]} · {event.location}
        </p>
        <h3>
          <Link to={url}>{event.title}</Link>
        </h3>
        {event.summary && <p className="next-event__summary">{event.summary}</p>}
        {speakers.length > 0 && (
          <p className="next-event__speakers">
            <Icon name="mic" size={16} />
            <span>
              {speakers.map((s, i) => (
                <span key={s.name}>
                  {i > 0 && ', '}
                  <strong>{s.name}</strong>
                  {s.title && ` · ${s.title}`}
                </span>
              ))}
            </span>
          </p>
        )}
        <div className="next-event__actions">
          {hasRegistration ? (
            <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="btn btn--primary">
              S'inscrire
            </a>
          ) : (
            <Link to={url} className="btn btn--primary">
              S'inscrire
            </Link>
          )}
          <Link to={url} className="link-arrow">
            Voir le programme <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
