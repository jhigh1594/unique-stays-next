/**
 * Generate SQL INSERT statements for missing journal posts.
 * Handles YAML frontmatter properly.
 *
 * Usage: npx tsx scripts/restore-journal-posts.ts
 */

import fs from 'fs';
import path from 'path';

// ── Lexical helpers ─────────────────────────────────────────────────────────

function textNode(content: string) {
  return { type: 'text', format: 0, style: '', mode: 'normal', text: content, detail: 0, version: 1 };
}
function boldTextNode(content: string) {
  return { type: 'text', format: 1, style: '', mode: 'normal', text: content, detail: 0, version: 1 };
}
function paragraph(children: any[] = []) {
  return { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, textStyle: '', children: children.length > 0 ? children : [textNode('')] };
}
function heading(tag: 'h2' | 'h3', content: string) {
  return { type: 'heading', tag, format: '', indent: 0, version: 1, direction: 'ltr', children: [textNode(content)] };
}
function horizontalRule() { return { type: 'horizontalrule', version: 1 }; }
function linkNode(url: string, text: string, newTab = true) {
  return { type: 'link', format: '', version: 1, fields: { url, newTab }, children: [textNode(text)] };
}

function parseInline(line: string): any[] {
  const children: any[] = [];
  const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let lastIdx = 0; let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIdx) children.push(textNode(line.slice(lastIdx, match.index)));
    if (match[1]) children.push(boldTextNode(match[1]));
    else if (match[2] && match[3]) children.push(linkNode(match[3], match[2]));
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < line.length) children.push(textNode(line.slice(lastIdx)));
  if (children.length === 0) children.push(textNode(line));
  return children;
}

function markdownToLexical(md: string) {
  const lines = md.split('\n');
  const children: any[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') { children.push(horizontalRule()); i++; continue; }
    if (line.startsWith('## ')) { children.push(heading('h2', line.slice(3).trim())); i++; continue; }
    if (line.startsWith('### ')) { children.push(heading('h3', line.slice(4).trim())); i++; continue; }
    if (line.startsWith('# ')) { i++; continue; }
    if (line.trim().startsWith('[EMBED:')) {
      const embedSlug = line.trim().match(/\[EMBED:\s*(.+?)\]/)?.[1] || '';
      children.push(paragraph([textNode(`[Stay embed: ${embedSlug}]`)])); i++; continue;
    }
    if (line.startsWith('> ')) {
      const ql: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { ql.push(lines[i].slice(2)); i++; }
      children.push({ type: 'quote', format: '', indent: 0, version: 1, direction: 'ltr', children: ql.map(l => paragraph(parseInline(l))) });
      continue;
    }
    const pl: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('---') && !lines[i].startsWith('***') && !lines[i].startsWith('___') && !lines[i].startsWith('> ') && !lines[i].startsWith('[EMBED:')) { pl.push(lines[i]); i++; }
    if (pl.length > 0) children.push(paragraph(parseInline(pl.join(' '))));
  }
  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } };
}

// ── Parse frontmatter + body ────────────────────────────────────────────────

interface PostMeta {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  subtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
}

function parseMarkdownFile(filePath: string): PostMeta {
  const raw = fs.readFileSync(filePath, 'utf-8');

  // Split frontmatter from body
  let frontmatter: Record<string, string> = {};
  let body = raw;

  if (raw.startsWith('---')) {
    const endIdx = raw.indexOf('---', 3);
    if (endIdx !== -1) {
      const fmText = raw.slice(3, endIdx).trim();
      body = raw.slice(endIdx + 3).trim();

      // Simple YAML parser
      for (const line of fmText.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        // Strip quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        frontmatter[key] = val;
      }
    }
  }

  return {
    slug: frontmatter.slug || path.basename(filePath, '.md'),
    title: frontmatter.title || frontmatter.slug || path.basename(filePath, '.md'),
    excerpt: frontmatter.excerpt || frontmatter.metaDescription || '',
    subtitle: frontmatter.subtitle,
    metaTitle: frontmatter.metaTitle,
    metaDescription: frontmatter.metaDescription,
    body,
  };
}

// ── Generate SQL ────────────────────────────────────────────────────────────

const FILES = [
  'extraordinary-treehouses-america',
  'stargazing-getaways-dark-sky-unique-stays',
  'unique-stays-near-national-forests',
  'fishing-cabins-unique-stays-anglers',
  'october-unique-stays',
  'snow-globe-stays',
  'thanksgiving-getaways-unique-stays',
  'halloween-getaways-unique-stays',
  'lakefront-unique-stays-water-cabins-domes-aframes',
];

const contentDir = path.resolve(import.meta.dirname, '../content/published');
const statements: string[] = [];

for (const slug of FILES) {
  const fp = path.join(contentDir, `${slug}.md`);
  if (!fs.existsSync(fp)) { console.error(`SKIP ${slug}: not found`); continue; }

  const meta = parseMarkdownFile(fp);
  const lexical = markdownToLexical(meta.body);

  // Escape single quotes for SQL
  const esc = (s: string) => s.replace(/'/g, "''");
  const contentJson = JSON.stringify(lexical);

  const fields = ['slug', 'title', 'status', 'excerpt', 'content', 'published_at', 'created_at', 'updated_at'];
  const values = [
    `'${esc(meta.slug)}'`,
    `'${esc(meta.title)}'`,
    `'published'`,
    `'${esc(meta.excerpt)}'`,
    `'${esc(contentJson)}'::jsonb`,
    'now()',
    'now()',
    'now()',
  ];

  if (meta.subtitle) {
    fields.push('subtitle');
    values.push(`'${esc(meta.subtitle)}'`);
  }
  if (meta.metaTitle) {
    fields.push('meta_title');
    values.push(`'${esc(meta.metaTitle)}'`);
  }
  if (meta.metaDescription) {
    fields.push('meta_description');
    values.push(`'${esc(meta.metaDescription)}'`);
  }

  statements.push(
    `INSERT INTO blog_posts (${fields.join(', ')})\nVALUES (${values.join(', ')})\nON CONFLICT (slug) DO NOTHING;`
  );
}

const outPath = path.resolve(import.meta.dirname, 'restore-posts.sql');
fs.writeFileSync(outPath, statements.join('\n\n'));
console.log(`Generated ${statements.length} INSERT statements → ${outPath}`);

// Also print a summary
for (const s of statements) {
  const slugMatch = s.match(/'([^']+)'/);
  const titleMatch = s.match(/title[^']*'([^']+)'/);
  console.log(`  ${slugMatch?.[1]}: ${titleMatch?.[1]?.substring(0, 60)}...`);
}
