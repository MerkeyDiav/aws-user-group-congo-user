import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { FORMAT_LABELS, dateParts, formatTime } from '../utils/events.js';

/** "texte {mot} texte" -> le mot entre accolades est mis en valeur. */
function renderTitle(title = '') {
  return title.split(/\{(.+?)\}/).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));
}

export default function Hero({ hero, nextEvent }) {
  const images = hero.images || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 7000);
    return () => clearInterval(id);
  }, [images.length]);

  const next = nextEvent && dateParts(nextEvent.start);

  return (
    <section className="hero">
      {images.map((src, i) => (
        <div
          key={src}
          className={`hero__img ${i === index ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
          aria-hidden="true"
        />
      ))}
      <div className="hero__overlay" aria-hidden="true" />

      <div className="container hero__main">
        <div className="hero__content">
          <h1>{renderTitle(hero.title)}</h1>
          <p className="hero__text">{hero.subtitle}</p>
          <div className="hero__actions">
            <Link to="/rejoindre" className="btn btn--primary btn--lg">
              Rejoindre la communauté
            </Link>
            <Link to="/evenements" className="btn btn--outline-light btn--lg">
              Nos événements
            </Link>
          </div>
        </div>
      </div>

      {nextEvent && (
        <div className="hero__next">
          <div className="container hero__next-inner">
            <span className="hero__next-label">Prochain événement</span>
            <span className="hero__next-date">
              {next.day} {next.month} {next.year} · {formatTime(nextEvent.start)} · {FORMAT_LABELS[nextEvent.format]}
            </span>
            <Link to={`/evenements/${nextEvent.id}`} className="hero__next-title">
              {nextEvent.title}
            </Link>
            <Link to={`/evenements/${nextEvent.id}`} className="hero__next-link" aria-label="Voir l'événement">
              <Icon name="arrowRight" size={20} />
            </Link>
          </div>
        </div>
      )}

      {hero.credit && <span className="hero__credit">{hero.credit}</span>}
    </section>
  );
}
