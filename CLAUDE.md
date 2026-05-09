@AGENTS.md

## Design Context

### Users
Curious travelers and aspiring adventurers browsing for inspiration — people who already know they want something extraordinary and are looking for permission to book it. They discover the site through search, newsletter, or social. The job-to-be-done: find a stay that makes a great story. Secondary: trust that what they're clicking through to is genuinely vetted.

### Brand Personality
Wanderer · Editorial · Nostalgic

UniqueStaysUSA is "The Wanderer's Postcard Collection" — a curated travel editorial masquerading as a directory. The voice is warm, first-person, slightly literary. The visual language draws on analog travel artifacts: polaroids, postage stamps, filmstrips, grain, compass needles. Think Kinfolk meets Monocle meets a dog-eared travel journal.

### Aesthetic Direction
- **Colors**: Terracotta (`oklch(0.55 0.14 38)` ≈ `#A84626`), cream, forest green, warm charcoal, sand
- **Type**: Fraunces (serif, display — editorial authority) + Plus Jakarta Sans (body — modern clarity)
- **Motifs**: polaroid frames, stamp badges (✦), grain overlays, tilted/rotated cards, filmstrip, compass needle, ghost section numbers
- **Theme mode**: Light only
- **References**: Kinfolk, Monocle Travel, analog travel ephemera, letterpress print
- **Anti-references**: generic agency sites, dark-mode SaaS, neon gradients, AI-slop stock imagery

### Design Principles
1. **Analog warmth over digital polish** — grain, tilt, and imperfection signal authenticity
2. **Editorial restraint** — whitespace and typographic hierarchy do the heavy lifting; decoration supports, doesn't dominate
3. **Motion earns its keep** — only animate when it communicates meaning (reveal, entrance, state change); no gratuitous effects
4. **Brand coherence across micro-details** — cursors, scrollbars, selection color, loading states all speak the same visual language
5. **Performance is part of the aesthetic** — a laggy site breaks the calm, curated feeling; CSS-only and native-first wherever possible

## GBrain Configuration (configured by /setup-gbrain)
- Mode: local-stdio
- Engine: pglite
- Config file: ~/.gbrain/config.json (mode 0600)
- Setup date: 2026-05-09
- MCP registered: yes (user scope)
- Artifacts sync: full
- Current repo policy: read-write

## GBrain Search Guidance (configured by /sync-gbrain)
<!-- gstack-gbrain-search-guidance:start -->

GBrain is set up and synced on this machine. The agent should prefer gbrain
over Grep when the question is semantic or when you don't know the exact
identifier yet. Two indexed corpora available via the `gbrain` CLI:
- This repo's code (registered as `gstack-code-<repo>` source).
- `~/.gstack/` curated memory (registered as `gstack-brain-<user>` source via
  the existing federation pipeline).

Prefer gbrain when:
- "Where is X handled?" / semantic intent, no exact string yet:
    `gbrain search "<terms>"` or `gbrain query "<question>"`
- "Where is symbol Y defined?" / symbol-based code questions:
    `gbrain code-def <symbol>` or `gbrain code-refs <symbol>`
- "What calls Y?" / "What does Y depend on?":
    `gbrain code-callers <symbol>` / `gbrain code-callees <symbol>`
- "What did we decide last time?" / past plans, retros, learnings:
    `gbrain search "<terms>" --source gstack-brain-<user>`

Grep is still right for known exact strings, regex, multiline patterns, and
file globs. The brain auto-syncs incrementally on every gstack skill start.
Run `/sync-gbrain` to force-refresh, `/sync-gbrain --full` for full reindex.

<!-- gstack-gbrain-search-guidance:end -->
