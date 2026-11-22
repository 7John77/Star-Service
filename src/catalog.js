import { english, make, tr } from './locale.js'

const categories = [
  ['all', 'Όλες οι κατηγορίες', 'All categories'],
  ['powder', 'Ξηράς σκόνης', 'Dry powder'],
  ['co2', 'CO₂', 'CO₂'],
  ['foam', 'Αφρού', 'Foam'],
  ['wet', 'Υγρού χημικού', 'Wet chemical'],
  ['special', 'Ειδικές εφαρμογές', 'Special applications'],
  ['mounts', 'Βάσεις, θήκες & εξαρτήματα', 'Mounts, cases & accessories'],
  ['agents', 'Υλικά κατάσβεσης', 'Extinguishing agents'],
  ['cabinets', 'Φωλιές & σταθμοί', 'Fire hose cabinets & stations'],
  ['detection', 'Πυρανίχνευση', 'Fire detection'],
  ['doors', 'Πόρτες πυράντοχες', 'Fire-resistant doors'],
  ['rok', 'Κατάλογος POK', 'POK catalogue'],
]
const categoryMap = new Map(categories.map(([key, el, en]) => [key, tr(el, en)]))
const featured = /^(?:Πυροσβεστήρας [36] ?Kg Ξηράς Σκόνης|Πυροσβεστήρας 2 ?Kg CO2 - Έξοδος στο πλάι|Πυροσβεστήρας 9 ?Lt ABF|Τροχήλατος Πυροσβεστήρας 100 ?Lt Αφρού)$/i
const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().replace(/₂/g, '2').replace(/[^\p{L}\p{N}]/gu, '')
const productTitle = (product) => english ? product.en : product.title
const pageSize = 12

