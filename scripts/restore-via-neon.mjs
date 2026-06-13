/**
 * Restore missing journal posts directly to Neon DB via serverless driver.
 * Usage: node scripts/restore-via-neon.mjs
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error('DATABASE_URI env var required');
  process.exit(1);
}

const sql = neon(DATABASE_URI);

async function main() {
  const sqlPath = join(__dirname, 'restore-posts.sql');
  const content = readFileSync(sqlPath, 'utf-8');
  const stmts = content.split('\n\n').filter(s => s.trim());

  console.log(`Running ${stmts.length} INSERT statements...\n`);

  for (let i = 0; i < stmts.length; i++) {
    const slug = stmts[i].match(/'([^']+)'/)?.[1] || `stmt-${i}`;
    try {
      await sql.query(stmts[i]);
      console.log(`OK ${i + 1}/${stmts.length}: ${slug}`);
    } catch (e) {
      console.error(`FAIL ${i + 1}/${stmts.length}: ${slug}: ${e.message}`);
    }
  }

  // Verify
  const rows = await sql`SELECT id, slug, title, status FROM blog_posts ORDER BY id`;
  console.log(`\nTotal posts in DB: ${rows.length}`);
  rows.forEach(r => console.log(`  ${r.id}. [${r.status}] ${r.slug}`));
}

main();
