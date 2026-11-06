import { Link } from 'react-router-dom';

export default function NotFound({ title = 'Page introuvable' }) {
  return (
    <section className="not-found">
      <div className="container">
        <span className="not-found__code">404</span>
        <h1>{title}</h1>
        <p className="lead">La page que vous cherchez n'existe pas ou a été déplacée.</p>
        <div className="actions actions--center">
          <Link to="/" className="btn btn--primary">
            Retour à l'accueil
          </Link>
          <Link to="/evenements" className="btn btn--outline">
            Voir les événements
          </Link>
        </div>
      </div>
    </section>
  );
}
