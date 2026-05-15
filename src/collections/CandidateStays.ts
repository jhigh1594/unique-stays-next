import type { CollectionConfig } from 'payload'

export const CandidateStays: CollectionConfig = {
  slug: 'candidate-stays',
  labels: {
    singular: 'Candidate Stay',
    plural: 'Candidate Stays',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'platform', 'location', 'noveltyScore', 'status', 'discoveredAt'],
    listSearchableFields: ['title', 'location', 'state'],
  },
  hooks: {
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

        // Look up default category and spoke for auto-promotion
        const [defaultCategory, defaultSpoke] = await Promise.all([
          req.payload.find({ collection: 'categories', limit: 1, depth: 0 }),
          req.payload.find({ collection: 'spokes', where: { slug: { equals: 'unique' } }, limit: 1, depth: 0 }),
        ])

        const categoryId = defaultCategory.docs[0]?.id
        const spokeId = defaultSpoke.docs[0]?.id

        if (!categoryId || !spokeId) {
          throw new Error('Cannot promote: no default category or "unique" spoke found')
        }

        // Promote candidate to stay as draft (requires category/spoke assignment before publishing)
        await req.payload.create({
          collection: 'stays',
          draft: true,
          overrideAccess: true,
          data: {
            slug,
            title: doc.title,
            location: doc.location ?? '',
            state: doc.state ?? '',
            region: doc.region ?? 'West',
            category: categoryId,
            spokes: [spokeId],
            platform: doc.platform,
            affiliateUrl: doc.sourceUrl,
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
          } as any,
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
      admin: { description: 'Primary listing image URL' },
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
