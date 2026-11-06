import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { LoadState, useLoad } from '../useLoad.jsx';
import { FORMAT_LABELS, formatDate, isUpcoming } from '../../utils/events.js';

export default function EventsList() {
  const { data: events, setData, error, loading, reload } = useLoad(adminApi.events);
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState('');

  async function remove(event) {
    if (!window.confirm(`Supprimer définitivement « ${event.title} » ?\n\nCette action est irréversible.`)) return;
    setActionError('');
    try {
      await adminApi.deleteEvent(event.id);
      setData((list) => list.filter((e) => e.id !== event.id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  const q = query.trim().toLowerCase();
  const shown = (events || []).filter((e) => !q || e.title.toLowerCase().includes(q));

  return (
    <>
      <header className="adm-head">
        <h1>Événements</h1>
        <Link to="/admin/evenements/nouveau" className="btn btn--primary btn--sm">
          + Nouvel événement
        </Link>
      </header>

      {!events ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : (
        <section className="adm-panel">
          <input
            className="input adm-search"
            type="search"
            placeholder="Rechercher un événement…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {actionError && <p className="adm-error">{actionError}</p>}
          {shown.length === 0 ? (
            <p className="adm-empty">Aucun événement.</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Événement</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <Link to={`/admin/evenements/${e.id}`} className="adm-strong">
                          {e.title}
                        </Link>
                        <div className="adm-muted">{FORMAT_LABELS[e.format] || e.format}</div>
                      </td>
                      <td className="adm-nowrap">{formatDate(e.start)}</td>
                      <td>
                        {e.published === false ? (
                          <span className="adm-badge">Brouillon</span>
                        ) : isUpcoming(e) ? (
                          <span className="adm-badge adm-badge--green">À venir</span>
                        ) : (
                          <span className="adm-badge adm-badge--grey">Passé</span>
                        )}
                      </td>
                      <td className="adm-actions">
                        <Link to={`/admin/evenements/${e.id}`} className="btn btn--ghost btn--xs">
                          Modifier
                        </Link>
                        <button type="button" className="btn btn--ghost btn--xs adm-danger" onClick={() => remove(e)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
