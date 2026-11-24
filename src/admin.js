import { categories, normalize, productKey } from './catalogue-fields.js'
import { make } from './locale.js'

const element = (id) => document.getElementById(id)
const login = element('login')
const dashboard = element('dashboard')
const logout = element('logout')
const form = element('login-form')
const password = element('password')
const search = element('search')
const category = element('category')
const pricing = element('pricing')
const list = element('product-list')
const notice = element('notice')
const byCategory = new Map(categories.map(([key, greek]) => [key, greek]))
const currency = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' })
const limit = 16
let products = []
let prices = {}
let page = 1
let noticeTimer

function announce(message, error = false) {
  clearTimeout(noticeTimer)
  notice.textContent = message
  notice.toggleAttribute('data-error', error)
  if (message && !error && !dashboard.hidden) noticeTimer = setTimeout(() => { notice.textContent = '' }, 3800)
}

async function api(method = 'GET', body) {
  const response = await fetch('/api/prices?admin=1', {
    method, cache: 'no-store',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error)
  return result
}

function report(error) {
  const messages = {
    configuration: 'Εκκρεμεί η ενεργοποίηση της διαχείρισης στο Vercel.',
    credentials: 'Ο κωδικός δεν είναι σωστός ή η σύνδεση έχει λήξει.',
    limit: 'Πολλές προσπάθειες σύνδεσης. Δοκιμάστε ξανά σε λίγα λεπτά.',
    invalid: 'Ελέγξτε την τιμή και δοκιμάστε ξανά.',
  }
  announce(messages[error.message] || 'Η σύνδεση απέτυχε. Δοκιμάστε ξανά σε λίγο.', true)
}

function showLogin() {
  dashboard.hidden = true
  logout.hidden = true
  login.hidden = false
}

function countPrices() {
  element('priced-total').textContent = Object.keys(prices).length
}

function priceCents(text) {
  const normalized = text.trim().replace(',', '.')
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return cents >= 1 && cents <= 99_999_999 ? cents : null
}

function row(product) {
  const article = make('article', '', 'product-row')
  const identity = make('div', '', 'product-identity')
  const image = make('img')
  image.alt = ''
  image.width = 54
  image.height = 54
  image.loading = 'lazy'
  image.referrerPolicy = 'no-referrer'
  image.src = product.thumbnail || product.images[0] || '/star-service-icon.svg'
  image.addEventListener('error', () => { image.src = '/star-service-icon.svg' }, { once: true })
  const description = make('div')
  const code = [...new Set([product.code, product.sku].filter(Boolean))].join(' / ')
  const title = make('h2', product.title)
  title.id = 'product-' + product.index
  description.append(title, make('p', [byCategory.get(product.category), code].filter(Boolean).join(' · '), 'product-meta'))
  identity.append(image, description)

  const editor = make('form', '', 'price-editor')
  editor.setAttribute('aria-labelledby', title.id)
  const label = make('label', 'Τιμή (€)')
  const input = make('input')
  input.type = 'text'
  input.inputMode = 'decimal'
  input.maxLength = 9
  input.required = true
  input.placeholder = 'π.χ. 25,00'
  label.append(input)
  const save = make('button', 'Αποθήκευση', 'primary')
  save.type = 'submit'
  const secondary = make('div', '', 'secondary')
  const status = make('span', '', 'price-status')
  const remove = make('button', 'Αφαίρεση τιμής', 'remove')
  remove.type = 'button'
  secondary.append(status, remove)
  editor.append(label, save, secondary)

  function updateEditor() {
    const cents = prices[product.key]
    const published = Number.isInteger(cents)
    input.value = published ? (cents / 100).toFixed(2).replace('.', ',') : ''
    status.textContent = published ? 'Δημοσιευμένη τιμή · ' + currency.format(cents / 100) : 'Χωρίς δημοσιευμένη τιμή'
    remove.hidden = !published
  }

  async function publish(cents) {
    save.disabled = remove.disabled = input.disabled = true
    try {
      await api('PUT', { key: product.key, cents })
      if (cents === null) delete prices[product.key]
      else prices[product.key] = cents
      updateEditor()
      countPrices()
      if (pricing.value) render()
      announce(cents === null ? 'Η τιμή αφαιρέθηκε από το site.' : 'Η τιμή ' + currency.format(cents / 100) + ' δημοσιεύτηκε στο site.')
    } catch (error) {
      if (error.message === 'credentials') showLogin()
      report(error)
    } finally {
      save.disabled = remove.disabled = input.disabled = false
    }
  }

  editor.addEventListener('submit', (event) => {
    event.preventDefault()
    const cents = priceCents(input.value)
    if (cents === null) {
      input.setCustomValidity('Γράψτε μια τιμή μεγαλύτερη από 0,00 €, με έως δύο δεκαδικά.')
      input.reportValidity()
      return
    }
    publish(cents)
  })
  input.addEventListener('input', () => input.setCustomValidity(''))
  remove.addEventListener('click', () => publish(null))
  updateEditor()
  article.append(identity, editor)
  return article
}

function render() {
  const term = normalize(search.value)
  const group = category.value
  const state = pricing.value
  const results = products.filter(product =>
    (!group || group === product.category) &&
    (!state || (state === 'published') === Object.hasOwn(prices, product.key)) &&
    product.searchKey.includes(term),
  )
  if (term) results.sort((a, b) => Number(b.exactCodes.includes(term)) - Number(a.exactCodes.includes(term)))
  const pages = Math.max(1, Math.ceil(results.length / limit))
  page = Math.min(page, pages)
  list.replaceChildren(...results.slice((page - 1) * limit, page * limit).map(row))
  element('result-count').textContent = results.length ? results.length + ' αποτελέσματα' : 'Δεν βρέθηκαν προϊόντα.'
  element('pagination').hidden = pages < 2
  element('page').textContent = page + ' / ' + pages
  element('previous').disabled = page === 1
  element('next').disabled = page === pages
}

async function showDashboard(data) {
  if (!products.length) {
    const response = await fetch('/catalogue.json')
    if (!response.ok) throw new Error('catalogue')
    products = (await response.json()).map((product, index) => ({
      ...product, index, key: productKey(product),
      exactCodes: [product.code, product.sku].filter(Boolean).map(normalize),
      searchKey: normalize([product.code, product.sku, product.title, product.en].filter(Boolean).join(' ')),
    }))
    const available = new Set(products.map(product => product.category))
    for (const [key, label] of byCategory) {
      if (!available.has(key)) continue
      const option = make('option', label)
      option.value = key
      category.append(option)
    }
  }
  prices = data.prices
  login.hidden = true
  dashboard.hidden = false
  logout.hidden = false
  countPrices()
  render()
  announce('')
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const button = event.submitter
  button.disabled = true
  announce('Σύνδεση…')
  try {
    await api('POST', { password: password.value })
    password.value = ''
    await showDashboard(await api())
    search.focus()
  } catch (error) {
    report(error)
  } finally {
    button.disabled = false
  }
})

logout.addEventListener('click', async () => {
  logout.disabled = true
  try {
    await api('DELETE')
    showLogin()
    password.focus()
    announce('Αποσυνδεθήκατε.')
  } catch (error) {
    report(error)
  } finally {
    logout.disabled = false
  }
})

for (const control of [search, category, pricing]) {
  control.addEventListener(control === search ? 'input' : 'change', () => { page = 1; render() })
}
element('previous').addEventListener('click', () => { page--; render() })
element('next').addEventListener('click', () => { page++; render() })
try {
  await showDashboard(await api())
} catch (error) {
  showLogin()
  if (error.message === 'credentials') announce('')
  else report(error)
}
