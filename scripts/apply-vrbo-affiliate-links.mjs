#!/usr/bin/env node
/**
 * Applies VRBO affiliate links from the DevTools output to Neon.
 *
 * Usage:
 *   1. Run vrbo-affiliate-devtools.js in Chrome DevTools on any vrbo.com page
 *   2. When done, run:  copy(JSON.stringify(window.__affiliateResults))
 *   3. Paste result into: scripts/vrbo-affiliate-results.json
 *   4. Run: node scripts/apply-vrbo-affiliate-links.mjs
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_FILE = path.join(dir, 'vrbo-affiliate-results.json');
const DB = process.env.DATABASE_URI
  ?? 'postgresql://neondb_owner:npg_0qBFTlycuQ7f@ep-little-silence-aper8xyh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const results = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
const entries = Object.entries(results);

let ok = 0, fail = 0, skip = 0;

for (const [id, { slug, affiliateUrl, error }] of entries) {
  if (error) {
    console.log(`SKIP  ${slug}: error — ${error}`);
    skip++;
    continue;
  }
  if (!affiliateUrl?.startsWith('https://vrbo.com/affiliates/')) {
    console.log(`SKIP  ${slug}: unexpected URL — ${affiliateUrl}`);
    skip++;
    continue;
  }

  try {
    const sql = `UPDATE stays SET affiliate_url = '${affiliateUrl.replace(/'/g, "''")}' WHERE id = ${parseInt(id)};`;
    execSync(`psql "${DB}" -c "${sql}"`, { stdio: 'pipe' });
    console.log(`OK    ${slug}: ${affiliateUrl}`);
    ok++;
  } catch (err) {
    console.error(`FAIL  ${slug}: ${err.stderr?.toString() ?? err.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} updated, ${skip} skipped, ${fail} failed`);