export async function setupCatalogue(pickQuote) {
  const input = document.getElementById('catalog-search')
  const filters = document.getElementById('catalog-filters')
  const grid = document.getElementById('catalog-grid')
  const status = document.getElementById('catalog-status')
  const more = document.getElementById('catalog-more')
  const dialog = document.getElementById('product-dialog')
  const detail = document.getElementById('product-detail')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let items = [], visible = pageSize, category = 'all'

  function setCategory(value, clearSearch = false) {
    if (value !== 'all' && !items.some((item) => item.category === value)) return
    category = value
    if (clearSearch) input.value = ''
    visible = pageSize
    for (const button of filters.children) button.setAttribute('aria-pressed', String(button.dataset.category === category))
    render(true)
  }

  function buildFilters() {
    for (const [value, name] of categoryMap) {
      if (value !== 'all' && !items.some((item) => item.category === value)) continue
      const button = make('button', name)
      button.type = 'button'
      button.dataset.category = value
      button.setAttribute('aria-pressed', String(value === category))
      button.addEventListener('click', () => setCategory(value))
      filters.append(button)
    }
  }

  function openProduct(product) {
    const title = productTitle(product)
    document.getElementById('product-title').textContent = title
    detail.replaceChildren()
    const gallery = make('figure', '', 'product-display')
    const image = make('img')
    image.src = product.images[0]
    image.alt = title
    gallery.append(image)
    if (product.images.length > 1) {
      const thumbs = make('div', '', 'product-thumbs')
      thumbs.setAttribute('role', 'group')
      thumbs.setAttribute('aria-label', tr('Φωτογραφίες προϊόντος', 'Product photos'))
      for (const [index, url] of product.images.entries()) {
        const choice = make('button')
        choice.type = 'button'
        choice.setAttribute('aria-label', tr('Φωτογραφία ', 'Photo ') + (index + 1))
        choice.setAttribute('aria-pressed', String(index === 0))
        const thumbnail = make('img')
        thumbnail.src = url
        thumbnail.alt = ''
        choice.append(thumbnail)
        choice.addEventListener('click', () => {
          if (image.getAttribute('src') === url) return
          image.src = url
          for (const other of thumbs.children) other.setAttribute('aria-pressed', String(other === choice))
          if (!reduce.matches) image.animate([{ opacity: .3, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 270 })
        })
        thumbs.append(choice)
      }
      gallery.append(thumbs)
    }
    detail.append(gallery)
    if (product.features?.length) {
      const features = make('ul', '', 'product-features')
      for (const [el, en] of product.features) features.append(make('li', tr(el, en)))
      detail.append(features)
    }
    const facts = product.specs || []
    if (product.capacity) detail.append(make('p', product.capacity, 'product-capacity'))
    if (facts.length) {
      const list = make('dl', '', 'product-specs')
      for (const [label, labelEnglish, value, valueEnglish] of facts) {
        const row = make('div')
        row.append(make('dt', tr(label, labelEnglish)), make('dd', tr(value, valueEnglish)))
        list.append(row)
      }
      detail.append(list)
    }
    const actions = make('div', '', 'product-actions')
    const quote = make('button', tr('Προσφορά για αυτό το είδος', 'Request a quote for this item'), 'button button-red')
    quote.type = 'button'
    quote.addEventListener('click', () => close(() => {
      pickQuote(/^(powder|co2|foam|wet|special|mounts|agents)$/.test(product.category) ? 'Προμήθεια πυροσβεστήρων' : 'Πυρανίχνευση / πυροπροστασία', title)
      document.getElementById('study').scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth' })
    }))
    actions.append(quote)
    detail.append(actions)
    dialog.showModal()
    if (!reduce.matches) dialog.animate([{ opacity: 0, transform: 'translateY(10px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' })
  }

  async function close(after) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return
    if (!reduce.matches) {
      dialog.classList.add('is-closing')
      await dialog.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px) scale(.985)' }], { duration: 220, fill: 'forwards' }).finished.catch(() => {})
      dialog.getAnimations().forEach((animation) => animation.cancel())
      dialog.classList.remove('is-closing')
    }
    dialog.close()
    after?.()
  }

  function card(product) {
    const button = make('button', '', 'product-card')
    button.type = 'button'
    const image = make('img', '', 'product-image')
    image.alt = ''
    image.loading = 'lazy'
    image.width = 280
    image.height = 200
    image.src = product.images[0]
    const copy = make('span', '', 'product-card-copy')
    const label = featured.test(product.title) ? tr('Επιλεγμένο είδος', 'Featured item') : categoryMap.get(product.category)
    copy.append(make('small', label), make('strong', productTitle(product)))
    button.classList.toggle('featured', featured.test(product.title))
    if (product.capacity) copy.append(make('span', product.capacity))
    button.append(image, copy, make('span', '+', 'product-plus'))
    button.lastElementChild.setAttribute('aria-hidden', 'true')
    button.addEventListener('click', () => openProduct(product))
    return button
  }

  function render(animate = false) {
    const text = normalize(input.value)
    const filtered = items.filter((product) => (category === 'all' || product.category === category) && normalize(product.title + ' ' + product.en + ' ' + (product.capacity || '')).includes(text))
    const previousLength = grid.children.length
    grid.replaceChildren(...filtered.slice(0, visible).map(card))
    status.textContent = filtered.length
      ? tr('Καταχωρίσεις ', 'Listings ') + Math.min(visible, filtered.length) + ' / ' + filtered.length
      : tr('Δεν βρέθηκαν καταχωρίσεις.', 'No listings found.')
    more.hidden = visible >= filtered.length
    if (animate && !reduce.matches && grid.children.length) {
      grid.animate([{ opacity: .35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 285, easing: 'cubic-bezier(.22,1,.36,1)' })
    }
    return previousLength
  }

  input.addEventListener('input', () => { visible = pageSize; render() })
  more.addEventListener('click', () => {
    visible += pageSize
    const previous = render()
    grid.children[previous]?.focus({ preventScroll: true })
  })
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-filter-link]')
    if (link) setCategory(link.dataset.filterLink, true)
  })
  dialog.querySelector('.dialog-close').addEventListener('click', () => close())
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close() })
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
  try {
    const response = await fetch('/catalogue.json')
    if (!response.ok) throw new Error()
    items = await response.json()
    items.sort((a, b) => Number(featured.test(b.title)) - Number(featured.test(a.title)))
    buildFilters()
    render()
  } catch {
    status.textContent = tr('Ο κατάλογος δεν μπόρεσε να φορτώσει. Ανανεώστε τη σελίδα.', 'The catalogue could not load. Reload the page.')
  }
}
