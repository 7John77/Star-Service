import { make, tr } from './locale.js'
import { equipment } from './equipment-data.js'
import galleries from './equipment-gallery.json'

export function setupEquipment(pickQuote) {
  const dialog = document.getElementById('equipment-dialog')
  const title = document.getElementById('equipment-title')
  const intro = document.getElementById('equipment-intro')
  const choices = document.getElementById('equipment-choices')
  const details = document.getElementById('equipment-content')
  const gallery = document.getElementById('equipment-gallery')
  const actions = document.getElementById('equipment-actions')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let closing = false
  let galleryKey = ''

  function pictures(key, index) {
    if (key === 'cabinets') return index < 4 ? ['/legacy/cabinets.webp'] : galleries.stations
    if (key === 'mounts') {
      const rules = [/item-10[5-9]|item-11[12]/, /item-10[1-4]/, /mounts-0[1-7]/, /mounts-(?:0[89]|1[0-2])/]
      return galleries.mounts.filter((path) => rules[index].test(path))
    }
    if (galleries[key]?.length) return galleries[key]
    return ['/legacy/' + key + '.webp']
  }

  function showGallery(key, index) {
    const photos = pictures(key, index)
    const signature = photos.join('|')
    if (signature === galleryKey) return
    galleryKey = signature
    gallery.replaceChildren()
    if (!photos.length) return
    const frame = make('div', '', 'equipment-preview')
    const image = make('img')
    image.src = photos[0]
    image.alt = tr('Φωτογραφία από τον κατάλογο', 'Photo from the catalogue')
    frame.append(image)
    const caption = make('p', tr('Φωτογραφίες κατηγορίας', 'Category photos'), 'equipment-caption')
    gallery.append(frame, caption)
    if (photos.length < 2) return
    const thumbs = make('div', '', 'product-thumbs equipment-thumbs')
    thumbs.setAttribute('role', 'group')
    thumbs.setAttribute('aria-label', caption.textContent)
    for (const [position, path] of photos.entries()) {
      const button = make('button')
      button.type = 'button'
      button.setAttribute('aria-label', tr('Φωτογραφία ', 'Photo ') + (position + 1))
      button.setAttribute('aria-pressed', String(position === 0))
      const preview = make('img')
      preview.src = path
      preview.alt = ''
      preview.loading = 'lazy'
      button.append(preview)
      button.addEventListener('click', () => {
        if (image.getAttribute('src') === path) return
        image.src = path
        for (const other of thumbs.children) other.setAttribute('aria-pressed', String(other === button))
        if (!reduce.matches) image.animate([{ opacity: .3, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 285, easing: 'ease-out' })
      })
      thumbs.append(button)
    }
    gallery.append(thumbs)
  }

  function select(category, index) {
    const item = equipment[category]
    const [name, description, facts, documentUrl] = item.entries[index]
    const label = tr(...name)
    for (const [position, option] of [...choices.children].entries()) {
      option.setAttribute('aria-pressed', String(position === index))
    }
    details.replaceChildren(make('h3', label), make('p', tr(...description)))
    if (facts?.length) {
      const list = make('ul')
      for (const fact of facts) list.append(make('li', tr(...fact)))
      details.append(list)
    }
    actions.replaceChildren()
    const quote = make('button', tr('Ρωτήστε για αυτή την επιλογή', 'Enquire about this option'), 'button button-red')
    quote.type = 'button'
    quote.addEventListener('click', () => close(() => {
      pickQuote(item.purpose, tr(...item.title) + ' · ' + label)
      document.getElementById('study').scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth' })
    }))

    if (documentUrl) {
      const label = category === 'rok'
        ? tr('Άνοιγμα καταλόγου PDF', 'Open PDF catalogue')
        : tr('Ευρωπαϊκός κανονισμός', 'EU regulation')
      const source = make('a', label, 'button button-outline')
      source.href = documentUrl
      source.target = '_blank'
      source.rel = 'noopener'
      actions.append(source)
    }
    const catalogueCategory = { mounts: 'accessories', cabinets: 'water', agents: 'agents', detection: 'detection', systems: 'systems', rok: 'rok' }[category]
    if (catalogueCategory) {
      const catalogue = make('a', '', 'equipment-catalogue-action')
      const copy = make('span')
      copy.append(
        make('strong', tr('Εξερευνήστε τον κατάλογο', 'Explore the catalogue')),
        make('small', tr('Δείτε τα προϊόντα αυτής της κατηγορίας', 'See the products in this category')),
      )
      const arrow = make('span', '↓', 'equipment-catalogue-arrow')
      arrow.setAttribute('aria-hidden', 'true')
      catalogue.append(copy, arrow)
      catalogue.href = '#catalog'
      catalogue.dataset.filterLink = catalogueCategory
      catalogue.addEventListener('click', (event) => {
        event.preventDefault()
        close(() => {
          if (location.hash !== '#catalog') history.pushState(null, '', '#catalog')
          document.getElementById('catalog-title').focus({ preventScroll: true })
          document.getElementById('catalog').scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth' })
        })
      })
      actions.prepend(catalogue)
      quote.classList.replace('button-red', 'button-outline')
    }
    actions.append(quote)
    showGallery(category, index)
    if (!reduce.matches) details.animate([{ opacity: .38, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 290, easing: 'ease-out' })
  }

  function open(category) {
    const item = equipment[category]
    title.textContent = tr(...item.title)
    intro.textContent = tr(...item.intro)
    choices.replaceChildren()
    for (const [index, [label]] of item.entries.entries()) {
      const option = make('button', tr(...label))
      option.type = 'button'
      option.addEventListener('click', () => select(category, index))
      choices.append(option)
    }
    select(category, 0)
    dialog.showModal()
    dialog.scrollTop = 0
    if (!reduce.matches) dialog.animate([{ opacity: 0, transform: 'translateY(11px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' })
  }

  async function close(after) {
    if (!dialog.open || closing) return
    closing = true
    if (!reduce.matches) {
      dialog.classList.add('is-closing')
      const exit = dialog.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px) scale(.985)' }], { duration: 215, fill: 'forwards' })
      await exit.finished.catch(() => {})
      dialog.close()
      exit.cancel()
      dialog.classList.remove('is-closing')
    } else dialog.close()
    closing = false
    after?.()
  }

  for (const button of document.querySelectorAll('[data-equipment]')) button.addEventListener('click', () => open(button.dataset.equipment))
  dialog.querySelector('.dialog-close').addEventListener('click', () => close())
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close() })
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
}
