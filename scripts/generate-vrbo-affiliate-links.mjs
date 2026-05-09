#!/usr/bin/env node
/**
 * Generates VRBO affiliate links for all VRBO listings in Payload.
 *
 * Requires your browser session cookies saved at /tmp/vrbo-session.json:
 *   agent-browser --auto-connect state save /tmp/vrbo-session.json
 *
 * Usage:
 *   node scripts/generate-vrbo-affiliate-links.mjs [--dry-run] [--session /path/to/session.json]
 *
 * The script reads each VRBO listing's affiliateUrl (raw VRBO property URL),
 * calls the VRBO GraphQL CreateLinkMutation with your creator session cookies,
 * and writes the resulting vrbo.com/affiliates/... link back to Payload.
 */

import { readFileSync } from 'fs';
import crypto from 'crypto';

const GRAPHQL_HASH = 'bc747b962f39935bf895c5fc510449f14953b1ad4e20e3680b7994f348beaf11';
const PAYLOAD_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SESSION_FILE = (() => {
  const idx = args.indexOf('--session');
  return idx !== -1 ? args[idx + 1] : '/tmp/vrbo-session.json';
})();

function buildCookieString(sessionFile) {
  const session = JSON.parse(readFileSync(sessionFile, 'utf8'));
  // Include all VRBO cookies — Akamai bot cookies (bm_*, _abck, datadome) are
  // needed for bot detection to pass on the GraphQL endpoint.
  const cookies = session.cookies.filter(c => c.domain.includes('vrbo.com'));
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

async function generateAffiliateLink(vrboUrl, cookieString) {
  const body = [
    {
      operationName: 'CreateLinkMutation',
      variables: {
        clientContext: {
          pageId: 'page.Hotels.Infosite.Information',
          lineOfBusiness: 'LODGING',
          pageLocation: 'DETAILS',
        },
        context: {
          siteId: 9001001,
          locale: 'en_US',
          eapid: 1,
          tpid: 9001,
          currency: 'USD',
          device: { type: 'DESKTOP' },
          identity: {
            duaid: crypto.randomUUID(),
            authState: 'ANONYMOUS',
          },
          privacyTrackingState: 'CAN_TRACK',
        },
        request: {
          targetUrl: vrboUrl,
        },
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: GRAPHQL_HASH,
        },
      },
    },
  ];

  const res = await fetch('https://www.vrbo.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
      'Referer': vrboUrl,
      'Origin': 'https://www.vrbo.com',
      'Accept': '*/*',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const result = data[0]?.data?.createAffiliateLink;

  if (result?.__typename === 'AffiliatesCreateLinkLodgingSuccessResponse') {
    return result.descriptiveLinkForm?.url ?? null;
  }

  // Surface error details if available
  const errorMsg = result?.message ?? JSON.stringify(result);
  throw new Error(`Mutation failed: ${errorMsg}`);
}

async function fetchVrboListings() {
  const url = `${PAYLOAD_URL}/api/stays?where[platform][equals]=VRBO&limit=200&depth=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Payload fetch failed: ${res.status}`);
  const { docs } = await res.json();
  return docs;
}

async function updateListing(id, affiliateUrl) {
  const headers = { 'Content-Type': 'application/json' };
  if (PAYLOAD_API_KEY) headers['Authorization'] = `users API-Key ${PAYLOAD_API_KEY}`;

  const res = await fetch(`${PAYLOAD_URL}/api/stays/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ affiliateUrl }),
  });
  if (!res.ok) throw new Error(`Payload update failed: ${res.status}`);
}

async function main() {
  console.log(`Session: ${SESSION_FILE}`);
  console.log(`Payload: ${PAYLOAD_URL}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  const cookieString = buildCookieString(SESSION_FILE);
  const listings = await fetchVrboListings();

  console.log(`Found ${listings.length} VRBO listing(s)\n`);

  let ok = 0, skip = 0, fail = 0;

  for (const stay of listings) {
    const vrboUrl = stay.affiliateUrl;

    // Skip if already has an affiliate link
    if (vrboUrl?.includes('vrbo.com/affiliates/')) {
      console.log(`  SKIP  ${stay.slug} (already has affiliate link)`);
      skip++;
      continue;
    }

    if (!vrboUrl?.startsWith('https://')) {
      console.log(`  SKIP  ${stay.slug} (no valid affiliateUrl)`);
      skip++;
      continue;
    }

    try {
      const affiliateLink = await generateAffiliateLink(vrboUrl, cookieString);

      if (!affiliateLink) {
        console.log(`  FAIL  ${stay.slug}: empty response`);
        fail++;
        continue;
      }

      if (!DRY_RUN) {
        await updateListing(stay.id, affiliateLink);
        console.log(`  OK    ${stay.slug}: ${affiliateLink}`);
      } else {
        console.log(`  DRY   ${stay.slug}: ${affiliateLink}`);
      }
      ok++;
    } catch (err) {
      console.log(`  ERROR ${stay.slug}: ${err.message}`);
      fail++;
    }

    // Respect rate limits
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\nDone: ${ok} updated, ${skip} skipped, ${fail} failed`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
