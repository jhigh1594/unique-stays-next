import type {
  BuildCostInput,
  BuildCostResult,
  BuildRegion,
  CostRange,
  FinishLevel,
  SiteComplexity,
  StructureCostProfile,
  StructureType,
} from './types'
import { BUILD_REGIONS, FINISH_LEVELS, SITE_COMPLEXITIES, STRUCTURE_TYPES } from './types'

const STRUCTURE_PROFILES: Record<StructureType, StructureCostProfile> = {
  treehouse: {
    label: 'Treehouse',
    description: 'An elevated, permit-sensitive build with engineering, access, and utility complexity.',
    baseSquareFeet: 420,
    costPerSquareFoot: { low: 420, high: 820 },
    nightlyRate: { low: 285, high: 560 },
    occupancyRate: 0.56,
    operatingExpenseRate: 0.38,
    permitAndDesignRate: 0.18,
    furnishingRate: 0.12,
    contingencyRate: 0.18,
    buildNotes: [
      'Budget for arborist review, structural engineering, and specialized foundations.',
      'Guest access, railings, lighting, and weatherproofing carry more cost than the square footage suggests.',
    ],
  },
  dome: {
    label: 'Geodesic Dome',
    description: 'A high-photo-impact structure with moderate shell cost and careful insulation needs.',
    baseSquareFeet: 520,
    costPerSquareFoot: { low: 230, high: 430 },
    nightlyRate: { low: 210, high: 410 },
    occupancyRate: 0.53,
    operatingExpenseRate: 0.34,
    permitAndDesignRate: 0.12,
    furnishingRate: 0.11,
    contingencyRate: 0.14,
    buildNotes: [
      'The shell can be efficient, but HVAC, condensation control, and platform work deserve real budget.',
      'Dramatic glazing improves bookings but raises both build and climate-control costs.',
    ],
  },
  yurt: {
    label: 'Yurt',
    description: 'A lighter glamping build with strong ROI when utilities and bath access stay simple.',
    baseSquareFeet: 420,
    costPerSquareFoot: { low: 105, high: 240 },
    nightlyRate: { low: 135, high: 265 },
    occupancyRate: 0.48,
    operatingExpenseRate: 0.32,
    permitAndDesignRate: 0.08,
    furnishingRate: 0.14,
    contingencyRate: 0.12,
    buildNotes: [
      'Decking, bath access, heating, and road access usually matter more than the yurt kit price.',
      'Seasonality can be sharp unless the insulation and heating package is guest-ready.',
    ],
  },
  'a-frame': {
    label: 'A-Frame',
    description: 'A cabin-like build with strong traveler recognition and broad financing familiarity.',
    baseSquareFeet: 700,
    costPerSquareFoot: { low: 245, high: 480 },
    nightlyRate: { low: 220, high: 430 },
    occupancyRate: 0.54,
    operatingExpenseRate: 0.35,
    permitAndDesignRate: 0.11,
    furnishingRate: 0.10,
    contingencyRate: 0.13,
    buildNotes: [
      'Steep rooflines help the story and weather performance, but loft stairs and glazing need careful planning.',
      'A-frames tend to comp well against cabins, which can make lender and permit conversations easier.',
    ],
  },
  'tiny-house': {
    label: 'Tiny House',
    description: 'A compact stay where utility hookups, delivery, and zoning are the major swing factors.',
    baseSquareFeet: 320,
    costPerSquareFoot: { low: 185, high: 360 },
    nightlyRate: { low: 155, high: 295 },
    occupancyRate: 0.50,
    operatingExpenseRate: 0.33,
    permitAndDesignRate: 0.09,
    furnishingRate: 0.12,
    contingencyRate: 0.12,
    buildNotes: [
      'Prefab pricing rarely includes land work, utility runs, delivery, skirting, decks, and guest-ready exterior space.',
      'The best returns come from strong outdoor amenities because the interior footprint is naturally constrained.',
    ],
  },
  cabin: {
    label: 'Cabin',
    description: 'The most familiar build type, with lower novelty risk and a wider contractor pool.',
    baseSquareFeet: 760,
    costPerSquareFoot: { low: 225, high: 430 },
    nightlyRate: { low: 190, high: 365 },
    occupancyRate: 0.51,
    operatingExpenseRate: 0.34,
    permitAndDesignRate: 0.10,
    furnishingRate: 0.10,
    contingencyRate: 0.12,
    buildNotes: [
      'Cabins are easier to comp, but the design needs a clear hook to avoid commodity pricing.',
      'Invest early in windows, porch experience, and a durable cleaning flow.',
    ],
  },
  'glamping-tent': {
    label: 'Glamping Tent',
    description: 'A fast-to-market stay with excellent test potential and stronger replacement-cycle risk.',
    baseSquareFeet: 300,
    costPerSquareFoot: { low: 75, high: 180 },
    nightlyRate: { low: 110, high: 225 },
    occupancyRate: 0.44,
    operatingExpenseRate: 0.31,
    permitAndDesignRate: 0.07,
    furnishingRate: 0.16,
    contingencyRate: 0.11,
    buildNotes: [
      'The platform, bathhouse, heating, and weather plan are the real budget drivers.',
      'Plan for canvas maintenance and replacement, especially in humid or high-wind regions.',
    ],
  },
}

