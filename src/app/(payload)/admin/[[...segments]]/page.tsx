import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import config from '@payload-config'

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  return generatePageMetadata({ config, params })
}

type Args = {
  params: Promise<{
    segments: string[]
  }>
}

const Page = ({ params }: Args) => RootPage({ config, params, importMap })

export default Page
