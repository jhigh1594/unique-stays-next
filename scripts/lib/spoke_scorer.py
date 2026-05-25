"""Novelty scorer — Python port of src/lib/discovery/scorer.ts.

Scores listings on "experience novelty" using NVIDIA NIM with OpenRouter
failover. Uses the same rubric as the TypeScript pipeline.
"""

import json
import re
import time

from llm_config import completion_with_failover

SYSTEM_PROMPT = """You are an expert curator for UniqueStaysUSA, a directory of unique vacation rentals.

Your job is to score listings on "experience novelty" — how distinctive and memorable the STAY EXPERIENCE is, not just how nice the property is.

Scoring guide:
- 9-10: Extraordinary structures (treehouses, caves, lighthouses, planes, trains, igloos, hobbit holes, converted churches/silos/firehouses)
- 7-8: Distinctive architecture (geodesic domes, yurts, glamping tents, A-frames with unique features, tiny homes with creative design)
- 5-6: Above-average uniqueness (cabins with unusual features like stargazing decks, hot springs access, private waterfalls)
- 3-4: Nice but common (well-designed cabins, nice lake houses, standard tiny homes without unique features)
- 0-2: Generic (standard condos, apartments, typical vacation rentals, hotel-like properties)

Key factors:
- Structure type matters more than amenities
- A treehouse with basic amenities scores higher than a luxury condo with every amenity
- Location uniqueness helps (private island, volcano adjacent, desert isolated) but doesn't override generic structure
- "Luxury" and "beautiful" do NOT mean novel
- Renovated/vintage properties score higher if the renovation preserves unique character

You MUST respond with ONLY valid JSON — no markdown fences, no commentary."""

MAX_RETRIES = 5
RETRY_BASE_S = 2


def _build_prompt(listing: dict) -> str:
    parts = [
        f"Title: {listing.get('title', '')}",
        f"Location: {listing.get('location', '')}",
        f"Platform: {listing.get('platform', '')}",
    ]
    if listing.get("price"):
        parts.append(f"Price: ${listing['price']}/night")
    if listing.get("description"):
        parts.append(f"Description: {listing['description'][:1000]}")
    if listing.get("amenities"):
        parts.append(f"Amenities: {', '.join(listing['amenities'])}")

    return f"""{chr(10).join(parts)}

Score this listing on experience novelty (0-10). Return JSON:
{{
  "score": <number 0-10>,
  "reason": "<1-2 sentences explaining the score>",
  "category": "<property type: treehouse|dome|yurt|cave|lighthouse|cabin|tiny-home|castle|silo|converted|glamping|generic>"
}}"""


def score_novelty(listing: dict, model_id: str | None = None) -> dict:
    """Score a single listing. Returns {score, reason, category, _rate_limited}."""
    prompt = _build_prompt(listing)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            text, provider = completion_with_failover(
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": prompt},
                ],
                model_id=model_id,
                max_tokens=200,
                temperature=0.3,
            )
            text = text.strip()
            fence_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?\s*```", text)
            if fence_match:
                text = fence_match.group(1).strip()

            parsed = json.loads(text)
            return {
                "score": max(0, min(10, int(parsed.get("score", 0)))),
                "reason": str(parsed.get("reason", ""))[:500],
                "category": str(parsed.get("category", "generic"))[:50],
            }
        except Exception as e:
            msg = str(e)
            if "429" in msg or "Too Many Requests" in msg or "rate" in msg.lower():
                if attempt < MAX_RETRIES:
                    backoff = RETRY_BASE_S * attempt
                    print(f"  Rate limited, retrying in {backoff}s (attempt {attempt}/{MAX_RETRIES})")
                    time.sleep(backoff)
                    continue
                # Exhausted retries — mark for later retry instead of scoring 0
                print(f"  Rate limited exhausted for \"{listing.get('title', '?')}\" — queued for retry")
                return {"score": 0, "reason": "Rate limited", "category": "unknown", "_rate_limited": True}
            print(f"  Scoring failed for \"{listing.get('title', '?')}\": {msg[:200]}")
            return {"score": 0, "reason": "Scoring failed", "category": "unknown"}

    return {"score": 0, "reason": "Scoring failed", "category": "unknown"}


def score_batch(listings: list[dict], model_id: str | None = None, delay_s: float = 3.0) -> list[dict]:
    """Score a batch of listings with retry queue for rate-limited items."""
    scored = []
    rate_limited = []

    # Phase 1: Initial scoring pass
    total = len(listings)
    for i, listing in enumerate(listings):
        print(f"  Scoring [{i+1}/{total}]: {listing.get('title', '?')[:50]}...")
        novelty = score_novelty(listing, model_id)

        if novelty.get("_rate_limited"):
            rate_limited.append(listing)
            # Placeholder — will be rescored
            scored.append({**listing, "novelty": novelty})
        else:
            scored.append({**listing, "novelty": novelty})

        if delay_s > 0 and i < total - 1:
            time.sleep(delay_s)

    # Phase 2: Retry rate-limited items with longer delays
    if rate_limited:
        retry_delay = max(delay_s * 3, 10)
        print(f"\n  Retrying {len(rate_limited)} rate-limited listings (delay: {retry_delay}s)...")
        # Pause to let rate limit window reset
        time.sleep(15)

        for i, listing in enumerate(rate_limited):
            print(f"  Retry [{i+1}/{len(rate_limited)}]: {listing.get('title', '?')[:50]}...")
            novelty = score_novelty(listing, model_id)

            # Find and update in scored list
            for j, s in enumerate(scored):
                if s.get("sourceUrl") == listing.get("sourceUrl") or s.get("url") == listing.get("url"):
                    if s["novelty"].get("_rate_limited"):
                        scored[j] = {**listing, "novelty": novelty}
                    break

            if i < len(rate_limited) - 1:
                time.sleep(retry_delay)

    return scored
