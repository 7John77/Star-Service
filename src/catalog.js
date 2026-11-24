import { english, make, tr } from './locale.js'
import { categories, careCategories, isCareCategory, normalize, productKey } from './catalogue-fields.js'

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

export async function setupCatalogue(pickQuote) {
  const input = document.getElementById('catalog-search')
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
  let items = [], visible = pageSize, section = 'all', type = 'all'

  let department = location.hash === '#care' ? 'care' : 'fire'
  const pending = { fire: true, care: true }
  const failed = { fire: false, care: false }
  const belongs = (product) => isCareCategory(product.category) === (department === 'care')

  function chooseDepartment(key) {
    department = key
    for (const button of document.querySelectorAll('button[data-department]')) {
      button.setAttribute('aria-pressed', String(button.dataset.department === key))
    }
    buildFilters()
    chooseSection('all', 'all', true)
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

  function setImage(image, source, fallback) {
    image.referrerPolicy = 'no-referrer'
    image.onerror = () => {
      image.onerror = null
      setImage(image, fallback)
    }
    if (!source) image.onerror = null
    image.src = source || '/star-service-icon.svg'
    image.classList.toggle('product-image-missing', !source)
  }

  function showPrice(node, product) {
    const cents = prices[productKey(product)]
    node.hidden = !Number.isInteger(cents)
    node.textContent = node.hidden ? '' : priceText(cents)
  }

  function openProduct(product) {
    openedProduct = product
    const title = productTitle(product)
    document.getElementById('product-title').textContent = title
    detail.replaceChildren()
    const gallery = make('figure', '', 'product-display')
    const image = make('img')
    setImage(image, product.images[0])
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
        setImage(thumbnail, url)
        thumbnail.alt = ''
        choice.append(thumbnail)
        choice.addEventListener('click', () => {
          if (image.getAttribute('src') === url) return
          setImage(image, url)
          for (const other of thumbs.children) other.setAttribute('aria-pressed', String(other === choice))
          if (!reduce.matches) image.animate([{ opacity: .3, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 270 })
        })
        thumbs.append(choice)
      }
      gallery.append(thumbs)
    }
    if (product.imageIllustrative) gallery.append(make('figcaption', illustrativePhoto, 'product-photo-note'))
    detail.append(gallery)
    const price = make('p', '', 'product-price')
    showPrice(price, product)
    detail.append(price)
    if (product.code) detail.append(make('p', tr('Κωδικός', 'Code') + ' · ' + product.code, 'product-code'))
    if (!product.images.length) detail.append(make('p', tr('Δεν υπάρχει διαθέσιμη φωτογραφία για αυτό το είδος.', 'No photo is available for this item.'), 'product-source-note'))
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
      pickQuote(isCareCategory(product.category) ? 'Είδη φροντίδας' : /^(powder|co2|foam|wet|special|mounts|agents|parts|gadgets)$/.test(product.category) ? 'Προμήθεια πυροσβεστήρων' : 'Πυρανίχνευση / πυροπροστασία', product.code ? product.code + ' · ' + title : title)
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
    setImage(image, product.thumbnail || product.images[0], product.thumbnail ? product.images[0] : undefined)
    const copy = make('span', '', 'product-card-copy')
    const label = product.isFeatured ? tr('Επιλεγμένο είδος', 'Featured item') : categoryMap.get(product.category)
    copy.append(make('small', label), make('strong', productTitle(product)))
    button.classList.toggle('featured', product.isFeatured)
    if (product.code || product.capacity) copy.append(make('span', product.code || product.capacity))
    const price = make('strong', '', 'product-price')
    showPrice(price, product)
    button.priceProduct = product
    copy.append(price)
    if (product.imageIllustrative) copy.append(make('span', illustrativePhoto, 'product-photo-note'))
    button.append(image, copy, make('span', '+', 'product-plus'))
    button.lastElementChild.setAttribute('aria-hidden', 'true')
    button.addEventListener('click', () => openProduct(product))
    return button
  }

  function render(animate = false) {
    const text = normalize(input.value)
    const filtered = items.filter(product => belongs(product) && (!family.value || product.family === family.value) && (section === 'all' || product.section === section) && (type === 'all' || product.category === type) && product.searchKey.includes(text))
    if (text) filtered.sort((a, b) => Number(b.codes.includes(text)) - Number(a.codes.includes(text)))
    const previousLength = grid.children.length
    grid.replaceChildren(...filtered.slice(0, visible).map(card))
    if (pending[department]) status.textContent = tr('Φόρτωση καταλόγου…', 'Loading catalogue…')
    else if (failed[department]) status.textContent = tr('Ο κατάλογος δεν φορτώθηκε. Ανανεώστε τη σελίδα.', 'The catalogue did not load. Reload the page.')
    else status.textContent = filtered.length
      ? tr('Καταχωρίσεις ', 'Listings ') + Math.min(visible, filtered.length) + ' / ' + filtered.length
      : tr('Δεν βρέθηκαν καταχωρίσεις.', 'No listings found.')
    more.hidden = visible >= filtered.length
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
  input.addEventListener('input', () => { visible = pageSize; render() })
  more.addEventListener('click', () => {
    visible += pageSize
    const previous = render()
    grid.children[previous]?.focus({ preventScroll: true })
  })
  document.addEventListener('click', (event) => {
    const departmentControl = event.target.closest('[data-department]')
    if (departmentControl) {
      chooseDepartment(departmentControl.dataset.department)
      return
    }
    const link = event.target.closest('[data-filter-link]')
    if (!link) return
    const key = link.dataset.filterLink
    const parent = sectionByType.get(key)
    if (department !== "fire") chooseDepartment("fire")
    chooseSection(parent || key, parent ? key : 'all', true)
  })
  dialog.querySelector('.dialog-close').addEventListener('click', () => close())
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close() })
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
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
      const count = new Intl.NumberFormat(english ? 'en' : 'el').format(data.length)
      document.getElementById('count-' + key).textContent = count + tr(' καταχωρίσεις', ' listings')
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
  fetch('/api/prices').then(response => response.ok ? response.json() : null).then(data => {
    if (!data?.prices) return
    prices = data.prices
    for (const button of grid.children) showPrice(button.querySelector('.product-price'), button.priceProduct)
    if (dialog.open && openedProduct) showPrice(detail.querySelector('.product-price'), openedProduct)
  }).catch(() => {})
  await Promise.all([load('fire', '/catalogue.json'), load('care', '/care-catalogue.json')])
}
