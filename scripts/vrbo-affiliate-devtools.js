/**
 * Paste into Chrome DevTools Console on any vrbo.com listing page
 * while the Expedia Creator Toolbox is active.
 *
 * When done, run this to copy results to clipboard:
 *   copy(JSON.stringify(window.__affiliateResults))
 *
 * Then paste into scripts/vrbo-affiliate-results.json and run:
 *   node scripts/apply-vrbo-affiliate-links.mjs
 */

const LISTINGS = [
  { id: 23,  slug: 'pelican-bay-lighthouse-or',          url: 'https://www.vrbo.com/3624099' },
  { id: 24,  slug: 'green-mountain-chapel-vt',           url: 'https://www.vrbo.com/4050172' },
  { id: 25,  slug: 'dc-firehouse-penthouse',             url: 'https://www.vrbo.com/9420794ha' },
  { id: 26,  slug: 'big-buffalo-hotel-wy',               url: 'https://www.vrbo.com/2178821' },
  { id: 27,  slug: 'point-robinson-lighthouse-wa',       url: 'https://www.vrbo.com/569944' },
  { id: 41,  slug: 'workfriendly-houseboat-seattle',     url: 'https://www.vrbo.com/599242' },
  { id: 59,  slug: 'maristellas-treehouse-ca',           url: 'https://www.vrbo.com/1098162' },
  { id: 60,  slug: 'east-zion-treetop-ut',               url: 'https://www.vrbo.com/1910808' },
  { id: 61,  slug: 'lake-travis-treehouse-tx',           url: 'https://www.vrbo.com/4968220ha' },
  { id: 62,  slug: 'dallas-city-treehouse-tx',           url: 'https://www.vrbo.com/1129722' },
  { id: 64,  slug: 'elm-treehouse-grove-tn',             url: 'https://www.vrbo.com/1988135' },
  { id: 65,  slug: 'out-on-a-limb-pigeon-forge-tn',      url: 'https://www.vrbo.com/1642965' },
  { id: 66,  slug: 'daniel-boone-treehouse-ky',          url: 'https://www.vrbo.com/7623743ha' },
  { id: 67,  slug: '87-getaway-treehouse-ar',            url: 'https://www.vrbo.com/1131237' },
  { id: 68,  slug: 'hocking-hills-treehouse-oh',         url: 'https://www.vrbo.com/1163394' },
  { id: 69,  slug: 'four-seasons-treehouse-mn',          url: 'https://www.vrbo.com/736892' },
  { id: 70,  slug: 'bar-harbor-treehouse-me',            url: 'https://www.vrbo.com/1776913' },
  { id: 71,  slug: 'lake-sunapee-treehouse-nh',          url: 'https://www.vrbo.com/2133966' },
  { id: 72,  slug: 'cape-cod-treehouse-ma',              url: 'https://www.vrbo.com/4837047ha' },
  { id: 77,  slug: 'treehouse-pisgah-nc',                url: 'https://www.vrbo.com/1036767' },
  { id: 78,  slug: 'smoky-mountains-treehouse-nc',       url: 'https://www.vrbo.com/1264122' },
  { id: 87,  slug: 'solar-yurt-bellingham-wa',           url: 'https://www.vrbo.com/2586211' },
  { id: 88,  slug: 'escalante-yurt-resort-ut',           url: 'https://www.vrbo.com/3363240' },
  { id: 89,  slug: 'luxury-yurt-sears-mi',               url: 'https://www.vrbo.com/3269289' },
  { id: 90,  slug: 'huron-forest-yurt-mi',               url: 'https://www.vrbo.com/1414292' },
  { id: 91,  slug: 'acadia-yurt-me',                     url: 'https://www.vrbo.com/663097' },
  { id: 92,  slug: 'waterfalls-yurt-ulster-ny',          url: 'https://www.vrbo.com/1654360' },
  { id: 93,  slug: 'lake-grapevine-yurts-tx',            url: 'https://www.vrbo.com/7454388ha' },
  { id: 94,  slug: 'luxury-yurt-conyers-ga',             url: 'https://www.vrbo.com/1744834' },
  { id: 95,  slug: 'lookout-mountain-yurt-ga',           url: 'https://www.vrbo.com/2591291' },
  { id: 96,  slug: 'blue-ridge-yurt-asheville-nc',       url: 'https://www.vrbo.com/1136597' },
  { id: 97,  slug: 'farm-yurt-granville-ny',             url: 'https://www.vrbo.com/4870506' },
  { id: 106, slug: 'river-aframe-riverbend-wa',          url: 'https://www.vrbo.com/3223344' },
  { id: 107, slug: 'waterfront-aframe-rhododendron-or',  url: 'https://www.vrbo.com/388262' },
  { id: 108, slug: 'clark-fork-aframe-mt',               url: 'https://www.vrbo.com/9907566ha' },
  { id: 109, slug: 'lakeside-aframe-idaho',              url: 'https://www.vrbo.com/7261088ha' },
  { id: 111, slug: 'coconino-aframe-flagstaff-az',       url: 'https://www.vrbo.com/589657' },
  { id: 112, slug: 'pedernales-aframe-fredericksburg-tx',url: 'https://www.vrbo.com/3757192' },
  { id: 113, slug: 'canyon-lake-aframe-tx',              url: 'https://www.vrbo.com/3605736' },
  { id: 119, slug: 'berkshires-aframe-becket-ma',        url: 'https://www.vrbo.com/9872779ha' },
  { id: 124, slug: 'double-aframe-vilas-nc',             url: 'https://www.vrbo.com/3782050' },
  { id: 125, slug: 'blue-ridge-river-aframe-wv',         url: 'https://www.vrbo.com/2871145' },
  { id: 131, slug: 'sierra-dome-arnold-ca',              url: 'https://www.vrbo.com/1278523' },
  { id: 132, slug: 'rockies-dome-wildernest-co',         url: 'https://www.vrbo.com/644256' },
  { id: 137, slug: 'boho-dome-terlingua-tx',             url: 'https://www.vrbo.com/4038225' },
  { id: 138, slug: 'eden-prairie-dome-mn',               url: 'https://www.vrbo.com/4525303ha' },
  { id: 140, slug: 'hocking-hills-dome-oh',              url: 'https://www.vrbo.com/2277115' },
  { id: 141, slug: 'bunny-bungalow-dome-oh',             url: 'https://www.vrbo.com/3635961' },
  { id: 144, slug: 'geodome-vernon-vt',                  url: 'https://www.vrbo.com/3560397' },
  { id: 146, slug: 'deep-gap-dome-nc',                   url: 'https://www.vrbo.com/1746200' },
  { id: 147, slug: 'grundy-dome-tn',                     url: 'https://www.vrbo.com/2066290' },
  { id: 148, slug: 'shenandoah-dome-wv',                 url: 'https://www.vrbo.com/563758' },
  { id: 149, slug: 'bighorn-schoolhouse-wy',             url: 'https://www.vrbo.com/4025884ha' },
  { id: 150, slug: 'hansville-schoolhouse-wa',           url: 'https://www.vrbo.com/4375507' },
  { id: 155, slug: 'ozarks-church-harrison-ar',          url: 'https://www.vrbo.com/2547578' },
  { id: 161, slug: 'centre-county-church-pa',            url: 'https://www.vrbo.com/4643551ha' },
  { id: 162, slug: 'brick-schoolhouse-ny',               url: 'https://www.vrbo.com/385025' },
  { id: 163, slug: 'newport-firehouse-ri',               url: 'https://www.vrbo.com/7468225ha' },
  { id: 173, slug: 'ark-tiny-zion-ut',                   url: 'https://www.vrbo.com/1713114' },
  { id: 174, slug: 'historic-tiny-eureka-springs-ar',    url: 'https://www.vrbo.com/2195717' },
  { id: 176, slug: 'lakewoods-tiny-sawyer-mi',           url: 'https://www.vrbo.com/322768' },
  { id: 178, slug: 'great-river-tiny-wi',                url: 'https://www.vrbo.com/1217859044' },
  { id: 180, slug: 'luxury-tiny-woodstock-nh',           url: 'https://www.vrbo.com/4147470' },
  { id: 182, slug: 'tiny-community-lancaster-pa',        url: 'https://www.vrbo.com/3512584' },
  { id: 183, slug: 'murray-tiny-chatsworth-ga',          url: 'https://www.vrbo.com/4873469ha' },
  { id: 189, slug: 'flathead-floating-house-mt',         url: 'https://www.vrbo.com/2307623' },
  { id: 194, slug: 'keys-luxury-houseboat-fl',           url: 'https://www.vrbo.com/836359' },
  { id: 195, slug: 'key-west-houseboat-fl',              url: 'https://www.vrbo.com/4243444' },
  { id: 203, slug: 'shire-of-montana-trout-creek',       url: 'https://www.vrbo.com/324679' },
  { id: 207, slug: 'hobbit-house-russellville-ar',       url: 'https://www.vrbo.com/2011545' },
  { id: 233, slug: 'eagle-harbor-lighthouse-mi',         url: 'https://www.vrbo.com/3893239ha' },
  { id: 257, slug: 'hilltop-castle-pocono-pa',           url: 'https://www.vrbo.com/7378631ha' },
];

