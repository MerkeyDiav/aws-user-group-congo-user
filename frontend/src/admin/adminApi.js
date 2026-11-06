import { API_URL } from '../services/api.js';
import { clearContentCache } from '../hooks/useResource.js';
import { getIdToken, signOut } from './auth.js';

export class ApiError extends Error {}

/** Appel à l'API admin avec le jeton Cognito ; une seule nouvelle tentative si le jeton a expiré. */
async function request(method, path, body, retried = false) {
  const token = await getIdToken({ forceRefresh: retried });
  if (!token) throw new ApiError('Session expirée : reconnectez-vous.');

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { Authorization: token, ...(body !== undefined && { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Connexion impossible. Vérifiez votre accès à Internet.');
  }

  if (res.status === 401) {
    if (!retried) return request(method, path, body, true);
    await signOut();
    throw new ApiError('Session expirée : reconnectez-vous.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || `Erreur ${res.status}`);
  if (method !== 'GET') clearContentCache(); // le site public rechargera la version à jour
  return data;
}

export const adminApi = {
  site: () => fetch(`${API_URL}/site`).then((r) => (r.ok ? r.json() : Promise.reject(new ApiError('Erreur de chargement.')))),
  saveSite: (site) => request('PUT', '/admin/site', site),
  events: () => request('GET', '/admin/events'),
  saveEvent: (event) => request('PUT', `/admin/events/${encodeURIComponent(event.id)}`, event),
  deleteEvent: (id) => request('DELETE', `/admin/events/${encodeURIComponent(id)}`),
  submissions: () => request('GET', '/admin/submissions'),
  setSubmissionStatus: (id, status) => request('PATCH', `/admin/submissions/${encodeURIComponent(id)}`, { status }),
  deleteSubmission: (id) => request('DELETE', `/admin/submissions/${encodeURIComponent(id)}`),
  upload: (contentType, data) => request('POST', '/admin/uploads', { contentType, data }),
};
