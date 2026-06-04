import { describe, expect, it } from 'vitest'
import { calculateBuildCost, normalizeBuildCostInput } from '../calculator'

describe('calculateBuildCost', () => {
  it('makes treehouses more expensive and slower to repay than yurts with similar inputs', () => {
    const treehouse = calculateBuildCost({
      structureType: 'treehouse',
      squareFeet: 420,
      region: 'South',
      finishLevel: 'guest-ready',
      siteComplexity: 'moderate',
      nightlyRate: 260,
    })
    const yurt = calculateBuildCost({
      structureType: 'yurt',
      squareFeet: 420,
      region: 'South',
      finishLevel: 'guest-ready',
      siteComplexity: 'moderate',
      nightlyRate: 260,
    })

    expect(treehouse.totalBuildCost.low).toBeGreaterThan(yurt.totalBuildCost.low)
    expect(treehouse.paybackYears.high).toBeGreaterThan(yurt.paybackYears.high)
  })

  it('applies region, finish, and site multipliers to the build range', () => {
    const simple = calculateBuildCost({
      structureType: 'dome',
      squareFeet: 520,
      region: 'Midwest',
      finishLevel: 'lean',
      siteComplexity: 'simple',
    })
    const complex = calculateBuildCost({
      structureType: 'dome',
      squareFeet: 520,
      region: 'West',
      finishLevel: 'premium',
      siteComplexity: 'difficult',
    })

    expect(complex.hardCost.low).toBeGreaterThan(simple.hardCost.low)
    expect(complex.hardCost.high).toBeGreaterThan(simple.hardCost.high)
  })

  it('keeps revenue and cost fields internally consistent', () => {
    const result = calculateBuildCost({
      structureType: 'a-frame',
      squareFeet: 700,
      region: 'Northeast',
      finishLevel: 'premium',
      siteComplexity: 'moderate',
      nightlyRate: 400,
      includeFinancing: true,
    })

    expect(result.totalBuildCost.low).toBe(
      result.hardCost.low + result.permitsAndDesign.low + result.furnishings.low + result.contingency.low,
    )
    expect(result.totalBuildCost.high).toBe(
      result.hardCost.high + result.permitsAndDesign.high + result.furnishings.high + result.contingency.high,
    )
    expect(result.annualGrossRevenue).toBeGreaterThan(result.annualOperatingCost)
    expect(result.annualFinancingCost).toBeGreaterThan(0)
    expect(result.annualNetRevenue).toBe(
      result.annualGrossRevenue - result.annualOperatingCost - result.annualFinancingCost,
    )
  })

  it('normalizes invalid or out-of-range inputs into usable defaults', () => {
    const input = normalizeBuildCostInput({
      structureType: 'castle' as any,
      squareFeet: 5000,
      region: 'Nowhere' as any,
      finishLevel: 'gold' as any,
      siteComplexity: 'mudslide' as any,
      nightlyRate: 5000,
    })

    expect(input.structureType).toBe('treehouse')
    expect(input.region).toBe('South')
    expect(input.finishLevel).toBe('guest-ready')
    expect(input.siteComplexity).toBe('moderate')
    expect(input.squareFeet).toBe(1600)
    expect(input.nightlyRate).toBe(1200)
  })
})
