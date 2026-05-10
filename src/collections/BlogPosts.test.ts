import { describe, expect, it } from 'vitest'
import type { AccessArgs } from 'payload'
import { BlogPosts } from './BlogPosts'

function accessArgs(user: AccessArgs['req']['user']): AccessArgs {
  return {
    req: { user },
  } as AccessArgs
}

describe('BlogPosts access', () => {
  it('allows authenticated users, including API-key users, to create and update posts', () => {
    const user = { id: 1, collection: 'users' } as AccessArgs['req']['user']

    expect(BlogPosts.access?.create?.(accessArgs(user))).toBe(true)
    expect(BlogPosts.access?.update?.(accessArgs(user))).toBe(true)
  })

  it('limits anonymous reads to published posts', () => {
    expect(BlogPosts.access?.read?.(accessArgs(null))).toEqual({
      status: { equals: 'published' },
    })
  })

  it('allows authenticated users to read drafts for admin editing', () => {
    const user = { id: 1, collection: 'users' } as AccessArgs['req']['user']

    expect(BlogPosts.access?.read?.(accessArgs(user))).toBe(true)
  })
})
