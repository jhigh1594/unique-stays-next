export const STRUCTURE_TYPES = [
  'treehouse',
  'dome',
  'yurt',
  'a-frame',
  'tiny-house',
  'cabin',
  'glamping-tent',
] as const

export const FINISH_LEVELS = ['lean', 'guest-ready', 'premium'] as const
export const SITE_COMPLEXITIES = ['simple', 'moderate', 'difficult'] as const
export const BUILD_REGIONS = ['West', 'Southwest', 'South', 'Midwest', 'Northeast', 'Southeast'] as const

export type StructureType = (typeof STRUCTURE_TYPES)[number]
export type FinishLevel = (typeof FINISH_LEVELS)[number]
export type SiteComplexity = (typeof SITE_COMPLEXITIES)[number]
export type BuildRegion = (typeof BUILD_REGIONS)[number]

export interface BuildCostInput {
  structureType: StructureType
  squareFeet: number
  region: BuildRegion
  finishLevel: FinishLevel
  siteComplexity: SiteComplexity
  nightlyRate?: number
  includeFinancing?: boolean
}

export interface CostRange {
  low: number
  high: number
}

export interface StructureCostProfile {
  label: string
  description: string
  baseSquareFeet: number
  costPerSquareFoot: CostRange
  nightlyRate: CostRange
  occupancyRate: number
  operatingExpenseRate: number
  permitAndDesignRate: number
  furnishingRate: number
  contingencyRate: number
  buildNotes: string[]
}

export interface BuildCostResult {
  input: BuildCostInput
  structure: StructureCostProfile
  hardCost: CostRange
  permitsAndDesign: CostRange
  furnishings: CostRange
  contingency: CostRange
  totalBuildCost: CostRange
  projectedNightlyRate: number
  annualGrossRevenue: number
  annualOperatingCost: number
  annualFinancingCost: number
  annualNetRevenue: number
  paybackYears: CostRange
  confidence: 'early sketch' | 'planning range' | 'builder-ready range'
  recommendation: string
  checklist: string[]
}
