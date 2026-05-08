export const CATEGORIES_CONFIG = [
  { id: 'treehouses', emoji: '🌲', label: 'Treehouses' },
  { id: 'geodesic-domes', emoji: '🔮', label: 'Geodesic Domes' },
  { id: 'houseboats', emoji: '⛵', label: 'Houseboats' },
  { id: 'lighthouses', emoji: '🏮', label: 'Lighthouses' },
  { id: 'converted-barns', emoji: '🏚️', label: 'Converted Barns' },
  { id: 'cave-dwellings', emoji: '🪨', label: 'Cave Dwellings' },
  { id: 'a-frame-cabins', emoji: '🏔️', label: 'A-Frame Cabins' },
  { id: 'tiny-homes', emoji: '🏡', label: 'Tiny Homes' },
  { id: 'glamping', emoji: '⛺', label: 'Glamping' },
  { id: 'castles-estates', emoji: '🏰', label: 'Castles & Estates' },
] as const

export type CategoryId = typeof CATEGORIES_CONFIG[number]['id']
export type CategoryConfig = { id: string; emoji: string; label: string; count: number }
