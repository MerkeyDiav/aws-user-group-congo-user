/**
 * Lambda « admin » — back office (routes protégées par Cognito via l'autorisation JWT d'API Gateway).
 *
 * Routes :
 *   GET    /admin/events              -> tous les événements, brouillons compris
 *   PUT    /admin/events/{id}         -> créer ou modifier un événement
 *   DELETE /admin/events/{id}         -> supprimer un événement
 *   PUT    /admin/site                -> enregistrer le contenu général du site
 *   GET    /admin/submissions         -> formulaires reçus (contact, adhésion, speaker)
 *   PATCH  /admin/submissions/{id}    -> changer le statut (new | done)
 *   DELETE /admin/submissions/{id}    -> supprimer une soumission
 *   POST   /admin/uploads             -> envoyer une image (JSON { contentType, data en base64 })
 *
 * Variables d'environnement : SITE_TABLE, EVENTS_TABLE, SUBMISSIONS_TABLE, MEDIA_BUCKET, MEDIA_BASE_URL
 */
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const { SITE_TABLE, EVENTS_TABLE, SUBMISSIONS_TABLE, MEDIA_BUCKET, MEDIA_BASE_URL } = process.env;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({});

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: body === undefined ? '' : JSON.stringify(body),
});

// ---------------------------------------------------------------------------
// Validation par schéma : on ne garde que les champs connus, au bon format.
// ---------------------------------------------------------------------------

const URL_RE = /^(https:\/\/[^\s<>"']+|\/(?!\/)[^\s<>"']*|mailto:[^\s<>"']+)$/;

const T = {
  str: (max = 300) => ({ kind: 'str', max }),
  text: (max = 8000) => ({ kind: 'str', max }),
  url: { kind: 'url' },
  date: { kind: 'date' },
  int: { kind: 'int' },
  bool: { kind: 'bool' },
  oneOf: (values) => ({ kind: 'enum', values }),
  list: (item, max = 50) => ({ kind: 'list', item, max }),
};

const PERSON = { name: T.str(), title: T.str(), photo: T.url, bio: T.text(3000), linkedin: T.url };

export const EVENT_SCHEMA = {
  title: T.str(250),
  summary: T.text(600),
  start: T.date,
  end: T.date,
  format: T.oneOf(['online', 'in-person', 'hybrid']),
  location: T.str(),
  language: T.str(60),
  image: T.url,
  tags: T.list(T.str(60), 20),
  description: T.list(T.text(4000), 30),
  highlights: T.list(T.str(400), 30),
  agenda: T.list({ time: T.str(40), title: T.str(300) }, 40),
  speakers: T.list(PERSON, 20),
  registrationUrl: T.url,
  recordingUrl: T.url,
  slidesUrl: T.url,
  attendees: T.int,
  published: T.bool,
};

export const SITE_SCHEMA = {
  name: T.str(),
  shortName: T.str(80),
  logo: T.url,
  tagline: T.str(),
  description: T.text(1500),
  hero: { title: T.str(200), subtitle: T.text(800), images: T.list(T.url, 10), credit: T.str(200) },
  pageImages: { about: T.url, events: T.url, join: T.url, speakers: T.url, contact: T.url },
  // Photo montrée en entier en haut de la page Rejoindre (visuel avec texte : jamais recadrée).
  joinPhoto: { image: T.url, alt: T.str(300) },
  activities: T.list({ label: T.str(60), text: T.text(400), image: T.url }, 8),
  stats: T.list({ value: T.str(40), label: T.str(100) }, 8),
  contact: { email: T.str(200), phone: T.str(60), location: T.str(200) },
  social: { linkedin: T.url, meetup: T.url, whatsapp: T.url },
  gallery: T.list({ src: T.url, alt: T.str(300), size: T.oneOf(['', 'big', 'tall', 'wide']) }, 60),
  leaders: T.list({ name: T.str(), role: T.str(), photo: T.url, bio: T.text(3000), linkedin: T.url }, 20),
};

const isEmpty = (v) => v === '' || v === null || v === undefined;

export function clean(schema, value, path = '') {
  if (!schema.kind) {
    const src = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const out = {};
    for (const [key, sub] of Object.entries(schema)) out[key] = clean(sub, src[key], path ? `${path}.${key}` : key);
    return out;
  }
  switch (schema.kind) {
    case 'str':
      return typeof value === 'string' ? value.trim().slice(0, schema.max) : '';
    case 'url': {
      const v = typeof value === 'string' ? value.trim() : '';
      if (v === '' || v === '#') return '';
      if (v.length > 1000 || !URL_RE.test(v)) {
        throw new HttpError(400, `Lien invalide (${path}) : utilisez une adresse qui commence par https://`);
      }
      return v;
    }
    case 'date': {
      if (isEmpty(value)) return '';
      const v = String(value).trim();
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) || Number.isNaN(Date.parse(v))) {
        throw new HttpError(400, `Date invalide (${path}).`);
      }
      return v;
    }
    case 'int': {
      const n = Number(value);
      return isEmpty(value) || !Number.isFinite(n) ? null : Math.max(0, Math.min(1e6, Math.round(n)));
    }
    case 'bool':
      return value === true;
    case 'enum':
      return schema.values.includes(value) ? value : schema.values[0];
    case 'list': {
      if (!Array.isArray(value)) return [];
      return value
        .slice(0, schema.max)
        .map((v, i) => clean(schema.item, v, `${path}[${i + 1}]`))
        .filter((v) => (typeof v === 'object' && v !== null ? Object.values(v).some((x) => !isEmpty(x)) : !isEmpty(v)));
    }
    default:
      throw new Error(`Type de schéma inconnu : ${schema.kind}`);
  }
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

