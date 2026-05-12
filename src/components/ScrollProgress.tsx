'use client'

import { useScroll, useSpring, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function ScrollProgress() {
  const pathname = usePathname()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { damping: 30, stiffness: 200 })

  if (pathname === '/journal') return null

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[9996] pointer-events-none"
      style={{
        height: '2.5px',
        scaleX,
        transformOrigin: 'left center',
        background: 'oklch(0.72 0.10 40)',
      }}
    />
  )
}
