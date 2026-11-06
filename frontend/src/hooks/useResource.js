import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import { fetchResource } from '../services/api.js';
import Logo from '../components/Logo.jsx';

/**
 * Contenu du site (réglages généraux, événements, actualités), chargé une fois depuis l'API.
 *
 * Pour un affichage instantané aux visites suivantes (et une connexion lente), la dernière
 * version reçue est gardée dans le navigateur : elle s'affiche tout de suite, puis est
 * remplacée par la version fraîche dès que l'API répond.
 */
const CACHE_KEY = 'awsug-content-v2';
const ContentContext = createContext(null);

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return cached?.site && Array.isArray(cached.events) && Array.isArray(cached.posts) ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(content) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(content));
  } catch {
    /* stockage indisponible (navigation privée…) : sans importance */
  }
}

/** Oublie la copie locale (appelé après une modification dans l'admin). */
export function clearContentCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* rien */
  }
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(readCache);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    Promise.all([
      fetchResource('site'),
      fetchResource('events'),
      // Les actualités ne doivent jamais empêcher le site de s'afficher.
      fetchResource('posts').catch(() => []),
    ])
      .then(([site, events, posts]) => {
        const fresh = { site, events, posts };
        setContent(fresh);
        writeCache(fresh);
      })
      .catch((err) => {
        console.warn(err.message);
        setFailed(true);
      });
  }, []);

  useEffect(load, [load]);

  if (!content) {
    return createElement(
      'div',
      { className: 'boot', role: failed ? 'alert' : 'status' },
      createElement(Logo, null),
      failed
        ? createElement(
            'div',
            { className: 'boot__error' },
            createElement('p', null, 'Impossible de charger le site. Vérifiez votre connexion Internet.'),
            createElement('button', { type: 'button', className: 'btn btn--primary', onClick: load }, 'Réessayer'),
          )
        : createElement('span', { className: 'spinner spinner--dark', 'aria-label': 'Chargement' }),
    );
  }

  return createElement(ContentContext.Provider, { value: content }, children);
}

/** Renvoie le contenu demandé : « site » (objet), « events » ou « posts » (listes). */
export function useResource(name) {
  const content = useContext(ContentContext);
  if (!content) throw new Error('useResource doit être utilisé dans <ContentProvider>.');
  return content[name];
}
