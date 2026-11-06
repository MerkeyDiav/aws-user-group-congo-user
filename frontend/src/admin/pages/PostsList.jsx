import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { LoadState, useLoad } from '../useLoad.jsx';
import { STATUS_LABELS, postStatus } from '../campaign.js';
import { shortDateTime } from '../dates.js';

const TABS = [
  ['scheduled', 'Programmées'],
  ['live', 'En ligne'],
  ['draft', 'Brouillons'],
  ['all', 'Toutes'],
];

export default function PostsList() {
  const { data, setData, error, loading, reload } = useLoad(() => Promise.all([adminApi.posts(), adminApi.events()]));
  const [tab, setTab] = useState('scheduled');
  const [actionError, setActionError] = useState('');

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const [posts, events] = data;
  const eventTitle = (id) => events.find((e) => e.id === id)?.title;

  const withStatus = posts.map((p) => ({ ...p, status: postStatus(p) }));
  const count = (t) => withStatus.filter((p) => t === 'all' || p.status === t).length;
  const shown = withStatus
    .filter((p) => tab === 'all' || p.status === tab)
    // Programmées : la plus proche en premier ; sinon la plus récente en premier.
    .sort((a, b) => (tab === 'scheduled' ? 1 : -1) * String(a.publishAt).localeCompare(String(b.publishAt)));

  async function remove(post) {
    if (!window.confirm(`Supprimer définitivement « ${post.title} » ?`)) return;
    setActionError('');
    try {
      await adminApi.deletePost(post.id);
      setData(([list, ev]) => [list.filter((p) => p.id !== post.id), ev]);
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      <header className="adm-head">
        <h1>Actualités</h1>
        <Link to="/admin/actualites/nouveau" className="btn btn--primary btn--sm">
          + Nouvelle publication
        </Link>
      </header>

      <p className="adm-hint adm-intro">
        Astuce : le programme de publication d'un événement (J-7, J-6, J-5, J-3, J-1…) se génère depuis la page de
        l'événement.
      </p>

      <div className="adm-filters">
        <div className="chip-group" role="tablist">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`chip ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label} <span className="adm-muted">{count(id)}</span>
            </button>
          ))}
        </div>
      </div>

      {actionError && <p className="adm-error">{actionError}</p>}

      <section className="adm-panel">
        {shown.length === 0 ? (
          <p className="adm-empty">Aucune publication ici.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Publication</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/admin/actualites/${p.id}`} className="adm-strong">
                        {p.title}
                      </Link>
                      <div className="adm-muted">
                        {p.type === 'video' ? 'Vidéo' : 'Post'}
                        {p.eventId && ` · ${eventTitle(p.eventId) || p.eventId}`}
                      </div>
                    </td>
                    <td className="adm-nowrap">{shortDateTime(p.publishAt)}</td>
                    <td>
                      <span className={`adm-badge adm-badge--${p.status}`}>{STATUS_LABELS[p.status]}</span>
                    </td>
                    <td className="adm-actions">
                      <Link to={`/admin/actualites/${p.id}`} className="btn btn--ghost btn--xs">
                        Modifier
                      </Link>
                      <button type="button" className="btn btn--ghost btn--xs adm-danger" onClick={() => remove(p)}>
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
    </>
  );
}
