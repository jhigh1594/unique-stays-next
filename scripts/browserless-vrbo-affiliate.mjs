#!/usr/bin/env node
/**
 * Generates VRBO affiliate links using browserless.io cloud Chrome.
 *
 * Runs the CreateLinkMutation inside a real browser, bypassing Akamai bot detection.
 *
 * Auth (pick one):
 *   Option A — env vars:  VRBO_EMAIL + VRBO_PASSWORD  (auto-login)
 *   Option B — session file (from: agent-browser --auto-connect state save /tmp/vrbo-session.json)
 *
 * Usage:
 *   VRBO_EMAIL=you@example.com VRBO_PASSWORD=secret node scripts/browserless-vrbo-affiliate.mjs
 *   node scripts/browserless-vrbo-affiliate.mjs --session /tmp/vrbo-session.json
 *   node scripts/browserless-vrbo-affiliate.mjs --dry-run
 *   node scripts/browserless-vrbo-affiliate.mjs --only pelican-bay-lighthouse-or,green-mountain-chapel-vt
 */

import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';

const GRAPHQL_HASH = 'bc747b962f39935bf895c5fc510449f14953b1ad4e20e3680b7994f348beaf11';
const PAYLOAD_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY;
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const VRBO_EMAIL = process.env.VRBO_EMAIL;
const VRBO_PASSWORD = process.env.VRBO_PASSWORD;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SESSION_FILE = (() => {
  const idx = args.indexOf('--session');
  return idx !== -1 ? args[idx + 1] : null;
})();
const ONLY_SLUGS = (() => {
  const idx = args.indexOf('--only');
  return idx !== -1 ? args[idx + 1].split(',').map(s => s.trim()) : null;
})();

if (!BROWSERLESS_API_KEY) {
  console.error('BROWSERLESS_API_KEY is required');
  process.exit(1);
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

// ── Auth: load session cookies from file ─────────────────────────────────────

async function loadSessionCookies(page, sessionFile) {
  const session = JSON.parse(readFileSync(sessionFile, 'utf8'));
  const cookies = session.cookies
    .filter(c => c.domain.includes('vrbo.com') || c.domain.includes('expedia.com'))
    .map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path ?? '/',
      expires: c.expires ?? -1,
      httpOnly: c.httpOnly ?? false,
      secure: c.secure ?? true,
      sameSite: c.sameSite ?? 'None',
    }));
  await page.setCookie(...cookies);
  console.log(`Loaded ${cookies.length} cookies from ${sessionFile}`);
}

// ── Auth: automated login ────────────────────────────────────────────────────

async function login(page) {
  console.log('Logging into VRBO...');
  await page.goto('https://www.vrbo.com/login', { waitUntil: 'networkidle2', timeout: 30000 });

  // Fill email
  await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 15000 });
  const emailField = await page.$('input[type="email"], input[name="email"], #email');
  await emailField.type(VRBO_EMAIL, { delay: 40 });

  // Continue / next button
  const continueBtn = await page.$('button[type="submit"], button[data-testid="continue-btn"]');
  if (continueBtn) {
    await continueBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  }

  // Fill password (may be on same page or next step)
  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  const pwField = await page.$('input[type="password"]');
  await pwField.type(VRBO_PASSWORD, { delay: 40 });

  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  const url = page.url();
  if (url.includes('/login')) throw new Error('Login failed — still on login page');
  console.log('Logged in.');
}

// ── GraphQL mutation (runs inside Chrome) ────────────────────────────────────

async function generateAffiliateLink(page, vrboUrl) {
  // Navigate to the listing so the Referer header and page context match
  await page.goto(vrboUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  return page.evaluate(async (targetUrl, hash) => {
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

    throw new Error(result?.message ?? JSON.stringify(result));
  }, vrboUrl, GRAPHQL_HASH);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SESSION_FILE && (!VRBO_EMAIL || !VRBO_PASSWORD)) {
    console.error('Provide auth: VRBO_EMAIL + VRBO_PASSWORD env vars, or --session /path/to/session.json');
    process.exit(1);
  }

  console.log(`Payload:  ${PAYLOAD_URL}`);
  console.log(`Auth:     ${SESSION_FILE ? `session file (${SESSION_FILE})` : 'credentials'}`);
  console.log(`Dry run:  ${DRY_RUN}\n`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  try {
    if (SESSION_FILE) {
      // Navigate first so cookies can be set for the domain
      await page.goto('https://www.vrbo.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await loadSessionCookies(page, SESSION_FILE);
    } else {
      await login(page);
    }

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
        const affiliateLink = await generateAffiliateLink(page, vrboUrl);

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

      await new Promise(r => setTimeout(r, 1200));
    }

    console.log(`\nDone: ${ok} updated, ${skip} skipped, ${fail} failed`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
