#!/usr/bin/env node
/**
 * Import initial du contenu (backend/seed/*.json) dans DynamoDB, à lancer UNE fois après le
 * premier déploiement. Ensuite, tout se gère depuis l'espace admin.
 *
 * Usage : node backend/scripts/seed.mjs [--force]
 *   Sans --force, le script refuse d'écrire dans une table qui contient déjà des données,
 *   pour ne jamais écraser ce qui a été saisi dans l'admin.
 *
 * Utilise l'AWS CLI (déjà configuré) : aucune dépendance à installer.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Région du backend (on n'utilise pas AWS_REGION, souvent réglé sur une autre région en local).
const REGION = process.env.BACKEND_REGION || 'us-east-2';
const PREFIX = process.env.PREFIX || 'awsug-kin';
const force = process.argv.includes('--force');
const seedDir = new URL('../seed/', import.meta.url);

/** Convertit une valeur JS au format attendu par l'API DynamoDB ({ S: … }, { M: … }…). */
function marshal(v) {
  if (v === null || v === undefined) return { NULL: true };
  if (typeof v === 'string') return { S: v };
  if (typeof v === 'number') return { N: String(v) };
  if (typeof v === 'boolean') return { BOOL: v };
  if (Array.isArray(v)) return { L: v.map(marshal) };
  return { M: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, marshal(x)])) };
}

const aws = (args) => execFileSync('aws', [...args, '--region', REGION, '--output', 'json'], { encoding: 'utf8' });

function count(table) {
  return JSON.parse(aws(['dynamodb', 'scan', '--table-name', table, '--select', 'COUNT', '--max-items', '1'])).Count;
}

function writeAll(table, items) {
  const dir = mkdtempSync(join(tmpdir(), 'seed-'));
  try {
    for (let i = 0; i < items.length; i += 25) {
      const file = join(dir, `batch-${i}.json`);
      const request = { [table]: items.slice(i, i + 25).map((it) => ({ PutRequest: { Item: marshal(it).M } })) };
      writeFileSync(file, JSON.stringify(request));
      const res = JSON.parse(aws(['dynamodb', 'batch-write-item', '--request-items', `file://${file}`]));
      if (Object.keys(res.UnprocessedItems || {}).length) throw new Error(`Éléments non écrits dans ${table}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const now = new Date().toISOString();
const site = JSON.parse(readFileSync(new URL('site.json', seedDir), 'utf8'));
const events = JSON.parse(readFileSync(new URL('events.json', seedDir), 'utf8'));

const jobs = [
  { table: `${PREFIX}-site`, items: [{ id: 'site', ...site, updatedAt: now, updatedBy: 'import initial' }] },
  { table: `${PREFIX}-events`, items: events.map((e) => ({ ...e, updatedAt: now, updatedBy: 'import initial' })) },
];

for (const { table, items } of jobs) {
  const existing = count(table);
  if (existing > 0 && !force) {
    console.log(`${table} : déjà ${existing} élément(s), rien n'est écrit (ajoutez --force pour écraser).`);
    continue;
  }
  writeAll(table, items);
  console.log(`${table} : ${items.length} élément(s) importé(s).`);
}
