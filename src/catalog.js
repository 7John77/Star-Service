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
  ['parts', 'Ανταλλακτικά πυροσβεστήρων', 'Extinguisher spare parts'],
  ['hoses', 'Σωλήνες, αυλοί & σύνδεσμοι', 'Hoses, nozzles & couplings'],
  ['systems', 'Συστήματα κατάσβεσης', 'Fire suppression systems'],
  ['curtains', 'Πυροκουρτίνες', 'Fire curtains'],
  ['safety', 'Μέσα προστασίας & πρώτες βοήθειες', 'Protective equipment & first aid'],
  ['gadgets', 'Fire Gadgets', 'Fire Gadgets'],
  ['other', 'Λοιπός εξοπλισμός', 'Other equipment'],
]
const categoryMap = new Map(categories.map(([key, el, en]) => [key, tr(el, en)]))
const featured = /^(?:Πυροσβεστήρας [36] ?Kg Ξηράς Σκόνης|Πυροσβεστήρας 2 ?Kg CO2 - Έξοδος στο πλάι|Πυροσβεστήρας 9 ?Lt ABF|Τροχήλατος Πυροσβεστήρας 100 ?Lt Αφρού)$/i
const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().replace(/₂/g, '2').replace(/[^\p{L}\p{N}]/gu, '')
const productTitle = (product) => english ? product.en : product.title
const pageSize = 12

export async function setupCatalogue(pickQuote) {
  const input = document.getElementById('catalog-search')
  const filters = document.getElementById('catalog-filters')
  const collection = document.getElementById('catalog-collection')
  const grid = document.getElementById('catalog-grid')
  const status = document.getElementById('catalog-status')
  const more = document.getElementById('catalog-more')
  const dialog = document.getElementById('product-dialog')
  const detail = document.getElementById('product-detail')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let items = [], visible = pageSize, category = 'all'

  function inCollection(item) {
    return collection.value === 'all'
      || (collection.value === 'store' ? item.storeListed : item.brand === 'MOBIAK')
  }

  function setCategory(value, clearSearch = false) {
    if (clearSearch) {
      input.value = ''
      collection.value = 'all'
      category = value
      buildFilters()
    } else category = value
    visible = pageSize
    render(true)
  }

  function buildFilters() {
    const available = new Set(items.filter(inCollection).map(item => item.category))
    if (!available.has(category)) category = 'all'
    filters.replaceChildren()
    for (const [value, name] of categoryMap) {
      if (value !== 'all' && !available.has(value)) continue
      const option = make('option', name)
      option.value = value
      filters.append(option)
    }
    filters.value = category
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

  function openProduct(product) {
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
    detail.append(gallery)
    if (product.code) detail.append(make('p', 'MOBIAK · ' + product.code, 'product-code'))
    if (!product.images.length) detail.append(make('p', tr('Η MOBIAK δεν δημοσιεύει φωτογραφία για αυτό το είδος.', 'MOBIAK does not publish a photo for this item.'), 'product-source-note'))
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
      pickQuote(/^(powder|co2|foam|wet|special|mounts|agents|parts|gadgets)$/.test(product.category) ? 'Προμήθεια πυροσβεστήρων' : 'Πυρανίχνευση / πυροπροστασία', product.code ? product.code + ' · ' + title : title)
      document.getElementById('study').scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth' })
    }))
    actions.append(quote)
    const official = product.source?.[english ? 1 : 0] || product.source?.find(Boolean)
    if (official) {
      const source = make('a', tr('Σελίδα κατασκευαστή', 'Manufacturer page'), 'button button-outline')
      source.href = official
      source.target = '_blank'
      source.rel = 'noopener noreferrer'
      actions.append(source)
    }
    const documents = product.documents?.[english ? 1 : 0] || []
    for (const [index, url] of documents.entries()) {
      const sheet = make('a', tr('Έγγραφο κατασκευαστή', 'Manufacturer document') + (documents.length > 1 ? ' ' + (index + 1) : ''), 'button button-outline')
      sheet.href = url
      sheet.target = '_blank'
      sheet.rel = 'noopener noreferrer'
      actions.append(sheet)
    }
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
    const label = featured.test(product.title) ? tr('Επιλεγμένο είδος', 'Featured item') : categoryMap.get(product.category)
    copy.append(make('small', label), make('strong', productTitle(product)))
    button.classList.toggle('featured', featured.test(product.title))
    if (product.code || product.capacity) copy.append(make('span', product.code || product.capacity))
    button.append(image, copy, make('span', '+', 'product-plus'))
    button.lastElementChild.setAttribute('aria-hidden', 'true')
    button.addEventListener('click', () => openProduct(product))
    return button
  }

  function render(animate = false) {
    const text = normalize(input.value)
    const filtered = items.filter(product => inCollection(product) && (category === 'all' || product.category === category) && product.searchKey.includes(text))
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

  filters.addEventListener('change', () => setCategory(filters.value))
  collection.addEventListener('change', () => { visible = pageSize; buildFilters(); render(true) })
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
    items = (await response.json()).map(product => ({
      ...product,
      storeListed: product.storeListed ?? !product.brand,
      searchKey: normalize([product.title, product.en, product.capacity, product.code, product.sku, product.brand].filter(Boolean).join(' ')),
    }))
    items.sort((a, b) => Number(featured.test(b.title)) - Number(featured.test(a.title)))
    buildFilters()
    render()
  } catch {
    status.textContent = tr('Ο κατάλογος δεν μπόρεσε να φορτώσει. Ανανεώστε τη σελίδα.', 'The catalogue could not load. Reload the page.')
  }
}
