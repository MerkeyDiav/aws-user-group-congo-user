import { useEffect, useState } from 'react';
import { adminApi } from '../adminApi.js';
import { LoadState, useLoad } from '../useLoad.jsx';
import { ImageField, ListEditor, SaveBar, SelectField, TextField } from '../fields.jsx';

const SECTIONS = [
  ['general', 'Général'],
  ['banniere', 'Bannière'],
  ['galerie', 'Galerie'],
  ['leaders', 'Leaders'],
  ['activites', 'Activités'],
  ['chiffres', 'Chiffres clés'],
  ['images', 'Images des pages'],
  ['contact', 'Contact et réseaux'],
];

const PAGE_IMAGES = [
  ['about', 'À propos'],
  ['events', 'Événements'],
  ['join', 'Rejoindre'],
  ['speakers', 'Speakers'],
  ['contact', 'Contact'],
];

export default function SiteEditor() {
  const { data, error: loadError, loading, reload } = useLoad(adminApi.site);
  const [site, setSite] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (data && !site) setSite(data);
  }, [data, site]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!site) return <LoadState loading={loading} error={loadError} onRetry={reload} />;

  const set = (patch) => {
    setSite((s) => ({ ...s, ...patch }));
    setDirty(true);
    setMessage('');
    setError('');
  };
  const setIn = (key, patch) => set({ [key]: { ...site[key], ...patch } });

  async function save() {
    setSaving(true);
    setError('');
    try {
      const saved = await adminApi.saveSite(site);
      const { id, updatedAt, updatedBy, ...clean } = saved;
      setSite(clean);
      setDirty(false);
      setMessage('Enregistré : le site est à jour.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="adm-head">
        <h1>Contenu du site</h1>
      </header>

      <nav className="adm-tabs" aria-label="Sections">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <section id="general" className="adm-panel adm-form">
        <h2>Général</h2>
        <div className="form-row">
          <TextField label="Nom du groupe" value={site.name} onChange={(name) => set({ name })} />
          <TextField label="Nom court" value={site.shortName} onChange={(shortName) => set({ shortName })} />
        </div>
        <TextField label="Slogan" value={site.tagline} onChange={(tagline) => set({ tagline })} />
        <TextField
          label="Présentation"
          hint="Affichée en haut de la page « À propos »."
          multiline
          rows={4}
          value={site.description}
          onChange={(description) => set({ description })}
        />
      </section>

      <section id="banniere" className="adm-panel adm-form">
        <h2>Bannière de la page d'accueil</h2>
        <TextField
          label="Titre"
          hint="Mettez un mot entre accolades pour le mettre en couleur : ex. « des passionnés du {Cloud} »."
          value={site.hero.title}
          onChange={(title) => setIn('hero', { title })}
        />
        <TextField label="Sous-titre" multiline rows={3} value={site.hero.subtitle} onChange={(subtitle) => setIn('hero', { subtitle })} />
        <ListEditor
          label="Photos de la bannière"
          hint="Plusieurs photos défilent automatiquement. Format paysage, au moins 1600 px de large."
          itemLabel="Photo"
          addLabel="Ajouter une photo"
          items={site.hero.images.map((src) => ({ src }))}
          onChange={(list) => setIn('hero', { images: list.map((i) => i.src) })}
          newItem={() => ({ src: '' })}
          renderItem={(item, update) => <ImageField label="Image" compact value={item.src} onChange={(src) => update({ src })} />}
        />
        <TextField label="Crédit photo" hint="Ex. : Photo : Nom / Unsplash" value={site.hero.credit} onChange={(credit) => setIn('hero', { credit })} />
      </section>

      <section id="galerie" className="adm-panel adm-form">
        <h2>Galerie « En images »</h2>
        <ListEditor
          label="Photos"
          hint="L'ordre ici est l'ordre d'affichage. La taille « grande » occupe plus de place dans la mosaïque."
          itemLabel="Photo"
          addLabel="Ajouter une photo"
          items={site.gallery}
          onChange={(gallery) => set({ gallery })}
          newItem={() => ({ src: '', alt: '', size: '' })}
          renderItem={(item, update) => (
            <>
              <ImageField label="Image" compact value={item.src} onChange={(src) => update({ src })} />
              <div className="form-row">
                <TextField
                  label="Description (accessibilité)"
                  hint="Décrivez la photo pour les personnes malvoyantes."
                  value={item.alt}
                  onChange={(alt) => update({ alt })}
                />
                <SelectField
                  label="Taille"
                  value={item.size}
                  onChange={(size) => update({ size })}
                  options={[
                    ['', 'Normale'],
                    ['big', 'Grande'],
                    ['wide', 'Large'],
                    ['tall', 'Haute'],
                  ]}
                />
              </div>
            </>
          )}
        />
      </section>

      <section id="leaders" className="adm-panel adm-form">
        <h2>Leaders</h2>
        <ListEditor
          label="Leaders"
          itemLabel="Leader"
          addLabel="Ajouter un leader"
          items={site.leaders}
          onChange={(leaders) => set({ leaders })}
          newItem={() => ({ name: '', role: '', photo: '', bio: '', linkedin: '' })}
          renderItem={(l, update) => (
            <>
              <div className="form-row">
                <TextField label="Nom" value={l.name} onChange={(name) => update({ name })} />
                <TextField label="Rôle" value={l.role} onChange={(role) => update({ role })} />
              </div>
              <ImageField label="Photo" hint="Format carré conseillé." compact value={l.photo} onChange={(photo) => update({ photo })} />
              <TextField label="Bio" multiline rows={3} value={l.bio} onChange={(bio) => update({ bio })} />
              <TextField label="LinkedIn" type="url" value={l.linkedin} onChange={(linkedin) => update({ linkedin })} placeholder="https://" />
            </>
          )}
        />
      </section>

      <section id="activites" className="adm-panel adm-form">
        <h2>Activités (tuiles de la page d'accueil)</h2>
        <ListEditor
          label="Activités"
          itemLabel="Activité"
          addLabel="Ajouter une activité"
          items={site.activities}
          onChange={(activities) => set({ activities })}
          newItem={() => ({ label: '', text: '', image: '' })}
          renderItem={(a, update) => (
            <>
              <TextField label="Nom" value={a.label} onChange={(label) => update({ label })} />
              <TextField label="Texte" multiline rows={2} value={a.text} onChange={(text) => update({ text })} />
              <ImageField label="Image" compact value={a.image} onChange={(image) => update({ image })} />
            </>
          )}
        />
      </section>

      <section id="chiffres" className="adm-panel adm-form">
        <h2>Chiffres clés</h2>
        <ListEditor
          label="Chiffres"
          hint="Affichés sous l'introduction de la page d'accueil. Laissez vide pour masquer la section."
          itemLabel="Chiffre"
          addLabel="Ajouter un chiffre"
          items={site.stats}
          onChange={(stats) => set({ stats })}
          newItem={() => ({ value: '', label: '' })}
          renderItem={(s, update) => (
            <div className="form-row">
              <TextField label="Valeur" value={s.value} onChange={(value) => update({ value })} placeholder="850" />
              <TextField label="Libellé" value={s.label} onChange={(label) => update({ label })} placeholder="Membres sur Meetup" />
            </div>
          )}
        />
      </section>

      <section id="images" className="adm-panel adm-form">
        <h2>Images d'en-tête des pages</h2>
        <div className="adm-grid-2">
          {PAGE_IMAGES.map(([key, label]) => (
            <ImageField key={key} label={label} compact value={site.pageImages[key]} onChange={(v) => setIn('pageImages', { [key]: v })} />
          ))}
        </div>
      </section>

      <section id="contact" className="adm-panel adm-form">
        <h2>Contact et réseaux</h2>
        <div className="form-row">
          <TextField
            label="E-mail public"
            hint="Affiché sur la page Contact et dans le pied de page. Vide = masqué."
            type="email"
            value={site.contact.email}
            onChange={(email) => setIn('contact', { email })}
          />
          <TextField label="Téléphone / WhatsApp" value={site.contact.phone} onChange={(phone) => setIn('contact', { phone })} />
        </div>
        <TextField label="Localisation" value={site.contact.location} onChange={(location) => setIn('contact', { location })} />
        <TextField label="LinkedIn" type="url" value={site.social.linkedin} onChange={(linkedin) => setIn('social', { linkedin })} />
        <TextField label="Meetup" type="url" value={site.social.meetup} onChange={(meetup) => setIn('social', { meetup })} />
        <TextField label="Groupe WhatsApp" type="url" value={site.social.whatsapp} onChange={(whatsapp) => setIn('social', { whatsapp })} />
      </section>

      <SaveBar dirty={dirty} saving={saving} onSave={save} message={message} error={error} />
    </>
  );
}
