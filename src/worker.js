const maxFile = 10_000_000
const maxRequest = maxFile + 65_536
const quoteEmail = 'starpirosvestika@gmail.com'
const idPattern = /^\d{13}-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/
const premisesTypes = new Set(['Retail / office', 'Hospitality / kitchen', 'Industry / warehouse', 'Home / vehicle / other'])
const formats = {
  pdf: [37,80,68,70,45],
  jpg: [255,216,255],
  jpeg: [255,216,255],
  png: [137,80,78,71,13,10,26,10],
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

async function notifyQuote(env, record, file) {
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
    record.filename && 'Συνημμένο: ' + record.filename,
  ].filter(line => line !== false && line != null)
  const payload = {
    from: 'Star Service <' + env.QUOTE_FROM_EMAIL.trim() + '>',
    to: [quoteEmail],
    reply_to: record.email,
    subject: 'Star Service | Νέο αίτημα προσφοράς ' + record.reference,
    text: lines.join('\n'),
  }
  if (file) {
    payload.attachments = [{
      filename: record.filename,
      content: Buffer.from(await file.arrayBuffer()).toString('base64'),
    }]
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY.trim(),
        'Content-Type': 'application/json',
        'Idempotency-Key': 'star-service-quote/' + record.id,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(18_000),
    })
    if (response.ok && typeof (await response.json())?.id === 'string') return true
    await response.body?.cancel().catch(() => {})
    console.warn('Quote email not accepted', record.reference, response.status)
  } catch {
    console.warn('Quote email not confirmed', record.reference)
  }
  return false
}

async function submit(request, env) {
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
      !/^[^\s@<>,;]+@[^\s@.<>,;]+(?:\.[^\s@.<>,;]+)+$/.test(user.email) || user.phone.length > 35 ||
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
  if (file !== null && typeof file !== 'string' && file.size > 0) {
    const signatureBytes = formats[file.name.split('.').at(-1)?.toLowerCase()]
    if (file.size > maxFile || !Array.isArray(signatureBytes)) return invalid('Επιλέξτε PDF, JPG ή PNG έως 10 MB.', 'Choose a PDF, JPG or PNG up to 10 MB.')
    const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
    if (!signatureBytes.every((byte, index) => signature[index] === byte)) {
      return invalid('Το περιεχόμενο του αρχείου δεν ταιριάζει με τον τύπο του.', 'The contents of the file do not match its file type.')
    }
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
  const record = { id, reference: reference(id), ...user, premises, product, needDetail: availableNeeds[needDetail]?.[0], filename }
  if (!emailConfigured(env)) {
    return invalid('Η αποστολή προσφορών είναι προσωρινά μη διαθέσιμη.', 'Quote submission is temporarily unavailable.', 503)
  }
  if (!await notifyQuote(env, record, filename ? file : null)) {
    return invalid('Η αποστολή δεν επιβεβαιώθηκε. Δοκιμάστε ξανά.', 'Sending was not confirmed. Please try again.', 502)
  }
  return json({ reference: record.reference }, 201)
}

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url)
    try {
      if (url.pathname === '/api/studies' && request.method === 'POST') {
        if (!allowedOrigin(request, url)) return error('Μη επιτρεπτή προέλευση αιτήματος.', 403)
        return await submit(request, env)
      }
      if (!['GET', 'HEAD'].includes(request.method)) return error('Μη επιτρεπτή μέθοδος.', 405)
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
