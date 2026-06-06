import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { registerOTel } from '@vercel/otel'

const SUPERLOG_ENDPOINT = 'https://intake.superlog.sh'
const SUPERLOG_PUBLIC_TOKEN = 'sl_public_J1Q8yKVoJGwnxDM5VzHCiO7Qnw-RnKS-47N1lWkU6K4'

function superlogHeaders(token: string): Record<string, string> {
  return { 'x-api-key': token }
}

const superlogTraceExporter = new OTLPTraceExporter({
  url: `${SUPERLOG_ENDPOINT}/v1/traces`,
  headers: superlogHeaders(SUPERLOG_PUBLIC_TOKEN),
})

const superlogLogExporter = new OTLPLogExporter({
  url: `${SUPERLOG_ENDPOINT}/v1/logs`,
  headers: superlogHeaders(SUPERLOG_PUBLIC_TOKEN),
})

const superlogMetricExporter = new OTLPMetricExporter({
  url: `${SUPERLOG_ENDPOINT}/v1/metrics`,
  headers: superlogHeaders(SUPERLOG_PUBLIC_TOKEN),
})

function deploymentEnvironmentName(): string {
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'production' || vercelEnv === 'preview' || vercelEnv === 'development') {
    return vercelEnv
  }
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'
  if (nodeEnv === 'test') return 'test'
  return 'local'
}

export function register() {
  registerOTel({
    serviceName: 'uniquestaysusa',
    attributes: {
      'deployment.environment.name': deploymentEnvironmentName(),
      'vcs.repository.url.full': 'https://github.com/jhigh1594/unique-stays-next',
    },
    traceExporter: superlogTraceExporter,
    logRecordProcessors: [new BatchLogRecordProcessor(superlogLogExporter)],
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: superlogMetricExporter,
      }),
    ],
  })
}
