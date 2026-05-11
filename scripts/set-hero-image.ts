// CLI wrapper for the hero image upload utility
// Run: pnpm exec tsx --env-file=.env.local scripts/set-hero-image.ts \
//   --slug best-aframe-cabins-america \
//   --image "https://images.unsplash.com/photo-xxx?fm=jpg&q=85&w=2400" \
//   --alt "A-frame cabin in mountain forest"

import { uploadHeroImage } from './lib/upload-hero.js'

const args = process.argv.slice(2)
function getArg(name: string): string {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1 || !args[idx + 1]) {
    console.error(`Missing required argument: --${name}`)
    process.exit(1)
  }
  return args[idx + 1]
}

const slug = getArg('slug')
const image = getArg('image')
const alt = getArg('alt')
const filename = `${slug}-hero.jpg`

uploadHeroImage({ imageUrl: image, filename, alt, postSlug: slug })
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1) })
