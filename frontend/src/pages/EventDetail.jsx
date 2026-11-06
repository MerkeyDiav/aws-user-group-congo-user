import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import EventCard from '../components/EventCard.jsx';
import NotFound from './NotFound.jsx';
import PostCard from '../components/PostCard.jsx';
import { useResource } from '../hooks/useResource.js';
import { FORMAT_LABELS, countdownLabel, eventStatus, formatDate, formatTime, googleCalendarUrl } from '../utils/events.js';
import { useNow } from '../hooks/useNow.js';

const isSet = (url) => Boolean(url) && url !== '#';

export default function EventDetail() {
  const { id } = useParams();
  const events = useResource('events');
  const posts = useResource('posts');
  const site = useResource('site');
  const event = events.find((e) => e.id === id);
  const [copied, setCopied] = useState(false);
  const now = useNow();

  if (!event) return <NotFound title="Événement introuvable" />;

  const status = eventStatus(event, now);
  const upcoming = status !== 'past';
  const description = Array.isArray(event.description) ? event.description : [event.description].filter(Boolean);
  const related = events.filter((e) => e.id !== event.id).slice(0, 3);
  const eventPosts = posts.filter((p) => p.eventId === event.id);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url });
      } catch {
        /* partage annulé */
      }
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <header className="page-header page-header--image page-header--event">
        <div
          className="page-header__img"
          style={{ backgroundImage: `url(${site.pageImages?.events})` }}
          aria-hidden="true"
        />
        <div className="container">
          <nav className="breadcrumb" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <Link to={upcoming ? '/evenements' : '/evenements?tab=past'}>Événements</Link>
          </nav>
          <p className="page-header__meta">
            <span className={upcoming ? 'status status--upcoming' : 'status'}>
              {status === 'live' ? 'En cours' : upcoming ? 'À venir' : 'Terminé'}
            </span>
            <span>{FORMAT_LABELS[event.format]}</span>
            {event.language && <span>{event.language}</span>}
          </p>
          <h1 className="event-title">{event.title}</h1>
          {event.summary && <p>{event.summary}</p>}
        </div>
      </header>

      <section className="section section--pt-sm">
        <div className="container event-layout">
          <div className="event-main">
            {event.image && (
              <div className="event-poster">
                <img src={event.image} alt={`Affiche : ${event.title}`} />
              </div>
            )}

            <div className="prose">
              <h2>À propos de cet événement</h2>
              {description.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}

              {event.highlights?.length > 0 && (
                <>
                  <h2>Ce que vous allez apprendre</h2>
                  <ul className="check-list">
                    {event.highlights.map((h) => (
                      <li key={h}>
                        <Icon name="check" size={18} /> {h}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {event.agenda?.length > 0 && (
                <>
                  <h2>Programme</h2>
                  <ol className="agenda">
                    {event.agenda.map((a) => (
                      <li key={a.time + a.title}>
                        <time>{a.time}</time>
                        <span>{a.title}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {event.speakers?.length > 0 && (
                <>
                  <h2>{event.speakers.length > 1 ? 'Speakers' : 'Speaker'}</h2>
                  <div className="speakers">
                    {event.speakers.map((s) => (
                      <article key={s.name} className="speaker">
                        <Avatar name={s.name} photo={s.photo} size={76} className="avatar--square" />
                        <div>
                          <h3>{s.name}</h3>
                          <p className="leader__role">{s.title}</p>
                          {s.bio && <p>{s.bio}</p>}
                          {s.linkedin && (
                            <a href={s.linkedin} target="_blank" rel="noreferrer" className="link-arrow">
                              <Icon name="linkedin" size={16} /> LinkedIn
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="sidebar-card">
            <h3>Informations pratiques</h3>
            <ul className="info-list">
              <li>
                <span className="info-list__icon">
                  <Icon name="calendar" size={18} />
                </span>
                <div>
                  <small>Date</small>
                  <strong>{formatDate(event.start)}</strong>
                </div>
              </li>
              <li>
                <span className="info-list__icon">
                  <Icon name="clock" size={18} />
                </span>
                <div>
                  <small>Horaire (heure de Kinshasa)</small>
                  <strong>
                    {formatTime(event.start)}
                    {event.end && ` – ${formatTime(event.end)}`}
                  </strong>
                </div>
              </li>
              <li>
                <span className="info-list__icon">
                  <Icon name={event.format === 'online' ? 'video' : 'pin'} size={18} />
                </span>
                <div>
                  <small>Lieu</small>
                  <strong>{event.location}</strong>
                </div>
              </li>
              {!upcoming && event.attendees >= 5 && (
                <li>
                  <span className="info-list__icon">
                    <Icon name="users" size={18} />
                  </span>
                  <div>
                    <small>Participants inscrits</small>
                    <strong>{event.attendees}</strong>
                  </div>
                </li>
              )}
            </ul>

            {upcoming && <p className="sidebar-card__countdown">{countdownLabel(event, now)}</p>}

            <div className="sidebar-card__actions">
              {upcoming ? (
                <>
                  {isSet(event.registrationUrl) ? (
                    <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="btn btn--primary btn--block">
                      S'inscrire gratuitement <Icon name="arrowRight" size={18} />
                    </a>
                  ) : (
                    <Link to="/rejoindre" className="btn btn--primary btn--block">
                      Rejoindre pour être notifié
                    </Link>
                  )}
                  <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="btn btn--ghost btn--block">
                    <Icon name="calendar" size={18} /> Ajouter à Google Agenda
                  </a>
                </>
              ) : (
                <>
                  {isSet(event.recordingUrl) && (
                    <a href={event.recordingUrl} target="_blank" rel="noreferrer" className="btn btn--primary btn--block">
                      <Icon name="play" size={18} /> Voir le replay
                    </a>
                  )}
                  {isSet(event.slidesUrl) && (
                    <a href={event.slidesUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--block">
                      <Icon name="book" size={18} /> Télécharger les slides
                    </a>
                  )}
                  {!isSet(event.recordingUrl) && !isSet(event.slidesUrl) && (
                    <p className="form-note">Cet événement est terminé. Merci à tous les participants !</p>
                  )}
                </>
              )}
              <button type="button" className="btn btn--ghost btn--block" onClick={share}>
                <Icon name={copied ? 'check' : 'share'} size={18} /> {copied ? 'Lien copié !' : 'Partager'}
              </button>
            </div>
          </aside>
        </div>
      </section>

      {eventPosts.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Autour de cet événement</h2>
            <div className="grid grid--3">
              {eventPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <div className="section__head section__head--split">
              <h2 className="section-title">Autres événements</h2>
              <Link to="/evenements" className="btn btn--ghost">
                Tous les événements <Icon name="arrowRight" size={18} />
              </Link>
            </div>
            <div className="grid grid--3">
              {related.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
