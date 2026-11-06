import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { LoadState, useLoad } from '../useLoad.jsx';
import { ImageField, LinesField, SaveBar, SelectField, TextField, VideoField } from '../fields.jsx';
import { fromLocalInput, kinshasaDate, shortDateTime, slugify, toLocalInput } from '../dates.js';
import { STATUS_LABELS, postStatus } from '../campaign.js';

function emptyPost(eventId) {
  return {
    id: '',
    title: '',
    type: 'post',
    eventId: eventId || '',
    publishAt: `${kinshasaDate(new Date().toISOString(), 1)}T09:00:00+01:00`,
    published: false,
    image: '',
    video: '',
    youtubeUrl: '',
    body: [],
  };
}

export default function PostEditor() {
  const { id } = useParams();
  const isNew = !id;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data, error: loadError, loading, reload } = useLoad(() => Promise.all([adminApi.posts(), adminApi.events()]));

  const [post, setPost] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [posts, events] = data || [[], []];

  useEffect(() => {
    if (!data || post) return;
    setPost(isNew ? emptyPost(params.get('evenement')) : posts.find((p) => p.id === id) || 'missing');
  }, [data, post, id, isNew, params, posts]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const takenIds = useMemo(() => new Set(posts.map((p) => p.id)), [posts]);
  const eventOptions = useMemo(
    () => [['', '— Aucun (publication libre)'], ...[...events].sort((a, b) => b.start.localeCompare(a.start)).map((e) => [e.id, e.title])],
    [events],
  );

  if (!post) return <LoadState loading={loading} error={loadError} onRetry={reload} />;
  if (post === 'missing') {
    return (
      <div className="adm-panel">
        <p>Publication introuvable.</p>
        <Link to="/admin/actualites">Retour aux actualités</Link>
      </div>
    );
  }

  const set = (patch) => {
    setPost((p) => ({ ...p, ...patch }));
    setDirty(true);
    setMessage('');
    setError('');
  };

  const status = postStatus(post);
  const event = events.find((e) => e.id === post.eventId);

  function uniqueId(base) {
    let candidate = base || 'publication';
    for (let n = 2; takenIds.has(candidate); n += 1) candidate = `${base}-${n}`;
    return candidate;
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = { ...post, id: isNew ? uniqueId(slugify(post.id || post.title)) : post.id };
      const saved = await adminApi.savePost(payload);
      setPost(saved);
      setDirty(false);
      const s = postStatus(saved);
      setMessage(
        s === 'draft'
          ? 'Brouillon enregistré (non visible sur le site).'
          : s === 'scheduled'
            ? `Programmée : visible sur le site le ${shortDateTime(saved.publishAt)}.`
            : 'Enregistrée et en ligne sur le site.',
      );
      if (isNew) navigate(`/admin/actualites/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Supprimer définitivement « ${post.title} » ?`)) return;
    try {
      await adminApi.deletePost(post.id);
      navigate(event ? `/admin/evenements/${event.id}` : '/admin/actualites', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <Link to={event ? `/admin/evenements/${event.id}` : '/admin/actualites'} className="adm-back">
            ← {event ? event.title : 'Actualités'}
          </Link>
          <h1>{isNew ? 'Nouvelle publication' : post.title || 'Publication'}</h1>
        </div>
        <div className="adm-actions">
          {!isNew && status === 'live' && (
            <a href={`/actualites/${post.id}`} target="_blank" rel="noreferrer" className="btn btn--ghost btn--xs">
              Voir sur le site
            </a>
          )}
          {!isNew && (
            <button type="button" className="btn btn--ghost btn--xs adm-danger" onClick={remove}>
              Supprimer
            </button>
          )}
        </div>
      </header>

      <section className="adm-panel adm-form">
        <h2>Publication</h2>
        <label className="adm-check">
          <input type="checkbox" checked={post.published} onChange={(e) => set({ published: e.target.checked })} />
          <span>
            <strong>Programmée</strong> — apparaît automatiquement sur le site à la date de publication. Décochez pour
            garder un brouillon.
            <br />
            <span className={`adm-badge adm-badge--${status}`}>{STATUS_LABELS[status]}</span>
          </span>
        </label>
        <div className="form-row">
          <SelectField
            label="Type"
            value={post.type}
            onChange={(type) => set({ type })}
            options={[
              ['post', 'Post écrit + photo'],
              ['video', 'Vidéo'],
            ]}
          />
          <TextField
            label="Date de publication * (heure de Kinshasa)"
            type="datetime-local"
            value={toLocalInput(post.publishAt)}
            onChange={(v) => set({ publishAt: fromLocalInput(v) })}
          />
        </div>
        <TextField label="Titre *" value={post.title} onChange={(title) => set({ title })} maxLength={200} />
        {isNew && (
          <TextField
            label="Adresse de la page"
            hint={`Le lien sera /actualites/${slugify(post.id || post.title) || '…'} (calculé à partir du titre si vide).`}
            value={post.id}
            onChange={(v) => set({ id: v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 100) })}
            placeholder={slugify(post.title)}
          />
        )}
        <SelectField
          label="Événement lié"
          value={post.eventId}
          onChange={(eventId) => set({ eventId })}
          options={eventOptions}
        />
        <small className="adm-hint">
          Le bouton d'inscription en bas de la publication pointe vers le lien d'inscription de cet événement (Meetup), ou vers
          la page Meetup du groupe sans événement lié.
        </small>
      </section>

      <section className="adm-panel adm-form">
        <h2>{post.type === 'video' ? 'Vidéo' : 'Photo'}</h2>
        {post.type === 'video' ? (
          <>
            <VideoField
              label="Fichier vidéo"
              hint="MP4 recommandé, 200 Mo maximum. Format vertical ou horizontal. Une vidéo courte (1 à 2 minutes) se charge vite pour tout le monde."
              value={post.video}
              onChange={(video) => set({ video })}
            />
            <TextField
              label="… ou lien YouTube"
              hint="Utilisé seulement si aucun fichier vidéo n'est envoyé."
              type="url"
              value={post.youtubeUrl}
              onChange={(youtubeUrl) => set({ youtubeUrl })}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <ImageField
              label="Image de couverture (optionnel)"
              hint="Affichée avant la lecture et sur les cartes. Sans image, la carte montre une icône vidéo (ou la miniature YouTube)."
              value={post.image}
              onChange={(image) => set({ image })}
            />
          </>
        ) : (
          <ImageField label="Photo" hint="Format paysage conseillé." value={post.image} onChange={(image) => set({ image })} />
        )}
      </section>

      <section className="adm-panel adm-form">
        <h2>Texte</h2>
        <LinesField
          key={`body-${post.id}`}
          label="Texte de la publication"
          hint="Séparez les paragraphes par une ligne vide. Terminez par une invitation : le bouton « S'inscrire sur Meetup » est ajouté automatiquement en dessous."
          paragraphs
          rows={9}
          value={post.body}
          onChange={(body) => set({ body })}
        />
      </section>

      <SaveBar dirty={dirty || isNew} saving={saving} onSave={save} message={message} error={error} />
    </>
  );
}
