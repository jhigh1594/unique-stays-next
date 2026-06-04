'use client'

import { useMemo, useState } from 'react'
import { Calculator, Hammer, Mail, MapPinned, ReceiptText, Trees } from 'lucide-react'
import {
  BUILD_REGIONS,
  FINISH_LEVELS,
  SITE_COMPLEXITIES,
  STRUCTURE_TYPES,
  calculateBuildCost,
  getStructureProfiles,
  type BuildCostInput,
  type BuildRegion,
  type FinishLevel,
  type SiteComplexity,
  type StructureType,
} from '@/lib/build-cost-calculator'

const profiles = getStructureProfiles()

const finishLabels: Record<FinishLevel, string> = {
  lean: 'Lean',
  'guest-ready': 'Guest-ready',
  premium: 'Premium',
}

const siteLabels: Record<SiteComplexity, string> = {
  simple: 'Simple site',
  moderate: 'Moderate site',
  difficult: 'Difficult site',
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function money(value: number) {
  return currency.format(value)
}

function moneyRange(range: { low: number; high: number }) {
  return `${money(range.low)} to ${money(range.high)}`
}

export default function BuildCostCalculatorClient() {
  const [input, setInput] = useState<BuildCostInput>({
    structureType: 'treehouse',
    squareFeet: profiles.treehouse.baseSquareFeet,
    region: 'South',
    finishLevel: 'guest-ready',
    siteComplexity: 'moderate',
    nightlyRate: undefined,
    includeFinancing: false,
  })

  const result = useMemo(() => calculateBuildCost(input), [input])

  const update = <K extends keyof BuildCostInput>(key: K, value: BuildCostInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }))
  }

  const handleStructureChange = (structureType: StructureType) => {
    setInput((current) => ({
      ...current,
      structureType,
      squareFeet: profiles[structureType].baseSquareFeet,
      nightlyRate: undefined,
    }))
  }

  return (
    <main className="bg-cream text-charcoal">
      <section className="grain-overlay relative overflow-hidden px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-[2px] border border-terracotta/35 bg-warm-white px-3 py-2 font-body text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracotta">
              <Hammer className="h-4 w-4" aria-hidden="true" />
              Build Cost Calculator
            </div>

            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] text-charcoal sm:text-6xl lg:text-7xl">
              Price the stay before you pour the footings.
            </h1>

            <p className="mt-6 max-w-2xl font-body text-base leading-7 text-muted-foreground sm:text-lg">
              Sketch a first budget for a treehouse, dome, yurt, A-frame, tiny house, cabin, or glamping tent. The estimate includes build cost, soft costs, furnishings, revenue, and payback range.
            </p>

            <div className="mt-8 rounded-[3px] border border-sand bg-warm-white p-5 shadow-[0_18px_45px_oklch(0.22_0.01_60_/_0.08)]">
              <div className="flex items-start gap-3">
                <MapPinned className="mt-1 h-5 w-5 flex-shrink-0 text-forest" aria-hidden="true" />
                <div>
                  <h2 className="font-body text-sm font-extrabold uppercase tracking-[0.14em] text-charcoal">
                    Early planning range
                  </h2>
                  <p className="mt-2 font-body text-sm leading-6 text-muted-foreground">
                    Use this to compare structures and spot budget pressure. Before buying land, confirm zoning, builder pricing, utilities, and local comps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <section
              className="rounded-[3px] border border-sand bg-warm-white p-5 shadow-[10px_18px_50px_oklch(0.22_0.01_60_/_0.10)] sm:p-6"
              aria-labelledby="calculator-inputs"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 id="calculator-inputs" className="font-display text-2xl font-semibold text-charcoal">
                    Project Notes
                  </h2>
                  <p className="mt-1 font-body text-sm text-muted-foreground">
                    Choose the closest version of the project you are considering.
                  </p>
                </div>
                <Calculator className="h-6 w-6 flex-shrink-0 text-terracotta" aria-hidden="true" />
              </div>

              <div className="space-y-6">
                <fieldset>
                  <legend className="mb-3 font-body text-sm font-bold text-charcoal">Structure</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {STRUCTURE_TYPES.map((type) => {
                      const selected = input.structureType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleStructureChange(type)}
                          className={`min-h-14 rounded-[3px] border px-3 py-3 text-left font-body transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                            selected
                              ? 'border-terracotta bg-terracotta text-warm-white'
                              : 'border-sand bg-cream text-charcoal hover:border-terracotta/60'
                          }`}
                          aria-pressed={selected}
                        >
                          <span className="block text-sm font-extrabold">{profiles[type].label}</span>
                          <span className={`mt-1 block text-xs ${selected ? 'text-warm-white/80' : 'text-muted-foreground'}`}>
                            {profiles[type].baseSquareFeet} sq ft baseline
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    id="region"
                    label="Region"
                    value={input.region}
                    options={BUILD_REGIONS}
                    getLabel={(value) => value}
                    onChange={(value) => update('region', value as BuildRegion)}
                  />
                  <SelectField
                    id="finish"
                    label="Finish level"
                    value={input.finishLevel}
                    options={FINISH_LEVELS}
                    getLabel={(value) => finishLabels[value]}
                    onChange={(value) => update('finishLevel', value as FinishLevel)}
                  />
                  <SelectField
                    id="site"
                    label="Site complexity"
                    value={input.siteComplexity}
                    options={SITE_COMPLEXITIES}
                    getLabel={(value) => siteLabels[value]}
                    onChange={(value) => update('siteComplexity', value as SiteComplexity)}
                  />
                  <NumberField
                    id="square-feet"
                    label="Interior square feet"
                    value={input.squareFeet}
                    min={120}
                    max={1600}
                    step={20}
                    onChange={(value) =>
                      update(
                        'squareFeet',
                        value === '' ? profiles[input.structureType].baseSquareFeet : value,
                      )
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <NumberField
                    id="nightly-rate"
                    label="Nightly rate override"
                    value={input.nightlyRate ?? ''}
                    min={75}
                    max={1200}
                    step={5}
                    placeholder={`${money(result.projectedNightlyRate)} suggested`}
                    onChange={(value) => update('nightlyRate', value || undefined)}
                  />
                  <label className="flex min-h-12 items-center gap-3 rounded-[3px] border border-sand bg-cream px-4 py-3 font-body text-sm font-semibold text-charcoal">
                    <input
                      type="checkbox"
                      checked={input.includeFinancing}
                      onChange={(event) => update('includeFinancing', event.target.checked)}
                      className="h-4 w-4 accent-terracotta"
                    />
                    Include debt estimate
                  </label>
                </div>
              </div>
            </section>

            <section
              className="rounded-[3px] border border-[oklch(0.72_0.04_75)] bg-[oklch(0.965_0.016_82)] p-5 shadow-[0_14px_40px_oklch(0.22_0.01_60_/_0.08)] sm:p-6"
              aria-labelledby="calculator-results"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="stamp-badge text-terracotta">{result.confidence}</p>
                  <h2 id="calculator-results" className="mt-3 font-display text-3xl font-semibold text-charcoal">
                    {profiles[input.structureType].label} estimate
                  </h2>
                  <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-muted-foreground">
                    {result.structure.description}
                  </p>
                </div>
                <Trees className="h-9 w-9 text-forest" aria-hidden="true" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <ResultStat label="Total build range" value={moneyRange(result.totalBuildCost)} />
                <ResultStat label="Annual net" value={money(result.annualNetRevenue)} />
                <ResultStat label="Payback" value={`${result.paybackYears.low} to ${result.paybackYears.high} yrs`} />
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(260px,1fr)]">
                <div className="rounded-[3px] border border-sand bg-warm-white p-4">
                  <h3 className="font-body text-sm font-extrabold uppercase tracking-[0.14em] text-charcoal">
                    Budget Breakdown
                  </h3>
                  <dl className="mt-4 space-y-3 font-body text-sm">
                    <BreakdownRow label="Hard build cost" value={moneyRange(result.hardCost)} />
                    <BreakdownRow label="Permits and design" value={moneyRange(result.permitsAndDesign)} />
                    <BreakdownRow label="Furnishings" value={moneyRange(result.furnishings)} />
                    <BreakdownRow label="Contingency" value={moneyRange(result.contingency)} />
                  </dl>
                </div>

                <div className="rounded-[3px] border border-sand bg-warm-white p-4">
                  <h3 className="font-body text-sm font-extrabold uppercase tracking-[0.14em] text-charcoal">
                    Revenue Sketch
                  </h3>
                  <dl className="mt-4 space-y-3 font-body text-sm">
                    <BreakdownRow label="Projected nightly rate" value={money(result.projectedNightlyRate)} />
                    <BreakdownRow label="Annual gross" value={money(result.annualGrossRevenue)} />
                    <BreakdownRow label="Operating cost" value={money(result.annualOperatingCost)} />
                    {result.annualFinancingCost > 0 && (
                      <BreakdownRow label="Debt estimate" value={money(result.annualFinancingCost)} />
                    )}
                  </dl>
                </div>
              </div>

              <div className="mt-5 rounded-[3px] border border-forest/25 bg-forest/10 p-4">
                <h3 className="font-body text-sm font-extrabold uppercase tracking-[0.14em] text-forest">
                  Field Note
                </h3>
                <p className="mt-2 font-body text-sm leading-6 text-charcoal">{result.recommendation}</p>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="font-body text-sm font-extrabold uppercase tracking-[0.14em] text-charcoal">
                    Builder Questions
                  </h3>
                  <ul className="mt-3 space-y-2 font-body text-sm leading-6 text-muted-foreground">
                    {result.checklist.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[3px] border border-dashed border-terracotta/45 bg-cream p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-1 h-5 w-5 flex-shrink-0 text-terracotta" aria-hidden="true" />
                    <div>
                      <h3 className="font-body text-sm font-extrabold uppercase tracking-[0.14em] text-charcoal">
                        Want the full host packet?
                      </h3>
                      <p className="mt-2 font-body text-sm leading-6 text-muted-foreground">
                        Soon: email yourself the estimate with comp prompts, builder questions, and a permitting checklist.
                      </p>
                      <a
                        href="#newsletter"
                        className="mt-4 inline-flex min-h-11 items-center rounded-[3px] bg-terracotta px-5 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
                      >
                        Get Weekly Host Notes
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[3px] border border-sand bg-warm-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ReceiptText className="mt-1 h-5 w-5 flex-shrink-0 text-terracotta" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-2xl font-semibold text-charcoal">How this estimate works</h2>
                  <p className="mt-2 font-body text-sm leading-6 text-muted-foreground">
                    The calculator combines structure-specific cost ranges, regional construction multipliers, finish level, site complexity, furnishing budgets, contingency, and conservative occupancy assumptions. It is a planning tool, not a bid.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  getLabel,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: readonly T[]
  getLabel: (value: T) => string
  onChange: (value: T) => void
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block font-body text-sm font-bold text-charcoal">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-12 w-full rounded-[3px] border border-sand bg-cream px-3 py-3 font-body text-sm font-semibold text-charcoal transition-colors focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: number | ''
  min: number
  max: number
  step: number
  placeholder?: string
  onChange: (value: number | '') => void
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block font-body text-sm font-bold text-charcoal">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value
          onChange(next === '' ? '' : Number(next))
        }}
        className="min-h-12 w-full rounded-[3px] border border-sand bg-cream px-3 py-3 font-body text-sm font-semibold text-charcoal transition-colors placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      />
    </label>
  )
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-sand bg-warm-white p-4">
      <dt className="font-body text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 font-display text-2xl font-semibold leading-tight text-charcoal">{value}</dd>
    </div>
  )
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-sand/60 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-bold text-charcoal">{value}</dd>
    </div>
  )
}
