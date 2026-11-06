import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from './adminApi.js';
import { useLoad } from './useLoad.jsx';
import { CAMPAIGN_STEPS, STATUS_LABELS, buildCampaign, postStatus } from './campaign.js';
import { shortDateTime } from './dates.js';

/**
 * Programme de publication d'un événement (section « Actualités » du site) : liste des publications
 * liées et générateur du programme type (jours à cocher : J-7, J-6, J-5, J-3, J-1, Jour J).
 */
export default function EventCampaign({ event }) {
  const { data: allPosts, setData, error, loading, reload } = useLoad(adminApi.posts);
  const [steps, setSteps] = useState(() => CAMPAIGN_STEPS.filter((s) => s.checked).map((s) => s.key));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const posts = (allPosts || [])
    .filter((p) => p.eventId === event.id)
    .sort((a, b) => String(a.publishAt).localeCompare(String(b.publishAt)));
  const existingIds = new Set((allPosts || []).map((p) => p.id));

  const toggle = (key) => setSteps((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  async function generate() {
    const drafts = buildCampaign(event, steps).filter((p) => !existingIds.has(p.id));
    if (drafts.length === 0) {
      setMessage('Ces publications existent déjà pour cet événement.');
      return;
    }
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      const saved = [];
      for (const draft of drafts) saved.push(await adminApi.savePost(draft));
      setData((list) => [...(list || []), ...saved]);
      setMessage(`${saved.length} brouillon(s) créé(s) : complétez chacun puis cochez « Programmée ».`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-panel adm-form">
      <h2>Programme de publication</h2>
      <p className="adm-hint">
        Les publications apparaissent dans « Actualités » sur le site, chacune à sa date. Ajoutez-en autant que voulu, ou
        générez le programme type puis adaptez-le.
      </p>

      {error && <p className="adm-error">{error}</p>}
      {loading && !allPosts && <p className="adm-muted">Chargement…</p>}

      {allPosts &&
        (posts.length === 0 ? (
          <p className="adm-empty">Aucune publication pour cet événement.</p>
        ) : (
          <ul className="adm-timeline">
            {posts.map((p) => {
              const status = postStatus(p);
              return (
                <li key={p.id} className={`adm-timeline__item is-${status}`}>
                  <span className="adm-timeline__date">{shortDateTime(p.publishAt)}</span>
                  <Link to={`/admin/actualites/${p.id}`} className="adm-strong">
                    {p.title}
                  </Link>
                  <span className="adm-badge adm-badge--grey">{p.type === 'video' ? 'Vidéo' : 'Post'}</span>
                  <span className={`adm-badge adm-badge--${status}`}>{STATUS_LABELS[status]}</span>
                </li>
              );
            })}
          </ul>
        ))}

      <div className="adm-campaign">
        <strong>Générer le programme type</strong>
        <div className="adm-campaign__steps">
          {CAMPAIGN_STEPS.map((s) => (
            <label key={s.key} className={`adm-step ${existingIds.has(`${event.id}-${s.key}`) ? 'is-done' : ''}`}>
              <input type="checkbox" checked={steps.includes(s.key)} onChange={() => toggle(s.key)} />
              <span>
                {s.label}
                <small>{s.type === 'video' ? 'Vidéo' : 'Post'}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="adm-campaign__actions">
          <button type="button" className="btn btn--ghost btn--xs" onClick={generate} disabled={busy || steps.length === 0}>
            {busy ? 'Création…' : `Créer ${steps.length} brouillon${steps.length > 1 ? 's' : ''}`}
          </button>
          <Link to={`/admin/actualites/nouveau?evenement=${encodeURIComponent(event.id)}`} className="btn btn--ghost btn--xs">
            + Publication libre
          </Link>
          {actionError && (
            <button type="button" className="adm-link" onClick={reload}>
              Actualiser
            </button>
          )}
        </div>
        <small className="adm-hint">
          Publication à 9h00 (heure de Kinshasa) les jours cochés ; les jours déjà générés sont ignorés. Rien n'est visible
          sur le site tant qu'une publication n'est pas cochée « Programmée ».
        </small>
        {message && <p className="adm-ok">{message}</p>}
        {actionError && <p className="adm-error">{actionError}</p>}
      </div>
    </section>
  );
}
