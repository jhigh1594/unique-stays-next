import Database from 'better-sqlite3';

const db = new Database('./data/content.db');

// Clear existing data
const tables = [
  'agent_log', 'published', 'critique_results', 'drafts', 'content_plan',
  'content_ideas', 'research_briefs', 'content_patterns', 'voice_profile',
  'communications', 'research', 'trends', 'competitor_content', 'founder_content'
];
tables.forEach(t => {
  try { db.exec(`DELETE FROM ${t}`); } catch (e) {}
});

// ===========================================
// BRAND VOICE — UniqueStaysUSA
// "The Wanderer's Postcard Collection"
// ===========================================

const insertFounderContent = db.prepare(`
  INSERT INTO founder_content (source, title, content, url, engagement_score, analyzed)
  VALUES (?, ?, ?, ?, ?, FALSE)
`);

const founderContent = [
  {
    source: 'other',
    title: 'About Page — We believe travel should make you feel alive',
    content: `Unique Stays USA was born from a simple frustration: too many boring places to stay, and too much time wasted finding the extraordinary ones. We fixed that.

We scour Airbnb, VRBO, Wander, and direct booking sites to find the stays that make you gasp. You shouldn't have to scroll for hours.

Not every treehouse makes the cut. We look for genuine "wow" factor — architectural uniqueness, stunning settings, and memorable experiences.

Every listing comes with honest context: what makes it special, who it's perfect for, and what to expect when you arrive.

We earn affiliate commissions when you book through our links. This never influences which stays we feature — only the extraordinary ones make it in.`,
    url: 'https://uniquestaysusa.com/about',
    engagement: 95
  },
  {
    source: 'other',
    title: 'Brand Personality Guidelines',
    content: `Brand personality: Wanderer · Editorial · Nostalgic

UniqueStaysUSA is "The Wanderer's Postcard Collection" — a curated travel editorial masquerading as a directory. The voice is warm, first-person, slightly literary.

Visual language draws on analog travel artifacts: polaroids, postage stamps, filmstrips, grain, compass needles. Think Kinfolk meets Monocle meets a dog-eared travel journal.

Colors: Terracotta (#A84626), cream, forest green, warm charcoal, sand.
Typography: Fraunces (serif display) + Plus Jakarta Sans (body).
Anti-references: generic agency sites, dark-mode SaaS, neon gradients, AI-slop stock imagery.`,
    url: 'https://uniquestaysusa.com',
    engagement: 100
  },
  {
    source: 'other',
    title: 'Stay Card — Example Listing Voice',
    content: `Title: "Catskills Pine Treehouse"
Subtitle: "40 feet up in the canopy"
Location: Woodstock, New York
Description: "A hand-crafted treehouse suspended among the pines. Wake to birdsong, fall asleep to wind through the branches. The wood-burning stove keeps it cozy year-round, and the stargazing deck is the reason you'll extend your stay."

Tags: Stargazing Deck, Wood-Burning Stove, Off-Grid Feel
Price: From $285/night
Rating: 4.9 (142 reviews)`,
    url: 'https://uniquestaysusa.com/stays/treehouse-catskills-pine',
    engagement: 88
  }
];

founderContent.forEach(c => insertFounderContent.run(
  c.source, c.title, c.content, c.url, c.engagement
));

