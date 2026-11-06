import { useState } from 'react';
import { adminApi } from '../adminApi.js';
import { LoadState, useLoad } from '../useLoad.jsx';

const TYPES = [
  ['all', 'Toutes'],
  ['contact', 'Contact'],
  ['join', 'Adhésions'],
  ['speaker', 'Speakers'],
];
const TYPE_LABELS = { contact: 'Contact', join: 'Adhésion', speaker: 'Candidature speaker' };

const LABELS = {
  name: 'Nom',
  fullName: 'Nom complet',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'E-mail',
  phone: 'Téléphone / WhatsApp',
  organization: 'Organisation',
  subject: 'Sujet',
  message: 'Message',
  profile: 'Profil',
  awsLevel: 'Niveau AWS',
  interests: 'Centres d’intérêt',
  source: 'Connu via',
  consent: 'Accepte d’être contacté(e)',
  jobTitle: 'Poste et entreprise',
  linkedin: 'LinkedIn',
  photoUrl: 'Photo',
  bio: 'Biographie',
  talkTitle: 'Titre du talk',
  format: 'Format',
  level: 'Niveau',
  topic: 'Thématique',
  abstract: 'Résumé',
  takeaways: 'Points clés',
  languages: 'Langue(s)',
  availability: 'Disponibilités',
  previousTalks: 'Talks précédents',
  needs: 'Besoins particuliers',
  recordingConsent: 'Accepte l’enregistrement',
  codeOfConduct: 'Accepte le code de conduite',
};

const display = (v) => (Array.isArray(v) ? v.join(', ') : v === 'yes' ? 'Oui' : String(v));

export function personName(s) {
  const d = s.data || {};
  return d.name || d.fullName || [d.firstName, d.lastName].filter(Boolean).join(' ') || d.email || '—';
}

function headline(s) {
  const d = s.data || {};
  return d.subject || d.talkTitle || d.profile || '';
}

export default function Submissions() {
  const { data: items, setData, error, loading, reload } = useLoad(adminApi.submissions);
  const [type, setType] = useState('all');
  const [showDone, setShowDone] = useState(false);
  const [open, setOpen] = useState(null);
  const [actionError, setActionError] = useState('');

  async function setStatus(s, status) {
    setActionError('');
    try {
      const updated = await adminApi.setSubmissionStatus(s.id, status);
      setData((list) => list.map((x) => (x.id === s.id ? updated : x)));
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function remove(s) {
    if (!window.confirm(`Supprimer définitivement la soumission de ${personName(s)} ?`)) return;
    setActionError('');
    try {
      await adminApi.deleteSubmission(s.id);
      setData((list) => list.filter((x) => x.id !== s.id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (!items) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const shown = items.filter((s) => (type === 'all' || s.type === type) && (showDone || s.status !== 'done'));
  const pending = (t) => items.filter((s) => s.status !== 'done' && (t === 'all' || s.type === t)).length;

  return (
    <>
      <header className="adm-head">
        <h1>Soumissions</h1>
        <button type="button" className="btn btn--ghost btn--xs" onClick={reload} disabled={loading}>
          Actualiser
        </button>
      </header>

      <div className="adm-filters">
        <div className="chip-group" role="tablist">
          {TYPES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={type === id}
              className={`chip ${type === id ? 'is-active' : ''}`}
              onClick={() => setType(id)}
            >
              {label} {pending(id) > 0 && <span className="adm-count">{pending(id)}</span>}
            </button>
          ))}
        </div>
        <label className="adm-check adm-check--inline">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          <span>Afficher les soumissions traitées</span>
        </label>
      </div>

      {actionError && <p className="adm-error">{actionError}</p>}

      {shown.length === 0 ? (
        <div className="adm-panel">
          <p className="adm-empty">{showDone ? 'Aucune soumission.' : 'Aucune soumission à traiter.'}</p>
        </div>
      ) : (
        <ul className="adm-subs">
          {shown.map((s) => {
            const isOpen = open === s.id;
            return (
              <li key={s.id} className={`adm-panel adm-sub ${s.status === 'done' ? 'is-done' : ''}`}>
                <button type="button" className="adm-sub__head" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                  <span className="adm-badge">{TYPE_LABELS[s.type] || s.type}</span>
                  <strong>{personName(s)}</strong>
                  <span className="adm-muted adm-sub__headline">{headline(s)}</span>
                  <span className="adm-muted adm-nowrap">
                    {new Date(s.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Kinshasa' })}
                  </span>
                </button>
                {isOpen && (
                  <div className="adm-sub__body">
                    <dl className="adm-dl">
                      {Object.entries(s.data || {}).map(([k, v]) => (
                        <div key={k}>
                          <dt>{LABELS[k] || k}</dt>
                          <dd>
                            {k === 'email' ? (
                              <a href={`mailto:${v}`}>{v}</a>
                            ) : /^https:\/\//.test(String(v)) ? (
                              <a href={v} target="_blank" rel="noreferrer noopener">
                                {v}
                              </a>
                            ) : (
                              display(v)
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="adm-sub__actions">
                      {s.data?.email && (
                        <a className="btn btn--primary btn--xs" href={`mailto:${s.data.email}?subject=${encodeURIComponent(`Re: ${headline(s) || 'AWS User Group Kinshasa'}`)}`}>
                          Répondre par e-mail
                        </a>
                      )}
                      {s.status === 'done' ? (
                        <button type="button" className="btn btn--ghost btn--xs" onClick={() => setStatus(s, 'new')}>
                          Remettre à traiter
                        </button>
                      ) : (
                        <button type="button" className="btn btn--ghost btn--xs" onClick={() => setStatus(s, 'done')}>
                          Marquer comme traitée
                        </button>
                      )}
                      <button type="button" className="btn btn--ghost btn--xs adm-danger" onClick={() => remove(s)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
