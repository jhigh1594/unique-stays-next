import type { CollectionConfig } from 'payload'

export const CandidateStays: CollectionConfig = {
  slug: 'candidate-stays',
  labels: {
    singular: 'Candidate Stay',
    plural: 'Candidate Stays',
  },
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'platform', 'location', 'noveltyScore', 'status', 'discoveredAt'],
    listSearchableFields: ['title', 'location', 'state'],
  },
  hooks: {
    beforeValidate: [],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Only trigger on status change to 'approved'
        if (doc.status !== 'approved' || previousDoc?.status === 'approved') return

        const slug = (doc.title as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 80)

        // Check if stay already exists by slug or source URL
        const existing = await req.payload.find({
          collection: 'stays',
          where: {
            or: [
              { slug: { equals: slug } },
              { affiliateUrl: { equals: doc.sourceUrl } },
            ],
          },
          limit: 1,
          depth: 0,
        })

        if (existing.totalDocs > 0) return

        // Look up category and spoke(s) for auto-promotion
        const targetSpokeSlug = (doc.targetSpoke as string) || 'unique'
        const [defaultCategory, targetSpoke, uniqueSpoke] = await Promise.all([
          req.payload.find({ collection: 'categories', limit: 1, depth: 0 }),
          req.payload.find({ collection: 'spokes', where: { slug: { equals: targetSpokeSlug } }, limit: 1, depth: 0 }),
          req.payload.find({ collection: 'spokes', where: { slug: { equals: 'unique' } }, limit: 1, depth: 0 }),
        ])

        const categoryId = defaultCategory.docs[0]?.id
        const spokeId = targetSpoke.docs[0]?.id
        const uniqueSpokeId = uniqueSpoke.docs[0]?.id

        if (!categoryId || !spokeId) {
          throw new Error('Cannot promote: no default category or target spoke found')
        }

        // Build spoke list: target spoke + "unique" as secondary for high-novelty listings
        const spokeIds = [spokeId]
        if (uniqueSpokeId && uniqueSpokeId !== spokeId && (doc.noveltyScore ?? 0) >= 6) {
          spokeIds.push(uniqueSpokeId)
        }

        // Parse spoke-specific fields from JSON
        let spokeFields: Record<string, unknown> = {}
        try {
          spokeFields = typeof doc.spokeFields === 'string'
            ? JSON.parse(doc.spokeFields as string)
            : (doc.spokeFields as Record<string, unknown>) ?? {}
        } catch { /* empty */ }

        // Build spoke-specific group fields
        const stayData: Record<string, unknown> = {
          slug,
          title: doc.title,
          location: doc.location ?? '',
          state: doc.state ?? '',
          region: doc.region ?? 'West',
          category: categoryId,
          spokes: spokeIds,
          platform: doc.platform,
          affiliateUrl: doc.sourceUrl,
          image: doc.heroImage ?? undefined,
          imageUrl: doc.imageUrl ?? '',
          price: doc.price ?? 0,
          rating: doc.rating ?? undefined,
          reviewCount: doc.reviewCount ?? undefined,
          sleeps: 1,
          bedrooms: 0,
          description: (doc.scrapedDescription as string) ?? '',
          tags: (doc.scrapedAmenities as Array<{ amenity: string }>)?.map((a) => ({ tag: a.amenity })) ?? [],
          featured: false,
          editorsPick: false,
          isNew: true,
          needsReview: true,
          reviewReason: 'Auto-promoted from candidate — needs category/spoke assignment before publishing',
        }

        // Map spoke fields to the correct group
        if (targetSpokeSlug === 'work-friendly') {
          stayData.workFriendly = {
            wifiSpeed: spokeFields.wifiSpeed ?? '',
            hasDesk: spokeFields.hasDesk ?? false,
          }
        } else if (targetSpokeSlug === 'pet-friendly') {
          stayData.petDetails = {
            petFriendly: spokeFields.petFriendly ?? true,
            petPolicy: spokeFields.petPolicy ?? '',
          }
        } else if (targetSpokeSlug === 'rv-ready') {
          stayData.rvDetails = {
            rvHookup: spokeFields.rvHookup ?? false,
            rvInfo: spokeFields.rvInfo ?? '',
          }
        } else if (targetSpokeSlug === 'ev-ready') {
          stayData.evDetails = {
            evCharger: spokeFields.evCharger ?? false,
            evInfo: spokeFields.evInfo ?? '',
          }
        }

        // Promote candidate to stay as draft
        await req.payload.create({
          collection: 'stays',
          draft: true,
          overrideAccess: true,
          data: stayData as any,
        })

        // Set reviewedAt on the candidate
        await req.payload.update({
          collection: 'candidate-stays',
          id: doc.id,
          data: { reviewedAt: new Date().toISOString() },
          overrideAccess: true,
        })
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'sourceUrl',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Platform listing URL (used for dedup)',
        position: 'sidebar',
      },
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Airbnb', value: 'Airbnb' },
        { label: 'VRBO', value: 'VRBO' },
        { label: 'Wander', value: 'Wander' },
        { label: 'Direct', value: 'Direct' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      admin: { description: 'City, State' },
    },
    {
      name: 'state',
      type: 'text',
    },
    {
      name: 'region',
      type: 'select',
      options: [
        { label: 'West', value: 'West' },
        { label: 'Southwest', value: 'Southwest' },
        { label: 'South', value: 'South' },
        { label: 'Midwest', value: 'Midwest' },
        { label: 'Northeast', value: 'Northeast' },
        { label: 'Southeast', value: 'Southeast' },
      ],
    },
    {
      name: 'price',
      type: 'number',
      admin: { description: 'Nightly rate in USD' },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
    },
    {
      name: 'reviewCount',
      type: 'number',
      min: 0,
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: { description: 'Primary listing image URL (from discovery)' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Upload a hero image before approving this candidate' },
    },
    {
      name: 'scrapedDescription',
      type: 'textarea',
      admin: { description: 'Description extracted from platform listing' },
    },
    {
      name: 'scrapedAmenities',
      type: 'array',
      fields: [
        {
          name: 'amenity',
          type: 'text',
          required: true,
        },
      ],
      admin: { description: 'Amenities extracted from platform listing' },
    },
    {
      name: 'noveltyScore',
      type: 'number',
      min: 0,
      max: 10,
      admin: {
        description: 'LLM-assigned experience novelty score (0-10)',
        position: 'sidebar',
      },
    },
    {
      name: 'noveltyReason',
      type: 'textarea',
      admin: {
        description: 'Why this score was assigned',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'targetSpoke',
      type: 'select',
      options: [
        { label: 'Work-Friendly', value: 'work-friendly' },
        { label: 'Pet-Friendly', value: 'pet-friendly' },
        { label: 'RV-Ready', value: 'rv-ready' },
        { label: 'EV-Ready', value: 'ev-ready' },
      ],
      admin: {
        description: 'Target spoke for auto-promotion (defaults to "unique" if empty)',
        position: 'sidebar',
      },
    },
    {
      name: 'spokeFields',
      type: 'json',
      admin: {
        description: 'Extracted spoke-specific data: {wifiSpeed, hasDesk, petFriendly, petPolicy, rvHookup, rvInfo, evCharger, evInfo}',
        position: 'sidebar',
      },
    },
    {
      name: 'discoveredAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
  ],
}
