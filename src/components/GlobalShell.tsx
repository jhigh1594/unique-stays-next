'use client'

import dynamic from 'next/dynamic'
import { Toaster } from 'sonner'
import ScrollProgress from './ScrollProgress'
// import CustomCursor from './CustomCursor'

const LoadingSplash = dynamic(() => import('./LoadingSplash'), { ssr: false })

export default function GlobalShell() {
  return (
    <>
      {/* <CustomCursor /> */}
      <LoadingSplash />
      <ScrollProgress />
      <Toaster position="bottom-right" richColors />
    </>
  )
}
