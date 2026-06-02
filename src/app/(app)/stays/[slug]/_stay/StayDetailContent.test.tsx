import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import posthog from 'posthog-js'
import StayDetailContent from './StayDetailContent'
import type { NormalizedStay } from '@/lib/types'

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}))

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
  bathrooms: 1,
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

const posthogCapture = vi.mocked(posthog.capture)

beforeEach(() => {
  posthogCapture.mockClear()
})

afterEach(() => {
  cleanup()
})

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

describe('StayDetailContent mobile booking module', () => {
  it('groups price, rating, caveat, facts, and the primary booking link', () => {
    render(<StayDetailContent stay={stay} related={[]} />)

    const booking = screen.getByTestId('mobile-booking-details')

    expect(booking).toHaveTextContent('$240')
    expect(booking).toHaveTextContent('/night')
    expect(booking).toHaveTextContent('4.9')
    expect(booking).toHaveTextContent('121 reviews')
    expect(booking).toHaveTextContent('Final price shown on VRBO')
    expect(within(booking).getByLabelText('Rated 4.9 out of 5 from 121 reviews')).toBeInTheDocument()
    expect(within(booking).getByLabelText('Stay facts: Bend, Oregon · 2 bedrooms · 1 bath · Sleeps 4')).toBeInTheDocument()

    const bookingLink = screen.getByRole('link', { name: 'Book Test Stay on VRBO' })
    expect(bookingLink).toHaveAttribute('href', 'https://example.com/book')
    expect(bookingLink).toHaveAttribute('target', '_blank')
    expect(bookingLink).toHaveAttribute('rel', 'noopener noreferrer sponsored')
  })

  it('preserves affiliate analytics for the mobile booking link', () => {
    render(<StayDetailContent stay={stay} related={[]} />)

    fireEvent.click(screen.getByRole('link', { name: 'Book Test Stay on VRBO' }))

    expect(posthogCapture).toHaveBeenCalledWith('affiliate_link_clicked', {
      stay_slug: 'test-stay',
      stay_title: 'Test Stay',
      stay_platform: 'VRBO',
      stay_price: 240,
      affiliate_url: 'https://example.com/book',
    })
  })

  it('keeps the booking module stable when rating data is missing', () => {
    render(<StayDetailContent stay={{ ...stay, rating: null, reviewCount: null }} related={[]} />)

    const booking = screen.getByTestId('mobile-booking-details')

    expect(booking).toHaveTextContent('$240')
    expect(booking).toHaveTextContent('Book on VRBO')
    expect(booking).toHaveTextContent('Final price shown on VRBO')
    expect(booking).not.toHaveTextContent('reviews')
    expect(screen.queryByLabelText(/Rated .* out of 5/)).not.toBeInTheDocument()
  })

  it('uses singular fact labels when the stay has one bedroom and bath', () => {
    render(<StayDetailContent stay={{ ...stay, bedrooms: 1, bathrooms: 1 }} related={[]} />)

    expect(screen.getByLabelText('Stay facts: Bend, Oregon · 1 bedroom · 1 bath · Sleeps 4')).toBeInTheDocument()
  })

  it('shows a compact sticky booking bar with the same outbound contract', () => {
    render(<StayDetailContent stay={stay} related={[]} />)

    const sticky = screen.getByTestId('mobile-sticky-booking')

    expect(sticky).toHaveTextContent('$240')
    expect(sticky).toHaveTextContent('4.9')
    expect(sticky).toHaveTextContent('121 reviews')

    const stickyLink = screen.getByRole('link', { name: 'Book Test Stay on VRBO from sticky bar' })
    expect(stickyLink).toHaveAttribute('href', 'https://example.com/book')
    expect(stickyLink).toHaveAttribute('target', '_blank')
    expect(stickyLink).toHaveAttribute('rel', 'noopener noreferrer sponsored')

    fireEvent.click(stickyLink)

    expect(posthogCapture).toHaveBeenCalledWith('affiliate_link_clicked', {
      stay_slug: 'test-stay',
      stay_title: 'Test Stay',
      stay_platform: 'VRBO',
      stay_price: 240,
      affiliate_url: 'https://example.com/book',
    })
  })
})
