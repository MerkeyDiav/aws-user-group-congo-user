import Honeypot from '../components/Honeypot.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Icon from '../components/Icon.jsx';
import { FormError, FormSuccess, SubmitButton } from '../components/FormStatus.jsx';
import { useResource } from '../hooks/useResource.js';
import { useFormSubmit } from '../hooks/useFormSubmit.js';

const BENEFITS = [
  { icon: 'calendar', title: 'Accès prioritaire', text: 'Soyez informé en premier de nos meetups, webinaires et workshops.' },
  { icon: 'book', title: 'Ressources exclusives', text: 'Slides, replays, guides de certification et labs partagés par la communauté.' },
  { icon: 'award', title: 'Certifications', text: 'Rejoignez nos study groups et préparez vos certifications AWS à plusieurs.' },
  { icon: 'users', title: 'Networking', text: 'Rencontrez des professionnels, recruteurs et passionnés du cloud à Kinshasa.' },
  { icon: 'mic', title: 'Visibilité', text: 'Présentez vos projets et devenez speaker devant la communauté.' },
  { icon: 'star', title: 'Programmes AWS', text: 'Découvrez les programmes AWS Community Builders, Heroes, crédits et plus.' },
];

const INTERESTS = [
  'Serverless',
  'Containers',
  'Sécurité',
  'IA / Machine Learning',
  'Data & Analytics',
  'DevOps',
  'Networking',
  'Certifications',
];

export default function Join() {
  const site = useResource('site');
  const { status, error, onSubmit, reset } = useFormSubmit('join');

  return (
    <>
      <PageHeader eyebrow="Rejoindre" image={site.pageImages?.join} title="Devenez membre de la communauté AWS de Kinshasa">
        L'adhésion est gratuite et ouverte à tous : étudiants, développeurs, architectes, managers ou simples curieux du
        cloud.
      </PageHeader>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Pourquoi nous rejoindre" title="Ce que vous gagnez en tant que membre" />
          <div className="grid grid--3">
            {BENEFITS.map((b) => (
              <article key={b.title} className="card card--row">
                <div className="icon-box">
                  <Icon name={b.icon} size={22} />
                </div>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--soft" id="inscription">
        <div className="container split">
          <div className="sticky">
            <h2 className="section-title">Rejoignez-nous en 1 minute</h2>
            <p className="lead">
              Remplissez le formulaire et nous vous ajouterons à nos canaux de communication pour recevoir toutes les
              invitations.
            </p>
            <ol className="mini-steps">
              <li>
                <span>1</span> Remplissez le formulaire
              </li>
              <li>
                <span>2</span> Recevez le lien vers nos canaux
              </li>
              <li>
                <span>3</span> Participez à votre premier événement
              </li>
            </ol>
            <div className="channels">
              {site.social.meetup && (
                <a href={site.social.meetup} target="_blank" rel="noreferrer" className="channel">
                  <Icon name="users" size={20} /> Meetup
                </a>
              )}
              {site.social.whatsapp && (
                <a href={site.social.whatsapp} target="_blank" rel="noreferrer" className="channel">
                  <Icon name="whatsapp" size={20} /> WhatsApp
                </a>
              )}
              {site.social.linkedin && (
                <a href={site.social.linkedin} target="_blank" rel="noreferrer" className="channel">
                  <Icon name="linkedin" size={20} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          <div className="form-card">
            {status === 'success' ? (
              <FormSuccess title="Bienvenue dans la communauté !" onReset={reset}>
                Votre inscription a bien été enregistrée. Vous recevrez très bientôt un message avec les liens vers nos
                canaux et nos prochains événements.
              </FormSuccess>
            ) : (
              <form className="form" onSubmit={onSubmit}>
                <Honeypot />
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="j-first">
                      Prénom <span className="req">*</span>
                    </label>
                    <input id="j-first" name="firstName" className="input" required autoComplete="given-name" />
                  </div>
                  <div className="field">
                    <label htmlFor="j-last">
                      Nom <span className="req">*</span>
                    </label>
                    <input id="j-last" name="lastName" className="input" required autoComplete="family-name" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="j-email">
                      Email <span className="req">*</span>
                    </label>
                    <input id="j-email" name="email" type="email" className="input" required autoComplete="email" />
                  </div>
                  <div className="field">
                    <label htmlFor="j-phone">Téléphone / WhatsApp</label>
                    <input id="j-phone" name="phone" type="tel" className="input" placeholder="+243 …" autoComplete="tel" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="j-profile">
                      Profil <span className="req">*</span>
                    </label>
                    <select id="j-profile" name="profile" className="select" required defaultValue="">
                      <option value="" disabled>
                        Sélectionner
                      </option>
                      <option>Étudiant(e)</option>
                      <option>Développeur / Développeuse</option>
                      <option>Ingénieur(e) / Architecte cloud</option>
                      <option>DevOps / SRE</option>
                      <option>Data / IA</option>
                      <option>Sécurité</option>
                      <option>Manager / Décideur</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="j-level">
                      Niveau AWS <span className="req">*</span>
                    </label>
                    <select id="j-level" name="awsLevel" className="select" required defaultValue="">
                      <option value="" disabled>
                        Sélectionner
                      </option>
                      <option>Je découvre AWS</option>
                      <option>Débutant</option>
                      <option>Intermédiaire</option>
                      <option>Avancé</option>
                      <option>Certifié AWS</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="j-org">Entreprise / Université</label>
                  <input id="j-org" name="organization" className="input" autoComplete="organization" />
                </div>
                <fieldset className="field">
                  <legend>Centres d'intérêt</legend>
                  <div className="checks">
                    {INTERESTS.map((i) => (
                      <label key={i} className="check">
                        <input type="checkbox" name="interests[]" value={i} /> {i}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="field">
                  <label htmlFor="j-source">Comment avez-vous connu le groupe ?</label>
                  <select id="j-source" name="source" className="select" defaultValue="">
                    <option value="">Sélectionner</option>
                    <option>LinkedIn</option>
                    <option>WhatsApp</option>
                    <option>Meetup</option>
                    <option>Un ami / collègue</option>
                    <option>Un événement</option>
                    <option>Autre</option>
                  </select>
                </div>
                <label className="consent">
                  <input type="checkbox" name="consent" value="yes" required />
                  <span>
                    J'accepte d'être contacté(e) par l'AWS User Group Congo-Kinshasa au sujet de ses activités.{' '}
                    <span className="req">*</span>
                  </span>
                </label>
                <FormError message={error} />
                <SubmitButton loading={status === 'loading'}>Rejoindre la communauté</SubmitButton>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
