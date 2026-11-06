import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import CountUp from '../components/CountUp.jsx';
import ActivityTiles from '../components/ActivityTiles.jsx';
import Icon from '../components/Icon.jsx';
import SectionHead from '../components/SectionHead.jsx';
import EventCard from '../components/EventCard.jsx';
import FeaturedEvent from '../components/FeaturedEvent.jsx';
import Gallery from '../components/Gallery.jsx';
import { useResource } from '../hooks/useResource.js';
import { useNow } from '../hooks/useNow.js';
import { eventStatus, splitEvents } from '../utils/events.js';

export default function Home() {
  const site = useResource('site');
  const events = useResource('events');
  const now = useNow();
  const { upcoming, past } = splitEvents(events, now);
  // À la une : le prochain événement ; s'il n'y en a pas, le dernier passé (affiché « Terminé », en gris).
  const next = upcoming[0] || past[0];
  const more = [...upcoming, ...past].filter((e) => e !== next).slice(0, 3);
  const nextStatus = next && eventStatus(next, now);
  const nextHeading =
    nextStatus === 'past' ? 'Dernier événement' : nextStatus === 'live' ? 'En ce moment' : 'Prochain événement';

  return (
    <>
      <Hero hero={site.hero} nextEvent={next} />

      <section className="section">
        <div className="container">
          <ActivityTiles activities={site.activities} />

          <div className="intro">
            <h2 className="intro__title">
              Par la communauté,
              <br />
              pour la communauté.
            </h2>
            <div>
              <p className="lead">
                Les AWS User Groups sont des communautés locales animées par des bénévoles. On s'y retrouve pour
                découvrir les nouveautés d'AWS, apprendre de ses pairs et rencontrer d'autres builders du cloud.
              </p>
              <p className="lead">
                À Kinshasa, nous organisons des webinaires et des rencontres gratuits, ouverts aux débutants comme aux
                profils confirmés.
              </p>
              <Link to="/a-propos" className="link-arrow">
                En savoir plus sur le groupe <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>

          {site.stats?.length > 0 && (
            <dl className="stats">
              {site.stats.map((s) => (
                <div key={s.label} className="stat">
                  <dt>{s.label}</dt>
                  <dd>
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {next && (
        <section className="section section--soft">
          <div className="container">
            <SectionHead title={nextHeading} />
            <FeaturedEvent event={next} />
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead
              title={upcoming.length > 1 ? 'À venir et récents' : 'Événements récents'}
              action={
                <Link to="/evenements" className="link-arrow">
                  Tous les événements <Icon name="arrowRight" size={16} />
                </Link>
              }
            />
            <div className="grid grid--3">
              {more.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}

      {site.gallery?.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <SectionHead
              title="En images"
              action={
                site.social?.meetup && (
                  <a href={site.social.meetup} target="_blank" rel="noreferrer" className="link-arrow">
                    Plus de photos sur Meetup <Icon name="arrowRight" size={16} />
                  </a>
                )
              }
            >
              Quelques moments de nos meetups, webinaires et workshops.
            </SectionHead>
            <Gallery photos={site.gallery} />
          </div>
        </section>
      )}

      <section className="band">
        <div className="container band__inner">
          <div className="band__item">
            <h2>Rejoindre le groupe</h2>
            <p>Recevez les invitations aux prochains événements et les ressources partagées par la communauté.</p>
            <Link to="/rejoindre" className="btn btn--light">
              Devenir membre
            </Link>
          </div>
          <div className="band__item">
            <h2>Proposer un talk</h2>
            <p>Un retour d'expérience, une démo ou un service AWS à présenter ? Proposez votre sujet.</p>
            <Link to="/speakers" className="btn btn--outline-light">
              Devenir speaker
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
