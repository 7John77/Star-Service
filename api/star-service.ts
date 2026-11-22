import worker from '../dist/server/index.js'

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } })

    const url = new URL(request.url)
    url.pathname = '/api/studies'
    const forwarded = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      duplex: 'half',
    } as RequestInit)
    return worker.fetch(forwarded, {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      QUOTE_FROM_EMAIL: process.env.QUOTE_FROM_EMAIL,
    })
  },
}
