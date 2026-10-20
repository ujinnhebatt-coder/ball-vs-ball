/**
 * Post-build: menggabungkan CSS dan JS ke dalam satu file HTML mandiri.
 *
 * Dipakai untuk hosting statis tanpa server (GitHub raw, CDN, dsb.) yang
 * menyajikan berkas non-HTML dengan content-type generik seperti text/plain,
 * sehingga browser menolak memuat modul JS maupun stylesheet.
 *
 * Jalankan: node scripts/inline-build.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'dist')

/** Menutup tag script di dalam string literal agar tidak merusak HTML. */
function escapeForInlineScript(code) {
  return code.replace(/<\/script/gi, '<\\/script')
}

async function main() {
  const html = await readFile(resolve(distDir, 'index.html'), 'utf8')

  const scriptMatch = html.match(
    /<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/,
  )
  const styleMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)

  if (!scriptMatch || !styleMatch) {
    throw new Error('Tidak menemukan script module atau stylesheet di dist/index.html')
  }

  const scriptPath = resolve(distDir, scriptMatch[1].replace(/^\.?\//, ''))
  const stylePath = resolve(distDir, styleMatch[1].replace(/^\.?\//, ''))

  const scriptCode = await readFile(scriptPath, 'utf8')
  const styleCode = await readFile(stylePath, 'utf8')

  let output = html
    .replace(scriptMatch[0], `<script type="module">\n${escapeForInlineScript(scriptCode)}\n</script>`)
    .replace(styleMatch[0], `<style>\n${styleCode}\n</style>`)

  const outDir = resolve(root, 'dist-single')
  await mkdir(outDir, { recursive: true })
  await writeFile(resolve(outDir, 'index.html'), output, 'utf8')

  const kb = (Buffer.byteLength(output) / 1024).toFixed(1)
  console.log(`OK  dist-single/index.html (${kb} kB, single file)`)
}

main().catch((error) => {
  console.error('GAGAL:', error.message)
  process.exit(1)
})