const REGION_MULTIPLIER: Record<BuildRegion, number> = {
  West: 1.18,
  Southwest: 1.03,
  South: 0.94,
  Midwest: 0.92,
  Northeast: 1.14,
  Southeast: 0.98,
}

const FINISH_MULTIPLIER: Record<FinishLevel, number> = {
  lean: 0.84,
  'guest-ready': 1,
  premium: 1.24,
}

const SITE_MULTIPLIER: Record<SiteComplexity, number> = {
  simple: 0.9,
  moderate: 1,
  difficult: 1.22,
}

const FINANCING_RATE = 0.085
const FINANCING_SHARE = 0.7

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === 'string' && options.includes(value)
}

function roundTo(value: number, increment: number): number {
  return Math.round(value / increment) * increment
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high)
}

function scaleRange(range: CostRange, multiplier: number, increment = 1000): CostRange {
  return {
    low: roundTo(range.low * multiplier, increment),
    high: roundTo(range.high * multiplier, increment),
  }
}

function addRanges(...ranges: CostRange[]): CostRange {
  return ranges.reduce(
    (total, range) => ({ low: total.low + range.low, high: total.high + range.high }),
    { low: 0, high: 0 },
  )
}

export function normalizeBuildCostInput(input: Partial<BuildCostInput>): BuildCostInput {
  const structureType = isOneOf(input.structureType, STRUCTURE_TYPES) ? input.structureType : 'treehouse'
  const region = isOneOf(input.region, BUILD_REGIONS) ? input.region : 'South'
  const finishLevel = isOneOf(input.finishLevel, FINISH_LEVELS) ? input.finishLevel : 'guest-ready'
  const siteComplexity = isOneOf(input.siteComplexity, SITE_COMPLEXITIES)
    ? input.siteComplexity
    : 'moderate'
  const profile = STRUCTURE_PROFILES[structureType]

  return {
    structureType,
    region,
    finishLevel,
    siteComplexity,
    squareFeet: clamp(Math.round(Number(input.squareFeet) || profile.baseSquareFeet), 120, 1600),
    nightlyRate:
      input.nightlyRate && Number.isFinite(input.nightlyRate)
        ? clamp(Math.round(input.nightlyRate), 75, 1200)
        : undefined,
    includeFinancing: Boolean(input.includeFinancing),
  }
}

