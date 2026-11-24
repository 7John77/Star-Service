import { openViewer } from './viewer.js'
import { setupCatalogue } from './catalog.js'
import { setupEquipment } from './equipment.js'
import { setupGuide } from './guide.js'
import { setupCompany } from './company.js'
import { setupQuote } from './quote.js'
import { setupContact } from './contact.js'
import { isCareCategory } from './catalogue-fields.js'
import { tr } from './locale.js'
import { setDisclosure, setupBrandWall, setupComparison, showPopover, wireDisclosures } from './motion.js'

const types = {
  powder: ['ABC', tr('Ξηράς σκόνης ABC', 'ABC dry powder'), tr('Η σήμανση ABC αφορά στερεά υλικά, εύφλεκτα υγρά και αέρια. Η ξηρή σκόνη αφήνει κατάλοιπα.', 'ABC covers solid materials, flammable liquids and gases. Dry powder leaves residue.')],
  co2: ['CO₂', tr('Διοξειδίου του άνθρακα', 'Carbon dioxide'), tr('Το CO₂ δεν αφήνει στερεά κατάλοιπα. Χρησιμοποιείται σε ορισμένους κινδύνους κατηγορίας B και σε χώρους με ηλεκτρικό εξοπλισμό, ανάλογα με τη σήμανση του μοντέλου.', 'CO₂ leaves no solid residue. Suitability for certain Class B risks and electrical equipment depends on the model’s marking.')],
  foam: ['AB', tr('Αφρού', 'Foam'), tr('Υπάρχουν μοντέλα αφρού με σήμανση AB για στερεά υλικά και εύφλεκτα υγρά. Η καταλληλότητα εξαρτάται από τη σήμανση του μοντέλου.', 'Some foam models carry an AB rating for solid materials and flammable liquids. Suitability depends on the model’s marking.')],
  wet: ['F', tr('Υγρού χημικού', 'Wet chemical'), tr('Η σήμανση F αφορά μαγειρικά έλαια και λίπη. Ο τύπος αυτός συναντάται σε χώρους με επαγγελματικές συσκευές μαγειρέματος.', 'Class F covers cooking oils and fats. This type is found in settings with commercial cooking equipment.')],
}
const parts = {
  valve: tr('Η βαλβίδα ελέγχει τη ροή του κατασβεστικού μέσου. Τα εξαρτήματα στην κορυφή διαφέρουν ανά μοντέλο.', 'The valve controls the flow of extinguishing agent. The parts at the top vary by model.'),
  outlet: tr('Από το ακροφύσιο εξέρχεται το κατασβεστικό μέσο. Στο μοντέλο CO₂ διακρίνεται η χοάνη.', 'The nozzle releases the extinguishing agent. The CO₂ model has a visible horn.'),
}
const partSummaries = {
  valve: tr('Ελέγχει τη ροή του κατασβεστικού μέσου.', 'Controls the flow of extinguishing agent.'),
  outlet: tr('Κατευθύνει το κατασβεστικό μέσο.', 'Directs the extinguishing agent.'),
}
const byId = (id) => document.getElementById(id)
const surface = byId('model-surface')
const typeButtons = document.querySelectorAll('button[data-type]')
const partButtons = document.querySelectorAll('button[data-part]')
const spinButton = byId('spin-model')
const zoomButton = byId('zoom-model')
const inspectionLabel = {
  summary: tr('Ετικέτα ελέγχου και αναγόμωσης Star Service.', 'Star Service inspection and refill label.'),
  description: tr('Η ετικέτα Star Service καταγράφει τους ελέγχους, τη συντήρηση και την αναγόμωση του πυροσβεστήρα.', 'The Star Service label records extinguisher inspections, servicing and refills.'),
}
const careParts = {
  backrest: tr('Η πλάτη και το κάθισμα στηρίζουν τον χρήστη. Το πλάτος και το βάθος του καθίσματος διαφέρουν ανά μοντέλο.', 'The backrest and seat support the user. Seat width and depth vary by model.'),
  wheel: tr('Οι μεγάλοι πίσω τροχοί έχουν στεφάνες ώθησης. Οι μικροί μπροστινοί τροχοί στρέφονται για τους ελιγμούς.', 'The large rear wheels have push rims. The small front casters swivel for manoeuvring.'),
  brake: tr('Τα φρένα στάθμευσης συγκρατούν τους πίσω τροχούς όταν το αμαξίδιο είναι σταματημένο.', 'The parking brakes hold the rear wheels in place when the wheelchair is stationary.'),
  footrest: tr('Τα υποπόδια στηρίζουν τα πέλματα. Σε αρκετά μοντέλα ρυθμίζονται, ανοίγουν στο πλάι ή αφαιρούνται.', 'Footrests support the feet. On many models they adjust, swing away or detach.'),
}
const careButtons = [...document.querySelectorAll('button[data-care-part]')]
const departmentButtons = [...document.querySelectorAll('button[data-department]')]
const departmentContent = [...document.querySelectorAll('[data-when]')]
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const stage = byId('stage')
const controls = stage.querySelector('.rotate-controls')
const heroQuote = document.querySelector('.hero-copy .button-red')
const entry = byId('department-entry')
const departmentStorageKey = 'star-service-department'
const brandImages = [...document.querySelectorAll('[data-brand-image]')]
const themeColor = document.querySelector('meta[name="theme-color"]')
let savedDepartment
try { savedDepartment = sessionStorage.getItem(departmentStorageKey) } catch {}
let department = location.hash === '#care' || (location.hash !== '#fire' && savedDepartment === 'care') ? 'care' : 'fire'
let fireType = 'powder'
let viewer
let viewerFailed = false
wireDisclosures()
setupBrandWall()
setupComparison((type) => {
  const button = [...typeButtons].find((entry) => entry.dataset.type === type)
  button.click()
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  byId('stage').scrollIntoView({ block: 'center', behavior })
})

