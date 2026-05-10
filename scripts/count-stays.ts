import { getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
const m = await payload.findByID({ collection: 'media', id: 1, depth: 0 })
console.log(JSON.stringify(m, null, 2))
process.exit(0)
