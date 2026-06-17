import { describe, expect, it } from 'vitest'
import { generateSlugFromTitle, resolveArticleSlug } from '../slug'

describe('snowseo slug helpers', () => {
  it('generates URL-safe slugs from titles', () => {
    expect(generateSlugFromTitle('Best Unique Stays in Vermont!')).toBe(
      'best-unique-stays-in-vermont',
    )
  })

  it('prefers provided slug over generated slug', () => {
    expect(
      resolveArticleSlug({
        slug: 'custom-slug',
        title: 'Ignored Title',
      }),
    ).toBe('custom-slug')
  })
})
