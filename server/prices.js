import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import catalogue from '../src/catalogue.json' with { type: 'json' }
import { productKey } from '../src/catalogue-fields.js'

const pricesKey = 'star-service:prices:v1'
const products = new Set(catalogue.map(productKey))
const cookieName = 'star_service_price_session'
const sessionTime = 8 * 60 * 60
const maxPrice = 99_999_999

const digest = (value) => createHash('sha256').update(value).digest('hex')
const json = (payload, status = 200, headers) => Response.json(payload, {
  status, headers: { 'Cache-Control': 'no-store', ...headers },
})

async function redis(...command) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error('Price storage is unavailable')
  const body = await response.json()
  if (body.error) throw new Error('Price storage command failed')
  return body.result
}

function getCookie(request) {
  const token = (request.headers.get('cookie') || '').match(/(?:^|;\s*)star_service_price_session=([0-9a-f]{64})(?:;|$)/)
  return token?.[1]
}

function sessionKey(token, password) {
  return 'star-service:price-session:' + digest(token + ':' + digest(password))
}

function cookie(value, age, url) {
  const secure = url.protocol === 'https:' || process.env.VERCEL === '1' ? '; Secure' : ''
  return cookieName + '=' + value + '; HttpOnly; SameSite=Strict; Path=/api/prices; Max-Age=' + age + secure
}

async function readPrices() {
  const raw = await redis('HGETALL', pricesKey)
  const prices = Object.create(null)
  for (let index = 0; index < raw.length; index += 2) {
    const key = raw[index]
    const cents = Number(raw[index + 1])
    if (products.has(key) && Number.isInteger(cents) && cents >= 1 && cents <= maxPrice) prices[key] = cents
  }
  return prices
}

async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Expected JSON')
  const body = await request.text()
  if (body.length > 4096) throw new Error('Request too large')
  return JSON.parse(body)
}

export async function handlePrices(request) {
  const url = new URL(request.url)
  const method = request.method
  const admin = url.searchParams.has('admin')
  const storage = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  if (method === 'GET' && !admin) {
    try { return json({ prices: storage ? await readPrices() : {} }) }
    catch { return json({ error: 'storage' }, 503) }
  }

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) return json({ error: 'method' }, 405, { Allow: 'GET, POST, PUT, DELETE' })
  if (method !== 'GET' && request.headers.get('origin') !== url.origin) return json({ error: 'origin' }, 403)

  const password = process.env.STAR_SERVICE_ADMIN_PASSWORD
  if (!storage || !password || password.length < 16) return json({ error: 'configuration' }, 503)

  try {
    if (method === 'POST') {
      const form = await readBody(request).catch(() => null)
      if (typeof form?.password !== 'string' || form.password.length > 256) return json({ error: 'invalid' }, 400)
      const ip = process.env.VERCEL === '1' ? request.headers.get('x-forwarded-for') || 'unknown' : 'local'
      const rateKey = 'star-service:price-login:' + digest(ip)
      const attempts = await redis('EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],900) end; return n", '1', rateKey)
      if (attempts > 12) return json({ error: 'limit' }, 429, { 'Retry-After': '900' })
      if (!timingSafeEqual(Buffer.from(digest(form.password)), Buffer.from(digest(password)))) return json({ error: 'credentials' }, 401)
      const token = randomBytes(32).toString('hex')
      await redis('SET', sessionKey(token, password), '1', 'EX', sessionTime)
      return json({ authenticated: true }, 200, { 'Set-Cookie': cookie(token, sessionTime, url) })
    }

    const token = getCookie(request)
    const key = token && sessionKey(token, password)
    if (method === 'DELETE') {
      if (key) await redis('DEL', key)
      return json({ authenticated: false }, 200, { 'Set-Cookie': cookie('', 0, url) })
    }
    if (!key || !await redis('GET', key)) return json({ error: 'credentials' }, 401)
    if (method === 'GET') return json({ authenticated: true, prices: await readPrices() })

    const update = await readBody(request).catch(() => null)
    if (!products.has(update?.key) || (update.cents !== null &&
        (!Number.isInteger(update.cents) || update.cents < 1 || update.cents > maxPrice))) {
      return json({ error: 'invalid' }, 400)
    }
    if (update.cents === null) await redis('HDEL', pricesKey, update.key)
    else await redis('HSET', pricesKey, update.key, String(update.cents))
    return json({ cents: update.cents })
  } catch {
    return json({ error: 'storage' }, 503)
  }
}
