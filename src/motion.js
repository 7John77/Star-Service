import { tr } from './locale.js'

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
const easing = 'cubic-bezier(.22, 1, .36, 1)'
const disclosures = new WeakMap()
const popovers = new WeakMap()

export function setDisclosure(details, expanded) {
  const previous = disclosures.get(details)
  if ((previous?.expanded ?? details.open) === expanded) return
  const body = details.querySelector('.disclosure-body')
  const content = details.querySelector('.disclosure-content')
  const start = details.open ? body.getBoundingClientRect().height : 0
  previous?.animation.cancel()
  if (reduceMotion.matches || !body.animate) {
    details.open = expanded
    body.classList.remove('is-animating')
    disclosures.delete(details)
    return
  }

  details.open = true
  const height = expanded ? content.offsetHeight : 0
  body.classList.add('is-animating')
  const animation = body.animate([{ height: start + 'px' }, { height: height + 'px' }], {
    duration: expanded ? 360 : 265,
    easing,
  })
  disclosures.set(details, { expanded, animation })
  animation.onfinish = () => {
    details.open = expanded
    body.classList.remove('is-animating')
    disclosures.delete(details)
  }
}

export function wireDisclosures() {
  document.querySelectorAll('details > summary').forEach((summary) => {
    const details = summary.parentElement
    summary.addEventListener('click', (event) => {
      if (event.defaultPrevented || reduceMotion.matches) return
      event.preventDefault()
      setDisclosure(details, !(disclosures.get(details)?.expanded ?? details.open))
    })
  })
}

export function showPopover(element, visible) {
  const previous = popovers.get(element)
  if (!visible && (element.hidden || previous?.visible === false)) return
  previous?.animation.cancel()
  if (!element.animate || reduceMotion.matches) {
    element.hidden = !visible
    popovers.delete(element)
    return
  }

  const resting = { opacity: 1, transform: 'translateY(0) scale(1)' }
  const offset = { opacity: 0, transform: 'translateY(5px) scale(.975)' }
  element.hidden = false
  const animation = element.animate(visible ? [offset, resting] : [resting, offset], {
    duration: visible ? 285 : 170,
    easing,
  })
  popovers.set(element, { visible, animation })
  animation.onfinish = () => {
    element.hidden = !visible
    popovers.delete(element)
  }
}

export function setupComparison(selectModel) {
  const dialog = document.getElementById('compare')
  const open = document.getElementById('compare-open')
  const close = dialog.querySelector('.dialog-close')
  const choices = dialog.querySelectorAll('[data-compare]')
  let closing = false
  let entry
  const near = { opacity: 1, transform: 'translateY(0) scale(1)' }
  const far = { opacity: 0, transform: 'translateY(12px) scale(.975)' }

  function show() {
    const current = document.querySelector('[data-type][aria-pressed=true]')?.dataset.type
    for (const choice of choices) choice.setAttribute('aria-current', String(choice.dataset.compare === current))
    dialog.showModal()
    if (!reduceMotion.matches && dialog.animate) entry = dialog.animate([far, near], { duration: 350, easing })
  }

  async function hide(model) {
    if (closing || !dialog.open) return
    closing = true
    entry?.cancel()
    if (!reduceMotion.matches && dialog.animate) {
      dialog.classList.add('is-closing')
      const exit = dialog.animate([near, far], { duration: 260, easing: 'ease-out', fill: 'forwards' })
      await exit.finished.catch(() => {})
      dialog.close()
      exit.cancel()
    }
    if (dialog.open) dialog.close()
    dialog.classList.remove('is-closing')
    closing = false
    if (model) selectModel(model)
  }

  open.addEventListener('click', show)
  close.addEventListener('click', () => hide())
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    hide()
  })
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) hide()
  })
  for (const choice of choices) choice.addEventListener('click', () => hide(choice.dataset.compare))
}

export function setupBrandWall() {
  const wall = document.querySelector('.brand-wall')
  const button = document.getElementById('wall-toggle')
  function update(paused) {
    wall.classList.toggle('is-paused', paused)
    button.setAttribute('aria-pressed', String(paused))
    button.textContent = paused ? tr('Κίνηση φόντου', 'Resume background') : tr('Παύση φόντου', 'Pause background')
  }
  try { update(localStorage.getItem('star-service-wall') === 'paused') } catch {}
  button.addEventListener('click', () => {
    const paused = button.getAttribute('aria-pressed') === 'false'
    update(paused)
    try { localStorage.setItem('star-service-wall', paused ? 'paused' : 'running') } catch {}
  })
}
