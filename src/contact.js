import { tr } from './locale.js'

export function setupContact() {
  const tabList = document.getElementById('visit-tabs')
  const tabs = [...tabList.querySelectorAll('button')]
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')))
  const card = tabList.closest('.visit-card')
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

  function select(index, focus = false) {
    for (const [position, tab] of tabs.entries()) {
      const selected = position === index
      tab.tabIndex = selected ? 0 : -1
      tab.setAttribute('aria-selected', String(selected))
      panels[position].hidden = !selected
    }
    card.classList.toggle('show-hours', index === 1)
    if (focus) tabs[index].focus()
    if (focus && !reduceMotion.matches) {
      panels[index].animate([{ opacity: .4, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' })
    }
  }

  tabList.setAttribute('role', 'tablist')
  for (const [index, tab] of tabs.entries()) {
    tab.setAttribute('role', 'tab')
    panels[index].setAttribute('role', 'tabpanel')
    panels[index].setAttribute('aria-labelledby', tab.id)
    panels[index].tabIndex = 0
    tab.addEventListener('click', () => select(index, true))
    tab.addEventListener('keydown', (event) => {
      const destination = ['ArrowLeft', 'ArrowRight'].includes(event.key) ? 1 - index
        : { Home: 0, End: 1 }[event.key]
      if (destination === undefined) return
      event.preventDefault()
      select(destination, true)
    })
  }
  select(0)
  tabList.hidden = false

  const copy = document.getElementById('visit-copy')
  const address = document.getElementById('visit-address')
  const status = document.getElementById('visit-status')
  if (navigator.clipboard) {
    copy.hidden = false
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(address.textContent.trim())
        status.textContent = tr('Η διεύθυνση αντιγράφηκε.', 'Address copied.')
      } catch {
        status.textContent = tr('Μπορείτε να επιλέξετε τη διεύθυνση για αντιγραφή.', 'Select the address to copy it.')
      }
    })
  }
}
