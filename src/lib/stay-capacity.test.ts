import { describe, expect, it } from 'vitest'
import {
  formatCapacitySummary,
  parseCapacityFromText,
  resolveStayCapacity,
} from './stay-capacity'

describe('parseCapacityFromText', () => {
  it('parses compact VRBO overview lines', () => {
    expect(
      parseCapacityFromText('See all 186 reviews\n3 bedrooms3+ bathroomsSleeps 11'),
    ).toEqual({ bedrooms: 3, bathrooms: 3, sleeps: 11 })
  })

  it('parses spaced VRBO overview lines', () => {
    expect(
      parseCapacityFromText('See all 2 reviews\n1 bedroom1 bathroomSleeps 6'),
    ).toEqual({ bedrooms: 1, bathrooms: 1, sleeps: 6 })
  })

  it('does not treat sq ft digits as part of sleeps count', () => {
    expect(
      parseCapacityFromText('1 bedroom1 bathroomSleeps 61000 sq ft'),
    ).toEqual({ bedrooms: 1, bathrooms: 1, sleeps: 6 })
  })

  it('parses Airbnb bullet layout', () => {
    expect(
      parseCapacityFromText(
        'Entire cabin in Leavenworth, Washington\n1 bedroom · 1 king bed · 2 baths\nSleeps 2',
      ),
    ).toEqual({ bedrooms: 1, bathrooms: 2, sleeps: 2 })
  })

  it('parses numbered Airbnb facts', () => {
    expect(
      parseCapacityFromText('1. 2 guests\n2. 1 bedroom\n3. 1 bed\n4. 1 bath'),
    ).toEqual({ bedrooms: 1, bathrooms: 1, sleeps: 2 })
  })
})

describe('resolveStayCapacity', () => {
  it('replaces scrape-failure defaults from description text', () => {
    expect(
      resolveStayCapacity({
        bedrooms: 0,
        bathrooms: 1,
        sleeps: 1,
        description: 'See all 186 reviews\n3 bedrooms3+ bathroomsSleeps 11',
      }),
    ).toEqual({ bedrooms: 3, bathrooms: 3, sleeps: 11 })
  })

  it('fills missing bedrooms without clobbering valid sleeps', () => {
    expect(
      resolveStayCapacity({
        bedrooms: 0,
        bathrooms: 1,
        sleeps: 2,
        description: '2. 1 bedroom\n4. 1 bath',
      }),
    ).toEqual({ bedrooms: 1, bathrooms: 1, sleeps: 2 })
  })

  it('keeps good stored values', () => {
    expect(
      resolveStayCapacity({
        bedrooms: 1,
        bathrooms: 1,
        sleeps: 2,
        description: '1 bedroom · 1 king bed · 2 baths',
      }),
    ).toEqual({ bedrooms: 1, bathrooms: 1, sleeps: 2 })
  })

  it('repairs VRBO default sleeps when sq ft is glued to the count', () => {
    expect(
      resolveStayCapacity({
        bedrooms: 0,
        bathrooms: 1,
        sleeps: 1,
        description: 'See all 2 reviews\n1 bedroom1 bathroomSleeps 61000 sq ft',
      }),
    ).toEqual({ bedrooms: 1, bathrooms: 1, sleeps: 6 })
  })
})

describe('formatCapacitySummary', () => {
  it('omits zero bedrooms instead of showing 0bd', () => {
    expect(formatCapacitySummary(0, 1, 2)).toBe('1ba · Sleeps 2')
  })

  it('formats a full capacity line', () => {
    expect(formatCapacitySummary(3, 2, 8)).toBe('3bd · 2ba · Sleeps 8')
  })
})
