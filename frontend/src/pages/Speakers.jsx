import PageHeader from '../components/PageHeader.jsx';
import SectionHead from '../components/SectionHead.jsx';
import SpeakerForm from '../components/SpeakerForm.jsx';
import Icon from '../components/Icon.jsx';
import { useResource } from '../hooks/useResource.js';

const WHY = [
  { icon: 'trendingUp', title: 'Développez votre visibilité', text: 'Positionnez-vous comme référence sur votre sujet auprès de la communauté et des recruteurs.' },
  { icon: 'users', title: 'Faites grandir la communauté', text: 'Votre expérience peut aider des dizaines de personnes qui débutent sur AWS.' },
  { icon: 'award', title: 'Programmes AWS', text: 'Prendre la parole est un atout pour les programmes AWS Community Builders et AWS Heroes.' },
  { icon: 'mic', title: 'Accompagnement', text: 'Première fois ? Nous vous aidons à préparer et à répéter votre présentation.' },
];

const FORMATS = [
  { icon: 'video', title: 'Webinaire', duration: '45 – 60 min', text: 'Session en ligne sur Google Meet, idéale pour un sujet approfondi avec démo.' },
  { icon: 'mic', title: 'Talk meetup', duration: '20 – 30 min', text: "Présentation en présentiel à Kinshasa, suivie d'échanges avec le public." },
  { icon: 'zap', title: 'Lightning talk', duration: '10 – 15 min', text: "Format court : une astuce, un outil, un retour d'expérience." },
  { icon: 'code', title: 'Workshop', duration: '2 – 3 h', text: 'Atelier pratique où les participants construisent pas à pas avec vous.' },
];

const STEPS = [
  ['Proposez votre sujet', 'Remplissez le formulaire avec votre idée de talk.'],
  ["Échange avec l'équipe", 'Nous revenons vers vous sous 7 jours pour affiner le sujet.'],
  ['Planification', 'Nous fixons ensemble la date et préparons la communication.'],
  ['Le jour J', 'Vous partagez votre expertise. Le replay est publié ensuite.'],
];

const TOPICS = [
  'Serverless',
  'Containers (ECS/EKS)',
  'Sécurité & conformité',
  'IA générative / Bedrock',
  'Machine Learning',
  'Data & Analytics',
  'DevOps & CI/CD',
  'Infrastructure as Code',
  'Networking',
  'FinOps / coûts',
  'Migration vers le cloud',
  'Carrière & certifications',
];

export default function Speakers() {
  const site = useResource('site');

  return (
    <>
      <PageHeader
        crumb="Devenir speaker"
        image={site.pageImages?.speakers}
        title="Partagez votre expertise AWS avec la communauté"
      >
        Vous avez construit quelque chose sur AWS, résolu un problème complexe ou souhaitez faire découvrir un service ?
        Proposez un webinaire, un talk ou un workshop.
      </PageHeader>

      <section className="section">
        <div className="container">
          <SectionHead title="Pourquoi devenir speaker ?" />
          <div className="grid grid--4">
            {WHY.map((w) => (
              <article key={w.title} className="card">
                <Icon name={w.icon} size={26} strokeWidth={1.5} className="card__icon" />
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <SectionHead title="Choisissez votre format">
            Tous les niveaux sont bienvenus : introduction, retour d'expérience ou plongée technique avancée.
          </SectionHead>
          <div className="grid grid--4">
            {FORMATS.map((f) => (
              <article key={f.title} className="card format-card">
                <span className="format-card__duration">{f.duration}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>

          <div className="topics-box">
            <h3>Idées de thématiques</h3>
            <div className="tags">
              {TOPICS.map((t) => (
                <span key={t} className="tag tag--lg">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead title="Comment ça se passe ?" />
          <div className="steps">
            {STEPS.map(([title, text], i) => (
              <article key={title} className="step">
                <span className="step__num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--soft" id="candidature">
        <div className="container split">
          <div className="sticky">
            <h2 className="section-title">Proposez votre talk</h2>
            <p className="lead">
              Quatre étapes courtes. Pas besoin d'avoir les slides prêtes : une bonne idée suffit pour commencer.
            </p>
            <div className="tips">
              <h4>Conseils pour une bonne proposition</h4>
              <ul className="dash-list">
                <li>Un titre clair qui annonce le bénéfice pour l'audience</li>
                <li>Un problème concret et la façon dont AWS le résout</li>
                <li>Une démo ou un retour d'expérience réel</li>
                <li>2 à 3 points clés que les participants retiendront</li>
              </ul>
            </div>
          </div>

          <div className="form-card">
            <SpeakerForm formats={FORMATS} topics={TOPICS} />
          </div>
        </div>
      </section>
    </>
  );
}
