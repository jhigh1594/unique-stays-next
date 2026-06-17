# SnowSEO Webhook Integration

UniqueStaysUSA receives journal articles from [SnowSEO](https://snowseo.com) via a signed webhook. Content is stored in Payload's `blog-posts` collection and served at `/journal/{slug}`.

## Endpoint

```
POST /api/webhook/snowseo
Authorization: Bearer <SNOWSEO_WEBHOOK_SECRET>
Content-Type: application/json
```

Health check:

```
GET /api/webhook/snowseo
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SNOWSEO_WEBHOOK_SECRET` | Yes | Shared bearer token — must match SnowSEO webhook settings |
| `NEXT_PUBLIC_SERVER_URL` | Recommended | Used to build `cmsUrl` in responses (e.g. `https://www.uniquestaysusa.com`) |
| `SNOWSEO_UNPUBLISH_ACTION` | No | What to do on `article.unpublished`: `draft` (default), `archive`, or `delete` |
| `SNOWSEO_WEBHOOK_DEBUG` | No | Set to `true` to log full payloads |

Copy `.env.local.example` to `.env.local` and paste the SnowSEO secret into `SNOWSEO_WEBHOOK_SECRET`.

## Events

| Event | Behavior |
|---|---|
| `article.published` | Upsert blog post as **published**; returns `cmsArticleId` + `cmsUrl` |
| `article.drafted` | Upsert blog post as **draft**; returns `cmsArticleId` |
| `article.unpublished` | Applies `SNOWSEO_UNPUBLISH_ACTION` — never silently deletes |
| `webhook.connected` | Acknowledgement ping |
| `webhook.disconnected` | Acknowledgement when integration is removed |

### Unpublish actions

Configure with `SNOWSEO_UNPUBLISH_ACTION`:

- **`draft`** (default) — set `status` to `draft` (post hidden from public journal)
- **`archive`** — set `status` to `draft` and stamp `archivedAt`
- **`delete`** — permanently remove the Payload document

The response includes the chosen `action` so SnowSEO and operators can verify what happened.

## Payload storage

Every request is logged in Payload admin under **SnowSEO Webhook Logs** (`snow-webhook-logs`), including:

- Raw request body (exact bytes)
- Parsed JSON payload
- Redacted headers
- Processing status and message

Inspect logs at `/admin/collections/snow-webhook-logs`.

## Response shape

On publish/draft:

```json
{
  "success": true,
  "event": "article.published",
  "slug": "best-unique-stays-in-vermont",
  "action": "published",
  "cmsArticleId": "123",
  "cmsUrl": "https://www.uniquestaysusa.com/journal/best-unique-stays-in-vermont"
}
```

## Test locally

```bash
curl -X POST http://localhost:3000/api/webhook/snowseo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-snowseo-webhook-secret" \
  -d '{
    "event": "article.published",
    "timestamp": "2026-06-01T00:00:00Z",
    "article": {
      "slug": "test-post",
      "title": "Test Post",
      "markdown": "# Hello\n\nWorld",
      "html": "<h1>Hello</h1><p>World</p>",
      "status": "publish",
      "metaData": {
        "metaDescription": "A test excerpt"
      }
    }
  }'
```

## SnowSEO dashboard setup

1. In SnowSEO, open **Webhooks** and add your production URL: `https://www.uniquestaysusa.com/api/webhook/snowseo`
2. Set the authorization header to `Bearer <same value as SNOWSEO_WEBHOOK_SECRET>`
3. Send a test `webhook.connected` event to verify the connection
4. Publish or draft an article — SnowSEO should receive `cmsArticleId` and `cmsUrl` back

## Migrations

After pulling webhook changes:

```bash
pnpm generate:types
pnpm migrate
```

Reference implementation: [Snow-SEO/custom-webhook-blog](https://github.com/Snow-SEO/custom-webhook-blog)
