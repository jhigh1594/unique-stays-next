import { describe, expect, it } from 'vitest'

import {
  WANDER_AFFILIATE_BASE_URL,
  isWanderPropertyUrl,
  normalizeWanderAffiliateUrl,
  toWanderAffiliateUrl,
} from './wander'

const propertyUrl = 'https://www.wander.com/property/wander-joshua-tree-starfall?checkIn=2026-08-01'
const expectedAffiliateUrl =
  'https://wander.sjv.io/k4b6Qv?u=https%3A%2F%2Fwww.wander.com%2Fproperty%2Fwander-joshua-tree-starfall%3FcheckIn%3D2026-08-01'

describe('Wander affiliate links', () => {
  it('wraps a property destination in the approved affiliate URL', () => {
    expect(toWanderAffiliateUrl(propertyUrl)).toBe(expectedAffiliateUrl)
  })

  it('normalizes an existing affiliate URL without double-wrapping it', () => {
    expect(normalizeWanderAffiliateUrl(expectedAffiliateUrl)).toBe(expectedAffiliateUrl)
  })

  it('accepts only HTTPS Wander property pages', () => {
    expect(isWanderPropertyUrl(propertyUrl)).toBe(true)
    expect(isWanderPropertyUrl('https://wander.com/property/wander-joshua-tree-starfall')).toBe(true)
    expect(isWanderPropertyUrl('https://www.wander.com/s?location=California')).toBe(false)
    expect(isWanderPropertyUrl('http://www.wander.com/property/wander-joshua-tree-starfall')).toBe(false)
    expect(isWanderPropertyUrl('https://not-wander.com/property/wander-joshua-tree-starfall')).toBe(false)
  })

  it('fails closed for an affiliate URL without a valid property destination', () => {
    expect(normalizeWanderAffiliateUrl(WANDER_AFFILIATE_BASE_URL)).toBeNull()
    expect(normalizeWanderAffiliateUrl('https://wander.sjv.io/k4b6Qv?u=https%3A%2F%2Fwww.wander.com')).toBeNull()
  })
})
