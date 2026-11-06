import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../adminApi.js';
import { LoadState, useLoad } from '../useLoad.jsx';
import { ImageField, LinesField, ListEditor, SaveBar, SelectField, TextField } from '../fields.jsx';
import { FORMAT_LABELS } from '../../utils/events.js';
import { fromLocalInput, slugify, toLocalInput } from '../dates.js';
import EventCampaign from '../EventCampaign.jsx';

const EMPTY_EVENT = {
  id: '',
  title: '',
  summary: '',
  start: '',
  end: '',
  format: 'online',
  location: 'Google Meet',
  language: 'Français',
  image: '',
  tags: [],
  description: [],
  highlights: [],
  agenda: [],
  speakers: [],
  registrationUrl: '',
  recordingUrl: '',
  slidesUrl: '',
  attendees: null,
  published: false,
};

export default function EventEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { data: events, error: loadError, loading, reload } = useLoad(adminApi.events);

  const [event, setEvent] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!events || event) return;
    setEvent(isNew ? { ...EMPTY_EVENT } : events.find((e) => e.id === id) || 'missing');
  }, [events, event, id, isNew]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const takenIds = useMemo(() => new Set((events || []).map((e) => e.id)), [events]);

  if (!event) return <LoadState loading={loading} error={loadError} onRetry={reload} />;
  if (event === 'missing') {
    return (
      <div className="adm-panel">
        <p>Événement introuvable.</p>
        <Link to="/admin/evenements">Retour à la liste</Link>
      </div>
    );
  }

  const set = (patch) => {
    setEvent((e) => ({ ...e, ...patch }));
    setDirty(true);
    setMessage('');
    setError('');
  };

  function uniqueId(base) {
    let candidate = base || 'evenement';
    for (let n = 2; takenIds.has(candidate); n += 1) candidate = `${base}-${n}`;
    return candidate;
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = { ...event, id: isNew ? uniqueId(slugify(event.id || event.title)) : event.id };
      const saved = await adminApi.saveEvent(payload);
      setEvent(saved);
      setDirty(false);
      setMessage(saved.published ? 'Enregistré et publié sur le site.' : 'Brouillon enregistré (non visible sur le site).');
      if (isNew) navigate(`/admin/evenements/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <Link to="/admin/evenements" className="adm-back">
            ← Événements
          </Link>
          <h1>{isNew ? 'Nouvel événement' : event.title || 'Événement'}</h1>
        </div>
        {!isNew && event.published && (
          <a href={`/evenements/${event.id}`} target="_blank" rel="noreferrer" className="btn btn--ghost btn--xs">
            Voir sur le site
          </a>
        )}
      </header>

      <section className="adm-panel adm-form">
        <h2>Informations</h2>
        <label className="adm-check">
          <input type="checkbox" checked={event.published} onChange={(e) => set({ published: e.target.checked })} />
          <span>
            <strong>Publié</strong> — visible sur le site. Décochez pour garder un brouillon.
          </span>
        </label>
        <TextField label="Titre *" value={event.title} onChange={(title) => set({ title })} required maxLength={250} />
        {isNew && (
          <TextField
            label="Adresse de la page"
            hint={`Le lien sera /evenements/${event.id || slugify(event.title) || '…'} (calculé à partir du titre si vide). Ne peut plus changer ensuite.`}
            value={event.id}
            onChange={(v) => set({ id: v.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 100) })}
            placeholder={slugify(event.title)}
          />
        )}
        <TextField
          label="Résumé"
          hint="Une ou deux phrases affichées sur les cartes et en haut de la page."
          multiline
          rows={2}
          value={event.summary}
          onChange={(summary) => set({ summary })}
          maxLength={600}
        />
        <div className="form-row">
          <TextField
            label="Début * (heure de Kinshasa)"
            type="datetime-local"
            value={toLocalInput(event.start)}
            onChange={(v) => set({ start: fromLocalInput(v) })}
          />
          <TextField
            label="Fin (heure de Kinshasa)"
            type="datetime-local"
            value={toLocalInput(event.end)}
            onChange={(v) => set({ end: fromLocalInput(v) })}
          />
        </div>
        <div className="form-row">
          <SelectField label="Format" value={event.format} onChange={(format) => set({ format })} options={Object.entries(FORMAT_LABELS)} />
          <TextField label="Lieu" hint="Ex. : Google Meet, ou l'adresse à Kinshasa." value={event.location} onChange={(location) => set({ location })} />
        </div>
        <div className="form-row">
          <TextField label="Langue" value={event.language} onChange={(language) => set({ language })} />
          <TextField
            label="Nombre de participants"
            hint="Affiché pour les événements passés (à partir de 5)."
            type="number"
            min="0"
            value={event.attendees ?? ''}
            onChange={(v) => set({ attendees: v === '' ? null : Number(v) })}
          />
        </div>
        <TextField
          label="Thématiques"
          hint="Séparées par des virgules. Ex. : Sécurité, Containers, Amazon ECR"
          value={event.tags.join(', ')}
          onChange={(v) => set({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
        />
        <ImageField
          label="Affiche de l'événement"
          hint="Affichée en grand sur la page d'accueil tant que c'est le prochain événement, et en haut de sa page. Tous formats : portrait, carré ou paysage."
          value={event.image}
          onChange={(image) => set({ image })}
        />
      </section>

      <section className="adm-panel adm-form">
        <h2>Liens</h2>
        <TextField
          label="Lien d'inscription"
          hint="Meetup, formulaire… Si vide, le bouton propose de rejoindre le groupe."
          type="url"
          value={event.registrationUrl}
          onChange={(registrationUrl) => set({ registrationUrl })}
          placeholder="https://"
        />
        <div className="form-row">
          <TextField label="Replay (vidéo)" type="url" value={event.recordingUrl} onChange={(recordingUrl) => set({ recordingUrl })} placeholder="https://" />
          <TextField label="Slides" type="url" value={event.slidesUrl} onChange={(slidesUrl) => set({ slidesUrl })} placeholder="https://" />
        </div>
      </section>

      <section className="adm-panel adm-form">
        <h2>Contenu de la page</h2>
        <LinesField
          key={`desc-${event.id}`}
          label="Description"
          hint="Séparez les paragraphes par une ligne vide."
          paragraphs
          rows={8}
          value={event.description}
          onChange={(description) => set({ description })}
        />
        <LinesField
          key={`hl-${event.id}`}
          label="Au programme / ce que vous allez apprendre"
          hint="Un point par ligne."
          rows={5}
          value={event.highlights}
          onChange={(highlights) => set({ highlights })}
        />
        <ListEditor
          label="Déroulé (horaires)"
          itemLabel="Créneau"
          addLabel="Ajouter un créneau"
          items={event.agenda}
          onChange={(agenda) => set({ agenda })}
          newItem={() => ({ time: '', title: '' })}
          renderItem={(item, update) => (
            <div className="adm-grid-agenda">
              <TextField label="Heure" value={item.time} onChange={(time) => update({ time })} placeholder="11h00" />
              <TextField label="Intitulé" value={item.title} onChange={(title) => update({ title })} />
            </div>
          )}
        />
      </section>

      <section className="adm-panel adm-form">
        <h2>Speakers</h2>
        <ListEditor
          label="Speakers"
          itemLabel="Speaker"
          addLabel="Ajouter un speaker"
          items={event.speakers}
          onChange={(speakers) => set({ speakers })}
          newItem={() => ({ name: '', title: '', photo: '', bio: '', linkedin: '' })}
          renderItem={(s, update) => (
            <>
              <div className="form-row">
                <TextField label="Nom" value={s.name} onChange={(name) => update({ name })} />
                <TextField label="Titre / poste" value={s.title} onChange={(title) => update({ title })} />
              </div>
              <ImageField label="Photo" compact value={s.photo} onChange={(photo) => update({ photo })} />
              <TextField label="Bio" multiline rows={3} value={s.bio} onChange={(bio) => update({ bio })} />
              <TextField label="LinkedIn" type="url" value={s.linkedin} onChange={(linkedin) => update({ linkedin })} placeholder="https://" />
            </>
          )}
        />
      </section>

      {!isNew && <EventCampaign event={event} />}

      <SaveBar dirty={dirty || isNew} saving={saving} onSave={save} message={message} error={error} />
    </>
  );
}
