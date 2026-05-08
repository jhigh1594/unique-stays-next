'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.975 0.012 85)' }}>
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'oklch(0.55 0.14 38)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Know a hidden gem?
            </p>
            <h1
              className="text-5xl font-bold mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
            >
              Submit a
              <span style={{ fontStyle: 'italic', color: 'oklch(0.55 0.14 38)' }}> Stay</span>
            </h1>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Found a treehouse, dome, lighthouse, or other extraordinary place that deserves to be on our radar? Tell us about it. We review every submission personally.
            </p>
          </div>

          {submitted ? (
            <div
              className="p-10 rounded-2xl text-center"
              style={{ background: 'oklch(0.93 0.025 75)', border: '1.5px solid oklch(0.88 0.025 75)' }}
            >
              <div className="text-4xl mb-4">🎉</div>
              <h2
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: 'Fraunces, serif', color: 'oklch(0.22 0.01 60)' }}
              >
                Thanks for the tip!
              </h2>
              <p
                className="text-sm"
                style={{ color: 'oklch(0.45 0.03 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                We&apos;ll review your submission and reach out if it makes the cut. Expect to hear from us within 2 weeks.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { label: 'Stay Name', placeholder: 'e.g. The Redwood Treehouse', type: 'text', required: true },
                { label: 'Location (City, State)', placeholder: 'e.g. Guerneville, California', type: 'text', required: true },
                { label: 'Listing URL', placeholder: 'Airbnb, VRBO, or direct booking link', type: 'url', required: true },
                { label: 'Your Name', placeholder: 'Optional', type: 'text', required: false },
                { label: 'Your Email', placeholder: 'So we can follow up', type: 'email', required: false },
              ].map((field) => (
                <div key={field.label}>
                  <label
                    className="block text-sm font-semibold mb-1.5"
                    style={{ color: 'oklch(0.30 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {field.label} {field.required && <span style={{ color: 'oklch(0.55 0.14 38)' }}>*</span>}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'oklch(0.99 0.005 85)',
                      border: '1.5px solid oklch(0.88 0.025 75)',
                      color: 'oklch(0.22 0.01 60)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  />
                </div>
              ))}

              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'oklch(0.30 0.02 60)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Why is it extraordinary?
                </label>
                <textarea
                  placeholder="Tell us what makes this stay special..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 transition-all resize-none"
                  style={{
                    background: 'oklch(0.99 0.005 85)',
                    border: '1.5px solid oklch(0.88 0.025 75)',
                    color: 'oklch(0.22 0.01 60)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                style={{
                  background: 'oklch(0.55 0.14 38)',
                  color: 'oklch(0.99 0.005 85)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Submit Your Stay <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
