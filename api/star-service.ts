import { createHash, timingSafeEqual } from 'node:crypto'
import { waitUntil } from '@vercel/functions'
import worker from '../dist/server/index.js'
import { createBucket } from '../server/r2.js'

const env = process.env
const bucket = createBucket(env)
const digest = (value: string) => createHash('sha256').update(value).digest()
const inboxPassword = env.STAR_SERVICE_INBOX_PASSWORD
const inboxCredential = inboxPassword && Buffer.from('star-service:' + inboxPassword, 'utf8').toString('base64')
const expected = inboxCredential ? digest('Basic ' + inboxCredential) : null

export default {
  async fetch(request: Request) {
    const url = new URL(request.url)
    if (url.pathname === '/api/star-service') {
      const route = url.searchParams.get('__star_route')
      if (route === '/inbox' || route === '/api/studies' || route === '/api/inbox' || route?.startsWith('/api/inbox/')) {
        url.pathname = route
        url.searchParams.delete('__star_route')
      }
    }
    const headers = new Headers(request.headers)
    for (const header of ['oai-authenticated-user-id', 'oai-authenticated-user-email']) headers.delete(header)
    const isInbox = url.pathname === '/inbox' || url.pathname === '/api/inbox' || url.pathname.startsWith('/api/inbox/')
    if (isInbox) {
      if (!expected || !timingSafeEqual(digest(headers.get('authorization') ?? ''), expected)) {
        return new Response('Star Service', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Star Service", charset="UTF-8"', 'Cache-Control': 'no-store' },
        })
      }
      if (!bucket) return new Response('Η αποθήκευση δεν έχει ρυθμιστεί.', { status: 503 })
      headers.set('oai-authenticated-user-id', 'vercel-owner')
    }
    headers.delete('authorization')
    const input = { method: request.method, headers }
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    const forwarded = new Request(url, hasBody ? { ...input, body: request.body, duplex: 'half' } as RequestInit : input)
    return worker.fetch(forwarded, {
      BUCKET: bucket,
      OWNER_PRIVATE_PREVIEW: 'on',
      RESEND_API_KEY: env.RESEND_API_KEY,
      QUOTE_FROM_EMAIL: env.QUOTE_FROM_EMAIL,
      QUOTE_INBOX_URL: env.QUOTE_INBOX_URL,
    }, { waitUntil })
  },
}
