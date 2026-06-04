'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { STAY_TYPES, VIBES, GUEST_TYPES, type StayType, type Vibe, type GuestType } from '@/lib/listing-generator/types'

interface ManualFormProps {
  onSubmit: (formData: Record<string, unknown>) => void
  onBack: () => void
}

export default function ManualForm({ onSubmit, onBack }: ManualFormProps) {
  const [stayType, setStayType] = useState<StayType | ''>('')
  const [propertyName, setPropertyName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [sleeps, setSleeps] = useState('')
  const [feature1, setFeature1] = useState('')
  const [feature2, setFeature2] = useState('')
  const [feature3, setFeature3] = useState('')
  const [vibe, setVibe] = useState<Vibe | ''>('')
  const [targetGuest, setTargetGuest] = useState<GuestType | ''>('')
  const [currentDescription, setCurrentDescription] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: string[] = []

    if (!stayType) newErrors.push('Stay type is required')
    if (!propertyName.trim()) newErrors.push('Property name is required')
    if (!city.trim()) newErrors.push('City is required')
    if (!state.trim()) newErrors.push('State is required')
    if (!bedrooms || Number(bedrooms) < 0) newErrors.push('Bedrooms is required')
    if (!bathrooms || Number(bathrooms) < 0) newErrors.push('Bathrooms is required')
    if (!sleeps || Number(sleeps) < 1) newErrors.push('Sleeps is required')
    if (!feature1.trim() || !feature2.trim() || !feature3.trim()) newErrors.push('All 3 standout features are required')
    if (!vibe) newErrors.push('Vibe is required')

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      stayType,
      propertyName: propertyName.trim(),
      city: city.trim(),
      state: state.trim(),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      sleeps: Number(sleeps),
      standoutFeatures: [feature1.trim(), feature2.trim(), feature3.trim()],
      vibe,
      targetGuest: targetGuest || undefined,
      currentDescription: currentDescription.trim() || undefined,
    })
  }

  const inputClasses = 'min-h-11 w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal transition-colors placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta'

  return (
    <section className="grain-overlay relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={onBack}
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-[3px] px-2 py-2 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-charcoal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to URL input
        </button>

        <h1 className="font-display text-4xl font-semibold text-charcoal sm:text-5xl">
          Describe your stay
        </h1>
        <p className="mt-3 font-body text-base text-muted-foreground">
          Fill in the details and our AI will craft a listing description that does your property justice.
        </p>

        {errors.length > 0 && (
          <div className="mt-6 rounded-[3px] border border-terracotta/25 bg-terracotta/5 p-4" role="alert">
            <ul className="space-y-1 font-body text-sm text-terracotta">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="stayType" className="mb-2 block font-body text-sm font-bold text-charcoal">Stay type *</label>
            <select id="stayType" value={stayType} onChange={(e) => setStayType(e.target.value as StayType)} className={inputClasses}>
              <option value="">Select stay type...</option>
              {STAY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="propertyName" className="mb-2 block font-body text-sm font-bold text-charcoal">Property name or location *</label>
            <input id="propertyName" type="text" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="e.g. Catskills Pine Treehouse" className={inputClasses} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-2 block font-body text-sm font-bold text-charcoal">City *</label>
              <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Woodstock" className={inputClasses} />
            </div>
            <div>
              <label htmlFor="state" className="mb-2 block font-body text-sm font-bold text-charcoal">State *</label>
              <input id="state" type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="New York" className={inputClasses} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-3">
            <div>
              <label htmlFor="bedrooms" className="mb-2 block font-body text-sm font-bold text-charcoal">Bedrooms *</label>
              <input id="bedrooms" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="bathrooms" className="mb-2 block font-body text-sm font-bold text-charcoal">Bathrooms *</label>
              <input id="bathrooms" type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="sleeps" className="mb-2 block font-body text-sm font-bold text-charcoal">Sleeps *</label>
              <input id="sleeps" type="number" min="1" value={sleeps} onChange={(e) => setSleeps(e.target.value)} className={inputClasses} />
            </div>
          </div>

          <div>
            <span className="mb-2 block font-body text-sm font-bold text-charcoal">Top 3 standout features *</span>
            <div className="space-y-3">
              {[
                { val: feature1, set: setFeature1, placeholder: 'Feature 1 (e.g. Stargazing deck)' },
                { val: feature2, set: setFeature2, placeholder: 'Feature 2 (e.g. Wood-burning stove)' },
                { val: feature3, set: setFeature3, placeholder: 'Feature 3 (e.g. Hot tub)' },
              ].map(({ val, set, placeholder }, i) => (
                <input key={i} type="text" value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={inputClasses} />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="vibe" className="mb-2 block font-body text-sm font-bold text-charcoal">Overall vibe *</label>
            <select id="vibe" value={vibe} onChange={(e) => setVibe(e.target.value as Vibe)} className={inputClasses}>
              <option value="">Select vibe...</option>
              {VIBES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="targetGuest" className="mb-2 block font-body text-sm font-bold text-charcoal">Target guest</label>
            <select id="targetGuest" value={targetGuest} onChange={(e) => setTargetGuest(e.target.value as GuestType)} className={inputClasses}>
              <option value="">Select target guest...</option>
              {GUEST_TYPES.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="currentDescription" className="mb-2 block font-body text-sm font-bold text-charcoal">Current description (optional)</label>
            <textarea
              id="currentDescription"
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              rows={4}
              placeholder="Paste your existing listing description if you have one..."
              className="w-full rounded-[3px] border border-sand bg-warm-white px-4 py-3 font-body text-sm text-charcoal placeholder:text-muted-foreground focus-visible:border-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            />
          </div>

          <button
            type="submit"
            className="min-h-12 w-full rounded-[3px] bg-terracotta px-6 py-3 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-warm-white transition-colors hover:bg-terracotta-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
          >
            Generate Description
          </button>
        </form>
      </div>
    </section>
  )
}
