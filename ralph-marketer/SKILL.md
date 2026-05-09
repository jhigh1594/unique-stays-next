---
name: ralph-marketer
description: "Autonomous AI copywriter that learns your voice, researches competitors, finds unique angles, and iterates until content is genuinely good. Use when asked to write marketing content, blog posts, social posts, newsletters, case studies, analyze writing style, or run an autonomous content creation loop. Commands: ralph-init, ralph-run, ralph-status, ralph-cancel."
version: 2.0.0
user-invocable: true
---

# Ralph the Marketer — OpenClaw Adaptation

Autonomous AI copywriter adapted from the Claude Code Ralph Wiggum pattern. Runs as an iterative loop inside OpenClaw — no external agent required.

## Architecture

```
content-project/
├── data/content.db          # SQLite database (trends, research, voice, drafts, published)
├── scripts/ralph/
│   ├── prd.json             # Task backlog (user stories with acceptance criteria)
│   └── progress.txt         # Accumulated learnings across iterations
├── content/
│   ├── drafts/              # Work-in-progress content
│   └── published/           # Final approved content
└── package.json             # npm scripts for db operations
```

## Commands

### Initialize a new project

When user says "ralph init" or "set up ralph" or "initialize content project":

```bash
# In the target project directory:
RALPH_SKILL="/data/workspace/skills/ralph-marketer"
mkdir -p data content/{drafts,published} scripts/ralph

# Copy templates
cp "$RALPH_SKILL/templates/prd.json" scripts/ralph/
cp "$RALPH_SKILL/templates/progress.txt" scripts/ralph/

# Copy and install database scripts
cp "$RALPH_SKILL/package.json" .
cp -r "$RALPH_SKILL/scripts" ./scripts/src
cp "$RALPH_SKILL/package.json" .
npm install

# Initialize database
npm run db:reset
npm test
```

Then customize:
1. Edit `scripts/ralph/prd.json` — replace sample tasks with real content needs
2. Edit seed data in `scripts/src/db/seed.js` — add your trends, research, company comms
3. Add your existing content to `founder_content` table for voice analysis

### Run the autonomous loop

When user says "ralph run" or "start ralph" or "run the copywriter":

You are now in a Ralph loop. Each iteration:

1. **Read PRD**: `cat scripts/ralph/prd.json` — find user stories
2. **Check Progress**: `cat scripts/ralph/progress.txt` — load accumulated learnings
3. **Pick Next Story**: Find highest priority story where `passes: false`
4. **Read Context**: Check database for relevant trends, research, voice profile
5. **Execute Story**: Complete the task following its acceptance criteria
6. **Quality Check**: Run through the copywriter quality loop (see below)
7. **Save Output**: Write draft to `content/drafts/` or published to `content/published/`
8. **Update DB**: Insert drafts/published records, update content_plan status
9. **Update PRD**: Mark story `passes: true` in `scripts/ralph/prd.json`
10. **Log Learnings**: Append patterns discovered to `scripts/ralph/progress.txt`
11. **Commit**: `git add -A && git commit -m "content: [ID] - [title]"`
12. **Next iteration**: Pick the next incomplete story

**Stop conditions:**
- All stories have `passes: true`
- User says "ralph cancel" or "stop ralph"
- Maximum iterations reached (user-configurable)

### Check status

When user says "ralph status" or "content status":

```bash
cd <project-dir> && npm run db:status
```

Then summarize: stories complete vs remaining, drafts written, content published.

### Cancel

When user says "ralph cancel" or "stop the loop":
- Stop iterating immediately
- Preserve all work in git
- Report what was completed

## The Quality Loop (Per Story)

Before marking any content story as `passes: true`, run this checklist:

### 1. VOICE — Does it sound like the founder?
- Load voice_profile from database
- Check signature phrases, tone, formality
- **Red flag**: "In today's rapidly evolving landscape..." → generic AI slop
- **Green flag**: Specific, personal, opinionated

### 2. ANGLE — Is the take unique?
- Search competitor_content in database
- If 5 other articles make the same point → find a different angle
- Best angles: personal data, contrarian take, specific case study

### 3. DATA — Are claims backed?
- Every claim must have a source or be labeled as opinion/experience
- Pull data_points from trends and research tables
- No unsubstantiated statistics

### 4. HOOK — Does the opening stop the scroll?
- First line must create curiosity or state something unexpected
- Test: "Would I keep reading past this line?"

### 5. CTA — Does it ask the reader to do something?
- Every piece of content needs a clear next step
- Value-first, not sales-first

## Adapting for Your Brand

### Voice Analysis
To teach Ralph your voice:
1. Add your best-performing content to `founder_content` table
2. Run voice analysis (extract patterns into `voice_profile`)
3. Ralph will match your tone, structure, and vocabulary

### Custom Content Sources
Edit `scripts/db/seed.js` to add:
- Your market trends
- Your competitor analysis
- Your company announcements
- Your research/data

### Custom Task Backlog
Edit `scripts/ralph/prd.json` to define:
- What content types you need (blog, social, newsletter, case study)
- Acceptance criteria for each piece
- Priority ordering
- Deadlines

## Key Differences from Claude Code Version

| Aspect | Claude Code Original | OpenClaw Adaptation |
|--------|---------------------|-------------------|
| Loop mechanism | Bash loop + Claude Code hooks | Iterative conversation turns |
| State management | Git commits + text files | Git commits + text files + SQLite |
| Context windows | Fresh each iteration | Persisted via PRD + progress files |
| Agent invocation | External Claude Code session | Native within OpenClaw session |
| Commands | `/ralph-*` slash commands | Natural language triggers |

## File Paths

- Skill root: `/data/workspace/skills/ralph-marketer/`
- Database scripts: `scripts/db/`
- Templates: `templates/`
- Tests: `scripts/test.js`
