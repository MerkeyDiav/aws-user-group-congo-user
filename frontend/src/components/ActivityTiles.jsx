import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

/**
 * Tuiles photo des activités. Au défilement, chaque photo glisse légèrement
 * (effet de parallaxe) et le texte apparaît quand la tuile entre à l'écran.
 */
export default function ActivityTiles({ activities = [] }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const images = [...root.querySelectorAll('.tile__img')];
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      images.forEach((img, i) => {
        const rect = img.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        // -1 quand la tuile entre par le bas, +1 quand elle sort par le haut
        const progress = (vh - rect.top) / (vh + rect.height) * 2 - 1;
        const speed = i % 2 ? 36 : 24; // des vitesses alternées donnent du relief
        img.style.transform = `translate3d(0, ${(-progress * speed).toFixed(1)}px, 0) scale(1.12)`;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [activities.length]);

  return (
    <div className="tiles" ref={ref}>
      {activities.map((a) => (
        <Link key={a.label} to="/evenements?tab=past" className="tile">
          <span className="tile__img" style={{ backgroundImage: `url(${a.image})` }} aria-hidden="true" />
          <span className="tile__body">
            <span className="tile__label">{a.label}</span>
            {a.text && <span className="tile__text">{a.text}</span>}
            <span className="tile__more">
              Voir les événements <Icon name="arrowRight" size={15} />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
