import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';
import SocialLinks from './SocialLinks.jsx';
import { useResource } from '../hooks/useResource.js';

export default function Footer() {
  const site = useResource('site');
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo />
            <p>{site.description}</p>
            <SocialLinks social={site.social} />
          </div>

          <div>
            <h4>Communauté</h4>
            <ul>
              <li><Link to="/a-propos">À propos</Link></li>
              <li><Link to="/evenements">Événements</Link></li>
              <li><Link to="/rejoindre">Rejoindre</Link></li>
              <li><Link to="/speakers">Devenir speaker</Link></li>
            </ul>
          </div>

          <div>
            <h4>Ressources</h4>
            <ul>
              <li><a href="https://aws.amazon.com/fr/developer/community/usergroups/" target="_blank" rel="noreferrer">AWS User Groups</a></li>
              <li><a href="https://skillbuilder.aws/" target="_blank" rel="noreferrer">AWS Skill Builder</a></li>
              <li><a href="https://aws.amazon.com/fr/certification/" target="_blank" rel="noreferrer">Certifications AWS</a></li>
              <li><a href="https://builder.aws.com/" target="_blank" rel="noreferrer">AWS Builder Center</a></li>
            </ul>
          </div>

          <div>
            <h4>Contact</h4>
            <ul className="footer__contact">
              <li>
                <Icon name="mail" size={17} />
                <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </li>
              <li>
                <Icon name="pin" size={17} />
                <span>{site.contact.location}</span>
              </li>
            </ul>
            <Link to="/contact" className="link-arrow">
              Nous écrire <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} {site.name}. Tous droits réservés.</span>
          <span className="footer__disclaimer">
            Communauté indépendante, animée par des bénévoles et soutenue par AWS.
          </span>
        </div>
      </div>
    </footer>
  );
}
