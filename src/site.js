import { openViewer } from './viewer.js'
import { setupCatalogue } from './catalog.js'
import { setupEquipment } from './equipment.js'
import { setupGuide } from './guide.js'
import { setupCompany } from './company.js'
import { setupQuote } from './quote.js'
import { setupContact } from './contact.js'
import { tr } from './locale.js'
import { setDisclosure, setupBrandWall, setupComparison, showPopover, wireDisclosures } from './motion.js'

const types = {
  powder: ['ABC', tr('Ξηράς σκόνης ABC', 'ABC dry powder'), tr('Η σήμανση ABC αφορά στερεά υλικά, εύφλεκτα υγρά και αέρια. Η ξηρή σκόνη αφήνει κατάλοιπα.', 'ABC covers solid materials, flammable liquids and gases. Dry powder leaves residue.')],
  co2: ['CO₂', tr('Διοξειδίου του άνθρακα', 'Carbon dioxide'), tr('Το CO₂ δεν αφήνει στερεά κατάλοιπα. Χρησιμοποιείται σε ορισμένους κινδύνους κατηγορίας B και σε χώρους με ηλεκτρικό εξοπλισμό, ανάλογα με τη σήμανση του μοντέλου.', 'CO₂ leaves no solid residue. Suitability for certain Class B risks and electrical equipment depends on the model’s marking.')],
  foam: ['AB', tr('Αφρού', 'Foam'), tr('Υπάρχουν μοντέλα αφρού με σήμανση AB για στερεά υλικά και εύφλεκτα υγρά. Η καταλληλότητα εξαρτάται από τη σήμανση του μοντέλου.', 'Some foam models carry an AB rating for solid materials and flammable liquids. Suitability depends on the model’s marking.')],
  wet: ['F', tr('Υγρού χημικού', 'Wet chemical'), tr('Η σήμανση F αφορά μαγειρικά έλαια και λίπη. Ο τύπος αυτός συναντάται σε χώρους με επαγγελματικές συσκευές μαγειρέματος.', 'Class F covers cooking oils and fats. This type is found in settings with commercial cooking equipment.')],
}
const parts = {
  label: tr('Η ετικέτα αναφέρει τις κατηγορίες φωτιάς και την κατασβεστική ικανότητα του συγκεκριμένου μοντέλου.', 'The label shows the model’s fire classes and rating.'),
  valve: tr('Η βαλβίδα ελέγχει τη ροή του κατασβεστικού μέσου. Τα εξαρτήματα στην κορυφή διαφέρουν ανά μοντέλο.', 'The valve controls the flow of extinguishing agent. The parts at the top vary by model.'),
  outlet: tr('Από το ακροφύσιο εξέρχεται το κατασβεστικό μέσο. Στο μοντέλο CO₂ διακρίνεται η χοάνη.', 'The nozzle releases the extinguishing agent. The CO₂ model has a visible horn.'),
}
const partSummaries = {
  label: tr('Κατηγορίες φωτιάς και κατασβεστική ικανότητα.', 'Fire classes and extinguishing rating.'),
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
const usesInspectionLabel = () => (byId('stage').dataset.activeModel || 'powder') === 'powder'
let viewer
wireDisclosures()
setupBrandWall()
setupComparison((type) => {
  const button = [...typeButtons].find((entry) => entry.dataset.type === type)
  button.click()
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  byId('stage').scrollIntoView({ block: 'center', behavior })
})

function showPart(part) {
  setDisclosure(byId('parts'), true)
  const label = byId('stage-part')
  const partButton = [...partButtons].find((button) => button.dataset.part === part)
  byId('stage-part-name').textContent = partButton.textContent
  const inspection = part === 'label' && usesInspectionLabel()
  byId('stage-part-text').textContent = inspection ? inspectionLabel.summary : partSummaries[part]
  showPopover(label, true)
  byId('part-description').textContent = inspection ? inspectionLabel.description : parts[part]
  for (const button of partButtons) button.setAttribute('aria-pressed', String(button.dataset.part === part))
  viewer?.focus(part)
}

function fallback() {
  viewer = undefined
  surface.replaceChildren()
  surface.classList.add('is-fallback')
  byId('viewer-mode').textContent = tr('Ενδεικτική φωτογραφία', 'Illustrative photograph')
  byId('viewer-hint').textContent = tr('Επιλέξτε τύπο για τα χαρακτηριστικά του', 'Choose a type to see its features')
  document.querySelector('.rotate-controls').hidden = true
}

for (const button of typeButtons) button.addEventListener('click', () => {
  const { type } = button.dataset
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
  byId('part-description').textContent = usesInspectionLabel() ? inspectionLabel.description : parts.label
  for (const entry of partButtons) entry.setAttribute('aria-pressed', String(entry.dataset.part === 'label'))
  showPopover(byId('stage-part'), false)
})
for (const button of partButtons) button.addEventListener('click', () => showPart(button.dataset.part))
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
surface.addEventListener('viewerunavailable', fallback)
try {
  viewer = openViewer(surface, showPart, (spinning) => {
    spinButton.setAttribute('aria-pressed', String(spinning))
    byId('spin-label').textContent = spinning ? tr('Παύση', 'Pause') : '360°'
  })
  viewer.set('powder')
  document.querySelector('.rotate-controls').hidden = false
} catch {
  fallback()
}

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
setupCatalogue(pickQuote)
setupEquipment(pickQuote)
setupGuide()
setupCompany()
setupContact()
