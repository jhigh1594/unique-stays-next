import type { Block } from 'payload'

export const StayEmbedBlock: Block = {
  slug: 'stayEmbed',
  interfaceName: 'StayEmbedBlock',
  fields: [
    {
      name: 'stay',
      type: 'relationship',
      relationTo: 'stays',
      required: true,
    },
  ],
}