export function cleanEvent(id, body) {
  if (!ID_RE.test(id || '')) throw new HttpError(400, 'Identifiant invalide : lettres minuscules, chiffres et tirets.');
  const event = clean(EVENT_SCHEMA, body);
  if (!event.title) throw new HttpError(400, 'Le titre est obligatoire.');
  if (!event.start) throw new HttpError(400, 'La date de début est obligatoire.');
  if (event.end && Date.parse(event.end) < Date.parse(event.start)) {
    throw new HttpError(400, 'La fin doit être après le début.');
  }
  return { id, ...event };
}

// ---------------------------------------------------------------------------
// Images : on vérifie le contenu réel du fichier, pas seulement le type annoncé.
// ---------------------------------------------------------------------------

const IMAGE_TYPES = {
  'image/jpeg': { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': {
    ext: 'webp',
    test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
};

export function decodeImage(body) {
  const type = IMAGE_TYPES[body?.contentType];
  if (!type) throw new HttpError(400, 'Format non accepté : JPEG, PNG ou WebP uniquement.');
  if (typeof body.data !== 'string' || !body.data) throw new HttpError(400, 'Fichier manquant.');
  const bytes = Buffer.from(body.data, 'base64');
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Image trop lourde (4 Mo maximum).');
  if (bytes.length < 12 || !type.test(bytes)) throw new HttpError(400, 'Le fichier ne correspond pas à une image valide.');
  return { bytes, ext: type.ext, contentType: body.contentType };
}

// ---------------------------------------------------------------------------

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

function parseBody(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Requête invalide.');
  }
}

const ROUTES = {
  'GET /admin/events': async () => {
    const events = await scanAll(EVENTS_TABLE);
    return reply(200, events.sort((a, b) => String(b.start).localeCompare(String(a.start))));
  },

  'PUT /admin/events/{id}': async ({ id, body, who }) => {
    const item = { ...cleanEvent(id, body), updatedAt: new Date().toISOString(), updatedBy: who };
    await ddb.send(new PutCommand({ TableName: EVENTS_TABLE, Item: item }));
    return reply(200, item);
  },

  'DELETE /admin/events/{id}': async ({ id }) => {
    await ddb.send(new DeleteCommand({ TableName: EVENTS_TABLE, Key: { id } }));
    return reply(204);
  },

  'PUT /admin/site': async ({ body, who }) => {
    const item = { id: 'site', ...clean(SITE_SCHEMA, body), updatedAt: new Date().toISOString(), updatedBy: who };
    await ddb.send(new PutCommand({ TableName: SITE_TABLE, Item: item }));
    return reply(200, item);
  },

  'GET /admin/submissions': async () => {
    const items = await scanAll(SUBMISSIONS_TABLE);
    return reply(200, items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
  },

  'PATCH /admin/submissions/{id}': async ({ id, body, who }) => {
    if (!['new', 'done'].includes(body.status)) throw new HttpError(400, 'Statut invalide.');
    try {
      const { Attributes } = await ddb.send(
        new UpdateCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { id },
          UpdateExpression: 'SET #s = :s, updatedAt = :t, updatedBy = :w',
          ConditionExpression: 'attribute_exists(id)',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':s': body.status, ':t': new Date().toISOString(), ':w': who },
          ReturnValues: 'ALL_NEW',
        }),
      );
      return reply(200, Attributes);
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') throw new HttpError(404, 'Soumission introuvable.');
      throw err;
    }
  },

  'DELETE /admin/submissions/{id}': async ({ id }) => {
    await ddb.send(new DeleteCommand({ TableName: SUBMISSIONS_TABLE, Key: { id } }));
    return reply(204);
  },

  'POST /admin/uploads': async ({ body, who }) => {
    const { bytes, ext, contentType } = decodeImage(body);
    const now = new Date();
    const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { 'uploaded-by': who.slice(0, 200) },
      }),
    );
    return reply(201, { url: `${MEDIA_BASE_URL}/${key}` });
  },
};

export const handler = async (event) => {
  const route = ROUTES[event.routeKey];
  if (!route) return reply(404, { message: 'Route inconnue.' });

  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const who = String(claims.email || claims['cognito:username'] || claims.sub || 'inconnu');

  try {
    const body = event.body ? parseBody(event) : {};
    if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new HttpError(400, 'Requête invalide.');
    const res = await route({ id: event.pathParameters?.id, body, who });
    console.log(JSON.stringify({ msg: 'admin_action', route: event.routeKey, id: event.pathParameters?.id, who }));
    return res;
  } catch (err) {
    if (err instanceof HttpError) return reply(err.status, { message: err.message });
    console.error(JSON.stringify({ msg: 'admin_error', route: event.routeKey, error: err.name, detail: err.message }));
    return reply(500, { message: 'Erreur serveur. Merci de réessayer.' });
  }
};
