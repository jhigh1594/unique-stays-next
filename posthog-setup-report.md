<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into UniqueStaysUSA. PostHog is initialized via `instrumentation-client.ts` (Next.js 15.3+ pattern) with a reverse proxy through `/ingest` to improve tracking reliability. Ten events are tracked across seven client component files, covering the full affiliate conversion funnel from discovery through booking click, plus collection filtering, journal engagement, and community submissions.

LLM analytics were added in a second pass. The novelty scorer (`src/lib/discovery/scorer.ts`) uses the Vercel AI SDK with an OpenAI-compatible NVIDIA NIM endpoint (Llama 3.3 70B). OpenTelemetry is initialized in `instrumentation.ts` using `PostHogSpanProcessor` from `@posthog/ai/otel`, which converts `gen_ai.*` OTel spans into `$ai_generation` events in PostHog automatically.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `stay_viewed` | User lands on a stay detail page — top of conversion funnel | `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx` |
| `affiliate_link_clicked` | User clicks the affiliate booking button | `src/app/(app)/stays/[slug]/_stay/StayDetailContent.tsx` |
| `stay_card_clicked` | User clicks a stay card in any listing grid | `src/components/StayCard.tsx` |
| `stay_search_performed` | User types a search query in the collection | `src/components/FilterEngine.tsx` |
| `collection_filtered` | User applies a filter (category, platform, price, location, sort) | `src/components/FilterEngine.tsx` |
| `collection_filters_reset` | User clears all active filters | `src/components/FilterEngine.tsx` |
| `collection_paginated` | User navigates to a different page of results | `src/components/FilterEngine.tsx` |
| `stay_submitted` | User submits a stay recommendation | `src/app/(app)/submit/page.tsx` |
| `journal_post_viewed` | User views a journal article — top of content funnel | `src/app/(app)/journal/[slug]/_post/JournalPostContent.tsx` |
| `spoke_browsed` | User navigates to a spoke section | `src/app/(app)/[spoke]/_spoke/SpokeFilterBar.tsx` |

## LLM analytics — events captured automatically

| Property | Description |
|---|---|
| `$ai_model` | Model name (e.g. `meta/llama-3.3-70b-instruct`) |
| `$ai_latency` | Latency in seconds per scoring call |
| `$ai_input_tokens` | Prompt token count |
| `$ai_output_tokens` | Completion token count |
| `$ai_total_cost_usd` | Estimated cost in USD |
| `listing_platform` | Custom metadata — Airbnb / VRBO / Wander source |

## Files created or modified

| File | Change |
|---|---|
| `instrumentation-client.ts` | Created — PostHog client initialization (Next.js 15.3+ pattern) |
| `instrumentation.ts` | Created — OTel `register()` with `PostHogSpanProcessor` for LLM analytics |
| `src/lib/posthog-server.ts` | Created — Server-side PostHog client helper |
| `src/lib/discovery/scorer.ts` | Added `experimental_telemetry` to `generateText` call |
| `next.config.ts` | Added PostHog reverse proxy rewrites (`/ingest/*`) |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1606549) — all five insights in one view
- [Affiliate Conversion Funnel](/insights/eUSszXm8) — `stay_viewed` → `affiliate_link_clicked` conversion rate (core revenue metric)
- [Affiliate Link Clicks Over Time](/insights/NIBeazdC) — daily clicks vs. views trend line
- [Affiliate Clicks by Platform](/insights/VW13ZNOj) — breakdown by Airbnb / VRBO / Wander / Direct
- [Stay Submissions](/insights/T3uQiTqo) — community submission count (bold number)
- [Spoke Browsing by Category](/insights/LoyK3XDM) — which spoke draws the most visitors

**LLM Analytics dashboard**

- [LLM Analytics dashboard](/dashboard/1606562) — all three LLM insights in one view
- [LLM Generation Count](/insights/00eLcq18) — daily count of novelty scoring calls
- [Avg LLM Latency](/insights/tqzoZwii) — average seconds per scoring call
- [Total Input + Output Tokens](/insights/MXPLVZxI) — token consumption split by direction
- [LLM traces view](/llm-analytics/traces) — full trace explorer for every generation

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
