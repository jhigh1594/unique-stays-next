export const CATEGORIES_CONFIG = [
  { id: 'Treehouses', emoji: '🌲', label: 'Treehouses' },
  { id: 'Geodesic Domes', emoji: '🔮', label: 'Geodesic Domes' },
  { id: 'Houseboats', emoji: '⛵', label: 'Houseboats' },
  { id: 'Lighthouses', emoji: '🏮', label: 'Lighthouses' },
  { id: 'Converted Barns', emoji: '🏚️', label: 'Converted Barns' },
  { id: 'Cave Dwellings', emoji: '🪨', label: 'Cave Dwellings' },
  { id: 'A-Frame Cabins', emoji: '🏔️', label: 'A-Frame Cabins' },
  { id: 'Tiny Homes', emoji: '🏡', label: 'Tiny Homes' },
  { id: 'Glamping', emoji: '⛺', label: 'Glamping' },
  { id: 'Castles & Estates', emoji: '🏰', label: 'Castles & Estates' },
] as const

export type CategoryId = typeof CATEGORIES_CONFIG[number]['id']
export type CategoryConfig = { id: string; emoji: string; label: string; count: number }
