export type StateConfig = {
  name: string
  slug: string
  region: string
}

export const STATES: StateConfig[] = [
  { name: 'Alabama', slug: 'alabama', region: 'South' },
  { name: 'Alaska', slug: 'alaska', region: 'West' },
  { name: 'Arizona', slug: 'arizona', region: 'Southwest' },
  { name: 'Arkansas', slug: 'arkansas', region: 'South' },
  { name: 'California', slug: 'california', region: 'West' },
  { name: 'Colorado', slug: 'colorado', region: 'West' },
  { name: 'Connecticut', slug: 'connecticut', region: 'Northeast' },
  { name: 'Delaware', slug: 'delaware', region: 'Northeast' },
  { name: 'Florida', slug: 'florida', region: 'Southeast' },
  { name: 'Georgia', slug: 'georgia', region: 'Southeast' },
  { name: 'Hawaii', slug: 'hawaii', region: 'West' },
  { name: 'Idaho', slug: 'idaho', region: 'West' },
  { name: 'Illinois', slug: 'illinois', region: 'Midwest' },
  { name: 'Indiana', slug: 'indiana', region: 'Midwest' },
  { name: 'Iowa', slug: 'iowa', region: 'Midwest' },
  { name: 'Kansas', slug: 'kansas', region: 'Midwest' },
  { name: 'Kentucky', slug: 'kentucky', region: 'South' },
  { name: 'Louisiana', slug: 'louisiana', region: 'South' },
  { name: 'Maine', slug: 'maine', region: 'Northeast' },
  { name: 'Maryland', slug: 'maryland', region: 'Northeast' },
  { name: 'Massachusetts', slug: 'massachusetts', region: 'Northeast' },
  { name: 'Michigan', slug: 'michigan', region: 'Midwest' },
  { name: 'Minnesota', slug: 'minnesota', region: 'Midwest' },
  { name: 'Mississippi', slug: 'mississippi', region: 'South' },
  { name: 'Missouri', slug: 'missouri', region: 'Midwest' },
  { name: 'Montana', slug: 'montana', region: 'West' },
  { name: 'Nebraska', slug: 'nebraska', region: 'Midwest' },
  { name: 'Nevada', slug: 'nevada', region: 'Southwest' },
  { name: 'New Hampshire', slug: 'new-hampshire', region: 'Northeast' },
  { name: 'New Jersey', slug: 'new-jersey', region: 'Northeast' },
  { name: 'New Mexico', slug: 'new-mexico', region: 'Southwest' },
  { name: 'New York', slug: 'new-york', region: 'Northeast' },
  { name: 'North Carolina', slug: 'north-carolina', region: 'Southeast' },
  { name: 'North Dakota', slug: 'north-dakota', region: 'Midwest' },
  { name: 'Ohio', slug: 'ohio', region: 'Midwest' },
  { name: 'Oklahoma', slug: 'oklahoma', region: 'Southwest' },
  { name: 'Oregon', slug: 'oregon', region: 'West' },
  { name: 'Pennsylvania', slug: 'pennsylvania', region: 'Northeast' },
  { name: 'Rhode Island', slug: 'rhode-island', region: 'Northeast' },
  { name: 'South Carolina', slug: 'south-carolina', region: 'Southeast' },
  { name: 'South Dakota', slug: 'south-dakota', region: 'Midwest' },
  { name: 'Tennessee', slug: 'tennessee', region: 'South' },
  { name: 'Texas', slug: 'texas', region: 'Southwest' },
  { name: 'Utah', slug: 'utah', region: 'Southwest' },
  { name: 'Vermont', slug: 'vermont', region: 'Northeast' },
  { name: 'Virginia', slug: 'virginia', region: 'Southeast' },
  { name: 'Washington', slug: 'washington', region: 'West' },
  { name: 'West Virginia', slug: 'west-virginia', region: 'Southeast' },
  { name: 'Wisconsin', slug: 'wisconsin', region: 'Midwest' },
  { name: 'Wyoming', slug: 'wyoming', region: 'West' },
]

export const STATES_BY_SLUG = Object.fromEntries(
  STATES.map((state) => [state.slug, state])
) as Record<string, StateConfig>

export const STATE_SLUGS = STATES.map((state) => state.slug)

export function getRelatedStates(stateSlug: string, limit = 6): StateConfig[] {
  const state = STATES_BY_SLUG[stateSlug]
  if (!state) return []

  const sameRegion = STATES.filter((candidate) => (
    candidate.region === state.region && candidate.slug !== state.slug
  ))
  const fallback = STATES.filter((candidate) => (
    candidate.region !== state.region && candidate.slug !== state.slug
  ))

  return [...sameRegion, ...fallback].slice(0, limit)
}
