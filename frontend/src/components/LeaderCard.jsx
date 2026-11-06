import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

export default function LeaderCard({ leader }) {
  return (
    <article className="card leader">
      <Avatar name={leader.name} photo={leader.photo} size={104} className="avatar--square" />
      <div>
        <h3>{leader.name}</h3>
        <p className="leader__role">{leader.role}</p>
        {leader.bio && <p>{leader.bio}</p>}
        {leader.linkedin && (
          <div className="socials">
            <a
              href={leader.linkedin}
              target="_blank"
              rel="noreferrer"
              className="social-btn"
              aria-label={`LinkedIn de ${leader.name}`}
            >
              <Icon name="linkedin" size={18} />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
