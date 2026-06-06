import { metrics, trace } from '@opentelemetry/api'

export const tracer = trace.getTracer('uniquestaysusa.web')
export const meter = metrics.getMeter('uniquestaysusa.web')

export const listingDescriptionGenerated = meter.createCounter('listing.description.generated')
export const newsletterSubscribed = meter.createCounter('newsletter.subscribed')