const HASH = 'bc747b962f39935bf895c5fc510449f14953b1ad4e20e3680b7994f348beaf11';

async function getAffiliateLink(vrboUrl) {
  const res = await fetch('https://www.vrbo.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify([{
      operationName: 'CreateLinkMutation',
      variables: {
        clientContext: { pageId: 'page.Hotels.Infosite.Information', lineOfBusiness: 'LODGING', pageLocation: 'DETAILS' },
        context: {
          siteId: 9001001, locale: 'en_US', eapid: 1, tpid: 9001, currency: 'USD',
          device: { type: 'DESKTOP' },
          identity: { duaid: crypto.randomUUID(), authState: 'ANONYMOUS' },
          privacyTrackingState: 'CAN_TRACK',
        },
        request: { targetUrl: vrboUrl },
      },
      extensions: { persistedQuery: { version: 1, sha256Hash: HASH } },
    }]),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${data?.message ?? ''}`);

  const result = data[0]?.data?.createAffiliateLink;
  if (result?.__typename !== 'AffiliatesCreateLinkLodgingSuccessResponse') {
    throw new Error(JSON.stringify(result).slice(0, 200));
  }
  return result.descriptiveLinkForm.url;
}

(async () => {
  const results = {};
  let ok = 0, fail = 0;
  console.log(`Generating affiliate links for ${LISTINGS.length} VRBO listings...\n`);

  for (const { id, slug, url } of LISTINGS) {
    try {
      const affiliateUrl = await getAffiliateLink(url);
      results[id] = { slug, affiliateUrl };
      console.log(`✓ [${ok + 1}/${LISTINGS.length}] ${slug}\n  ${affiliateUrl}`);
      ok++;
    } catch (err) {
      results[id] = { slug, error: err.message };
      console.error(`✗ ${slug}: ${err.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 600));
  }

  window.__affiliateResults = results;
  console.log(`\n✅ Done: ${ok} succeeded, ${fail} failed`);
  console.log('Run this to copy results:\n  copy(JSON.stringify(window.__affiliateResults))');
})();
