'use client'

import { useEffect } from 'react'

const REVEAL_SELECTOR = '.fade-up:not(.visible), .clip-reveal:not(.visible)'

/**
 * Reveals `.fade-up` / `.clip-reveal` elements when they enter the viewport.
 * Uses a MutationObserver so dynamically imported sections (e.g. FilmstripSection)
 * still get observed after the initial paint.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
    )

    const observeNew = () => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el))
    }

    observeNew()

    const mutationObserver = new MutationObserver(observeNew)
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])
}
