'use client'

import { Toaster } from 'sonner'
import ScrollProgress from './ScrollProgress'
// import CustomCursor from './CustomCursor'

export default function GlobalShell() {
  return (
    <>
      {/* <CustomCursor /> */}
      <ScrollProgress />
      <Toaster position="bottom-right" richColors />
    </>
  )
}
