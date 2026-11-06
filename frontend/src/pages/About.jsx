import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import SectionHead from '../components/SectionHead.jsx';
import LeaderCard from '../components/LeaderCard.jsx';
import Icon from '../components/Icon.jsx';
import { useResource } from '../hooks/useResource.js';

const VALUES = [
  { icon: 'heart', title: 'Partage', text: 'Chacun apprend et chacun enseigne. La connaissance circule librement au sein de la communauté.' },
  { icon: 'users', title: 'Inclusion', text: 'Étudiants, professionnels, femmes et hommes de tous horizons : tout le monde a sa place.' },
  { icon: 'code', title: 'Pratique', text: 'Nous privilégions le concret : démos, ateliers et retours terrain plutôt que la théorie seule.' },
  { icon: 'trendingUp', title: 'Impact', text: "Nous formons les talents qui construiront l'économie numérique de la RDC de demain." },
];

const FAQ = [
  {
    q: "Qu'est-ce qu'un AWS User Group ?",
    a: "Les AWS User Groups sont des communautés locales, animées par des bénévoles, qui se réunissent pour apprendre et échanger autour d'Amazon Web Services. Il en existe des centaines dans le monde, reconnus et soutenus par AWS.",
  },
  {
    q: 'Faut-il payer pour participer ?',
    a: "Non. L'adhésion et la participation à nos événements sont entièrement gratuites.",
  },
  {
    q: 'Dois-je déjà connaître AWS ?',
    a: "Pas du tout. Nos événements s'adressent à tous les niveaux. Les débutants sont les bienvenus et chaque événement indique son niveau.",
  },
  {
    q: 'Les événements sont-ils en ligne ou en présentiel ?',
    a: 'Les deux. Nous organisons des webinaires en ligne (Google Meet) et des meetups ou workshops en présentiel à Kinshasa.',
  },
  {
    q: 'Comment devenir speaker ou partenaire ?',
    a: 'Proposez un sujet via notre page « Devenir speaker ». Pour un partenariat ou un sponsoring, écrivez-nous via la page Contact.',
  },
];

export default function About() {
  const site = useResource('site');

  return (
    <>
      <PageHeader eyebrow="À propos" image={site.pageImages?.about} title="Une communauté qui fait grandir le cloud en RDC">
        {site.description}
      </PageHeader>

      <section className="section">
        <div className="container split split--center">
          <div>
            <h2 className="section-title">Démocratiser les compétences cloud à Kinshasa</h2>
            <p className="lead">
              Le cloud transforme la manière dont les entreprises, les startups et les institutions construisent leurs
              services. Notre mission est de donner aux talents congolais les connaissances, le réseau et la confiance
              nécessaires pour en tirer parti.
            </p>
            <ul className="check-list">
              <li>
                <Icon name="check" size={18} /> Organiser des événements réguliers, gratuits et accessibles
              </li>
              <li>
                <Icon name="check" size={18} /> Accompagner les membres vers les certifications AWS
              </li>
              <li>
                <Icon name="check" size={18} /> Mettre en valeur les speakers et experts locaux
              </li>
              <li>
                <Icon name="check" size={18} /> Connecter la communauté à l'écosystème AWS mondial
              </li>
            </ul>
          </div>
          <dl className="facts">
            <div>
              <dt>Ville</dt>
              <dd>Kinshasa, République Démocratique du Congo</dd>
            </div>
            <div>
              <dt>Leaders</dt>
              <dd>{site.leaders.map((l) => l.name).join(' et ')}</dd>
            </div>
            <div>
              <dt>Formats</dt>
              <dd>Webinaires sur Google Meet, meetups et workshops à Kinshasa</dd>
            </div>
            <div>
              <dt>Langue</dt>
              <dd>Français</dd>
            </div>
            <div>
              <dt>Adhésion</dt>
              <dd>Gratuite, ouverte à tous les niveaux</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <SectionHead eyebrow="Nos valeurs" title="Ce qui nous anime" />
          <div className="grid grid--4">
            {VALUES.map((v) => (
              <article key={v.title} className="card">
                <div className="icon-box">
                  <Icon name={v.icon} size={24} />
                </div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="L'équipe" title="Les AWS Community Leaders">
            L'AWS User Group Congo-Kinshasa est co-dirigé par deux leaders bénévoles, soutenus par une équipe de
            volontaires.
          </SectionHead>
          <div className="grid grid--2">
            {site.leaders.map((l) => (
              <LeaderCard key={l.name} leader={l} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <SectionHead eyebrow="FAQ" title="Questions fréquentes" />
          <div className="faq">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="actions">
            <Link to="/rejoindre" className="btn btn--primary">
              Rejoindre la communauté <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/contact" className="btn btn--ghost">
              Une autre question ?
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
