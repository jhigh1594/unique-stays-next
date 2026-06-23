'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import StayCard from './StayCard'
import type { NormalizedStay } from '@/lib/types'

interface Props {
  stays: NormalizedStay[]
}

export default function FilmstripSection({ stays }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  })

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section className="py-20 overflow-hidden" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 fade-up relative">
          <span
            className="absolute select-none pointer-events-none font-display leading-none"
            style={{
              fontSize: 'clamp(7rem, 15vw, 13rem)',
              color: 'oklch(0.22 0.01 60)',
              opacity: 0.04,
              bottom: '-0.15em',
              left: '-0.04em',
              lineHeight: 1,
              fontFamily: 'Fraunces, serif',
              fontWeight: 900,
            }}
          >
            03
          </span>

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="stamp-badge"
                style={{
                  color: 'oklch(0.55 0.14 38)',
                  borderColor: 'oklch(0.55 0.14 38)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Recently Discovered
              </div>
            </div>
            <h2
              className="font-bold leading-none"
              style={{
                fontFamily: 'Fraunces, serif',
                color: 'oklch(0.22 0.01 60)',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              }}
            >
              Drag to{' '}
              <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}>
                explore.
              </span>
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <motion.button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: canPrev ? 'oklch(0.55 0.14 38)' : 'oklch(0.88 0.025 75)',
                color: canPrev ? 'oklch(0.99 0.005 85)' : 'oklch(0.60 0.02 60)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: canNext ? 'oklch(0.55 0.14 38)' : 'oklch(0.88 0.025 75)',
                color: canNext ? 'oklch(0.99 0.005 85)' : 'oklch(0.60 0.02 60)',
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      <div
        ref={emblaRef}
        className="overflow-hidden pl-4 sm:pl-6 lg:pl-[calc((100vw-1320px)/2+2rem)] pb-8 -mb-8"
        data-cursor="drag"
      >
        <div className="flex items-start gap-5 select-none">
          {stays.map((stay, i) => (
            <motion.div
              key={stay.id}
              className="flex-shrink-0"
              style={{ width: 'min(340px, 78vw)' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
            >
              <StayCard stay={stay} index={i + 10} />
            </motion.div>
          ))}
          <div className="flex-shrink-0 w-6 lg:w-[calc((100vw-1320px)/2+2rem)]" />
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center gap-2 justify-center md:justify-start">
          {stays.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className="transition-all duration-300"
              style={{
                width: i === selectedIndex ? 24 : 6,
                height: 6,
                borderRadius: 3,
                background: i === selectedIndex ? 'oklch(0.55 0.14 38)' : 'oklch(0.88 0.025 75)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
