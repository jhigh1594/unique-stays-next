'use client'

import { Toaster } from 'sonner'
import CustomCursor from './CustomCursor'
import LoadingSplash from './LoadingSplash'
import ScrollProgress from './ScrollProgress'

export default function GlobalShell() {
  return (
    <>
      <CustomCursor />
      <LoadingSplash />
      <ScrollProgress />
      <Toaster position="bottom-right" richColors />
    </>
  )
}
