import type { CollectionConfig } from 'payload'

export const Stays: CollectionConfig = {
  slug: 'stays',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'platform', 'state', 'price', 'featured'],
    listSearchableFields: ['title', 'location', 'state', 'tags'],
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Kebab-case URL identifier (e.g. wander-joshua-tree-starfall)',
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
    },

    // ── Location ──────────────────────────────────────────────
    {
      name: 'location',
      type: 'text',
      required: true,
      admin: { description: 'City, State (e.g. Joshua Tree, California)' },
    },
    {
      name: 'state',
      type: 'text',
      required: true,
    },
    {
      name: 'region',
      type: 'select',
      required: true,
      options: [
        { label: 'West', value: 'West' },
        { label: 'Southwest', value: 'Southwest' },
        { label: 'South', value: 'South' },
        { label: 'Midwest', value: 'Midwest' },
        { label: 'Northeast', value: 'Northeast' },
        { label: 'Southeast', value: 'Southeast' },
      ],
    },

    // ── Classification ────────────────────────────────────────
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'spokes',
      type: 'relationship',
      relationTo: 'spokes',
      hasMany: true,
      required: true,
      admin: {
        description: 'Which spoke sections this listing appears in',
      },
    },

    // ── Booking ───────────────────────────────────────────────
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
      name: 'affiliateUrl',
      type: 'text',
      required: true,
      admin: { description: 'Full booking URL with affiliate tracking' },
    },

    // ── Media ─────────────────────────────────────────────────
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Primary listing image — use Media upload for hosted images' },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Fallback: direct image URL (used during migration from legacy data)',
      },
    },

    // ── Pricing & Stats ───────────────────────────────────────
    {
      name: 'price',
      type: 'number',
      required: true,
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

    // ── Capacity ──────────────────────────────────────────────
    {
      name: 'sleeps',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'bedrooms',
      type: 'number',
      required: true,
      min: 0,
    },

    // ── Content ───────────────────────────────────────────────
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
      admin: { description: 'Amenity tags (e.g. Stargazing Deck, Heated Pool)' },
    },

    // ── Editorial Flags ───────────────────────────────────────
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'editorsPick',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isNew',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },

    // ── Work-Friendly ─────────────────────────────────────────
    {
      name: 'workFriendly',
      type: 'group',
      admin: {
        description: 'Attributes for the Work-Friendly spoke',
        condition: (data) => Array.isArray(data?.spokes),
      },
      fields: [
        {
          name: 'wifiSpeed',
          type: 'text',
          admin: { description: 'e.g. 200 Mbps Starlink' },
        },
        {
          name: 'hasDesk',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // ── Pet-Friendly ──────────────────────────────────────────
    {
      name: 'petDetails',
      type: 'group',
      admin: { description: 'Attributes for the Pet-Friendly spoke' },
      fields: [
        {
          name: 'petFriendly',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'petPolicy',
          type: 'text',
          admin: { description: 'e.g. Dogs welcome, 2 max, $50 fee' },
        },
      ],
    },

    // ── RV-Ready ──────────────────────────────────────────────
    {
      name: 'rvDetails',
      type: 'group',
      admin: { description: 'Attributes for the RV-Ready spoke' },
      fields: [
        {
          name: 'rvHookup',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'rvInfo',
          type: 'text',
          admin: { description: 'e.g. 30-amp hookup, pull-through site' },
        },
      ],
    },

    // ── EV-Ready ──────────────────────────────────────────────
    {
      name: 'evDetails',
      type: 'group',
      admin: { description: 'Attributes for the EV-Ready spoke' },
      fields: [
        {
          name: 'evCharger',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'evInfo',
          type: 'text',
          admin: { description: 'e.g. Level 2 Tesla adapter, 48A' },
        },
      ],
    },
  ],
}
