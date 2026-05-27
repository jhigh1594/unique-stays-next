import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, ChevronRight } from 'lucide-react'
import StayCard from '@/components/StayCard'
import {
  getPseoBreadcrumbJsonLd,
  getPseoFaqs,
  getPseoFaqJsonLd,
  getPseoIntro,
  getPseoItemListJsonLd,
  getPseoMetadata,
  getPseoPageTitle,
  getPseoRelatedSpokes,
  getPseoRelatedStates,
  getPseoRouteParams,
  getPseoStats,
  resolvePseoRouteContext,
} from '@/lib/pseo'
import { getStaysBySpokeAndState } from '@/lib/payload-queries'

type PageParams = {
  spoke: string
  state: string
}

export const dynamicParams = false
export const revalidate = 3600

export function generateStaticParams() {
  return getPseoRouteParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { spoke, state } = await params
  const context = resolvePseoRouteContext({ spoke, state })
  if (!context) return {}

  const stays = await getStaysBySpokeAndState(context.spoke, context.stateConfig.name)
  return getPseoMetadata(context, stays.length)
}

export default async function SpokeStatePage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { spoke, state } = await params
  const context = resolvePseoRouteContext({ spoke, state })
  if (!context) notFound()

  const stays = await getStaysBySpokeAndState(context.spoke, context.stateConfig.name)
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://uniquestaysusa.com').replace(/\/$/, '')
  const { config, stateConfig } = context
  const relatedStates = getPseoRelatedStates(context.state, 6)
  const relatedSpokes = getPseoRelatedSpokes(context.spoke)
  const pageTitle = getPseoPageTitle(config, stateConfig.name)
  const stats = getPseoStats(stays)
  const intro = getPseoIntro(config, stateConfig.name, stays.length, stats)
  const itemListJsonLd = getPseoItemListJsonLd({ baseUrl, config, stateName: stateConfig.name, stays })
  const breadcrumbJsonLd = getPseoBreadcrumbJsonLd({ baseUrl, config, stateConfig })
  const faqs = getPseoFaqs(config, stateConfig.name)
  const faqJsonLd = faqs.length > 0 ? getPseoFaqJsonLd(faqs) : null
  const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <section className="relative overflow-hidden border-b border-[oklch(0.88_0.025_75)]">
        <div className="absolute inset-0">
          <img
            src={config.heroImage}
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, oklch(0.12 0.02 60 / 0.92), oklch(0.12 0.02 60 / 0.48), oklch(0.12 0.02 60 / 0.35))',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[460px] max-w-[1320px] flex-col justify-end px-4 pb-12 pt-32 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center gap-2">
            <Link
              href={`/${context.spoke}`}
              className="text-xs font-semibold uppercase tracking-widest opacity-75 transition-opacity hover:opacity-100"
              style={{ color: 'oklch(0.99 0.005 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {config.title}
            </Link>
            <ChevronRight className="h-3 w-3 opacity-55" style={{ color: 'oklch(0.99 0.005 85)' }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {stateConfig.name}
            </span>
          </div>

          <div className="max-w-3xl">
            <p
              className="mb-4 inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{
                background: `${config.accentColor}33`,
                color: 'oklch(0.99 0.005 85)',
                border: '1px solid oklch(0.99 0.005 85 / 0.2)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {stateConfig.region} collection
            </p>
            <h1
              className="mb-5 text-5xl font-bold leading-tight md:text-6xl"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.99 0.005 85)' }}
            >
              {pageTitle}
            </h1>
            <p
              className="max-w-2xl text-lg leading-relaxed"
              style={{ color: 'oklch(0.88 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {intro}
            </p>
            <p
              className="mt-3 text-xs"
              style={{ color: 'oklch(0.70 0.01 85)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Last updated {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 border-b border-[oklch(0.88_0.025_75)] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {stays.length === 1 ? '1 stay' : `${stays.length} stays`}
              </p>
              <h2
                className="text-3xl font-bold"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Browse the {stateConfig.name} shortlist
              </h2>
            </div>
            <Link
              href={`/${context.spoke}`}
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all hover:gap-3"
              style={{ color: config.accentColor, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              View all {config.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {stays.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stays.map((stay, index) => (
                <StayCard
                  key={stay.id}
                  stay={stay}
                  accentColor={config.accentColor}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div
              className="border border-[oklch(0.88_0.025_75)] px-6 py-12 text-center"
              style={{ background: 'oklch(0.99 0.005 85)', borderRadius: '6px' }}
            >
              <h2
                className="mb-2 text-2xl font-bold"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                More {stateConfig.name} stays are being reviewed
              </h2>
              <p
                className="mx-auto max-w-xl text-sm leading-relaxed"
                style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                This page is part of the UniqueStaysUSA state collection. Check the broader hub while we add more verified listings for this exact combination.
              </p>
            </div>
          )}
        </div>
      </section>

      {faqs.length > 0 && (
        <section
          className="py-14 border-t border-[oklch(0.88_0.025_75)]"
          style={{ background: 'oklch(0.965 0.015 85)' }}
        >
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-6 text-2xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group border"
                  style={{ borderColor: 'oklch(0.84 0.025 75)', borderRadius: '6px' }}
                >
                  <summary
                    className="cursor-pointer px-5 py-4 text-sm font-semibold"
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'oklch(0.22 0.01 60)' }}
                  >
                    {faq.question}
                  </summary>
                  <p
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        className="border-t border-[oklch(0.88_0.025_75)] py-14"
        style={{ background: 'oklch(0.99 0.005 85)' }}
      >
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Related states
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedStates.map((relatedState) => (
                <Link
                  key={relatedState.slug}
                  href={`/${context.spoke}/${relatedState.slug}`}
                  className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[oklch(0.94_0.02_75)]"
                  style={{
                    borderColor: 'oklch(0.84 0.025 75)',
                    color: 'oklch(0.34 0.025 60)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {relatedState.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              More ways to browse {stateConfig.name}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relatedSpokes.map((relatedSpoke) => (
                <Link
                  key={relatedSpoke.slug}
                  href={`/${relatedSpoke.slug}/${context.state}`}
                  className="group flex items-center justify-between border p-4 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: relatedSpoke.accentColorLight,
                    borderColor: `${relatedSpoke.accentColor}40`,
                    borderRadius: '6px',
                  }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
                  >
                    {relatedSpoke.title}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: relatedSpoke.accentColor }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
