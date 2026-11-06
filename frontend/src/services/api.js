/**
 * Couche d'accès à l'API serverless (API Gateway + Lambda + DynamoDB).
 *
 * Tout le contenu (site, événements) est géré depuis l'espace admin (/admin) et lu ici :
 *   GET  /site                  -> contenu général du site
 *   GET  /events                -> événements publiés
 *   POST /submissions/{type}    -> formulaires (type = contact | join | speaker)
 */
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

if (!API_URL) {
  console.error('VITE_API_URL manquant : le site ne peut pas charger son contenu (voir frontend/.env.example).');
}

export async function fetchResource(resource) {
  const res = await fetch(`${API_URL}/${resource}`);
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement de « ${resource} »`);
  return res.json();
}

export async function submitForm(type, payload) {
  let res;
  try {
    res = await fetch(`${API_URL}/submissions/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
    });
  } catch {
    throw new Error('Connexion impossible. Vérifiez votre accès à Internet et réessayez.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error('Trop de demandes en peu de temps. Réessayez dans une minute.');
    throw new Error(body.message || "L'envoi a échoué. Merci de réessayer dans quelques instants.");
  }
  return res.json().catch(() => ({ ok: true }));
}
