const maxFile = 10_000_000
const maxRequest = maxFile + 65_536
const prefix = 'study/'
const quoteEmail = 'starpirosvestika@gmail.com'
const quoteInbox = 'https://star-service.kepesidisjohn.chatgpt.site/inbox'
const emailPrefix = 'study-email/'
const idPattern = /^\d{13}-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/
const encoder = new TextEncoder()
const premisesTypes = new Set(['Retail / office', 'Hospitality / kitchen', 'Industry / warehouse', 'Home / vehicle / other'])
const formats = {
  pdf: ['application/pdf', [37,80,68,70,45]],
  jpg: ['image/jpeg', [255,216,255]],
  jpeg: ['image/jpeg', [255,216,255]],
  png: ['image/png', [137,80,78,71,13,10,26,10]],
}

const security = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'content-security-policy': "default-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'",
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { ...security, 'cache-control': 'no-store' } })
}
function error(message, status) {
  return json({ error: message }, status)
}
function field(form, name) {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}
function allowedOrigin(request, url) {
  const origin = request.headers.get('origin')
  return origin ? origin === url.origin : request.headers.get('sec-fetch-site') !== 'cross-site'
}
function admin(request, env) {
  const identity = request.headers.get('oai-authenticated-user-id')
  const email = request.headers.get('oai-authenticated-user-email')?.toLowerCase()
  if (!identity) return false
  if (env.INBOX_OWNER_EMAIL) return email === env.INBOX_OWNER_EMAIL.trim().toLowerCase()
  return env.OWNER_PRIVATE_PREVIEW !== 'off'
}
function reference(id) {
  return 'SS-' + id.slice(14, 22).toUpperCase()
}
async function extractForm(request) {
  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxRequest) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return new Response(new Blob(chunks), { headers: { 'content-type': request.headers.get('content-type') } }).formData()
}

function emailConfigured(env) {
  return Boolean(env.RESEND_API_KEY?.trim() && env.QUOTE_FROM_EMAIL?.trim())
}

async function notifyQuote(env, record) {
  const key = emailPrefix + record.id
  if (await env.BUCKET.head(key)) return true
  if (!emailConfigured(env)) return false

  const lines = [
    'Νέο αίτημα προσφοράς ' + record.reference,
    '',
    'Αίτημα: ' + record.purpose,
    record.needDetail && 'Ανάγκη: ' + record.needDetail,
    record.premises && 'Χώρος: ' + record.premises,
    record.product && 'Είδος: ' + record.product,
    'Ονοματεπώνυμο: ' + record.name,
    'Email: ' + record.email,
    record.phone && 'Τηλέφωνο: ' + record.phone,
    '',
    record.message,
    record.filename && 'Συνημμένο στη Διαχείριση αιτημάτων: ' + record.filename,
    '',
    'Διαχείριση αιτημάτων: ' + quoteInbox,
  ].filter(line => line !== false && line != null)
  const payload = {
    from: 'Star Service <' + env.QUOTE_FROM_EMAIL.trim() + '>',
    to: [quoteEmail],
    reply_to: record.email,
    subject: 'Star Service | Νέο αίτημα προσφοράς ' + record.reference,
    text: lines.join('\n'),
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    let response
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.RESEND_API_KEY.trim(),
          'Content-Type': 'application/json',
          'Idempotency-Key': 'star-service-quote/' + record.id,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4500),
      })
    } catch {
      console.warn('Quote email network error', record.reference)
      continue
    }
    if (response.ok) {
      await env.BUCKET.put(key, '', { onlyIf: { etagDoesNotMatch: '*' } })
      return true
    }
    await response.body?.cancel().catch(() => {})
    console.warn('Quote email provider rejected request', record.reference, response.status)
    if (response.status < 500) break
  }
  return false
}