// ===========================================
// VOICE PROFILE — UniqueStaysUSA
// ===========================================
db.prepare(`
  INSERT INTO voice_profile (
    profile_name, tone, formality, sentence_patterns, paragraph_style,
    signature_phrases, hook_patterns, data_usage_style, storytelling_style,
    cta_style, controversial_tendency, emoji_usage, vocabulary_notes, avoid_patterns
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'uniquestaysusa',
  'Warm, editorial, slightly literary — like a well-traveled friend writing a postcard',
  'Casual but polished — conversational with intentional word choices',
  JSON.stringify([
    'Short evocative sentences for setting scenes',
    'Second person ("you") to invite the reader in',
    'Sensory details — sound, light, texture',
    'One-line paragraphs for emphasis',
    'Questions that spark wanderlust'
  ]),
  'Short paragraphs (2-3 sentences), generous whitespace, rhythm of prose like a travel essay',
  JSON.stringify([
    "make you feel alive",
    "the kind of place that...",
    "you shouldn't have to scroll for hours",
    "genuine wow factor",
    "this one makes the cut because",
    "here's what to expect"
  ]),
  JSON.stringify([
    'Sensory opening — paint the scene first',
    'Contrast (boring vs extraordinary)',
    'Specific detail that triggers imagination ("40 feet up in the canopy")',
    'Direct address to the traveler'
  ]),
  'Uses specifics (price, rating, review count) to build trust. Numbers are always honest, never exaggerated.',
  'Travel vignettes — brief moments that make you want to be there. Never generic "imagine yourself" fluff.',
  'Invitation, not hard sell. "Book through our link" framed as trust, not transaction.',
  'Mild — opinionated about what makes a stay extraordinary, but warm about it.',
  'None — text-only, clean editorial feel',
  JSON.stringify([
    'Travel vocabulary: canopy, birdsong, stargazing, off-grid, hand-crafted',
    'Evocative adjectives: extraordinary, stunning, memorable',
    'Directional: curated, vetted, scoured, hand-picked',
    'Honest qualifiers: "what to expect", "here\'s the trade-off"'
  ]),
  JSON.stringify([
    '"Nestled in..." (cliché)',
    '"Escape the ordinary" (overused)',
    '"Your dream vacation awaits" (generic)',
    'Exclamation marks (editorial voice doesn\'t need them)',
    'AI patterns: "In today\'s world", "It\'s important to note", "Whether you\'re looking for"',
    'Stock photo vibes in text',
    'Hard sell language'
  ])
);

// ===========================================
// COMPETITOR ANALYSIS
// ===========================================
const insertCompetitor = db.prepare(`
  INSERT INTO competitor_content (competitor_name, title, url, summary, angle, engagement_notes, gap_opportunity)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const competitors = [
  {
    name: 'Airbnb Categories',
    title: 'Airbnb Categories — Treehouses, A-frames, etc.',
    url: 'https://www.airbnb.com/categories',
    summary: 'Airbnb has category pages for unique stays, but they\'re algorithmic, not curated. No editorial voice.',
    angle: 'Platform-native, no personality, no context beyond listing data',
    engagement: 'High traffic but low trust — users know it\'s algorithmic',
    gap: 'No editorial voice, no honest context, no "who is this perfect for" guidance. Opportunity: Curation + editorial + honesty'
  },
  {
    name: 'GlampingHub',
    title: 'Glamping Hub — Unique Outdoor Stays',
    url: 'https://glampinghub.com',
    summary: 'Glamping-focused directory with decent UX but thin editorial. Feels like a search engine, not a magazine.',
    angle: 'Broad inventory, low editorial quality',
    engagement: 'Moderate — good SEO but forgettable brand',
    gap: 'No strong brand voice. No postcard/editorial feel. All listings, no story. Opportunity: Brand personality + storytelling'
  },
  {
    name: 'Dirt',
    title: 'Dirt — Beautiful Vacation Rentals',
    url: 'https://www.dirt.love',
    summary: 'Design-forward curation of vacation rentals. Strong aesthetic, good taste, but limited scope and no regional depth.',
    angle: 'Design-first, Instagram-friendly, aspirational',
    engagement: 'Strong on social, but narrow audience',
    gap: 'Not US-focused. Not comprehensive by region. No hub-and-spoke model. Opportunity: Regional depth + multiple verticals'
  },
  {
    name: 'Travel blog roundups',
    title: '"Best Treehouses in the US" style posts',
    url: 'Various travel blogs',
    summary: 'Generic listicles with affiliate links. 10-20 picks, thin descriptions, stock-feeling photos.',
    angle: 'SEO-driven, quantity over quality',
    engagement: 'Decent organic traffic but zero brand loyalty',
    gap: 'No curation standard. No brand. No return visits. Opportunity: Brand trust + repeat visitors + editorial quality'
  }
];

competitors.forEach(c => insertCompetitor.run(
  c.name, c.title, c.url, c.summary, c.angle, c.engagement, c.gap
));

// ===========================================
// TRENDS
// ===========================================
const insertTrend = db.prepare(`
  INSERT INTO trends (topic, description, source, relevance_score, data_points, status)
  VALUES (?, ?, ?, ?, ?, 'active')
`);

const trends = [
  {
    topic: 'Experience Economy Shift to "Stays as Experiences"',
    description: 'Travelers increasingly choose accommodations BECAUSE of what they are, not just where they are. The stay IS the destination.',
    source: 'Airbnb 2025-2026 trend reports + STR industry data',
    relevance: 95,
    data: JSON.stringify([
      'Airbnb: "Categories" bookings grew 300%+ since launch',
      'Gen Z and Millennials: 72% say accommodation uniqueness is top-3 trip factor',
      '"Treehouse" searches on Airbnb up 140% YoY',
      'Average stay duration in unique properties: 2.3 nights vs 1.8 for standard'
    ])
  },
  {
    topic: 'Affiliate Content Commerce Boom',
    description: 'Content-driven affiliate sites outperforming pure directories. Editorial voice + curation = trust = conversions. Wirecutter model applied to travel.',
    source: 'Awin + Impact Radius affiliate industry reports',
    relevance: 90,
    data: JSON.stringify([
      'Travel affiliate market: $12B+ globally',
      'Content-commerce sites convert 3-5x higher than pure directories',
      'Editorial recommendations have 4.7x higher trust than ads',
      'Average travel affiliate commission: 3-8% of booking value'
    ])
  },
  {
    topic: 'Niche Directories Beating General Platforms',
    description: 'Vertical-specific directories gaining SEO ground against broad platforms. "Pet-friendly vacation rentals" outranks general booking sites for specific intent.',
    source: 'SEMrush + Ahrefs competitive data',
    relevance: 88,
    data: JSON.stringify([
      'Long-tail travel queries growing 25% YoY',
      '"Unique stays near [city]" searches up 180%',
      'Niche directories have 60% lower bounce rates than OTAs',
      'Hub-and-spoke SEO models showing 3x indexation efficiency'
    ])
  },
  {
    topic: 'Work-from-Anywhere Driving Extended Stays',
    description: 'Remote workers booking unique properties for 1-2 week "workcations." Need WiFi, desk space, and a view worth staying for.',
    source: 'Airbnb Work category data + remote work surveys',
    relevance: 85,
    data: JSON.stringify([
      '28-day+ stays: fastest growing segment on Airbnb',
      '68% of remote workers have taken a "workcation"',
      'WiFi quality is now top-3 booking factor (was top-10 in 2020)',
      'Work-friendly stays command 15-25% premium'
    ])
  },
  {
    topic: 'EV Travel Infrastructure Expanding',
    description: 'EV road trippers need destination charging. Properties with EV chargers becoming a booking differentiator, especially for rural/remote unique stays.',
    source: 'PlugShare data + DOE alternative fuels reports',
    relevance: 82,
    data: JSON.stringify([
      'US EV registrations: 12% of new vehicles (2026)',
      'Destination charging grew 45% YoY',
      'Properties with EV chargers see 18% higher booking rates',
      'EV road trips projected to double by 2028'
    ])
  }
];

trends.forEach(t => insertTrend.run(t.topic, t.description, t.source, t.relevance, t.data));

// ===========================================
// RESEARCH
// ===========================================
const insertResearch = db.prepare(`
  INSERT INTO research (title, summary, key_findings, data_points, sources, category, credibility_score, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
`);

const research = [
  {
    title: 'STR Affiliate Directory Performance Benchmarks',
    summary: 'How top-performing travel affiliate directories structure content, SEO, and monetization',
    findings: JSON.stringify([
      'Top directories publish 50-100 listing pages before monetizing',
      'Editorial descriptions of 150-300 words per listing perform best for SEO',
      'Hub pages (category/spoke) should be 800-1500 words with internal links',
      'Email capture at 2-5% conversion rate is realistic for travel directories',
      'Average RPM for travel affiliate content: $15-40'
    ]),
    data: JSON.stringify([
      { metric: 'Pages needed before SEO traction', value: '50-100' },
      { metric: 'Optimal listing description length', value: '150-300 words' },
      { metric: 'Hub page word count', value: '800-1500 words' },
      { metric: 'Email capture rate (realistic)', value: '2-5%' },
      { metric: 'Average RPM (travel affiliate)', value: '$15-40' }
    ]),
    sources: JSON.stringify(['Awin Publisher Reports', 'Affiliate Summit Data', 'SEMrush Travel Vertical Analysis']),
    category: 'affiliate_strategy',
    credibility: 80
  },
  {
    title: 'Unique Stay Categories by Search Volume',
    summary: 'Which unique stay types have the highest search demand and lowest competition',
    findings: JSON.stringify([
      'Treehouses: highest search volume, moderate competition',
      'A-frames: fast-growing trend, lower competition',
      'Yurts and geodomes: niche but passionate audience',
      'Caboose/train cars: very low competition, high novelty appeal',
      'Houseboats: strong regional demand (Northeast, Northwest)',
      'Shipping container homes: rising trend, urban + rural appeal'
    ]),
    data: JSON.stringify([
      { metric: 'Treehouse monthly searches (US)', value: '110K' },
      { metric: 'A-frame monthly searches (US)', value: '74K' },
      { metric: 'Yurt monthly searches (US)', value: '49K' },
      { metric: 'Geodome monthly searches (US)', value: '33K' },
      { metric: 'Houseboat monthly searches (US)', value: '40K' }
    ]),
    sources: JSON.stringify(['Google Keyword Planner', 'Ahrefs', 'SEMrush']),
    category: 'seo_research',
    credibility: 90
  }
];

research.forEach(r => insertResearch.run(
  r.title, r.summary, r.findings, r.data, r.sources, r.category, r.credibility
));

// ===========================================
// COMMUNICATIONS
// ===========================================
const insertComm = db.prepare(`
  INSERT INTO communications (type, title, details, key_messages, target_audience, priority, status)
  VALUES (?, ?, ?, ?, ?, ?, 'pending')
`);

const communications = [
  {
    type: 'announcement',
    title: 'Site Launch — UniqueStaysUSA.com',
    details: 'Launch of the curated unique vacation rental directory. 5 spokes (unique, work-friendly, pet-friendly, RV-ready, EV-ready) with ~250 listings at launch. Editorial voice, analog aesthetic, affiliate model.',
    messages: JSON.stringify([
      'Travel should make you feel alive — we find the stays that do',
      'Curated, not algorithmic — every listing hand-picked for genuine wow factor',
      '5 ways to find your next extraordinary stay',
      'Honest context: what makes it special, who it\'s for, what to expect'
    ]),
    audience: 'Curious travelers, adventure seekers, couples planning getaways, remote workers looking for workcations',
    priority: 1
  },
  {
    type: 'feature',
    title: 'AI Semantic Search Launch',
    details: 'New AI-powered search that understands intent, not just keywords. "Cozy treehouse for a romantic weekend" returns perfect matches instead of keyword soup.',
    messages: JSON.stringify([
      'Search like you think — describe the vibe, not just the location',
      'AI-powered discovery finds stays you didn\'t know to look for',
      'The first travel directory that understands "cozy" and "romantic" aren\'t just tags'
    ]),
    audience: 'Existing site visitors, travel tech enthusiasts, newsletter subscribers',
    priority: 2
  },
  {
    type: 'case_study',
    title: 'The Treehouse That Books Itself — How Curation Beats Algorithms',
    details: 'Story of a specific listing that performs 3x better on UniqueStaysUSA than on Airbnb, because editorial context + honest review drives trust and conversions.',
    messages: JSON.stringify([
      'Editorial curation converts 3x higher than algorithmic listing',
      'Honest context ("the stairs are steep but worth it") builds trust',
      'The right description turns a listing into a story'
    ]),
    audience: 'Travel content readers, potential affiliate partners, STR property owners',
    priority: 3
  }
];

communications.forEach(c => insertComm.run(
  c.type, c.title, c.details, c.messages, c.audience, c.priority
));

// ===========================================
// CONTENT PATTERNS
// ===========================================
const insertPattern = db.prepare(`
  INSERT INTO content_patterns (pattern_type, description, example, effectiveness_score)
  VALUES (?, ?, ?, ?)
`);

const patterns = [
  {
    type: 'hook',
    description: 'Sensory opening that places the reader in the scene',
    example: '"Wake to birdsong, 40 feet up in a canopy of pines. The coffee tastes different up here."',
    score: 95
  },
  {
    type: 'hook',
    description: 'Contrast between ordinary and extraordinary',
    example: '"Most hotel rooms look the same. This one hangs from a tree."',
    score: 90
  },
  {
    type: 'structure',
    description: 'Scene-setting → What makes it special → Who it\'s for → Honest context → Book it',
    example: 'Stay listing pattern: Paint the vibe → architectural uniqueness → ideal guest profile → trade-offs if any → affiliate CTA',
    score: 88
  },
  {
    type: 'angle',
    description: 'Honest vulnerability about trade-offs as trust builder',
    example: '"The stairs are steep. The WiFi is spotty. You won\'t care."',
    score: 92
  },
  {
    type: 'cta',
    description: 'Invitation framed as sharing, not selling',
    example: '"This one books out fast. Here\'s the link if you want it."',
    score: 85
  }
];

patterns.forEach(p => insertPattern.run(p.type, p.description, p.example, p.score));

// Log
db.prepare(`INSERT INTO agent_log (phase, action, details) VALUES (?, ?, ?)`).run(
  'discover',
  'database_seeded_uniquestaysusa',
  JSON.stringify({
    founder_content: founderContent.length,
    voice_profile: 'uniquestaysusa',
    competitors: competitors.length,
    trends: trends.length,
    research: research.length,
    communications: communications.length,
    patterns: patterns.length
  })
);

console.log('✅ Database seeded for UniqueStaysUSA:');
console.log(`   - ${founderContent.length} brand voice samples`);
console.log(`   - 1 voice profile: "The Wanderer's Postcard Collection"`);
console.log(`   - ${competitors.length} competitor analyses`);
console.log(`   - ${trends.length} travel/affiliate market trends`);
console.log(`   - ${research.length} research studies`);
console.log(`   - ${communications.length} content communications`);
console.log(`   - ${patterns.length} content patterns`);

db.close();
