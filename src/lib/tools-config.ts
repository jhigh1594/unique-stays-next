export type ToolConfig = {
  slug: string
  title: string
  description: string
  stamp: string
  iconName: string
  seoTitle: string
  seoDescription: string
}

export const TOOLS: ToolConfig[] = [
  {
    slug: 'listing-generator',
    title: 'Listing Description Generator',
    description: 'Turn rough notes into a more bookable stay story.',
    stamp: 'WRITE',
    iconName: 'PenLine',
    seoTitle: 'Free Listing Description Generator — Unique Stays USA',
    seoDescription:
      'Turn rough notes into a polished, bookable listing description. Free AI-powered tool for Airbnb, VRBO, and vacation rental hosts.',
  },
  {
    slug: 'build-cost-calculator',
    title: 'Build Cost Calculator',
    description: 'Estimate the real budget for cabins, domes, and glampsites.',
    stamp: 'COST',
    iconName: 'Calculator',
    seoTitle: 'Vacation Rental Build Cost Calculator — Unique Stays USA',
    seoDescription:
      'Estimate construction costs for cabins, domes, glampsites, and unique vacation rentals. Free budget calculator for hosts and developers.',
  },
  {
    slug: 'unique-score',
    title: 'Listing Score Checker',
    description: 'See how distinctive your stay feels to a traveler.',
    stamp: 'SCORE',
    iconName: 'BadgeCheck',
    seoTitle: 'Listing Score Checker — How Unique Is Your Stay? — Unique Stays USA',
    seoDescription:
      'Score your vacation rental listing for uniqueness. See how distinctive your stay feels to travelers and get tips to stand out.',
  },
  {
    slug: 'vacation-quiz',
    title: 'Vacation Match Quiz',
    description: 'Find the kind of escape your next trip is asking for.',
    stamp: 'QUIZ',
    iconName: 'Compass',
    seoTitle: 'Vacation Match Quiz — Find Your Perfect Getaway — Unique Stays USA',
    seoDescription:
      'Answer a few questions and discover what kind of vacation escape you actually need. Free personality-based trip matcher.',
  },
]

export const TOOL_SLUGS = TOOLS.map((t) => t.slug) as string[]
