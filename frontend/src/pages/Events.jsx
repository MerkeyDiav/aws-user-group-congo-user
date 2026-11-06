import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import EventCard from '../components/EventCard.jsx';
import FeaturedEvent from '../components/FeaturedEvent.jsx';
import Icon from '../components/Icon.jsx';
import { useResource } from '../hooks/useResource.js';
import { FORMAT_LABELS, matchesQuery, splitEvents } from '../utils/events.js';
import { useNow } from '../hooks/useNow.js';

const FORMATS = [['all', 'Tous'], ...Object.entries(FORMAT_LABELS)];

/** Regroupe les événements (déjà triés) par année, la plus récente en premier. */
function groupByYear(events) {
  const groups = new Map();
  events.forEach((e) => {
    const year = new Date(e.start).getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(e);
  });
  return [...groups.entries()];
}

export default function Events() {
  const events = useResource('events');
  const site = useResource('site');
  const now = useNow();
  const { upcoming, past } = useMemo(() => splitEvents(events, now), [events, now]);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'past' ? 'past' : 'upcoming';
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('all');

  const source = tab === 'past' ? past : upcoming;
  const filtered = source.filter((e) => (format === 'all' || e.format === format) && matchesQuery(e, query));
  const isFiltering = query || format !== 'all';
  const showFeatured = tab === 'upcoming' && !isFiltering && filtered.length > 0;
  const list = showFeatured ? filtered.slice(1) : filtered;

  const setTab = (t) => setParams(t === 'past' ? { tab: 'past' } : {}, { replace: true });

  return (
    <>
      <PageHeader eyebrow="Événements" image={site.pageImages?.events} title="Meetups, webinaires & workshops">
        Retrouvez nos prochains rendez-vous et revivez nos événements passés : replays, supports et récaps.
      </PageHeader>

      <section className="section">
        <div className="container">
          <div className="toolbar">
            <div className="tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'upcoming'}
                className={`tab ${tab === 'upcoming' ? 'is-active' : ''}`}
                onClick={() => setTab('upcoming')}
              >
                À venir <span className="tab__count">{upcoming.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'past'}
                className={`tab ${tab === 'past' ? 'is-active' : ''}`}
                onClick={() => setTab('past')}
              >
                Passés <span className="tab__count">{past.length}</span>
              </button>
            </div>

            <div className="toolbar__filters">
              <div className="chip-group" aria-label="Filtrer par format">
                {FORMATS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip ${format === value ? 'is-active' : ''}`}
                    onClick={() => setFormat(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="search">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  className="input"
                  placeholder="Rechercher…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div key={`${tab}-${format}`} className="tab-panel">
            {showFeatured && (
              <div className="events-featured">
                <FeaturedEvent event={filtered[0]} />
              </div>
            )}

            {tab === 'past'
              ? groupByYear(list).map(([year, items]) => (
                  <div key={year} className="year-group">
                    <h2 className="year-group__title">
                      {year}
                      <span>
                        {items.length} événement{items.length > 1 ? 's' : ''}
                      </span>
                    </h2>
                    <div className="grid grid--3">
                      {items.map((e) => (
                        <EventCard key={e.id} event={e} />
                      ))}
                    </div>
                  </div>
                ))
              : list.length > 0 && (
                  <div className="grid grid--3">
                    {list.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </div>
                )}
          </div>

          {filtered.length === 0 && (
            <div className="empty">
              <h3>{isFiltering ? 'Aucun événement ne correspond à votre recherche' : 'Aucun événement pour le moment'}</h3>
              <p>
                {tab === 'upcoming'
                  ? 'Nos prochains événements seront annoncés très bientôt. Rejoignez la communauté pour être notifié en premier.'
                  : 'Essayez un autre mot-clé ou un autre filtre.'}
              </p>
              <Link to="/rejoindre" className="btn btn--primary">
                Être informé <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="band">
        <div className="container band__row">
          <div>
            <h2>Vous souhaitez animer une session ?</h2>
            <p>Partagez votre expertise AWS avec la communauté lors d'un webinaire ou d'un meetup.</p>
          </div>
          <Link to="/speakers" className="btn btn--light">
            Proposer un talk
          </Link>
        </div>
      </section>
    </>
  );
}
