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
  posts: () => request('GET', '/admin/posts'),
  savePost: (post) => request('PUT', `/admin/posts/${encodeURIComponent(post.id)}`, post),
  deletePost: (id) => request('DELETE', `/admin/posts/${encodeURIComponent(id)}`),
  uploadVideo,
};

const VIDEO_TYPES = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
export const MAX_VIDEO_MB = 200;

/**
 * Envoi d'une vidéo : l'API donne une adresse signée, puis le navigateur envoie le fichier
 * directement dans S3 (avec suivi de la progression). Renvoie l'adresse publique de la vidéo.
 */
async function uploadVideo(file, onProgress = () => {}) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const contentType = Object.values(VIDEO_TYPES).includes(file.type) ? file.type : VIDEO_TYPES[ext];
  if (!contentType) throw new ApiError('Format vidéo non accepté : MP4 (recommandé), WebM ou MOV.');
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new ApiError(`Vidéo trop lourde (${MAX_VIDEO_MB} Mo maximum) : raccourcissez-la ou compressez-la.`);
  }
  const { uploadUrl, url } = await request('POST', '/admin/uploads/video', { contentType, size: file.size });

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(`Envoi refusé (${xhr.status}).`)));
    xhr.onerror = () => reject(new ApiError("Connexion interrompue pendant l'envoi : réessayez."));
    xhr.send(file);
  });
  return url;
}
