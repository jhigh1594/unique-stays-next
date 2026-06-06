import { metrics, trace } from '@opentelemetry/api'
import { logs, SeverityNumber } from '@opentelemetry/api-logs'
import { register } from '../instrumentation.ts'

register()

const tracer = trace.getTracer('uniquestaysusa.smoke')
const meter = metrics.getMeter('uniquestaysusa.smoke')
const counter = meter.createCounter('smoke.check')
const logger = logs.getLogger('uniquestaysusa.smoke')

await tracer.startActiveSpan('smoke.ping', async (span) => {
  span.setAttribute('smoke', true)
  counter.add(1, { outcome: 'success' })
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'superlog smoke check',
    attributes: { outcome: 'success' },
  })
  span.end()
})

await new Promise((resolve) => setTimeout(resolve, 4000))
console.log('superlog smoke finished — check Superlog ingest for trace, log, and metric')
