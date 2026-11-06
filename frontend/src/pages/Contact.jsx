import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import { FormError, FormSuccess, SubmitButton } from '../components/FormStatus.jsx';
import { useResource } from '../hooks/useResource.js';
import { useFormSubmit } from '../hooks/useFormSubmit.js';

export default function Contact() {
  const site = useResource('site');
  const { status, error, onSubmit, reset } = useFormSubmit('contact');

  return (
    <>
      <PageHeader eyebrow="Contact" image={site.pageImages?.contact} title="Parlons cloud ensemble">
        Une question, une idée de partenariat, une proposition de sponsoring ? Notre équipe vous répond rapidement.
      </PageHeader>

      <section className="section">
        <div className="container split">
          <div className="contact-info">
            <article className="info-card">
              <span className="icon-box">
                <Icon name="mail" size={22} />
              </span>
              <div>
                <h3>Email</h3>
                <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </div>
            </article>
            <article className="info-card">
              <span className="icon-box">
                <Icon name="pin" size={22} />
              </span>
              <div>
                <h3>Localisation</h3>
                <p>{site.contact.location}</p>
              </div>
            </article>
            {site.contact.phone && (
              <article className="info-card">
                <span className="icon-box">
                  <Icon name="whatsapp" size={22} />
                </span>
                <div>
                  <h3>Téléphone / WhatsApp</h3>
                  <p>{site.contact.phone}</p>
                </div>
              </article>
            )}
            <article className="info-card">
              <span className="icon-box">
                <Icon name="briefcase" size={22} />
              </span>
              <div>
                <h3>Partenariats & sponsoring</h3>
                <p>
                  Entreprises, universités, incubateurs : soutenez la communauté en accueillant un meetup ou en
                  sponsorisant un événement.
                </p>
              </div>
            </article>
            <div className="info-card info-card--plain">
              <div>
                <h3>Suivez-nous</h3>
                <SocialLinks social={site.social} />
              </div>
            </div>
          </div>

          <div className="form-card">
            {status === 'success' ? (
              <FormSuccess title="Message envoyé !" onReset={reset}>
                Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.
              </FormSuccess>
            ) : (
              <form className="form" onSubmit={onSubmit}>
                <h2 className="form-title">Envoyez-nous un message</h2>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="c-name">
                      Nom complet <span className="req">*</span>
                    </label>
                    <input id="c-name" name="name" className="input" required autoComplete="name" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">
                      Email <span className="req">*</span>
                    </label>
                    <input id="c-email" name="email" type="email" className="input" required autoComplete="email" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="c-org">Organisation</label>
                    <input id="c-org" name="organization" className="input" autoComplete="organization" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-subject">
                      Sujet <span className="req">*</span>
                    </label>
                    <select id="c-subject" name="subject" className="select" required defaultValue="">
                      <option value="" disabled>
                        Choisir un sujet
                      </option>
                      <option>Question générale</option>
                      <option>Partenariat / Sponsoring</option>
                      <option>Accueillir un meetup</option>
                      <option>Presse / Médias</option>
                      <option>Autre</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="c-message">
                    Message <span className="req">*</span>
                  </label>
                  <textarea id="c-message" name="message" className="textarea" rows={6} required />
                </div>
                <FormError message={error} />
                <SubmitButton loading={status === 'loading'}>Envoyer le message</SubmitButton>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
