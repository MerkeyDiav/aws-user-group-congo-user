import Honeypot from './Honeypot.jsx';
import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { FormError, FormSuccess } from './FormStatus.jsx';
import { useFormSubmit } from '../hooks/useFormSubmit.js';

const STEPS = ['Votre profil', 'Votre proposition', 'Logistique', 'Vérification'];
const LAST = STEPS.length - 1;

const SUMMARY_FIELDS = [
  ['fullName', 'Nom'],
  ['email', 'Email'],
  ['jobTitle', 'Poste'],
  ['talkTitle', 'Titre du talk'],
  ['format', 'Format'],
  ['level', 'Niveau'],
  ['topic', 'Thématique'],
  ['languages', 'Langue(s)'],
  ['availability', 'Disponibilités'],
];

export default function SpeakerForm({ formats, topics }) {
  const { status, error, onSubmit, reset } = useFormSubmit('speaker');
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState({});
  const formRef = useRef(null);
  const topRef = useRef(null);
  const stepRefs = useRef([]);

  function validateStep(i) {
    const fields = stepRefs.current[i]?.querySelectorAll('input, select, textarea') || [];
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  function goTo(i) {
    setStep(i);
    const top = topRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 80) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function collectSummary() {
    const data = new FormData(formRef.current);
    const result = {};
    SUMMARY_FIELDS.forEach(([key]) => {
      const values = key === 'languages' ? data.getAll('languages[]') : [data.get(key)];
      result[key] = values.filter(Boolean).join(', ');
    });
    setSummary(result);
  }

  function handleSubmit(event) {
    if (step < LAST) {
      event.preventDefault();
      if (!validateStep(step)) return;
      if (step === LAST - 1) collectSummary();
      goTo(step + 1);
      return;
    }
    if (!validateStep(step)) {
      event.preventDefault();
      return;
    }
    onSubmit(event);
  }

  if (status === 'success') {
    return (
      <FormSuccess
        title="Merci pour votre proposition !"
        onReset={() => {
          reset();
          setStep(0);
        }}
      >
        Nous avons bien reçu votre candidature. L'équipe l'étudie et revient vers vous sous 7 jours.
      </FormSuccess>
    );
  }

  return (
    <div className="wizard" ref={topRef}>
      <div className="wizard__progress">
        <p className="wizard__count">
          Étape {step + 1} sur {STEPS.length} · <strong>{STEPS[step]}</strong>
        </p>
        <div className="wizard__bar" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="wizard__steps">
          {STEPS.map((label, i) => (
            <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
              <button type="button" disabled={i >= step} onClick={() => goTo(i)}>
                <span className="wizard__dot">{i < step ? <Icon name="check" size={14} strokeWidth={2.4} /> : i + 1}</span>
                <span className="wizard__label">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <form ref={formRef} className="form" noValidate onSubmit={handleSubmit}>
        <Honeypot />
        <fieldset className="wizard-step" hidden={step !== 0} ref={(el) => (stepRefs.current[0] = el)}>
          <legend className="sr-only">Votre profil</legend>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-name">
                Nom complet <span className="req">*</span>
              </label>
              <input id="s-name" name="fullName" className="input" required autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="s-email">
                Email <span className="req">*</span>
              </label>
              <input id="s-email" name="email" type="email" className="input" required autoComplete="email" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-job">
                Poste et entreprise <span className="req">*</span>
              </label>
              <input id="s-job" name="jobTitle" className="input" required placeholder="Ex. Cloud Engineer chez …" />
            </div>
            <div className="field">
              <label htmlFor="s-phone">Téléphone / WhatsApp</label>
              <input id="s-phone" name="phone" type="tel" className="input" placeholder="+243 …" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-linkedin">Profil LinkedIn</label>
              <input id="s-linkedin" name="linkedin" type="url" className="input" placeholder="https://linkedin.com/in/…" />
            </div>
            <div className="field">
              <label htmlFor="s-photo">Lien vers votre photo</label>
              <input id="s-photo" name="photoUrl" type="url" className="input" placeholder="https://…" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-bio">
              Courte biographie <span className="req">*</span>
            </label>
            <textarea id="s-bio" name="bio" className="textarea textarea--sm" rows={3} required />
            <span className="hint">Elle servira à vous présenter (3 à 5 lignes).</span>
          </div>
        </fieldset>

        <fieldset className="wizard-step" hidden={step !== 1} ref={(el) => (stepRefs.current[1] = el)}>
          <legend className="sr-only">Votre proposition</legend>
          <div className="field">
            <label htmlFor="s-title">
              Titre du talk <span className="req">*</span>
            </label>
            <input id="s-title" name="talkTitle" className="input" required />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-format">
                Format <span className="req">*</span>
              </label>
              <select id="s-format" name="format" className="select" required defaultValue="">
                <option value="" disabled>
                  Sélectionner
                </option>
                {formats.map((f) => (
                  <option key={f.title}>
                    {f.title} ({f.duration})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-level">
                Niveau <span className="req">*</span>
              </label>
              <select id="s-level" name="level" className="select" required defaultValue="">
                <option value="" disabled>
                  Sélectionner
                </option>
                <option>100 – Introduction</option>
                <option>200 – Intermédiaire</option>
                <option>300 – Avancé</option>
                <option>400 – Expert</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-topic">
              Thématique principale <span className="req">*</span>
            </label>
            <select id="s-topic" name="topic" className="select" required defaultValue="">
              <option value="" disabled>
                Sélectionner
              </option>
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
              <option>Autre</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="s-abstract">
              Résumé du talk <span className="req">*</span>
            </label>
            <textarea id="s-abstract" name="abstract" className="textarea" rows={5} required />
            <span className="hint">Quel problème abordez-vous ? Que vont apprendre les participants ?</span>
          </div>
          <div className="field">
            <label htmlFor="s-takeaways">Points clés à retenir</label>
            <textarea id="s-takeaways" name="takeaways" className="textarea textarea--sm" rows={3} />
          </div>
        </fieldset>

        <fieldset className="wizard-step" hidden={step !== 2} ref={(el) => (stepRefs.current[2] = el)}>
          <legend className="sr-only">Logistique</legend>
          <div className="field">
            <span className="field__title">Langue de présentation</span>
            <div className="checks">
              {['Français', 'Anglais', 'Lingala'].map((l) => (
                <label key={l} className="check">
                  <input type="checkbox" name="languages[]" value={l} defaultChecked={l === 'Français'} /> {l}
                </label>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-dates">Disponibilités</label>
              <input id="s-dates" name="availability" className="input" placeholder="Ex. samedis de décembre" />
            </div>
            <div className="field">
              <label htmlFor="s-prev">Talks précédents (lien)</label>
              <input id="s-prev" name="previousTalks" type="url" className="input" placeholder="https://…" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-needs">Besoins particuliers</label>
            <textarea
              id="s-needs"
              name="needs"
              className="textarea textarea--sm"
              rows={3}
              placeholder="Matériel, accès, co-speaker…"
            />
          </div>
        </fieldset>

        <fieldset className="wizard-step" hidden={step !== 3} ref={(el) => (stepRefs.current[3] = el)}>
          <legend className="sr-only">Vérification</legend>
          <p className="form-note">Vérifiez vos informations avant l'envoi. Vous pouvez revenir aux étapes précédentes.</p>
          <dl className="summary">
            {SUMMARY_FIELDS.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{summary[key] || '—'}</dd>
              </div>
            ))}
          </dl>
          <label className="consent">
            <input type="checkbox" name="recordingConsent" value="yes" />
            <span>J'accepte que ma session soit enregistrée et partagée en replay.</span>
          </label>
          <label className="consent">
            <input type="checkbox" name="codeOfConduct" value="yes" required />
            <span>
              Je m'engage à respecter le code de conduite de la communauté AWS. <span className="req">*</span>
            </span>
          </label>
        </fieldset>

        <FormError message={error} />

        <div className="wizard__nav">
          {step > 0 ? (
            <button type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)}>
              <Icon name="arrowLeft" size={16} /> Retour
            </button>
          ) : (
            <span />
          )}
          {step < LAST ? (
            <button type="submit" className="btn btn--primary">
              Continuer <Icon name="arrowRight" size={16} />
            </button>
          ) : (
            <button type="submit" className="btn btn--primary" disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <span className="spinner" /> Envoi en cours…
                </>
              ) : (
                'Envoyer ma proposition'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
