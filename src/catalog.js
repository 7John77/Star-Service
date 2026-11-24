import { english, make, tr } from './locale.js'
import { categories, careCategories, isCareCategory, normalize, productKey } from './catalogue-fields.js'
import carePreviews from './care-previews.json'
import extraSpecs from './catalogue-extra-specs.json'

const categoryMap = new Map(categories.map(([key, el, en]) => [key, tr(el, en)]))
const sections = [
  ['extinguishers', 'Πυροσβεστήρες', 'Fire extinguishers', ['powder', 'co2', 'foam', 'wet', 'special']],
  ['accessories', 'Βάσεις, θήκες & εξαρτήματα', 'Mounts, cases & accessories', ['mounts', 'parts']],
  ['water', 'Φωλιές & σταθμοί', 'Fire hose cabinets & stations', ['cabinets', 'hoses']],
  ['detection', 'Πυρανίχνευση', 'Fire detection', ['detection']],
  ['agents', 'Υλικά κατάσβεσης', 'Extinguishing agents', ['agents']],
  ['barriers', 'Πόρτες & πυροκουρτίνες', 'Doors & fire curtains', ['doors', 'curtains']],
  ['systems', 'Συστήματα κατάσβεσης', 'Fire suppression systems', ['systems']],
  ['protection', 'Προστασία & πρώτες βοήθειες', 'Protection & first aid', ['safety', 'gadgets']],
  ['rok', 'Κατάλογος POK', 'POK catalogue', ['rok']],
  ['other', 'Λοιπός εξοπλισμός', 'Other equipment', ['other']],
  ...careCategories.map(([key, el, en]) => [key, el, en, [key]]),
]
const sectionByType = new Map(sections.flatMap(section => section[3].map(type => [type, section[0]])))
const featured = /^(?:Πυροσβεστήρας [36] ?Kg Ξηράς Σκόνης|Πυροσβεστήρας 2 ?Kg CO2 - Έξοδος στο πλάι|Πυροσβεστήρας 9 ?Lt ABF|Τροχήλατος Πυροσβεστήρας 100 ?Lt Αφρού)$/i
const productTitle = (product) => english ? product.en : product.title
const illustrativePhoto = tr('Ενδεικτική φωτογραφία', 'Illustrative photo')
const pageSize = 12
const euro = new Intl.NumberFormat(english ? 'en-IE' : 'el-GR', { style: 'currency', currency: 'EUR' })
const priceText = (cents) => euro.format(cents / 100)
const searchTerm = (word) => normalize(word)
  .replace(/^πυροσβεστηρ(?:ας|ες)$/, 'πυροσβεστηρ')
  .replace(/^αμαξιδι(?:ο|α)$/, 'αμαξιδι')
  .replace(/^καρεκλ(?:α|ες)$/, 'καρεκλ')
const coverBySection = {
  extinguishers: 'extinguishers', accessories: 'mounts', water: 'cabinets',
  detection: 'detection', agents: 'agents', barriers: 'doors', systems: 'systems',
}
const representativePhoto = tr('Ενδεικτική εικόνα κατηγορίας', 'Representative category image')

