/**
 * Lambda « submissions » — reçoit les formulaires du site (contact, adhésion, speaker),
 * les enregistre dans DynamoDB et envoie une notification par e-mail via SES.
 *
 * Route : POST /submissions/{type}   (type = contact | join | speaker)
 * Variables d'environnement : TABLE_NAME, NOTIFY_TO, MAIL_FROM
 *
 * Le SDK AWS v3 est fourni par le runtime Node.js 22 : aucune dépendance à installer.
 */
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const { TABLE_NAME, NOTIFY_TO, MAIL_FROM } = process.env;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESv2Client({});

const FORMS = {
  contact: {
    subject: 'Nouveau message de contact',
    required: ['name', 'email', 'subject', 'message'],
    nameFields: ['name'],
  },
  join: {
    subject: 'Nouvelle demande d’adhésion',
    required: ['firstName', 'lastName', 'email', 'profile', 'awsLevel', 'consent'],
    nameFields: ['firstName', 'lastName'],
  },
  speaker: {
    subject: 'Nouvelle candidature speaker',
    required: ['fullName', 'email', 'jobTitle', 'bio', 'talkTitle', 'format', 'level', 'topic', 'abstract', 'codeOfConduct'],
    nameFields: ['fullName'],
  },
};

const LABELS = {
  name: 'Nom',
  fullName: 'Nom complet',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone / WhatsApp',
  organization: 'Organisation',
  subject: 'Sujet',
  message: 'Message',
  profile: 'Profil',
  awsLevel: 'Niveau AWS',
  interests: 'Centres d’intérêt',
  source: 'Connu via',
  consent: 'Accepte d’être contacté(e)',
  jobTitle: 'Poste et entreprise',
  linkedin: 'LinkedIn',
  photoUrl: 'Photo',
  bio: 'Biographie',
  talkTitle: 'Titre du talk',
  format: 'Format',
  level: 'Niveau',
  topic: 'Thématique',
  abstract: 'Résumé',
  takeaways: 'Points clés',
  languages: 'Langue(s)',
  availability: 'Disponibilités',
  previousTalks: 'Talks précédents',
  needs: 'Besoins particuliers',
  recordingConsent: 'Accepte l’enregistrement',
  codeOfConduct: 'Accepte le code de conduite',
};

const LIMITS = { body: 20_000, fields: 40, value: 5_000, list: 20 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IGNORED = new Set(['website', 'submittedAt']); // « website » = champ piège anti-robots

const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

/** Ne garde que des chaînes (ou listes de chaînes) de taille raisonnable. */
export function sanitize(payload) {
  const data = {};
  for (const [key, value] of Object.entries(payload)) {
    if (IGNORED.has(key) || !/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key)) continue;
    if (typeof value === 'string') {
      const v = value.trim().slice(0, LIMITS.value);
      if (v) data[key] = v;
    } else if (Array.isArray(value)) {
      const list = value
        .filter((v) => typeof v === 'string' && v.trim())
        .slice(0, LIMITS.list)
        .map((v) => v.trim().slice(0, 200));
      if (list.length) data[key] = list;
    }
  }
  return data;
}

export function validate(type, data) {
  const errors = [];
  if (Object.keys(data).length > LIMITS.fields) errors.push('Trop de champs.');
  for (const field of FORMS[type].required) {
    if (!data[field]) errors.push(`Le champ « ${LABELS[field] || field} » est obligatoire.`);
  }
  if (data.email && !EMAIL_RE.test(data.email)) errors.push('L’adresse e-mail n’est pas valide.');
  return errors;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const display = (value) => (Array.isArray(value) ? value.join(', ') : value === 'yes' ? 'Oui' : value);

export function buildEmail(item) {
  const form = FORMS[item.type];
  const who = form.nameFields.map((f) => item.data[f]).filter(Boolean).join(' ') || item.data.email;
  const rows = Object.entries(item.data).map(([k, v]) => [LABELS[k] || k, display(v)]);

  const text = [
    `${form.subject} — ${who}`,
    '',
    ...rows.map(([label, value]) => `${label} : ${value}`),
    '',
    `Reçu le ${item.createdAt} — référence ${item.id}`,
  ].join('\n');

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1b2230;line-height:1.5">
<h2 style="margin:0 0 4px">${escapeHtml(form.subject)}</h2>
<p style="margin:0 0 20px;color:#586174">${escapeHtml(who)}</p>
<table cellpadding="8" style="border-collapse:collapse;max-width:680px;width:100%">
${rows
  .map(
    ([label, value]) =>
      `<tr style="border-top:1px solid #e1e4ea"><td style="width:180px;color:#586174;vertical-align:top">${escapeHtml(label)}</td><td style="white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin-top:24px;font-size:12px;color:#586174">Reçu le ${escapeHtml(item.createdAt)} — référence ${escapeHtml(item.id)}<br>Répondez directement à cet e-mail pour écrire à la personne.</p>
</body></html>`;

  return { subject: `[AWS UG Kinshasa] ${form.subject} — ${who}`, text, html };
}

export const handler = async (event) => {
  const type = event.pathParameters?.type;
  if (!FORMS[type]) return reply(404, { message: 'Formulaire inconnu.' });

  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  if (raw.length > LIMITS.body) return reply(413, { message: 'Le formulaire est trop volumineux.' });

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return reply(400, { message: 'Requête invalide.' });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return reply(400, { message: 'Requête invalide.' });
  }

  // Champ piège rempli : c'est un robot. On répond « OK » sans rien enregistrer.
  if (payload.website) {
    console.warn(JSON.stringify({ msg: 'honeypot', type }));
    return reply(201, { ok: true });
  }

  const data = sanitize(payload);
  const errors = validate(type, data);
  if (errors.length) return reply(400, { message: errors[0], errors });

  const item = { id: randomUUID(), type, status: 'new', createdAt: new Date().toISOString(), data };
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  // L'e-mail est un plus : s'il échoue, la soumission reste enregistrée dans DynamoDB.
  try {
    const mail = buildEmail(item);
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: MAIL_FROM,
        Destination: { ToAddresses: [NOTIFY_TO] },
        ReplyToAddresses: [data.email],
        Content: {
          Simple: {
            Subject: { Data: mail.subject, Charset: 'UTF-8' },
            Body: { Text: { Data: mail.text, Charset: 'UTF-8' }, Html: { Data: mail.html, Charset: 'UTF-8' } },
          },
        },
      }),
    );
  } catch (err) {
    console.error(JSON.stringify({ msg: 'ses_send_failed', id: item.id, error: err.name, detail: err.message }));
  }

  console.log(JSON.stringify({ msg: 'submission_saved', id: item.id, type }));
  return reply(201, { ok: true, id: item.id });
};
