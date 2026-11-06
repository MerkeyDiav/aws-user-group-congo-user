import { Link } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { LoadState, useLoad } from '../useLoad.jsx';
import { formatDate, isUpcoming } from '../../utils/events.js';

export default function Dashboard() {
  const { data, error, loading, reload } = useLoad(() => Promise.all([adminApi.events(), adminApi.submissions()]));

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const [events, submissions] = data;
  const upcoming = events.filter((e) => e.published !== false && isUpcoming(e)).sort((a, b) => a.start.localeCompare(b.start));
  const drafts = events.filter((e) => e.published === false);
  const fresh = submissions.filter((s) => s.status !== 'done');

  return (
    <>
      <header className="adm-head">
        <h1>Tableau de bord</h1>
        <Link to="/admin/evenements/nouveau" className="btn btn--primary btn--sm">
          + Nouvel événement
        </Link>
      </header>

      <div className="adm-cards">
        <Link to="/admin/evenements" className="adm-card">
          <strong>{upcoming.length}</strong>
          <span>événement{upcoming.length > 1 ? 's' : ''} à venir</span>
        </Link>
        <Link to="/admin/evenements" className="adm-card">
          <strong>{drafts.length}</strong>
          <span>brouillon{drafts.length > 1 ? 's' : ''}</span>
        </Link>
        <Link to="/admin/soumissions" className={`adm-card ${fresh.length ? 'adm-card--alert' : ''}`}>
          <strong>{fresh.length}</strong>
          <span>soumission{fresh.length > 1 ? 's' : ''} à traiter</span>
        </Link>
      </div>

      <section className="adm-panel">
        <h2>Prochains événements</h2>
        {upcoming.length === 0 ? (
          <p className="adm-empty">
            Aucun événement à venir. <Link to="/admin/evenements/nouveau">Créer un événement</Link>
          </p>
        ) : (
          <ul className="adm-rows">
            {upcoming.slice(0, 5).map((e) => (
              <li key={e.id}>
                <Link to={`/admin/evenements/${e.id}`}>{e.title}</Link>
                <span className="adm-muted">{formatDate(e.start)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="adm-panel">
        <h2>Dernières soumissions</h2>
        {fresh.length === 0 ? (
          <p className="adm-empty">Rien à traiter pour le moment.</p>
        ) : (
          <ul className="adm-rows">
            {fresh.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link to="/admin/soumissions">
                  {s.data?.name || s.data?.fullName || [s.data?.firstName, s.data?.lastName].filter(Boolean).join(' ') || s.data?.email}
                </Link>
                <span className="adm-muted">
                  {{ contact: 'Contact', join: 'Adhésion', speaker: 'Speaker' }[s.type] || s.type} ·{' '}
                  {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
