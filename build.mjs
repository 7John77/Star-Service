import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { dirname } from 'node:path'
import { mkdir, readdir, readFile, writeFile, copyFile } from 'node:fs/promises'

await mkdir('dist/server', { recursive: true })
await mkdir('dist/.openai', { recursive: true })
const assets = {
  '/inter-greek.woff2': ['inter-greek.woff2', 'font/woff2'],
  '/inter-latin.woff2': ['inter-latin.woff2', 'font/woff2'],
  '/catalogue.json': ['catalogue.json', 'application/json; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/fonts.css': ['fonts.css', 'text/css; charset=utf-8'],
  '/commissioner-greek.woff2': ['commissioner-greek.woff2', 'font/woff2'],
  '/commissioner-latin.woff2': ['commissioner-latin.woff2', 'font/woff2'],
  '/space-grotesk-latin.woff2': ['space-grotesk-latin.woff2', 'font/woff2'],
  '/star-service-logo.svg': ['star-service-logo.svg', 'image/svg+xml'],
  '/star-service-logo-dark.svg': ['star-service-logo-dark.svg', 'image/svg+xml'],
  '/star-service-icon.svg': ['star-service-icon.svg', 'image/svg+xml'],
  '/star-service-icon.png': ['star-service-icon.png', 'image/png'],
  '/extinguisher-preview.webp': ['extinguisher-preview.webp', 'image/webp'],
  '/inspection-label.webp': ['inspection-label.webp', 'image/webp'],
  '/hero.webp': ['hero.webp', 'image/webp'],
}
for (const file of await readdir('src/legacy')) {
  if (file.endsWith('.webp')) assets['/legacy/' + file] = ['legacy/' + file, 'image/webp']
}
const bundle = await build({ entryPoints: ['src/site.js'], bundle: true, write: false, format: 'esm', minify: true })
const siteScript = bundle.outputFiles[0].text
const sitePath = '/site-' + createHash('sha256').update(siteScript).digest('hex').slice(0, 12) + '.js'
const stylesheet = await readFile('src/style.css', 'utf8')
const stylePath = '/style-' + createHash('sha256').update(stylesheet).digest('hex').slice(0, 12) + '.css'
const template = (await readFile('src/index.html', 'utf8')).replace('/site.js', sitePath).replace('/style.css', stylePath)
function page(english) {
  return {
    body: template.replace(/\[\[([^|]*?)\|([^]*?)\]\]/g, (_, greek, en) => english ? en : greek),
    type: 'text/html; charset=utf-8',
  }
}
const embedded = { '/': page(false), '/en/': page(true) }
for (const [path, [name, type]] of Object.entries(assets)) {
  const data = await readFile('src/' + name)
  embedded[path] = { body: data.toString(/^(image|font)\//.test(type) ? 'base64' : 'utf8'), type }
}
embedded[stylePath] = { body: stylesheet, type: 'text/css; charset=utf-8' }
embedded[sitePath] = embedded['/site.js'] = { body: siteScript, type: 'text/javascript; charset=utf-8' }
const admin = await build({ entryPoints: ['src/admin.js'], bundle: true, write: false, format: 'esm', minify: true })
embedded['/admin/'] = { body: await readFile('src/admin.html', 'utf8'), type: 'text/html; charset=utf-8' }
embedded['/admin.js'] = { body: admin.outputFiles[0].text, type: 'text/javascript; charset=utf-8' }
embedded['/admin.css'] = { body: await readFile('src/admin.css', 'utf8'), type: 'text/css; charset=utf-8' }
const worker = await readFile('src/worker.js', 'utf8')
const quoteNeeds = JSON.parse(await readFile('src/quote-needs.json', 'utf8'))
await writeFile('dist/server/index.js', 'const assets = ' + JSON.stringify(embedded) + '\nconst quoteNeeds = ' + JSON.stringify(quoteNeeds) + '\n' + worker)
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json')

for (const [path, asset] of Object.entries(embedded)) {
  const file = 'dist/public' + (path.endsWith('/') ? path + 'index.html' : path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, /^(image|font)\//.test(asset.type) ? Buffer.from(asset.body, 'base64') : asset.body)
}
