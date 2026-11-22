import { english, make, tr } from './locale.js'
import quoteNeeds from './quote-needs.json'

export function setupQuote() {
  const form = document.getElementById('study-form')
  const intro = document.getElementById('quote-intro')
  const start = document.getElementById('quote-start')
  const introProduct = document.getElementById('quote-intro-product')
  const introBack = document.getElementById('quote-intro-back')
  const steps = [...form.querySelectorAll('[data-step]')]
  const markers = [...form.querySelectorAll('.quote-progress li')]
  const next = document.getElementById('quote-next')
  const back = document.getElementById('quote-back')
  const submit = form.querySelector('[type=submit]')
  const input = document.getElementById('file')
  const drop = document.getElementById('drop')
  const info = document.getElementById('file-info')
  const remove = document.getElementById('remove-file')
  const status = document.getElementById('form-status')
  const selection = document.getElementById('quote-product')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const purposes = [...form.querySelectorAll('[name=purpose]')]
  const needs = document.getElementById('quote-needs')
  const needOptions = document.getElementById('quote-needs-options')
  let current = 0, attachment, attemptId, product = '', busy = false
  let productPurpose = '', displayedPurpose

  function updateNeeds() {
    const purpose = form.elements.purpose.value
    if (purpose === displayedPurpose) return
    displayedPurpose = purpose
    const options = quoteNeeds[purpose]
    needOptions.replaceChildren()
    needs.hidden = !options
    if (!options) return

    for (const [value, translations] of [...Object.entries(options), ['', ['Χωρίς εξειδίκευση', 'No specific preference']]]) {
      const label = make('label')
      const radio = make('input')
      radio.type = 'radio'
      radio.name = 'needDetail'
      radio.value = value
      label.append(radio, make('span', tr(...translations)))
      needOptions.append(label)
    }
    if (!reduce.matches) needs.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 270, easing: 'ease-out' })
  }

  function go(index, focus = true) {
    current = index
    steps.forEach((step, position) => { step.hidden = position !== current })
    markers.forEach((marker, position) => {
      marker.toggleAttribute('data-completed', position < current)
      if (position === current) marker.setAttribute('aria-current', 'step')
      else marker.removeAttribute('aria-current')
    })
    back.hidden = current === 0
    next.hidden = current === 2
    submit.hidden = current !== 2
    const active = steps[current]
    if (current === 0) updateNeeds()
    if (current === 2) {
      const needsPlan = form.elements.purpose.value === 'Μελέτη / κάτοψη'
      document.getElementById('file-help').textContent = needsPlan
        ? tr('Για αίτημα μελέτης απαιτείται σχέδιο. PDF, JPG ή PNG έως 10 MB.', 'A study request requires a plan. PDF, JPG or PNG up to 10 MB.')
        : tr('Προαιρετικό. PDF, JPG ή PNG έως 10 MB.', 'Optional. PDF, JPG or PNG up to 10 MB.')
    }
    if (!reduce.matches) active.animate([{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'none' }], { duration: 330, easing: 'cubic-bezier(.22,1,.36,1)' })
    if (focus) {
      const legend = active.querySelector('legend')
      legend.tabIndex = -1
      legend.focus({ preventScroll: true })
    }
  }

  function setFile(file) {
    attachment = file
    attemptId = undefined
    info.classList.remove('error')
    if (file && (!/\.(pdf|jpe?g|png)$/i.test(file.name) || file.size > 10_000_000 || !file.size)) {
      input.value = ''
      attachment = undefined
      info.classList.add('error')
      info.textContent = tr('Επιλέξτε έγκυρο PDF, JPG ή PNG έως 10 MB.', 'Choose a valid PDF, JPG or PNG up to 10 MB.')
    } else {
      info.textContent = file?.name || ''
    }
    drop.classList.toggle('attached', Boolean(attachment))
    remove.hidden = !attachment
  }

  function showIntro(focus = false) {
    intro.hidden = false
    form.hidden = true
    if (focus) start.focus()
  }

  start.addEventListener('click', () => {
    intro.hidden = true
    form.hidden = false
    go(current)
  })
  introBack.addEventListener('click', () => showIntro(true))

  function pick(purpose, name = '') {
    if (busy) return
    const radio = purposes.find((entry) => entry.value === purpose)
    if (!radio) return
    radio.checked = true
    product = name
    productPurpose = purpose
    selection.hidden = !product
    selection.textContent = product
    introProduct.hidden = !product
    introProduct.textContent = product
    attemptId = undefined
    status.textContent = ''
    go(0, false)
    showIntro()
  }

  document.querySelectorAll('[data-purpose]').forEach((link) => link.addEventListener('click', () => pick(link.dataset.purpose)))
  purposes.forEach((radio) => radio.addEventListener('change', () => {
    if (radio.value !== productPurpose) {
      product = ''
      productPurpose = ''
      selection.hidden = true
      introProduct.hidden = true
    }
    updateNeeds()
  }))
  function advance() {
    if ([...steps[current].querySelectorAll('input, textarea')].every((field) => field.reportValidity())) go(current + 1)
  }
  next.addEventListener('click', advance)
  back.addEventListener('click', () => go(current - 1))
  form.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || current === 2 || !event.target.matches('input') || event.target.name === 'needDetail') return
    event.preventDefault()
    advance()
  })
  input.addEventListener('change', () => setFile(input.files[0]))
  remove.addEventListener('click', () => { input.value = ''; setFile(undefined); input.focus() })
  for (const event of ['dragenter', 'dragover', 'dragleave', 'drop']) drop.addEventListener(event, (e) => {
    e.preventDefault()
    drop.classList.toggle('drag', event === 'dragenter' || event === 'dragover')
    if (event !== 'drop' || busy) return
    input.value = ''
    if (e.dataTransfer.files.length > 1) {
      setFile(undefined)
      info.classList.add('error')
      info.textContent = tr('Επιλέξτε ένα αρχείο ανά αίτημα.', 'Choose one file per request.')
      return
    }
    setFile(e.dataTransfer.files[0])
  })

  form.addEventListener('input', () => { attemptId = undefined })
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (busy || current !== 2) return
    const payload = new FormData(form)
    if (info.classList.contains('error')) { input.focus(); return }
    if (payload.get('purpose') === 'Μελέτη / κάτοψη' && !attachment) {
      info.textContent = tr('Για αίτημα μελέτης, προσθέστε τη μελέτη ή την κάτοψη.', 'For a study request, attach the study or floor plan.')
      input.focus()
      return
    }

    if (attachment) payload.set('file', attachment)
    else payload.delete('file')
    payload.set('product', product.slice(0, 200))
    payload.set('locale', english ? 'en' : 'el')
    attemptId ||= (9_999_999_999_999 - Date.now()) + '-' + crypto.randomUUID()
    payload.set('attemptId', attemptId)
    busy = true
    const controls = [...form.querySelectorAll('input, textarea, button')]
    controls.forEach((control) => { control.disabled = true })
    status.className = ''
    status.textContent = tr('Γίνεται υποβολή…', 'Sending your request…')
    try {
      const response = await fetch(form.action, { method: 'POST', body: payload })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || tr('Η υποβολή απέτυχε. Δοκιμάστε ξανά.', 'Submission failed. Please try again.'))
      form.reset()
      setFile(undefined)
      product = ''
      productPurpose = ''
      selection.hidden = true
      introProduct.hidden = true
      go(0, false)
      status.className = 'success'
      status.textContent = tr('Το αίτημα στάλθηκε. Κωδικός: ', 'Your request was sent. Reference: ') + result.reference
    } catch (error) {
      status.className = 'error'
      status.textContent = error instanceof TypeError || error instanceof SyntaxError
        ? tr('Η σύνδεση διακόπηκε. Δοκιμάστε ξανά.', 'The connection was interrupted. Please try again.') : error.message
    } finally {
      busy = false
      controls.forEach((control) => { control.disabled = false })
      status.focus()
    }
  })

  return pick
}
