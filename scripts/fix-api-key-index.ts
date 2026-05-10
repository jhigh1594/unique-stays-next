/**
 * Fix missing apiKeyIndex for Payload CMS API key authentication.
 *
 * Root cause: Payload's beforeValidate hook on apiKeyIndex should compute
 * HMAC-SHA256(secret, apiKey) when the API key is set, but it fails silently
 * in certain scenarios (direct DB writes, migration-based key setup). Without
 * the index, Payload's auth strategy can never match the provided key.
 *
 * This script generates a new API key, updates it through Payload (so the
 * encryption hook fires), then writes the HMAC index directly to the database.
 *
 * Usage:
 *   pnpm tsx scripts/fix-api-key-index.ts
 *
 * Requires env vars: PAYLOAD_SECRET, DATABASE_URI, NEXT_PUBLIC_SERVER_URL
 */
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.js'
import crypto from 'crypto'

async function main() {
  const payload = await getPayload({ config: configPromise })
  const secret = payload.secret

  const user = (
    await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
  ).docs[0]

  if (!user) {
    console.error('No user found')
    process.exit(1)
  }

  console.log(`User: ${user.email} (id: ${user.id})`)
  console.log(`Current apiKeyIndex: ${user.apiKeyIndex || 'NULL (broken)'}`)

  // Generate new key
  const newApiKey = crypto.randomBytes(24).toString('hex')
  const apiKeyIndex = crypto.createHmac('sha256', secret).update(newApiKey).digest('hex')

  // Update through Payload so the encryption hook fires on apiKey
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { enableAPIKey: true, apiKey: newApiKey },
    overrideAccess: true,
  })

  // Write the index directly (Payload's beforeValidate hook is unreliable here)
  const pool = payload.db.pool
  await pool.query('UPDATE users SET api_key_index = $1 WHERE id = $2', [apiKeyIndex, user.id])

  // Verify
  const check = await pool.query('SELECT api_key_index FROM users WHERE id = $1', [user.id])
  const stored = check.rows[0]?.api_key_index
  if (stored !== apiKeyIndex) {
    console.error('Verification failed — index not stored correctly')
    process.exit(1)
  }

  console.log(`apiKeyIndex: ${apiKeyIndex.substring(0, 12)}... (${stored === apiKeyIndex ? 'verified' : 'MISMATCH'})`)
  console.log(`\nNew API Key: ${newApiKey}`)
  console.log('\nUpdate any external tools (OpenClaw, etc.) with this new key.')

  await payload.destroy()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
