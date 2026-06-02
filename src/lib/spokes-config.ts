import type { SpokeConfig } from './types'

export const SPOKES_CONFIG: Record<string, SpokeConfig> = {
  unique: {
    slug: 'unique',
    title: 'Unique Stays',
    tagline: 'Sleep somewhere extraordinary.',
    description:
      'Treehouses, geodesic domes, lighthouses, cave dwellings, and architectural wonders. The stays that make your jaw drop.',
    heroEmoji: '🌲',
    accentColor: 'oklch(0.55 0.14 38)',
    accentColorLight: 'oklch(0.93 0.025 75)',
    heroImage:
      'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/spokes/unique.jpg',
    stats: [
      { value: '400+', label: 'Curated Stays' },
      { value: '48', label: 'States' },
      { value: '10', label: 'Categories' },
    ],
    filterLabel: 'Category',
    externalDomain: 'uniquestaysusa.com',
    seoTitle: 'Unique Stays USA — Treehouses, Domes, Lighthouses & More',
    seoDescription:
      'Discover the most extraordinary short-term rentals in America. Curated treehouses, geodesic domes, cave dwellings, lighthouses, and more on Airbnb, VRBO, and Wander.',
  },
  'work-friendly': {
    slug: 'work-friendly',
    title: 'Work-Friendly Stays',
    tagline: 'Your office with a view.',
    description:
      'WiFi-verified, desk-equipped, distraction-free. The best remote work retreats across America — for solo nomads and team off-sites alike.',
    heroEmoji: '💻',
    accentColor: 'oklch(0.45 0.12 250)',
    accentColorLight: 'oklch(0.93 0.025 250)',
    heroImage: 'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/spokes/work-friendly.jpg',
    stats: [
      { value: '150+', label: 'Verified Stays' },
      { value: '100+', label: 'Mbps Avg WiFi' },
      { value: '38', label: 'States' },
    ],
    filterLabel: 'WiFi Speed',
    externalDomain: 'workfriendlystays.com',
    seoTitle: 'Work-Friendly Stays USA — Remote Work Vacation Rentals',
    seoDescription:
      'Find the best remote work vacation rentals in America. WiFi-verified, desk-equipped stays on Airbnb, VRBO, and Wander. Perfect for digital nomads and team retreats.',
  },
  'pet-friendly': {
    slug: 'pet-friendly',
    title: 'Pet-Friendly Stays',
    tagline: 'The whole family is invited.',
    description:
      'Fenced yards, dog wash stations, pet beds, and trails. Stays that genuinely welcome your furry co-pilots — not just tolerate them.',
    heroEmoji: '🐾',
    accentColor: 'oklch(0.50 0.14 145)',
    accentColorLight: 'oklch(0.93 0.025 145)',
    heroImage:
      'https://pub-b693088e04e14696a9caf041d4221a3a.r2.dev/spokes/pet-friendly.jpg',
    stats: [
      { value: '200+', label: 'Pet-Friendly Stays' },
      { value: '40+', label: 'States' },
      { value: '0', label: 'Size Restrictions*' },
    ],
    filterLabel: 'Pet Type',
    externalDomain: 'stayswithpets.com',
    seoTitle: 'Pet-Friendly Stays USA — Dog & Cat-Friendly Vacation Rentals',
    seoDescription:
      'The best pet-friendly vacation rentals in America. Fenced yards, dog wash stations, and trails. Find stays that truly welcome your pets on Airbnb and VRBO.',
  },
  'rv-ready': {
    slug: 'rv-ready',
    title: 'RV-Ready Stays',
    tagline: 'Hook up. Kick back. Explore.',
    description:
      'Full hookups (30 & 50-amp), pull-through sites, and scenic locations for your rig. From desert ranches to coastal cliffs — the best RV stays in America.',
    heroEmoji: '🚐',
    accentColor: 'oklch(0.50 0.14 60)',
    accentColorLight: 'oklch(0.93 0.025 60)',
    heroImage: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1920&q=85&fm=jpg&crop=entropy&cs=srgb&fit=crop',
    stats: [
      { value: '120+', label: 'RV Sites' },
      { value: '35', label: 'States' },
      { value: '60ft', label: 'Max Rig Length' },
    ],
    filterLabel: 'Hookup Type',
    externalDomain: 'rvreadystays.com',
    seoTitle: 'RV-Ready Stays USA — Full Hookup RV Sites & Campgrounds',
    seoDescription:
      'Find the best RV hookup sites across America. Full hookups (30 & 50-amp), pull-through sites, and scenic locations. From desert ranches to coastal cliffs.',
  },
  'ev-ready': {
    slug: 'ev-ready',
    title: 'EV-Ready Stays',
    tagline: 'Charge up. Drive further.',
    description:
      'Level 2 chargers, Tesla Wall Connectors, and EV-friendly hosts. The only directory of vacation rentals verified to have on-site EV charging.',
    heroEmoji: '⚡',
    accentColor: 'oklch(0.50 0.14 200)',
    accentColorLight: 'oklch(0.93 0.025 200)',
    heroImage: '/spokes/ev-ready.webp',
    stats: [
      { value: '90+', label: 'EV-Verified Stays' },
      { value: '32', label: 'States' },
      { value: 'L2+', label: 'Charger Level' },
    ],
    filterLabel: 'Charger Type',
    externalDomain: 'evreadystays.com',
    seoTitle: 'EV-Ready Stays USA — Vacation Rentals with EV Charging',
    seoDescription:
      'The only curated directory of vacation rentals with on-site EV charging. Level 2, Tesla Wall Connectors, and more. Find EV-friendly Airbnb and VRBO stays.',
  },
}

export const SPOKE_SLUGS = ['unique', 'work-friendly', 'pet-friendly', 'rv-ready', 'ev-ready'] as const
export type SpokeSlug = (typeof SPOKE_SLUGS)[number]
