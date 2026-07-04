import { describe, expect, it } from 'vitest'
import { extractListingSlug, normalizeListing } from './wander-pp-cli'

describe('wander-pp-cli helpers', () => {
  it('extracts listing slugs from property URLs and raw slugs', () => {
    expect(extractListingSlug('https://www.wander.com/property/wander-charleston-green?checkIn=2026-07-21')).toBe(
      'wander-charleston-green',
    )
    expect(extractListingSlug('Wander-Charleston-Green')).toBe('wander-charleston-green')
    expect(extractListingSlug('https://www.wander.com/s?location=South+Carolina')).toBeNull()
  })

  it('normalizes object-shaped images, amenities, and numeric strings', () => {
    const listing = normalizeListing({
      slug: 'wander-charleston-green',
      name: 'Wander Charleston Green',
      url: 'https://www.wander.com/property/wander-charleston-green',
      city: 'Charleston',
      state: 'South Carolina',
      latitude: '32.7893496',
      longitude: '-79.9460664',
      bedrooms: '4',
      bathrooms: 3,
      sleeps: '10 guests',
      nightlyMin: '$562',
      rating: '4.91',
      reviewCount: '35 reviews',
      amenities: [{ label: 'Wifi' }, { name: 'EV Charger' }, 'Patio', 'Wifi'],
      images: [
        { url: 'https://assets.wander.com/611197331961806980/640.webp', width: '640' },
        'https://assets.wander.com/609053117052355902/640.webp',
        'https://assets.wander.com/609053117052355902/640.webp',
      ],
      policies: {
        petsAllowed: 'true',
        smokingAllowed: false,
        checkinTime: '16:00:00',
      },
    })

    expect(listing).toMatchObject({
      slug: 'wander-charleston-green',
      name: 'Wander Charleston Green',
      city: 'Charleston',
      state: 'South Carolina',
      latitude: 32.7893496,
      longitude: -79.9460664,
      bedrooms: 4,
      bathrooms: 3,
      sleeps: 10,
      nightlyMin: 562,
      rating: 4.91,
      reviewCount: 35,
      amenities: ['Wifi', 'EV Charger', 'Patio'],
      policies: {
        petsAllowed: true,
        smokingAllowed: false,
        checkinTime: '16:00:00',
      },
    })
    expect(listing?.images).toEqual([
      {
        url: 'https://assets.wander.com/611197331961806980/640.webp',
        caption: '',
        width: 640,
      },
      {
        url: 'https://assets.wander.com/609053117052355902/640.webp',
        caption: '',
      },
    ])
  })

  it('falls back to canonical Wander URLs and slug titles', () => {
    const listing = normalizeListing({}, 'wander-hatch-canyons')

    expect(listing?.url).toBe('https://www.wander.com/property/wander-hatch-canyons')
    expect(listing?.name).toBe('Wander Hatch Canyons')
  })
})
