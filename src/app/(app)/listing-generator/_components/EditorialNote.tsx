'use client'

import { Lightbulb } from 'lucide-react'
import type { EditorialNote as EditorialNoteType } from '@/lib/listing-generator/types'

interface EditorialNoteProps {
  note: EditorialNoteType
}

const CATEGORY_LABELS: Record<EditorialNoteType['category'], string> = {
  hook: 'Hook',
  story: 'Story',
  conversion: 'Conversion',
}

export default function EditorialNote({ note }: EditorialNoteProps) {
  return (
    <article className="rounded-[3px] border border-terracotta/20 bg-warm-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[2px] bg-terracotta/10">
          <Lightbulb className="h-4 w-4 text-terracotta" aria-hidden="true" />
        </div>
        <div>
          <span className="font-body text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
            {CATEGORY_LABELS[note.category]}
          </span>
          <p className="mt-1 font-body text-sm leading-6 text-charcoal">
            {note.note}
          </p>
          {note.example && (
            <p className="mt-2 rounded-[2px] bg-cream-dark p-3 font-body text-xs italic text-muted-foreground">
              {note.example}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
