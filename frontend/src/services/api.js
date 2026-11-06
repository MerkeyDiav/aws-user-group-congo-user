/**
 * Couche d'accès aux données.
 *
 * Aujourd'hui : les contenus viennent des fichiers JSON locaux (src/data) et les
 * formulaires sont simulés (mode démo).
 *
 * Demain : définir VITE_API_URL (ex. https://xxxx.execute-api.af-south-1.amazonaws.com/prod)
 * et le site lira/écrira automatiquement via l'API serverless (API Gateway + Lambda + DynamoDB)
 * alimentée par le back office. Aucune page n'a besoin d'être modifiée.
 *
 * Contrat d'API attendu :
 *   GET  /site                  -> objet identique à src/data/site.json
 *   GET  /events                -> tableau identique à src/data/events.json
 *   POST /submissions/{type}    -> type = contact | join | speaker
 */
import siteData from '../data/site.json';
import eventsData from '../data/events.json';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const hasBackend = Boolean(API_URL);

const localData = {
  site: siteData,
  events: eventsData,
};

export function getLocal(resource) {
  return localData[resource];
}

export async function fetchResource(resource) {
  if (!hasBackend) return localData[resource];
  const res = await fetch(`${API_URL}/${resource}`);
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement de "${resource}"`);
  return res.json();
}

export async function submitForm(type, payload) {
  if (!hasBackend) {
    // Mode démo : on simule un envoi réussi.
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.info(`[mode démo] Formulaire "${type}" soumis :`, payload);
    return { ok: true, demo: true };
  }

  const res = await fetch(`${API_URL}/submissions/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("L'envoi a échoué. Merci de réessayer dans quelques instants.");
  return res.json().catch(() => ({ ok: true }));
}
