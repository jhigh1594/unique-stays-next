#!/usr/bin/env node
/**
 * Generates VRBO affiliate links using the already-running Chrome browser.
 *
 * Connects to Chrome via CDP (agent-browser keeps it running). Runs the
 * CreateLinkMutation from inside real Chrome — fully authenticated, no Akamai issues.
 *
 * Prerequisites:
 *   agent-browser must be running (it keeps a Chrome instance alive)
 *   Chrome must be logged into vrbo.com/affiliates/uniquestaysusa/
 *
 * Usage:
 *   node scripts/local-chrome-vrbo-affiliate.mjs [--dry-run]
 *   node scripts/local-chrome-vrbo-affiliate.mjs --only pelican-bay-lighthouse-or,dc-firehouse-penthouse
 */

import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';

const GRAPHQL_HASH = 'bc747b962f39935bf895c5fc510449f14953b1ad4e20e3680b7994f348beaf11';
const EAPID = 310123; // UniqueStaysUSA creator EAPID from iEAPID cookie
const PAYLOAD_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_SLUGS = (() => {
  const idx = args.indexOf('--only');
  return idx !== -1 ? args[idx + 1].split(',').map(s => s.trim()) : null;
})();

// ── CDP connection ───────────────────────────────────────────────────────────

function getCdpUrl() {
  try {
    const url = execSync('agent-browser --auto-connect get cdp-url', { encoding: 'utf8' }).trim();
    if (!url.startsWith('ws://')) throw new Error('unexpected output');
    return url;
  } catch {
    throw new Error(
      'Could not get CDP URL — make sure agent-browser is running.\n' +
      'Start it with: agent-browser --auto-connect open https://www.vrbo.com/affiliates/uniquestaysusa/home'
    );
  }
}

// ── Payload helpers ──────────────────────────────────────────────────────────

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

// ── GraphQL mutation (runs inside Chrome) ────────────────────────────────────

async function generateAffiliateLink(browser, vrboUrl, attempt = 1) {
  const page = await browser.newPage();
  try {
    await page.goto(vrboUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const result = await page.evaluate(async (targetUrl, hash, eapid) => {
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
              eapid,
              tpid: 9001,
              currency: 'USD',
              device: { type: 'DESKTOP' },
              identity: {
                duaid: crypto.randomUUID(),
                authState: 'ANONYMOUS',
              },
              privacyTrackingState: 'CAN_TRACK',
            },
            request: { targetUrl },
          },
          extensions: {
            persistedQuery: { version: 1, sha256Hash: hash },
          },
        },
      ];

      const res = await fetch('https://www.vrbo.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const result = data[0]?.data?.createAffiliateLink;

      if (result?.__typename === 'AffiliatesCreateLinkLodgingSuccessResponse') {
        return result.descriptiveLinkForm?.url ?? null;
      }

      throw new Error(result?.message ?? JSON.stringify(result).slice(0, 200));
    }, vrboUrl, GRAPHQL_HASH, EAPID);

    return result;
  } catch (err) {
    // Retry on 429 with exponential backoff (max 3 attempts)
    if (err.message.includes('429') && attempt < 3) {
      const wait = attempt * 60000; // 60s, 120s
      console.log(`    rate limited — waiting ${wait / 1000}s before retry ${attempt + 1}/3...`);
      await new Promise(r => setTimeout(r, wait));
      await page.close();
      return generateAffiliateLink(browser, vrboUrl, attempt + 1);
    }
    throw err;
  } finally {
    if (!page.isClosed()) await page.close();
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cdpUrl = getCdpUrl();
  console.log(`CDP:      ${cdpUrl}`);
  console.log(`Payload:  ${PAYLOAD_URL}`);
  console.log(`EAPID:    ${EAPID}`);
  console.log(`Dry run:  ${DRY_RUN}\n`);

  const browser = await puppeteer.connect({ browserWSEndpoint: cdpUrl });

  try {
    const allListings = await fetchVrboListings();
    const listings = ONLY_SLUGS
      ? allListings.filter(s => ONLY_SLUGS.includes(s.slug))
      : allListings;

    console.log(`Processing ${listings.length} VRBO listing(s)\n`);

    let ok = 0, skip = 0, fail = 0;

    for (const stay of listings) {
      const vrboUrl = stay.affiliateUrl;

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
        const affiliateLink = await generateAffiliateLink(browser, vrboUrl);

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

      await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`\nDone: ${ok} updated, ${skip} skipped, ${fail} failed`);
  } finally {
    // Disconnect without closing the browser — leave Chrome running
    browser.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