function showCarePart(part) {
  const button = careButtons.find((entry) => entry.dataset.carePart === part)
  if (!button) return
  for (const entry of careButtons) entry.setAttribute('aria-pressed', String(entry === button))
  byId('care-part-name').textContent = button.textContent
  byId('care-part-description').textContent = careParts[part]
  byId('care-part-detail').hidden = false
  viewer?.focus(part)
  if (!reducedMotion.matches) {
    byId('care-part-detail').animate([{ opacity: .45, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 200 })
  }
}

function showPart(part) {
  if (department === 'care') {
    showCarePart(part)
    return
  }
  setDisclosure(byId('parts'), true)
  const label = byId('stage-part')
  const partButton = [...partButtons].find((button) => button.dataset.part === part)
  byId('stage-part-name').textContent = partButton.textContent
  const inspection = part === 'label'
  byId('stage-part-text').textContent = inspection ? inspectionLabel.summary : partSummaries[part]
  showPopover(label, true)
  byId('part-description').textContent = inspection ? inspectionLabel.description : parts[part]
  for (const button of partButtons) button.setAttribute('aria-pressed', String(button.dataset.part === part))
  viewer?.focus(part)
}

function fallback() {
  viewerFailed = true
  viewer = undefined
  surface.replaceChildren()
  surface.classList.add('is-preview')
  byId('viewer-mode').textContent = tr('Προεπισκόπηση μοντέλου', 'Model preview')
  byId('viewer-hint').textContent = tr('Επιλέξτε ένα μέρος για λεπτομέρειες', 'Select a part for details')
  controls.hidden = true
}

for (const button of typeButtons) button.addEventListener('click', () => {
  const { type } = button.dataset
  if (department !== 'fire') return
  fireType = type
  const [mark, title, description] = types[type]
  byId('stage').dataset.activeModel = type
  byId('model-catalog').dataset.filterLink = type
  byId('stage-class').textContent = mark
  byId('type-title').textContent = title
  byId('type-description').textContent = description
  surface.setAttribute('aria-label', tr('Μοντέλο πυροσβεστήρα · ', 'Fire extinguisher model · ') + title)
  for (const entry of typeButtons) entry.setAttribute('aria-pressed', String(entry === button))
  viewer?.set(type)
  setDisclosure(byId('parts'), false)
  byId('part-description').textContent = inspectionLabel.description
  for (const entry of partButtons) entry.setAttribute('aria-pressed', String(entry.dataset.part === 'label'))
  showPopover(byId('stage-part'), false)
})
for (const button of partButtons) button.addEventListener('click', () => showPart(button.dataset.part))
for (const button of careButtons) button.addEventListener('click', () => showCarePart(button.dataset.carePart))
spinButton.addEventListener('click', () => viewer?.spin())

function updateZoom(enabled) {
  zoomButton.setAttribute('aria-pressed', String(enabled))
  byId('zoom-label').textContent = enabled ? 'Zoom −' : 'Zoom'
}

zoomButton.addEventListener('click', () => {
  const enabled = zoomButton.getAttribute('aria-pressed') === 'false'
  viewer?.zoom(enabled)
  updateZoom(enabled)
})
byId('reset-model').addEventListener('click', () => {
  viewer?.reset()
  updateZoom(false)
  showPopover(byId('stage-part'), false)
})
byId('stage').addEventListener('keydown', (event) => {
  if (!viewer || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
  event.preventDefault()
  viewer.turn(event.key === 'ArrowLeft' ? -1 : 1)
})


byId('parts').addEventListener('toggle', (event) => {
  if (!event.target.open) showPopover(byId('stage-part'), false)
})
function showDepartment(next, initial = false) {
  if (!initial && next === department) return
  department = next
  const care = next === 'care'
  document.documentElement.dataset.department = next
  for (const image of brandImages) {
    image.src = '/star-service-logo' + (care ? '-care' : '') + (image.hasAttribute('data-brand-dark') ? '-dark' : '') + '.svg'
  }
  themeColor.content = care ? '#edf6f7' : '#f4f1ec'
  for (const panel of departmentContent) panel.hidden = panel.dataset.when !== next
  for (const button of departmentButtons) button.setAttribute('aria-pressed', String(button.dataset.department === next))
  const model = care ? 'wheelchair' : fireType
  stage.dataset.activeModel = model
  byId('stage-class').textContent = care ? tr('Αμαξίδιο', 'Wheelchair') : types[model][0]
  surface.setAttribute('aria-label', care ? tr('3D μοντέλο αναπηρικού αμαξιδίου', '3D wheelchair model') : tr('Μοντέλο πυροσβεστήρα', 'Fire extinguisher model'))
  byId('catalog-search').placeholder = care ? tr('π.χ. αμαξίδιο ή 0811900', 'e.g. wheelchair or 0811900') : tr('π.χ. 6 kg ή CO₂', 'e.g. 6 kg or CO₂')
  const language = document.querySelector('.language-switch')
  language.hash = care ? 'care' : ''
  showPopover(byId('stage-part'), false)
  byId('care-part-detail').hidden = true
  for (const button of careButtons) button.setAttribute('aria-pressed', 'false')
  updateZoom(false)
  viewer?.zoom(false)
  viewer?.set(model)
  if (viewerFailed) fallback()
  if (!initial && !reducedMotion.matches) {
    for (const panel of [document.querySelector('.hero-copy'), stage, document.querySelector('.department-grid[data-when="' + next + '"]')]) {
      panel.animate([{ opacity: .65, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' })
    }
  }
  if (!initial) document.dispatchEvent(new CustomEvent('cataloguedepartment', { detail: next }))
}

function rememberDepartment(next) {
  try { sessionStorage.setItem(departmentStorageKey, next) } catch {}
}

function enterDepartment(next) {
  rememberDepartment(next)
  showDepartment(next)
  history.replaceState(null, '', location.pathname + location.search + (next === 'care' ? '#care' : ''))
  entry.close()
  window.scrollTo({ top: 0, behavior: 'instant' })
  byId('hero-title').focus({ preventScroll: true })
}

for (const button of entry.querySelectorAll('[data-entry]')) {
  button.addEventListener('click', () => enterDepartment(button.dataset.entry))
}
entry.addEventListener('cancel', (event) => {
  event.preventDefault()
  enterDepartment('fire')
})

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-department]')
  const filter = event.target.closest('[data-filter-link]')
  if (control) {
    const next = control.dataset.department
    rememberDepartment(next)
    showDepartment(next)
    if (control.tagName === 'BUTTON' && (location.hash === '#care' || location.hash === '#fire' || !location.hash)) {
      history.replaceState(null, '', next === 'care' ? '#care' : location.pathname + location.search)
    }
  } else if (filter) {
    showDepartment(isCareCategory(filter.dataset.filterLink) ? 'care' : 'fire')
  }
})
window.addEventListener('hashchange', () => {
  if (location.hash === '#care') showDepartment('care')
  if (location.hash === '#fire') showDepartment('fire')
})
heroQuote.addEventListener('click', () => {
  if (department === 'care') pickQuote('Είδη φροντίδας')
})
showDepartment(department, true)
if (!savedDepartment && !location.hash) entry.showModal()

surface.addEventListener('viewerunavailable', fallback)
const artwork = new Image()
artwork.src = '/inspection-label.webp'
artwork.decode().then(() => artwork, () => null).then((decoded) => {
  viewer = openViewer(surface, decoded, showPart, (spinning) => {
    spinButton.setAttribute('aria-pressed', String(spinning))
    byId('spin-label').textContent = spinning ? tr('Παύση', 'Pause') : '360°'
  })
  viewer.set(stage.dataset.activeModel)
  controls.hidden = false
}).catch(fallback)

const menu = document.querySelector('.menu-toggle')
const nav = byId('nav')
function setMenu(open) {
  nav.classList.toggle('open', open)
  menu.setAttribute('aria-expanded', String(open))
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'))
nav.addEventListener('click', () => setMenu(false))
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false)
    menu.focus()
  }
})

const pickQuote = setupQuote()
setupCatalogue(pickQuote, department)
setupEquipment(pickQuote)
setupGuide()
setupCompany()
setupContact()
