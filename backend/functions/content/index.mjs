/**
 * Lambda « content » — lecture publique du contenu du site (sans authentification).
 *
 * Routes :
 *   GET /site    -> contenu général (bannière, galerie, leaders, contact…)
 *   GET /events  -> événements publiés (les brouillons sont exclus)
 *
 * Variables d'environnement : SITE_TABLE, EVENTS_TABLE
 * Droits IAM : lecture seule sur ces deux tables.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const { SITE_TABLE, EVENTS_TABLE } = process.env;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

/** Champs internes qui ne sont pas exposés au site public. */
function publicView(item) {
  const { published, updatedAt, updatedBy, ...rest } = item;
  return rest;
}

async function scanAll(TableName) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey }));
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

export const handler = async (event) => {
  try {
    if (event.routeKey === 'GET /site') {
      const { Item } = await ddb.send(new GetCommand({ TableName: SITE_TABLE, Key: { id: 'site' } }));
      if (!Item) return reply(404, { message: 'Contenu du site introuvable.' });
      const { id, ...site } = publicView(Item);
      return reply(200, site);
    }

    if (event.routeKey === 'GET /events') {
      const items = await scanAll(EVENTS_TABLE);
      const events = items
        .filter((e) => e.published !== false)
        .map(publicView)
        .sort((a, b) => String(b.start).localeCompare(String(a.start)));
      return reply(200, events);
    }

    return reply(404, { message: 'Route inconnue.' });
  } catch (err) {
    console.error(JSON.stringify({ msg: 'content_error', route: event.routeKey, error: err.name, detail: err.message }));
    return reply(500, { message: 'Erreur serveur. Merci de réessayer.' });
  }
};
