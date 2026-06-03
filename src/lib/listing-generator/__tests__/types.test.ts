import { describe, it, expect } from 'vitest'
import {
  detectPlatform,
  validateListingUrl,
  validateManualInput,
  STAY_TYPES,
  VIBES,
  GUEST_TYPES,
  type ListingInput,
  type GenerationResult,
  type EditorialNote,
} from '../types'

describe('detectPlatform', () => {
  it('detects Airbnb URLs', () => {
    expect(detectPlatform('https://www.airbnb.com/rooms/12345')).toBe('airbnb')
    expect(detectPlatform('https://airbnb.com/w/12345')).toBe('airbnb')
    expect(detectPlatform('https://www.airbnb.co.uk/rooms/12345')).toBe('airbnb')
  })

  it('detects VRBO URLs', () => {
    expect(detectPlatform('https://www.vrbo.com/12345')).toBe('vrbo')
  })

  it('detects Wander URLs', () => {
    expect(detectPlatform('https://www.wander.com/stays/some-stay')).toBe('wander')
  })

  it('returns null for unsupported URLs', () => {
    expect(detectPlatform('https://www.example.com/listing')).toBeNull()
    expect(detectPlatform('https://www.booking.com/hotel/us/foo')).toBeNull()
  })

  it('rejects URLs without protocol (anchored regex requires https://)', () => {
    expect(detectPlatform('www.airbnb.com/rooms/12345')).toBeNull()
  })
})

describe('validateListingUrl', () => {
  it('accepts valid Airbnb URLs', () => {
    const result = validateListingUrl('https://www.airbnb.com/rooms/12345')
    expect(result.valid).toBe(true)
    expect(result.platform).toBe('airbnb')
  })

  it('accepts valid VRBO URLs', () => {
    const result = validateListingUrl('https://www.vrbo.com/12345')
    expect(result.valid).toBe(true)
    expect(result.platform).toBe('vrbo')
  })

  it('accepts valid Wander URLs', () => {
    const result = validateListingUrl('https://www.wander.com/stays/my-stay')
    expect(result.valid).toBe(true)
    expect(result.platform).toBe('wander')
  })

  it('rejects invalid URLs', () => {
    expect(validateListingUrl('not-a-url').valid).toBe(false)
    expect(validateListingUrl('').valid).toBe(false)
  })

  it('rejects unsupported platforms', () => {
    const result = validateListingUrl('https://www.booking.com/hotel/us/foo')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Airbnb, VRBO, or Wander')
  })
})

describe('validateManualInput', () => {
  const validInput: ListingInput = {
    stayType: 'treehouse',
    propertyName: 'Catskills Pine Treehouse',
    city: 'Woodstock',
    state: 'New York',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    standoutFeatures: ['Stargazing deck', 'Wood-burning stove', 'Canopy views'],
    vibe: 'romantic',
  }

  it('accepts valid input', () => {
    const result = validateManualInput(validInput)
    expect(result.valid).toBe(true)
  })

  it('rejects missing required fields', () => {
    const { stayType, ...missingType } = validInput
    expect(validateManualInput(missingType as ListingInput).valid).toBe(false)
  })

  it('rejects invalid stay type', () => {
    const result = validateManualInput({ ...validInput, stayType: 'skyscraper' as any })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid vibe', () => {
    const result = validateManualInput({ ...validInput, vibe: 'chaotic' as any })
    expect(result.valid).toBe(false)
  })

  it('accepts optional fields as undefined', () => {
    const { targetGuest, currentDescription, ...required } = validInput
    expect(validateManualInput(required as ListingInput).valid).toBe(true)
  })
})

describe('constants', () => {
  it('STAY_TYPES has expected entries', () => {
    expect(STAY_TYPES).toContain('treehouse')
    expect(STAY_TYPES).toContain('dome')
    expect(STAY_TYPES).toContain('yurt')
    expect(STAY_TYPES.length).toBe(10)
  })

  it('VIBES has expected entries', () => {
    expect(VIBES).toContain('romantic')
    expect(VIBES).toContain('luxury')
  })

  it('GUEST_TYPES has expected entries', () => {
    expect(GUEST_TYPES).toContain('couples')
    expect(GUEST_TYPES).toContain('digital-nomads')
  })
})
