import { useEffect, useState } from 'react';
import { fetchResource, getLocal, hasContentApi } from '../services/api.js';

/**
 * Renvoie immédiatement les données locales, puis les remplace par celles de
 * l'API si un backend est configuré. Pas d'écran de chargement nécessaire.
 */
export function useResource(name) {
  const [data, setData] = useState(() => getLocal(name));

  useEffect(() => {
    if (!hasContentApi) return undefined;
    let alive = true;
    fetchResource(name)
      .then((remote) => alive && remote && setData(remote))
      .catch((err) => console.warn(err.message));
    return () => {
      alive = false;
    };
  }, [name]);

  return data;
}
