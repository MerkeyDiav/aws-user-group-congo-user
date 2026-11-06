import { useCallback, useEffect, useState } from 'react';

/** Charge des données pour une page admin : { data, setData, error, loading, reload }. */
export function useLoad(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    setError('');
    return loader()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}

export function LoadState({ loading, error, onRetry }) {
  if (error) {
    return (
      <div className="adm-panel adm-state" role="alert">
        <p className="adm-error">{error}</p>
        {onRetry && (
          <button type="button" className="btn btn--ghost btn--xs" onClick={onRetry}>
            Réessayer
          </button>
        )}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="adm-panel adm-state" role="status">
        <span className="spinner spinner--dark" /> Chargement…
      </div>
    );
  }
  return null;
}