export function setupCatalogue(pickQuote, initialDepartment, entry) {
  const input = document.getElementById('catalog-search')
  const clear = document.getElementById('catalog-clear')
  const reset = document.getElementById('catalog-reset')
  const filters = document.getElementById('catalog-filters')
  const types = document.getElementById('catalog-types')
  const family = document.getElementById('catalog-family')
  const grid = document.getElementById('catalog-grid')
  const status = document.getElementById('catalog-status')
  const more = document.getElementById('catalog-more')
  const dialog = document.getElementById('product-dialog')
  const detail = document.getElementById('product-detail')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let prices = {}
  let openedProduct
  let opener
  let fireDetails = {}
  let fireDetailsRequest
  let items = [], visible = pageSize, section = 'all', type = 'all'
  let searchTimer

  let department = initialDepartment
  const pending = { fire: true, care: true }
  const failed = { fire: false, care: false }
  const requested = new Set()
  const belongs = (product) => isCareCategory(product.category) === (department === 'care')

  function chooseDepartment(key) {
    department = key
    buildFilters()
    chooseSection('all', 'all', true)
    if (!entry.open && requested.size) ensureCatalogue(key)
  }

  function chooseSection(value, subtype = 'all', clearSearch = false) {
    if (clearSearch) input.value = ''
    section = value
    type = subtype
    visible = pageSize
    for (const button of filters.children) {
      button.setAttribute('aria-pressed', String(button.dataset.section === section))
    }
    const subtypes = sections.find(([key]) => key === section)?.[3].filter(key => items.some(item => item.category === key)) || []
    types.replaceChildren()
    types.parentElement.hidden = subtypes.length < 2
    if (!types.parentElement.hidden) {
      for (const key of ['all', ...subtypes]) {
        const option = make('option', key === 'all' ? tr('Όλα στην κατηγορία', 'All in this category') : categoryMap.get(key))
        option.value = key
        types.append(option)
      }
      types.value = type
    }
    const families = new Map(items.filter(item => item.section === section && item.family)
      .map(item => [item.family, tr(item.familyEl, item.familyEn)]))
    family.replaceChildren()
    const options = [...families].sort((a, b) => a[1].localeCompare(b[1], english ? 'en' : 'el'))
    for (const [key, label] of [['', tr('Όλες οι υποκατηγορίες', 'All subcategories')], ...options]) {
      const option = make('option', label)
      option.value = key
      family.append(option)
    }
    family.parentElement.hidden = !families.size
    render(true)
  }

  function buildFilters() {
    const available = new Set(items.filter(belongs).map(item => item.section))
    filters.replaceChildren()
    for (const [value, el, en] of [['all', 'Όλα τα προϊόντα', 'All products'], ...sections]) {
      if (value !== 'all' && !available.has(value)) continue
      const button = make('button', tr(el, en))
      button.type = 'button'
      button.dataset.section = value
      button.setAttribute('aria-pressed', String(value === section))
      button.addEventListener('click', () => chooseSection(value))
      filters.append(button)
    }
  }

  function setImage(image, candidates, width, cover, note, illustrative = false) {
    const sources = [...new Set(candidates.filter(Boolean).flatMap(url => {
      const preview = carePreviews[url]
      if (!preview) return [url]
      return width <= 384 ? [preview, url] : [url, preview]
    }))]
    if (cover) sources.push(cover)
    sources.push('/star-service-icon.svg')
    let index = 0
    image.referrerPolicy = 'no-referrer'
    image.decoding = 'async'
    function next() {
      const url = sources[index++]
      const categoryImage = url === cover
      const missing = index === sources.length
      image.classList.toggle('product-image-missing', missing)
      image.alt = categoryImage && image.dataset.productAlt ? representativePhoto : missing ? '' : image.dataset.productAlt || ''
      if (note) {
        note.hidden = !categoryImage && !missing && !illustrative
        note.textContent = categoryImage ? representativePhoto : missing
          ? tr('Φωτογραφία προσωρινά μη διαθέσιμη', 'Photo temporarily unavailable')
          : illustrativePhoto
      }
      image.onerror = missing ? null : next
      image.src = url
    }
    next()
  }

  function coverImage(product) {
    const cover = isCareCategory(product.category) ? 'care-category-' + product.category.slice(5) : coverBySection[product.section]
    return cover ? '/legacy/' + cover + '.webp' : undefined
  }

  function showPrice(node, product) {
    const cents = prices[productKey(product)]
    node.hidden = !Number.isInteger(cents)
    node.textContent = node.hidden ? '' : priceText(cents)
  }

  function productFacts(product) {
    const key = product.sku && product.code && !(product.sku === '0133051' && product.code === '0133051')
      ? product.sku + '|' + product.code : product.title
    const facts = new Map()
    const supplemental = isCareCategory(product.category) ? [] : fireDetails[key] || []
    for (const row of [...(product.specs || []), ...(extraSpecs[product.path || product.code || product.title] || []), ...supplemental]) {
      if (!Array.isArray(row) || row.length !== 4 || !(row[2] || row[3]) || row[1] === 'ERP code') continue
      const field = JSON.stringify([normalize(row[0]), normalize(row[2])])
      if (!facts.has(field)) facts.set(field, row)
    }
    return [...facts.values()]
  }

  function showSpecifications(product, information) {
    information.replaceChildren(make('h3', tr('Χαρακτηριστικά προϊόντος', 'Product specifications')))
    const facts = productFacts(product)
    if (product.features?.length) {
      const features = make('ul', '', 'product-features')
      for (const [el, en] of product.features) features.append(make('li', tr(el, en)))
      information.append(features)
    }
    if (product.capacity && !facts.some(row => row[1] === 'Capacity')) information.append(make('p', product.capacity, 'product-capacity'))
    if (facts.length) {
      const list = make('dl', '', 'product-specs')
      for (const [label, labelEnglish, value, valueEnglish] of facts) {
        const row = make('div')
        row.append(make('dt', tr(label, labelEnglish)), make('dd', tr(value, valueEnglish)))
        list.append(row)
      }
      information.append(list)
    }
    if (information.children.length === 1) {
      information.append(make('p', tr('Επικοινωνήστε για τεχνικές λεπτομέρειες του συγκεκριμένου είδους.', 'Contact us for the technical details of this item.'), 'product-source-note'))
    }
  }

  function loadFireDetails() {
    fireDetailsRequest ||= fetch('/fire-details.json')
      .then(response => response.ok ? response.json() : {})
      .then(data => { fireDetails = data })
      .catch(() => {})
    return fireDetailsRequest
  }

  function openProduct(product, button) {
    if (dialog.open) return
    opener = button
    openedProduct = product
    const title = productTitle(product)
    document.getElementById('product-title').textContent = title
    detail.replaceChildren()
    const gallery = make('figure', '', 'product-display')
    const image = make('img')
    image.fetchPriority = 'high'
    const photoNote = make('figcaption', '', 'product-photo-note')
    image.dataset.productAlt = title
    setImage(image, [...product.images.slice(0, 3), product.thumbnail], 768, coverImage(product), photoNote, product.imageIllustrative)
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
        thumbnail.loading = 'lazy'
        setImage(thumbnail, [url], 160)
        choice.append(thumbnail)
        choice.addEventListener('click', () => {
          if (choice.getAttribute('aria-pressed') === 'true') return
          setImage(image, [url, ...product.images.slice(0, 3), product.thumbnail], 768, coverImage(product), photoNote, product.imageIllustrative)
          for (const other of thumbs.children) other.setAttribute('aria-pressed', String(other === choice))
          if (!reduce.matches) image.animate([{ opacity: .3, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 270 })
        })
        thumbs.append(choice)
      }
      gallery.append(thumbs)
    }
    gallery.append(photoNote)
    detail.append(gallery)
    const price = make('p', '', 'product-price')
    showPrice(price, product)
    detail.append(price)
    const meta = make('div', '', 'product-detail-meta')
    meta.append(make('p', categoryMap.get(product.category)))
    if (product.code) meta.append(make('p', tr('Κωδικός', 'Code') + ' · ' + product.code, 'product-code'))
    if (product.sku && product.sku !== product.code) meta.append(make('p', 'ERP · ' + product.sku, 'product-code'))
    if (product.family) meta.append(make('p', tr(product.familyEl, product.familyEn)))
    detail.append(meta)
    const information = make('section', '', 'product-detail-facts')
    showSpecifications(product, information)
    detail.append(information)
    if (!isCareCategory(product.category)) {
      loadFireDetails().then(() => {
        if (dialog.open && information.isConnected) showSpecifications(product, information)
      })
    }
    const actions = make('div', '', 'product-actions')
    const quote = make('button', tr('Προσφορά για αυτό το είδος', 'Request a quote for this item'), 'button button-red')
    quote.type = 'button'
    quote.addEventListener('click', () => close(() => {
      pickQuote(isCareCategory(product.category) ? 'Είδη φροντίδας' : /^(powder|co2|foam|wet|special|mounts|agents|parts|gadgets)$/.test(product.category) ? 'Προμήθεια πυροσβεστήρων' : 'Πυρανίχνευση / πυροπροστασία', product.code ? product.code + ' · ' + title : title)
      document.getElementById('study').scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth' })
    }))
    actions.append(quote)
    detail.append(actions)
    dialog.showModal()
    dialog.scrollTop = 0
  }

  function close(after) {
    if (!dialog.open) return
    dialog.close()
    if (!after && opener?.isConnected) opener.focus({ preventScroll: true })
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
    const photoNote = make('span', '', 'product-photo-note')
    setImage(image, [product.thumbnail, ...product.images.slice(0, 3)], 384, coverImage(product), photoNote, product.imageIllustrative)
    const copy = make('span', '', 'product-card-copy')
    const label = product.isFeatured ? tr('Επιλεγμένο είδος', 'Featured item') : categoryMap.get(product.category)
    copy.append(make('small', label), make('strong', productTitle(product)))
    button.classList.toggle('featured', product.isFeatured)
    if (product.code || product.capacity) copy.append(make('span', product.code || product.capacity, 'product-code'))
    const price = make('strong', '', 'product-price')
    showPrice(price, product)
    button.priceProduct = product
    copy.append(price)
    copy.append(photoNote)
    const view = make('span', tr('Δείτε λεπτομέρειες', 'View details'), 'product-cta')
    const arrow = make('b', '↗')
    arrow.setAttribute('aria-hidden', 'true')
    view.append(arrow)
    copy.append(view)
    button.append(image, copy)
    button.setAttribute('aria-haspopup', 'dialog')
    button.addEventListener('click', () => openProduct(product, button))
    return button
  }

  function render(animate = false) {
    clearTimeout(searchTimer)
    const text = normalize(input.value)
    const words = (input.value.match(/[\p{L}\p{N}]+/gu) || []).map(searchTerm)
    const filtered = items.filter(product => belongs(product) && (!family.value || product.family === family.value) && (section === 'all' || product.section === section) && (type === 'all' || product.category === type) && (
      product.searchKey.includes(text) || words.every(word => product.searchKey.includes(word))
    ))
    if (text) filtered.sort((a, b) => Number(b.codes.includes(text)) - Number(a.codes.includes(text)))
    const previousLength = grid.children.length
    const shown = filtered.slice(0, visible)
    const current = Array.from(grid.children)
    if (current.length > shown.length || current.some((button, index) => button.priceProduct !== shown[index])) {
      const cards = new Map(current.map(button => [button.priceProduct, button]))
      grid.replaceChildren(...shown.map(product => cards.get(product) || card(product)))
    } else {
      grid.append(...shown.slice(current.length).map(card))
    }
    if (pending[department]) status.textContent = tr('Φόρτωση καταλόγου…', 'Loading catalogue…')
    else if (failed[department]) status.textContent = tr('Ο κατάλογος δεν φορτώθηκε. Ανανεώστε τη σελίδα.', 'The catalogue did not load. Reload the page.')
    else status.textContent = filtered.length
      ? tr('Καταχωρίσεις ', 'Listings ') + Math.min(visible, filtered.length) + ' / ' + filtered.length
      : tr('Δεν βρέθηκαν καταχωρίσεις.', 'No listings found.')
    more.hidden = visible >= filtered.length
    clear.hidden = !input.value
    reset.hidden = pending[department] || failed[department] || filtered.length > 0 || (!text && section === 'all')
    if (animate && !reduce.matches && grid.children.length) {
      grid.animate([{ opacity: .35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 285, easing: 'cubic-bezier(.22,1,.36,1)' })
    }
    return previousLength
  }

  types.addEventListener('change', () => {
    type = types.value
    visible = pageSize
    render(true)
  })
  family.addEventListener('change', () => { visible = pageSize; render(true) })
  input.addEventListener('input', () => {
    clear.hidden = !input.value
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { visible = pageSize; render() }, 100)
  })
  clear.addEventListener('click', () => {
    input.value = ''
    visible = pageSize
    render()
    input.focus()
  })
  reset.addEventListener('click', () => {
    chooseSection('all', 'all', true)
    input.focus()
  })
  more.addEventListener('click', () => {
    visible += pageSize
    const previous = render()
    grid.children[previous]?.focus({ preventScroll: true })
  })
  document.addEventListener('cataloguedepartment', (event) => chooseDepartment(event.detail))
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-filter-link]')
    if (!link) return
    const key = link.dataset.filterLink
    const parent = sectionByType.get(key)
    chooseSection(parent || key, parent ? key : 'all', true)
    if (!entry.open) ensureCatalogue(department)
  })
  dialog.querySelector('.dialog-close').addEventListener('click', () => close())
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close() })
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
  function ensureCatalogue(key) {
    if (requested.has(key)) return
    requested.add(key)
    return load(key, key === 'fire' ? '/catalogue.json' : '/care-catalogue.json')
  }

  async function load(key, path) {
    try {
      const response = await fetch(path)
      if (!response.ok) throw new Error('Catalogue unavailable')
      const data = (await response.json()).map(product => ({
        ...product,
        section: sectionByType.get(product.category),
        isFeatured: product.storeListed && featured.test(product.title),
        codes: [product.code, product.sku].filter(Boolean).map(normalize),
        searchKey: normalize([product.title, product.en, product.capacity, product.code, product.sku, product.familyEl, product.familyEn].filter(Boolean).join(' ')),
      }))
      items.push(...data.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)))
    } catch {
      failed[key] = true
    } finally {
      pending[key] = false
      if (key === department) {
        buildFilters()
        chooseSection(section, type)
      }
    }
  }

  chooseDepartment(department)
  let pricesRequested = false
  function showCatalogue() {
    if (entry.open) return
    ensureCatalogue(department)
    if (department === 'fire') loadFireDetails()
    if (pricesRequested) return
    pricesRequested = true
    fetch('/api/prices').then(response => response.ok ? response.json() : null).then(data => {
      if (!data?.prices) return
      prices = data.prices
      for (const button of grid.children) showPrice(button.querySelector('.product-price'), button.priceProduct)
      if (dialog.open && openedProduct) showPrice(detail.querySelector('.product-price'), openedProduct)
    }).catch(() => {})
  }
  const catalogue = document.getElementById('catalog')
  const observer = new IntersectionObserver(([observation]) => {
    if (observation.isIntersecting) showCatalogue()
  }, { rootMargin: '320px' })
  observer.observe(catalogue)
  entry.addEventListener('close', () => {
    if (catalogue.getBoundingClientRect().top < innerHeight + 320) showCatalogue()
  })
  input.addEventListener('focus', showCatalogue)
}
