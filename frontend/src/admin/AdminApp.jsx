import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { currentUser, onSessionChange, signOut } from './auth.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EventsList from './pages/EventsList.jsx';
import EventEditor from './pages/EventEditor.jsx';
import SiteEditor from './pages/SiteEditor.jsx';
import Submissions from './pages/Submissions.jsx';
import './admin.css';

const NAV = [
  ['', 'Tableau de bord', 'home'],
  ['evenements', 'Événements', 'calendar'],
  ['contenu', 'Contenu du site', 'edit'],
  ['soumissions', 'Soumissions', 'inbox'],
];

export default function AdminApp() {
  const [user, setUser] = useState(currentUser);
  useEffect(() => onSessionChange(() => setUser(currentUser())), []);

  useEffect(() => {
    // L'espace admin ne doit pas apparaître dans les moteurs de recherche.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const title = document.title;
    document.title = 'Admin · AWS User Group Kinshasa';
    return () => {
      meta.remove();
      document.title = title;
    };
  }, []);

  if (!user) return <Login />;

  return (
    <div className="adm">
      <aside className="adm-side">
        <Link to="/admin" className="adm-side__brand">
          <img src="/images/logo/logo-128.png" alt="" width="36" height="36" />
          <span>
            AWS UG Kinshasa
            <small>Espace admin</small>
          </span>
        </Link>
        <nav className="adm-side__nav" aria-label="Admin">
          {NAV.map(([to, label, icon]) => (
            <NavLink key={to} to={to ? `/admin/${to}` : '/admin'} end={!to} className="adm-side__link">
              <Icon name={icon} size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side__foot">
          <a href="/" target="_blank" rel="noreferrer" className="adm-side__link">
            <Icon name="external" size={18} /> Voir le site
          </a>
          <button type="button" className="adm-side__link" onClick={signOut}>
            <Icon name="logout" size={18} /> Déconnexion
          </button>
          <small className="adm-side__user">{user.email}</small>
        </div>
      </aside>
      <main className="adm-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="evenements" element={<EventsList />} />
          <Route path="evenements/nouveau" element={<EventEditor />} />
          <Route path="evenements/:id" element={<EventEditor />} />
          <Route path="contenu" element={<SiteEditor />} />
          <Route path="soumissions" element={<Submissions />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
