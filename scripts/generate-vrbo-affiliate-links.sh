#!/usr/bin/env bash
# Generate Expedia Group affiliate links for all VRBO listings that need them.
# Reads from Payload CMS, generates links via the expedia-group CLI, writes back.
set -euo pipefail

CLI="$HOME/go/bin/expedia-group"
BASE_URL="http://localhost:3003"
PARTNER_ID="f822dc10-dd1d-483f-9917-93b526aaab70"
CAMREF="1100l5K5tH"
CREATIVEREF="1101l63118"
BATCH_SIZE=10  # Expedia Group processes multiple landing pages per request

echo "=== VRBO Affiliate Link Generator ==="
echo "Partner: $PARTNER_ID"
echo "Campaign: camref=$CAMREF creativeRef=$CREATIVEREF"
echo ""

# Fetch all VRBO listings needing affiliate links
ALL_LISTINGS=$(python3 -c "
import json, urllib.request

all_stays = []
page = 1
while True:
    url = f'$BASE_URL/api/stays?where%5Bplatform%5D%5Bequals%5D=VRBO&depth=0&limit=100&fields=id,slug,title,affiliateUrl&page={page}'
    with urllib.request.urlopen(url) as resp:
        d = json.loads(resp.read())
    all_stays.extend(d['docs'])
    if not d.get('hasNextPage'):
        break
    page += 1

# Filter: only direct VRBO URLs (not already affiliate links)
needs_link = []
for s in all_stays:
    url = s.get('affiliateUrl', '') or ''
    if 'vrbo.com/affiliate' in url or 'vrbo.com/affiliates' in url:
        continue
    if 'vrbo.com' in url:
        needs_link.append(s)
    elif url:
        needs_link.append(s)

print(json.dumps(needs_link))
")

TOTAL=$(echo "$ALL_LISTINGS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "Listings needing affiliate links: $TOTAL"
echo ""

if [ "$TOTAL" -eq 0 ]; then
    echo "All VRBO listings already have affiliate links. Nothing to do."
    exit 0
fi

# Process in batches
SUCCESS=0
FAIL=0
UPDATED=0

echo "$ALL_LISTINGS" | python3 -c "
import json, sys
listings = json.load(sys.stdin)
for i in range(0, len(listings), $BATCH_SIZE):
    batch = listings[i:i+$BATCH_SIZE]
    print(json.dumps(batch))
" | while IFS= read -r BATCH_JSON; do
    # Build the landing pages payload
    LANDING_PAGES=$(echo "$BATCH_JSON" | python3 -c "
import json, sys
batch = json.load(sys.stdin)
pages = []
for s in batch:
    slug = s['slug'][:50]
    title = s.get('title', slug)[:100]
    url = s.get('affiliateUrl', '')
    pages.append({
        'generateShortLink': True,
        'label': slug,
        'title': title,
        'type': 'STAY',
        'url': url
    })
print(json.dumps(pages))
")

    # Build the full request body
    REQUEST_BODY=$(python3 -c "
import json
body = {
    'camref': '$CAMREF',
    'creativeref': '$CREATIVEREF',
    'landingPages': json.loads('$LANDING_PAGES'),
    'partnerId': '$PARTNER_ID'
}
print(json.dumps(body))
")

    # Call the CLI
    RESPONSE=$(echo "$REQUEST_BODY" | "$CLI" links create-affiliate-links --stdin --json 2>&1) || {
        echo "FAILED batch: $RESPONSE"
        continue
    }

    # Parse response and update Payload
    echo "$RESPONSE" | python3 -c "
import json, sys, urllib.request

resp = json.load(sys.stdin)
data = resp.get('data', {})
urls = data.get('affiliateUrls', [])

# Build lookup: label -> affiliate URL
link_map = {}
for u in urls:
    link_map[u.get('label', '')] = u.get('url', '')

batch = json.loads('$BATCH_JSON')
for s in batch:
    slug = s['slug'][:50]
    stay_id = s['id']
    affiliate_url = link_map.get(slug, '')

    if not affiliate_url:
        print(f'  SKIP [{stay_id}] {slug} — no affiliate URL in response')
        continue

    # Update Payload CMS
    payload = json.dumps({'affiliateUrl': affiliate_url}).encode()
    req = urllib.request.Request(
        f'$BASE_URL/api/stays/{stay_id}',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req) as r:
            if r.status == 200:
                print(f'  UPDATED [{stay_id}] {slug} -> {affiliate_url}')
            else:
                print(f'  FAIL [{stay_id}] {slug} — HTTP {r.status}')
    except Exception as e:
        print(f'  ERROR [{stay_id}] {slug} — {e}')
" 2>&1
done

echo ""
echo "=== Done ==="
