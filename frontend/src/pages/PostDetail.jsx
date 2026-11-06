import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PostCard from '../components/PostCard.jsx';
import PostCta from '../components/PostCta.jsx';
import PostMedia from '../components/PostMedia.jsx';
import NotFound from './NotFound.jsx';
import { useResource } from '../hooks/useResource.js';
import { formatPublishDate, isVideoPost } from '../utils/posts.js';

export default function PostDetail() {
  const { id } = useParams();
  const posts = useResource('posts');
  const events = useResource('events');
  const site = useResource('site');
  const [copied, setCopied] = useState(false);

  const post = posts.find((p) => p.id === id);
  if (!post) return <NotFound title="Publication introuvable" />;

  const event = post.eventId ? events.find((e) => e.id === post.eventId) : null;
  // Autres publications : d'abord celles du même événement.
  const related = posts
    .filter((p) => p.id !== post.id)
    .sort((a, b) => (b.eventId === post.eventId) - (a.eventId === post.eventId))
    .slice(0, 3);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
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
      <header className="page-header page-header--post">
        <div className="container post-page__inner">
          <nav className="breadcrumb" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link to="/actualites">Actualités</Link>
          </nav>
          <p className="post-page__meta">
            <span className={`post-badge ${isVideoPost(post) ? 'post-badge--video' : ''}`}>
              {isVideoPost(post) ? 'Vidéo' : 'Article'}
            </span>
            <time dateTime={post.publishAt}>{formatPublishDate(post.publishAt)}</time>
            {event && (
              <Link to={`/evenements/${event.id}`} className="post-page__event">
                <Icon name="calendar" size={15} /> {event.title}
              </Link>
            )}
          </p>
          <h1>{post.title}</h1>
        </div>
      </header>

      <section className="section section--pt-sm post-page">
        <div className="container post-page__inner">
          <PostMedia post={post} />

          {post.body?.length > 0 && (
            <div className="prose post-page__body">
              {post.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          <button type="button" className="btn btn--ghost btn--sm post-page__share" onClick={share}>
            <Icon name={copied ? 'check' : 'share'} size={16} /> {copied ? 'Lien copié' : 'Partager'}
          </button>

          <PostCta post={post} events={events} site={site} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <h2 className="section-title">À lire et à voir aussi</h2>
            <div className="grid grid--3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} event={p.eventId ? events.find((e) => e.id === p.eventId) : null} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
