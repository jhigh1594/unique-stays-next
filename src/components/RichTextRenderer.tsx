import { RichText } from '@payloadcms/richtext-lexical/react'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import StayPolaroidCard from './StayPolaroidCard'
import type { NormalizedStay } from '@/lib/types'

interface RichTextRendererProps {
  content: unknown
  className?: string
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    stayEmbed: ({ node }: { node: Record<string, unknown> }) => {
      const stay = (node.fields as { stay?: NormalizedStay | null } | undefined)?.stay
      if (!stay || typeof stay !== 'object') return null
      return <StayPolaroidCard stay={stay as NormalizedStay} />
    },
  },
})

export default function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content) return null
  return (
    <RichText
      data={content as Parameters<typeof RichText>[0]['data']}
      converters={converters}
      className={className}
    />
  )
}
