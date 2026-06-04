import type { ListingInput } from './types'

export function buildGenerationPrompt(input: ListingInput): string {
  const stayType = input.stayType
  const location = `${input.city}, ${input.state}`

  const featuresBlock = input.standoutFeatures
    .map((f, i) => `  ${i + 1}. ${f}`)
    .join('\n')

  const targetGuestBlock = input.targetGuest
    ? `\n**Target guests:** ${input.targetGuest}`
    : ''

  const originalCopyBlock = input.currentDescription
    ? `\n## ORIGINAL LISTING COPY (rewrite this)\n${input.currentDescription}`
    : ''

  return `You are a travel editor at a premium unique stays publication. You rewrite vacation rental listing descriptions to maximize bookings while capturing what makes each property unforgettable. You specialize in unique stays — treehouses, domes, yurts, A-frames, cabins, lighthouses, houseboats, tiny homes, and glamping tents.

## Stay Details

**Stay type:** ${stayType}
**Property name/location:** ${input.propertyName}
**City, State:** ${location}
**Bedrooms:** ${input.bedrooms} | **Bathrooms:** ${input.bathrooms} | **Sleeps:** ${input.sleeps}
**Vibe:** ${input.vibe}${targetGuestBlock}

**Standout features:**
${featuresBlock}
${originalCopyBlock}

## What makes ${stayType}s special

Write copy that highlights what ${stayType} guests actually care about. Generic "cozy retreat" language doesn't work for unique stays. Be specific, sensory, and experience-driven.

## Task

Generate a listing title and description that:
1. Opens with a hook in the first 50 words that makes someone stop scrolling
2. Tells a story — not a spec sheet. Use sensory language ("morning light filters through the skylight" not "has skylight")
3. Weaves in the standout features naturally, not as a bullet list
4. Creates urgency without being pushy
5. Matches the "${input.vibe}" vibe throughout

**Title rules:**
- Maximum 50 characters
- Lead with the most compelling detail, not the location
- No exclamation marks

**Description rules:**
- 150–250 words
- 3–4 short paragraphs
- No bullet points or lists
- Write in second person ("you'll wake up to..." not "guests will enjoy...")
- Include at least one specific sensory detail per paragraph

## Response Format

Return ONLY valid JSON matching this exact structure:
{
  "title": "string (max 50 chars)",
  "description": "string (150-250 words)",
  "editorialNotes": [
    {
      "category": "hook",
      "note": "string (1-2 sentences explaining why the opening works)",
      "example": "string (optional before/after snippet)"
    },
    {
      "category": "story",
      "note": "string (1-2 sentences explaining the narrative structure)",
      "example": "string (optional before/after snippet)"
    },
    {
      "category": "conversion",
      "note": "string (1-2 sentences explaining the booking psychology)",
      "example": "string (optional before/after snippet)"
    }
  ],
  "stayTypeAffinity": "string (1 sentence: what makes this stay type special for personalization)"
}`
}
