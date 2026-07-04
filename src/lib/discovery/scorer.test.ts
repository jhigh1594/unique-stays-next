import { describe, expect, it } from 'vitest'
import { scoreNoveltyWithRules } from './scorer'

describe('scoreNoveltyWithRules', () => {
  it('scores distinctive US stays without requiring an LLM', () => {
    const score = scoreNoveltyWithRules({
      title: 'Wander Sevierville Woods',
      location: 'Sevierville, Tennessee',
      platform: 'Wander',
      price: 1067,
      description: 'A one-of-a-kind treehouse retreat with elevated decks in the forest near the Smoky Mountains.',
      amenities: ['Hot Tub', 'Wifi', 'Deck'],
    })

    expect(score).toMatchObject({
      category: 'treehouse',
      score: 10,
      source: 'rules',
    })
    expect(score.reason).toContain('Needs editorial review')
  })

  it('filters obvious non-US listings', () => {
    expect(
      scoreNoveltyWithRules({
        title: 'Dome in British Columbia',
        location: 'Whistler, British Columbia',
        platform: 'Wander',
        price: 300,
        description: 'A geodesic dome in Canada.',
      }),
    ).toMatchObject({
      category: 'filtered',
      score: 0,
      source: 'rules',
    })
  })
})
