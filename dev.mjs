import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { execFileSync } from 'node:child_process'

execFileSync(process.execPath, ['build.mjs'], { stdio: 'inherit' })
const { default: worker } = await import('./dist/server/index.js')
const objects = new Map()
const BUCKET = {
  async put(key, data, options) {
    if (options.onlyIf && objects.has(key)) return null
    objects.set(key, { key, size: data.byteLength, customMetadata: options.customMetadata, data })
  },
  async get(key, { range } = {}) {
    const object = objects.get(key)
    if (!object) return null
    const offset = range?.offset ?? 0
    const bytes = object.data.slice(offset, range?.length ? offset + range.length : undefined)
    return new Response(bytes)
  },
  async head(key) { return objects.get(key) ?? null },
  async delete(key) { objects.delete(key) },
  async list({ prefix, limit, cursor }) {
    const keys = [...objects.keys()].sort().filter(key => key.startsWith(prefix) && (!cursor || key > cursor))
    const batch = keys.slice(0, limit)
    return { objects: batch.map(key => objects.get(key)), truncated: keys.length > batch.length, cursor: batch.at(-1) }
  },
}
const portArgument = process.argv.indexOf('--port')
const port = Number(portArgument < 0 ? process.env.PORT || 3000 : process.argv[portArgument + 1])
createServer(async (incoming, outgoing) => {
  const headers = new Headers(incoming.headers)
  headers.set('oai-authenticated-user-id', 'local-preview')
  const method = incoming.method
  const request = new Request('http://' + incoming.headers.host + incoming.url, {
    method, headers, ...(['GET', 'HEAD'].includes(method) ? {} : { body: Readable.toWeb(incoming), duplex: 'half' }),
  })
  const response = await worker.fetch(request, { BUCKET })
  outgoing.writeHead(response.status, Object.fromEntries(response.headers))
  if (response.body) Readable.fromWeb(response.body).pipe(outgoing)
  else outgoing.end()
}).listen(port, '0.0.0.0', () => console.log('Star Service preview on port ' + port))