async function submit(request, env, ctx) {
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data;') ||
      Number(request.headers.get('content-length')) > maxRequest) {
    return error('Στείλε τη φόρμα με αρχείο έως 10 MB.', 400)
  }
  let form
  try { form = await extractForm(request) } catch { return error('Η φόρμα δεν διαβάστηκε.', 400) }
  if (!form) return error('Το αίτημα ξεπερνά το όριο μεγέθους.', 413)

  const en = field(form, 'locale') === 'en'
  const invalid = (el, english, status = 422) => error(en ? english : el, status)
  const premises = field(form, 'premises')
  const product = field(form, 'product')
  const needDetail = field(form, 'needDetail')
  const user = {
    name: field(form, 'name'), email: field(form, 'email'), phone: field(form, 'phone'),
    purpose: field(form, 'purpose'), message: field(form, 'message'),
  }
  if (!user.name || user.name.length > 100 || user.email.length > 150 ||
      !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(user.email) || user.phone.length > 35 ||
      !Object.hasOwn(quoteNeeds, user.purpose) || (!user.message && !premises) || user.message.length > 1500 ||
      (premises && !premisesTypes.has(premises)) || product.length > 200) {
    return invalid('Ελέγξτε τα στοιχεία επικοινωνίας και του αιτήματος.', 'Check your contact details and request.')
  }

  const availableNeeds = quoteNeeds[user.purpose]
  if (needDetail && !Object.hasOwn(availableNeeds, needDetail)) {
    return invalid('Ελέγξτε την επιλογή στο βήμα «Ανάγκη».', 'Check your selection in the Request step.')
  }

  const file = form.get('file')
  let filename = ''
  let fileType = ''
  if (file !== null && typeof file !== 'string' && file.size > 0) {
    const format = formats[file.name.split('.').at(-1)?.toLowerCase()]
    if (file.size > maxFile || !Array.isArray(format)) return invalid('Επιλέξτε PDF, JPG ή PNG έως 10 MB.', 'Choose a PDF, JPG or PNG up to 10 MB.')
    const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
    if (!format[1].every((byte, index) => signature[index] === byte)) {
      return invalid('Το περιεχόμενο του αρχείου δεν ταιριάζει με τον τύπο του.', 'The contents of the file do not match its file type.')
    }
    fileType = format[0]
    const cleanName = file.name.split(/[\\/]/).at(-1).replace(/[\u0000-\u001f\u007f]/g, '')
    const extension = cleanName.slice(cleanName.lastIndexOf('.'))
    filename = Array.from(cleanName.slice(0, -extension.length)).slice(0, 116).join('') + extension
  } else if (user.purpose === 'Μελέτη / κάτοψη') {
    return invalid('Προσθέστε την κάτοψη ή το αρχείο μελέτης.', 'Attach the floor plan or study.')
  }

  const now = Date.now()
  const proposed = field(form, 'attemptId')
  const descending = 9_999_999_999_999
  const date = idPattern.test(proposed) ? descending - Number(proposed.slice(0, 13)) : now
  const id = idPattern.test(proposed) && Math.abs(now - date) < 86_400_000
    ? proposed : (descending - now) + '-' + crypto.randomUUID()
  const record = { id, reference: reference(id), date: new Date(now).toISOString(), ...user, premises, product, ...(needDetail ? { needDetail: availableNeeds[needDetail][0] } : {}), filename, fileType }
  const metadata = encoder.encode(JSON.stringify(record))
  const body = new Blob(filename ? [metadata, file] : [metadata])
  const saved = await env.BUCKET.put(prefix + id, await body.arrayBuffer(), {
    customMetadata: { jsonSize: String(metadata.byteLength), quoteEmail: 'tracked' },
    onlyIf: { etagDoesNotMatch: '*' },
  })
  if (saved && emailConfigured(env)) {
    const notification = notifyQuote(env, record).catch(() => {
      console.warn('Quote email status storage error', record.reference)
    })
    if (ctx?.waitUntil) ctx.waitUntil(notification)
    else await notification
  }
  return json({ reference: record.reference }, 201)
}

async function readRecord(bucket, object) {
  const length = Number(object.customMetadata?.jsonSize)
  if (!Number.isInteger(length) || length < 1 || length > object.size) return null
  const stored = await bucket.get(object.key, { range: { offset: 0, length } })
  return stored ? JSON.parse(await stored.text()) : null
}

