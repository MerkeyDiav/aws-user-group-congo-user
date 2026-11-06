import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

export const NAV_LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/a-propos', label: 'À propos' },
  { to: '/evenements', label: 'Événements' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/speakers', label: 'Devenir speaker' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const linkClass = ({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`;

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''} ${open ? 'nav--open' : ''}`}>
      <div className="container nav__inner">
        <Link to="/" className="nav__brand" aria-label="Accueil">
          <Logo />
        </Link>

        <nav className="nav__links" aria-label="Navigation principale">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/rejoindre" className="btn btn--primary btn--sm nav__cta">
          Rejoindre
        </Link>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} size={24} />
        </button>
      </div>

      <div id="mobile-menu" className="nav__mobile">
        {NAV_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            {l.label}
          </NavLink>
        ))}
        <Link to="/rejoindre" className="btn btn--primary btn--block">
          Rejoindre la communauté
        </Link>
      </div>
    </header>
  );
}
