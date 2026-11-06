import { useEffect } from 'react';

/**
 * Fait apparaître en douceur les blocs de contenu lorsqu'ils entrent dans l'écran.
 * Les blocs déjà visibles au chargement ne sont pas masqués, et rien n'est animé
 * si l'utilisateur a demandé à réduire les animations.
 */
const SELECTOR = [
  '.section__head',
  '.tile',
  '.intro > *',
  '.stat',
  '.next-event',
  '.event-card',
  '.card',
  '.step',
  '.faq',
  '.facts',
  '.split > *',
  '.band__item',
  '.band__row > *',
  '.form-card',
  '.info-card',
  '.topics-box',
  '.speaker',
  '.agenda',
  '.event-poster',
  '.gallery__item',
].join(',');

export function useScrollReveal(key) {
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main || !('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    );

    const limit = window.innerHeight * 0.9;
    main.querySelectorAll(SELECTOR).forEach((el) => {
      if (el.parentElement.closest('.reveal')) return; // un parent s'anime déjà
      if (el.getBoundingClientRect().top < limit) return; // déjà à l'écran
      const siblings = [...el.parentElement.children].filter((c) => c.matches(SELECTOR));
      el.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(el), 4) * 90}ms`);
      el.classList.add('reveal');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [key]);
}
