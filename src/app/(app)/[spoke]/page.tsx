import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SPOKES_CONFIG, SPOKE_SLUGS } from '@/lib/spokes-config'
import { getStaysBySpoke } from '@/lib/payload-queries'
import SpokeContent from './_spoke/SpokeContent'

export const dynamicParams = false
export const revalidate = 3600

export function generateStaticParams() {
  return SPOKE_SLUGS.map((slug) => ({ spoke: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ spoke: string }>
}): Promise<Metadata> {
  const { spoke } = await params
  const config = SPOKES_CONFIG[spoke]
  if (!config) return {}
  return {
    title: config.seoTitle,
    description: config.seoDescription,
  }
}

export default async function SpokePage({
  params,
}: {
  params: Promise<{ spoke: string }>
}) {
  const { spoke } = await params
  const config = SPOKES_CONFIG[spoke]
  if (!config) notFound()

  const stays = await getStaysBySpoke(spoke)

  return <SpokeContent slug={spoke} config={config} stays={stays} />
}
