import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { FORMAT_LABELS, dateParts, formatTime, isUpcoming } from '../utils/events.js';

export default function EventCard({ event }) {
  const upcoming = isUpcoming(event);
  const { day, month, year } = dateParts(event.start);
  const url = `/evenements/${event.id}`;
  const speakers = event.speakers || [];

  return (
    <article className="event-card">
      {event.image && (
        <Link to={url} className="event-card__img" tabIndex={-1} aria-hidden="true">
          <img src={event.image} alt="" loading="lazy" />
        </Link>
      )}
      <div className="event-card__body">
        <div className="event-card__top">
          <time dateTime={event.start}>
            {day} {month} {year} · {formatTime(event.start)}
          </time>
          <span className={`format format--${event.format}`}>{FORMAT_LABELS[event.format]}</span>
        </div>
        <h3>
          <Link to={url}>{event.title}</Link>
        </h3>
        {event.summary && <p className="event-card__summary">{event.summary}</p>}
        <div className="event-card__bottom">
          <span className="event-card__speakers">
            {speakers.length > 0 ? (
              <>
                <Icon name="mic" size={15} /> {speakers.map((s) => s.name).join(', ')}
              </>
            ) : (
              !upcoming &&
              event.attendees >= 5 && (
                <>
                  <Icon name="users" size={15} /> {event.attendees} participant{event.attendees > 1 ? 's' : ''}
                </>
              )
            )}
          </span>
          <Link to={url} className="link-arrow" aria-label={`Détails : ${event.title}`}>
            {upcoming ? 'Détails' : 'Récap'} <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
