import { Link } from 'react-router-dom';

export default function PageHeader({ eyebrow, title, children, crumb, image, parent }) {
  return (
    <header className={`page-header ${image ? 'page-header--image' : ''}`}>
      {image && <div className="page-header__img" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />}
      <div className="container">
        <nav className="breadcrumb" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link>
          <span aria-hidden="true">/</span>
          {parent && (
            <>
              <Link to={parent.to}>{parent.label}</Link>
              <span aria-hidden="true">/</span>
            </>
          )}
          <span aria-current="page">{crumb || eyebrow}</span>
        </nav>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </header>
  );
}
