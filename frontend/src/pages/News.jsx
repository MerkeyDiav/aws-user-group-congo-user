import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import PostCard from '../components/PostCard.jsx';
import { useResource } from '../hooks/useResource.js';

const FILTERS = [
  ['all', 'Tout'],
  ['video', 'Vidéos'],
  ['post', 'Articles'],
];

export default function News() {
  const site = useResource('site');
  const posts = useResource('posts');
  const events = useResource('events');
  const [filter, setFilter] = useState('all');

  const shown = posts.filter((p) => filter === 'all' || p.type === filter);
  const eventOf = (p) => (p.eventId ? events.find((e) => e.id === p.eventId) : null);

  return (
    <>
      <PageHeader eyebrow="Actualités" image={site.pageImages?.events} title="L'actualité de la communauté">
        Présentations de nos speakers, sujets de nos prochains événements et nouvelles du groupe.
      </PageHeader>

      <section className="section">
        <div className="container">
          {posts.length === 0 ? (
            <p className="empty">Les premières actualités arrivent très bientôt.</p>
          ) : (
            <>
              <div className="chip-group news-filters" role="tablist" aria-label="Type de publication">
                {FILTERS.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={filter === id}
                    className={`chip ${filter === id ? 'is-active' : ''}`}
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {shown.length === 0 ? (
                <p className="empty">Aucune publication de ce type pour l'instant.</p>
              ) : (
                <div className="grid grid--3">
                  {shown.map((p) => (
                    <PostCard key={p.id} post={p} event={eventOf(p)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
