import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SpokeContent from './SpokeContent'
import { SPOKES_CONFIG } from '@/lib/spokes-config'
import type { NormalizedStay } from '@/lib/types'

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: { src: string; alt: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fill={fill ? 'true' : undefined} {...props} />
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const stay: NormalizedStay = {
  id: 1,
  slug: 'california-dog-cabin',
  title: 'California Dog Cabin',
  subtitle: '',
  location: 'Big Sur, California',
  state: 'California',
  region: 'West',
  category: 'cabins',
  spokes: ['pet-friendly'],
  platform: 'VRBO',
  affiliateUrl: 'https://example.com/book',
  imageUrl: 'https://example.com/cabin.jpg',
  price: 320,
  rating: 4.9,
  reviewCount: 88,
  sleeps: 4,
  bedrooms: 2,
  description: 'A dog-friendly cabin.',
  tags: ['Fenced Yard'],
  galleryImages: [],
  editorNote: '',
  bestFor: '',
  bestSeason: '',
  vibe: '',
  featured: false,
  editorsPick: false,
  isNew: false,
  wifiSpeed: '',
  hasDesk: false,
  petFriendly: true,
  petPolicy: 'Dogs welcome',
  rvHookup: false,
  rvDetails: '',
  evCharger: false,
  evDetails: '',
}

describe('SpokeContent pSEO state links', () => {
  it('renders canonical state intersection links for the current spoke', () => {
    render(
      <SpokeContent
        slug="pet-friendly"
        config={SPOKES_CONFIG['pet-friendly']}
        stays={[stay]}
      />
    )

    expect(screen.getAllByRole('link', { name: /California/i })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: expect.stringContaining('/pet-friendly/california') }),
      ])
    )
    expect(screen.getByRole('link', { name: /New York/i })).toHaveAttribute('href', '/pet-friendly/new-york')
  })
})
