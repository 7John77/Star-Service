import { handlePrices } from './server/prices.js'
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { execFileSync } from 'node:child_process'

execFileSync(process.execPath, ['build.mjs'], { stdio: 'inherit' })
const { default: worker } = await import('./dist/server/index.js')
const portArgument = process.argv.indexOf('--port')
const port = Number(portArgument < 0 ? process.env.PORT || 3000 : process.argv[portArgument + 1])
createServer(async (incoming, outgoing) => {
  const headers = new Headers(incoming.headers)
  const method = incoming.method
  const request = new Request('http://' + incoming.headers.host + incoming.url, {
    method, headers, ...(['GET', 'HEAD'].includes(method) ? {} : { body: Readable.toWeb(incoming), duplex: 'half' }),
  })
  const path = new URL(request.url).pathname
  if (path === '/admin') {
    outgoing.writeHead(308, { Location: '/admin/' }).end()
    return
  }
  const response = await (path === '/api/prices' ? handlePrices(request) : worker.fetch(request))
  outgoing.writeHead(response.status, Object.fromEntries(response.headers))
  if (response.body) Readable.fromWeb(response.body).pipe(outgoing)
  else outgoing.end()
}).listen(port, '0.0.0.0', () => console.log('Star Service preview on port ' + port))
