import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })

  await payload.update({
    collection: 'stays',
    id: 259,
    data: {
      imageUrl: 'https://a0.muscache.com/im/pictures/miso/Hosting-13761529/original/329b4608-26d0-4492-ab99-331fd4d6c00c.jpeg'
    }
  })

  console.log('Updated imageUrl for stay 259')
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
