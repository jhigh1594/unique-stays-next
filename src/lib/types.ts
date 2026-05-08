export type NormalizedStay = {
  id: number
  slug: string
  title: string
  subtitle: string
  location: string
  state: string
  region: string
  category: string
  spokes: string[]
  platform: 'Airbnb' | 'VRBO' | 'Wander' | 'Direct'
  affiliateUrl: string
  imageUrl: string
  price: number
  rating: number | null
  reviewCount: number | null
  sleeps: number
  bedrooms: number
  description: string
  tags: string[]
  featured: boolean
  editorsPick: boolean
  isNew: boolean
  wifiSpeed: string
  hasDesk: boolean
  petFriendly: boolean
  petPolicy: string
  rvHookup: boolean
  rvDetails: string
  evCharger: boolean
  evDetails: string
}

export type SpokeStatItem = {
  value: string
  label: string
}

export type SpokeConfig = {
  slug: string
  title: string
  tagline: string
  description: string
  heroEmoji: string
  accentColor: string
  accentColorLight: string
  heroImage: string
  stats: SpokeStatItem[]
  filterLabel: string
  externalDomain: string
  seoTitle: string
  seoDescription: string
}