export function calculateBuildCost(rawInput: Partial<BuildCostInput>): BuildCostResult {
  const input = normalizeBuildCostInput(rawInput)
  const structure = STRUCTURE_PROFILES[input.structureType]
  const sizeMultiplier = input.squareFeet / structure.baseSquareFeet
  const totalMultiplier =
    sizeMultiplier *
    REGION_MULTIPLIER[input.region] *
    FINISH_MULTIPLIER[input.finishLevel] *
    SITE_MULTIPLIER[input.siteComplexity]

  const hardCost = scaleRange(
    {
      low: structure.costPerSquareFoot.low * structure.baseSquareFeet,
      high: structure.costPerSquareFoot.high * structure.baseSquareFeet,
    },
    totalMultiplier,
  )
  const permitsAndDesign = scaleRange(hardCost, structure.permitAndDesignRate)
  const furnishings = scaleRange(hardCost, structure.furnishingRate)
  const contingency = scaleRange(hardCost, structure.contingencyRate)
  const totalBuildCost = addRanges(hardCost, permitsAndDesign, furnishings, contingency)
  const projectedNightlyRate =
    input.nightlyRate ?? roundTo((structure.nightlyRate.low + structure.nightlyRate.high) / 2, 5)
  const annualGrossRevenue = roundTo(projectedNightlyRate * 365 * structure.occupancyRate, 100)
  const annualOperatingCost = roundTo(annualGrossRevenue * structure.operatingExpenseRate, 100)
  const annualFinancingCost = input.includeFinancing
    ? roundTo(((totalBuildCost.low + totalBuildCost.high) / 2) * FINANCING_SHARE * FINANCING_RATE, 100)
    : 0
  const annualNetRevenue = Math.max(0, annualGrossRevenue - annualOperatingCost - annualFinancingCost)
  const paybackYears =
    annualNetRevenue > 0
      ? {
          low: Number((totalBuildCost.low / annualNetRevenue).toFixed(1)),
          high: Number((totalBuildCost.high / annualNetRevenue).toFixed(1)),
        }
      : { low: 99, high: 99 }

  return {
    input,
    structure,
    hardCost,
    permitsAndDesign,
    furnishings,
    contingency,
    totalBuildCost,
    projectedNightlyRate,
    annualGrossRevenue,
    annualOperatingCost,
    annualFinancingCost,
    annualNetRevenue,
    paybackYears,
    confidence: input.nightlyRate ? 'planning range' : 'early sketch',
    recommendation: buildRecommendation(input, paybackYears, annualNetRevenue),
    checklist: buildChecklist(input),
  }
}

export function getStructureProfiles(): Record<StructureType, StructureCostProfile> {
  return STRUCTURE_PROFILES
}

function buildRecommendation(input: BuildCostInput, paybackYears: CostRange, annualNetRevenue: number): string {
  if (annualNetRevenue <= 0) {
    return 'Treat this as a concept budget until financing or operating costs come down.'
  }

  if (paybackYears.high <= 5.5) {
    return 'This is a strong early ROI shape. Validate zoning and two local comps before pricing builders.'
  }

  if (input.structureType === 'treehouse' || input.siteComplexity === 'difficult') {
    return 'The story is compelling, but the build is sensitive. Price engineering, access, and utilities before trusting the upside.'
  }

  return 'This looks plausible as a host project. Tighten the nightly-rate assumption with nearby unique stay comps.'
}

function buildChecklist(input: BuildCostInput): string[] {
  const checklist = [
    'Confirm zoning, STR rules, and whether this structure needs a building permit.',
    'Gather three comparable nightly rates within a two-hour drive.',
    'Ask builders to separate shell, site work, utilities, furnishings, and contingency.',
  ]

  if (input.siteComplexity === 'difficult') {
    checklist.push('Walk the site with a contractor before buying plans or kits.')
  }

  if (input.structureType === 'treehouse') {
    checklist.push('Add an arborist and structural engineer to the first estimate round.')
  }

  if (input.includeFinancing) {
    checklist.push('Model debt service separately from operating expenses before deciding on premium finishes.')
  }

  return checklist
}
