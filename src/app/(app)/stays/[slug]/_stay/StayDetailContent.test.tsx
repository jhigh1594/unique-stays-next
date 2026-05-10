import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import StayDetailContent from './StayDetailContent'
import type { NormalizedStay } from '@/lib/types'

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, priority, ...props }: { src: string; alt: string; fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fill={fill ? 'true' : undefined} data-priority={priority ? 'true' : undefined} {...props} />
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const stay: NormalizedStay = {
  id: 7,
  slug: 'test-stay',
  title: 'Test Stay',
  subtitle: 'A quiet test cabin',
  location: 'Bend, Oregon',
  state: 'Oregon',
  region: 'West',
  category: 'cabins',
  spokes: ['unique'],
  platform: 'VRBO',
  affiliateUrl: 'https://example.com/book',
  imageUrl: 'https://example.com/primary.jpg',
  galleryImages: [
    'https://example.com/gallery-1.jpg',
    'https://example.com/gallery-2.jpg',
    'https://example.com/gallery-3.jpg',
    'https://example.com/gallery-4.jpg',
    'https://example.com/gallery-5.jpg',
  ],
  price: 240,
  rating: 4.9,
  reviewCount: 121,
  sleeps: 4,
  bedrooms: 2,
  description: 'A test stay in the woods.',
  body: 'A test stay in the woods with enough detail for rendering.',
  tags: ['Fire Pit'],
  editorNote: '',
  bestFor: '',
  bestSeason: '',
  vibe: '',
  featured: false,
  editorsPick: false,
  isNew: false,
  wifiSpeed: '',
  hasDesk: false,
  petFriendly: false,
  petPolicy: '',
  rvHookup: false,
  rvDetails: '',
  evCharger: false,
  evDetails: '',
}

describe('StayDetailContent gallery', () => {
  it('renders every gallery image as clickable bottom polaroids on desktop and mobile', () => {
    render(<StayDetailContent stay={stay} related={[]} />)

    const photoButtons = screen.getAllByRole('button', { name: /^View photo \d+$/ })
    expect(photoButtons).toHaveLength(12)
    expect(screen.getAllByRole('button', { name: 'View photo 6' })).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'View photo 6' })[0])

    const heroImages = screen.getAllByAltText('Test Stay')
    expect(heroImages).toHaveLength(2)
    expect(heroImages.every((img) => img.getAttribute('src') === 'https://example.com/gallery-5.jpg')).toBe(true)
  })
})
