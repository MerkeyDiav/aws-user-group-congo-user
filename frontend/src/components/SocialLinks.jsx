import Icon from './Icon.jsx';

const NETWORKS = [
  ['linkedin', 'LinkedIn', 'linkedin'],
  ['meetup', 'Meetup', 'users'],
  ['whatsapp', 'WhatsApp', 'whatsapp'],
  ['youtube', 'YouTube', 'youtube'],
  ['x', 'X (Twitter)', 'x'],
];

export default function SocialLinks({ social = {} }) {
  return (
    <div className="socials">
      {NETWORKS.filter(([key]) => social[key]).map(([key, label, icon]) => (
        <a
          key={key}
          href={social[key]}
          target="_blank"
          rel="noreferrer"
          className="social-btn"
          aria-label={label}
          title={label}
        >
          <Icon name={icon} size={18} />
        </a>
      ))}
    </div>
  );
}
