import { useCallback, useEffect, useState } from 'react';
import Icon from './Icon.jsx';

/** Galerie photo en mosaïque, avec visionneuse plein écran (clavier : ← → Échap). */
export default function Gallery({ photos = [] }) {
  const [open, setOpen] = useState(null); // index de la photo affichée, ou null

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta) => setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, step]);

  return (
    <>
      <div className="gallery">
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            className={`gallery__item ${p.size ? `gallery__item--${p.size}` : ''}`}
            onClick={() => setOpen(i)}
            aria-label={`Agrandir : ${p.alt}`}
          >
            <img src={p.src} alt={p.alt} loading="lazy" />
            {p.caption && <span className="gallery__caption">{p.caption}</span>}
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Visionneuse photo" onClick={close}>
          <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
            <img key={photos[open].src} src={photos[open].src} alt={photos[open].alt} />
            <figcaption>
              <span>{photos[open].caption || photos[open].alt}</span>
              <span className="lightbox__count">
                {open + 1} / {photos.length}
              </span>
            </figcaption>
          </figure>
          <button type="button" className="lightbox__btn lightbox__close" onClick={close} aria-label="Fermer">
            <Icon name="close" size={22} />
          </button>
          <button
            type="button"
            className="lightbox__btn lightbox__prev"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Photo précédente"
          >
            <Icon name="arrowLeft" size={22} />
          </button>
          <button
            type="button"
            className="lightbox__btn lightbox__next"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Photo suivante"
          >
            <Icon name="arrowRight" size={22} />
          </button>
        </div>
      )}
    </>
  );
}
