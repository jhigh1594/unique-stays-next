'use client'

import { Toaster } from 'sonner'
import LoadingSplash from './LoadingSplash'
import ScrollProgress from './ScrollProgress'
// import CustomCursor from './CustomCursor'

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