async function inbox(request, env, url) {
  if (!admin(request, env)) return error('Η πρόσβαση απαιτεί λογαριασμό ιδιοκτήτη.', 403)
  if (url.pathname === '/api/inbox' && request.method === 'GET') {
    const cursor = url.searchParams.get('cursor') || undefined
    if (cursor?.length > 4096) return error('Μη έγκυρη σελίδα αιτημάτων.', 400)
    const result = await env.BUCKET.list({ prefix, limit: 16, cursor, include: ['customMetadata'] })
    const items = await Promise.all(result.objects.map(async (object) => {
      const record = await readRecord(env.BUCKET, object)
      if (!record || object.customMetadata?.quoteEmail !== 'tracked') return record
      const emailed = await env.BUCKET.head(emailPrefix + record.id)
      return { ...record, emailStatus: emailed ? 'accepted' : emailConfigured(env) ? 'unconfirmed' : 'unconfigured' }
    }))
    return json({ items: items.filter(Boolean), cursor: result.truncated ? result.cursor : null })
  }
  const path = url.pathname.slice('/api/inbox/'.length)
  const retry = path.endsWith('/email')
  const id = retry ? path.slice(0, -'/email'.length) : path
  if (!idPattern.test(id)) return error('Το αίτημα δεν βρέθηκε.', 404)
  const key = prefix + id
  if (retry) {
    if (request.method !== 'POST' || !allowedOrigin(request, url)) return error('Μη επιτρεπτό αίτημα.', 403)
    const object = await env.BUCKET.head(key)
    const record = object?.customMetadata?.quoteEmail === 'tracked' && await readRecord(env.BUCKET, object)
    if (!record) return error('Το αίτημα δεν βρέθηκε.', 404)
    if (!emailConfigured(env)) return error('Η αποστολή email για το Star Service δεν έχει ενεργοποιηθεί.', 503)
    if (!await notifyQuote(env, record)) return error('Η υπηρεσία email δεν επιβεβαίωσε την αποστολή.', 502)
    return json({ emailStatus: 'accepted' })
  }
  if (request.method === 'DELETE' && allowedOrigin(request, url)) {
    await env.BUCKET.delete(key)
    await env.BUCKET.delete(emailPrefix + id)
    return new Response(null, { status: 204, headers: security })
  }
  if (request.method !== 'GET') return error('Μη επιτρεπτή μέθοδος.', 405)
  const object = await env.BUCKET.head(key)
  const record = object && await readRecord(env.BUCKET, object)
  if (!record?.filename) return error('Το αρχείο δεν βρέθηκε.', 404)
  const file = await env.BUCKET.get(key, { range: { offset: Number(object.customMetadata.jsonSize) } })
  if (!file) return error('Το αρχείο δεν βρέθηκε.', 404)
  const filename = encodeURIComponent(record.filename).replace(/['()*]/g, (char) => '%' + char.charCodeAt(0).toString(16))
  return new Response(file.body, {
    headers: {
      ...security, 'cache-control': 'no-store', 'content-type': 'application/octet-stream',
      'content-disposition': "attachment; filename*=UTF-8''" + filename,
    },
  })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    try {
      if (url.pathname === '/api/studies' && request.method === 'POST') {
        if (!allowedOrigin(request, url)) return error('Μη επιτρεπτή προέλευση αιτήματος.', 403)
        if (!env.BUCKET) return error('Η αποθήκευση προσωρινά δεν είναι διαθέσιμη.', 503)
        return await submit(request, env, ctx)
      }
      if (url.pathname === '/api/inbox' || url.pathname.startsWith('/api/inbox/')) return await inbox(request, env, url)
      if (!['GET', 'HEAD'].includes(request.method)) return error('Μη επιτρεπτή μέθοδος.', 405)
      if (url.pathname === '/inbox' && !admin(request, env)) return error('Η πρόσβαση απαιτεί λογαριασμό ιδιοκτήτη.', 403)
      if (url.pathname === '/en') return Response.redirect(new URL('/en/', request.url), 308)
      const asset = Object.hasOwn(assets, url.pathname) && assets[url.pathname]
      if (!asset) return error('Η σελίδα δεν βρέθηκε.', 404)
      const binary = /^(image|font)\//.test(asset.type)
      const body = request.method === 'HEAD' ? null : binary ? Uint8Array.from(atob(asset.body), (char) => char.charCodeAt(0)) : asset.body
      return new Response(body, {
        headers: { ...security, 'content-type': asset.type, 'cache-control': binary ? 'public, max-age=3600' : 'no-store' },
      })
    } catch {
      return error('Παρουσιάστηκε προσωρινό πρόβλημα. Δοκίμασε ξανά.', 503)
    }
  },
}
