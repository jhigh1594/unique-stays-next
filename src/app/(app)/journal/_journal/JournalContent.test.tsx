import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JournalContent from './JournalContent'
import type { NormalizedJournalPost } from '@/lib/types'

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill,
    priority,
    ...props
  }: {
    src: string
    alt: string
    fill?: boolean
    priority?: boolean
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-fill={fill ? 'true' : undefined}
      data-priority={priority ? 'true' : undefined}
      {...props}
    />
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

afterEach(() => {
  cleanup()
})

function journalPost(overrides: Partial<NormalizedJournalPost> = {}): NormalizedJournalPost {
  const id = overrides.id ?? 1

  return {
    id,
    slug: `dispatch-${id}`,
    title: `Dispatch ${id}`,
    subtitle: '',
    excerpt: `Field notes for dispatch ${id}.`,
    heroImageUrl: `https://example.com/dispatch-${id}.jpg`,
    publishedAt: '2026-05-10T12:00:00.000Z',
    updatedAt: '2026-05-10T12:00:00.000Z',
    city: 'Joshua Tree',
    state: 'California',
    latitude: '34.1347',
    longitude: '-116.3116',
    metaTitle: '',
    metaDescription: '',
    linkedStays: [],
    content: null,
    ...overrides,
  }
}

describe('JournalContent archive board', () => {
  it('renders the featured post once, each archived post exactly once', () => {
    const posts = [
      journalPost({ id: 1, title: 'Latest Dispatch' }),
      journalPost({ id: 2, title: 'Treehouse Field Notes' }),
      journalPost({ id: 3, title: 'Desert Glass House' }),
      journalPost({ id: 4, title: 'Workcation Manifesto' }),
      journalPost({ id: 5, title: 'A-Frame Ledger' }),
    ]

    render(<JournalContent posts={posts} />)

    expect(screen.getAllByText('Latest Dispatch')).toHaveLength(1)
    expect(screen.getAllByText('Treehouse Field Notes')).toHaveLength(1)
    expect(screen.getAllByText('Desert Glass House')).toHaveLength(1)
    expect(screen.getAllByText('Workcation Manifesto')).toHaveLength(1)
    expect(screen.getAllByText('A-Frame Ledger')).toHaveLength(1)
    expect(screen.getByLabelText('Filed dispatches')).toBeInTheDocument()
  })

  it('renders a single post as the featured dispatch', () => {
    render(<JournalContent posts={[journalPost({ id: 1, title: 'Only Dispatch' })]} />)

    expect(screen.getByText('Only Dispatch')).toBeInTheDocument()
    expect(screen.queryByLabelText('Filed dispatches')).not.toBeInTheDocument()
  })

  it('renders the empty state when no posts exist', () => {
    render(<JournalContent posts={[]} />)

    expect(screen.getByText('The dispatch desk is still being assembled.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Filed dispatches')).not.toBeInTheDocument()
  })

  it('renders image-less archive posts as linked paper files without an image element', () => {
    render(
      <JournalContent
        posts={[
          journalPost({ id: 1, title: 'Latest Dispatch' }),
          journalPost({
            id: 2,
            title: 'Undisclosed Paper File',
            heroImageUrl: '',
            city: '',
            state: '',
            latitude: '',
            longitude: '',
          }),
        ]}
      />,
    )

    const paperFileLink = screen.getByRole('link', { name: /Undisclosed Paper File/ })

    expect(paperFileLink).toHaveAttribute('href', '/journal/dispatch-2')
    expect(within(paperFileLink).queryByRole('img')).not.toBeInTheDocument()
    expect(within(paperFileLink).getAllByText('Undisclosed location').length).toBeGreaterThan(0)
  })
})
