const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ICON_DIR = path.join(__dirname, '..', 'public', 'icons')
const SOURCE = path.join(ICON_DIR, 'icon-source.png')
const SOURCE_MASKABLE = path.join(ICON_DIR, 'icon-source-maskable.png')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const maskableSizes = [192, 512]

const svgSource = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#ffffff" />
  <text x="256" y="300" font-family="sans-serif" font-weight="bold" font-size="200" fill="#000000" text-anchor="middle">BD</text>
</svg>
`

const svgSourceMaskable = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#ffffff" />
  <text x="256" y="280" font-family="sans-serif" font-weight="bold" font-size="120" fill="#000000" text-anchor="middle">BD</text>
</svg>
`

async function run() {
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true })
  }

  if (!fs.existsSync(SOURCE)) {
    console.log('Generating icon-source.png...')
    await sharp(Buffer.from(svgSource)).png().toFile(SOURCE)
  }

  if (!fs.existsSync(SOURCE_MASKABLE)) {
    console.log('Generating icon-source-maskable.png...')
    await sharp(Buffer.from(svgSourceMaskable)).png().toFile(SOURCE_MASKABLE)
  }

  for (const size of sizes) {
    const out = path.join(ICON_DIR, `icon-${size}x${size}.png`)
    await sharp(SOURCE).resize(size, size).png().toFile(out)
    console.log('✓', out)
  }

  for (const size of maskableSizes) {
    const out = path.join(ICON_DIR, `icon-${size}x${size}-maskable.png`)
    await sharp(SOURCE_MASKABLE).resize(size, size).png().toFile(out)
    console.log('✓ (maskable)', out)
  }
}

run().catch((e) => { console.error(e); process.exit(1) })
