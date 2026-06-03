import { describe, it, expect } from 'vitest'
import { buildGenerationPrompt } from '../prompt'
import type { ListingInput } from '../types'

describe('buildGenerationPrompt', () => {
  it('includes stay type in prompt', () => {
    const input: ListingInput = {
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
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('treehouse')
    expect(prompt).toContain('Catskills Pine Treehouse')
    expect(prompt).toContain('Woodstock')
    expect(prompt).toContain('romantic')
    expect(prompt).toContain('Stargazing deck')
  })

  it('includes current description when provided', () => {
    const input: ListingInput = {
      stayType: 'dome',
      propertyName: 'Desert Dome',
      city: 'Joshua Tree',
      state: 'California',
      bedrooms: 1,
      bathrooms: 1,
      sleeps: 2,
      standoutFeatures: ['Stargazing skylight', 'Hot tub', 'Fire pit'],
      vibe: 'adventurous',
      currentDescription: 'A nice dome in the desert. Come stay here.',
    }
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('A nice dome in the desert')
    expect(prompt).toContain('ORIGINAL LISTING COPY')
  })

  it('includes target guest when provided', () => {
    const input: ListingInput = {
      stayType: 'cabin',
      propertyName: 'Mountain Retreat',
      city: 'Asheville',
      state: 'North Carolina',
      bedrooms: 3,
      bathrooms: 2,
      sleeps: 6,
      standoutFeatures: ['Hot tub', 'Mountain views', 'Game room'],
      vibe: 'family-friendly',
      targetGuest: 'families',
    }
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('families')
  })

  it('includes JSON output format instruction', () => {
    const input: ListingInput = {
      stayType: 'yurt',
      propertyName: 'Yurt in the Woods',
      city: 'Bend',
      state: 'Oregon',
      bedrooms: 1,
      bathrooms: 1,
      sleeps: 2,
      standoutFeatures: ['Wood stove', 'Forest views', 'Outdoor shower'],
      vibe: 'rustic',
    }
    const prompt = buildGenerationPrompt(input)
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('title')
    expect(prompt).toContain('description')
    expect(prompt).toContain('editorialNotes')
  })
})
