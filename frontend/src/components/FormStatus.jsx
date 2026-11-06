import Icon from './Icon.jsx';

export function FormSuccess({ title, children, onReset }) {
  return (
    <div className="form-success" role="status">
      <div className="form-success__icon">
        <Icon name="check" size={34} strokeWidth={2.4} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {onReset && (
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Envoyer une autre réponse
        </button>
      )}
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert--error" role="alert">
      <Icon name="alert" size={18} /> {message}
    </div>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
      {loading ? (
        <>
          <span className="spinner" /> Envoi en cours…
        </>
      ) : (
        <>
          {children} <Icon name="send" size={18} />
        </>
      )}
    </button>
  );
}
