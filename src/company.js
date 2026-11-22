export function setupCompany() {
  const options = [...document.querySelectorAll('[data-company]')]
  const dialog = document.getElementById('certificate-viewer')
  const image = document.getElementById('certificate-image')
  const title = document.getElementById('certificate-title')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let active, leaving = false

  function toggle(selected, allowClose) {
    const next = allowClose && selected === active ? undefined : selected
    for (const button of options) {
      const panel = document.getElementById(button.dataset.company)
      const shown = button === next
      panel.hidden = !shown
      button.setAttribute('aria-expanded', String(shown))
      if (shown && !reduce.matches) panel.animate([{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'none' }], { duration: 310, easing: 'ease-out' })
    }
    active = next
  }

  for (const button of options) button.addEventListener('click', () => toggle(button, true))
  function fromHash() {
    const button = options.find((entry) => '#' + entry.dataset.company === location.hash)
    if (button) {
      toggle(button, false)
      document.getElementById(button.dataset.company).scrollIntoView({ block: 'nearest' })
    }
  }
  document.querySelector('a[href="#clients"]').addEventListener('click', () => toggle(options[0], false))
  window.addEventListener('hashchange', fromHash)
  fromHash()

  for (const thumb of document.querySelectorAll('[data-certificate]')) thumb.addEventListener('click', () => {
    const alt = thumb.querySelector('img').alt
    image.alt = alt
    title.textContent = alt
    image.src = thumb.dataset.certificate
    dialog.showModal()
    if (!reduce.matches) dialog.animate([{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 310, easing: 'ease-out' })
  })
  async function close() {
    if (!dialog.open || leaving) return
    leaving = true
    if (!reduce.matches) {
      dialog.classList.add('is-closing')
      const exit = dialog.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px) scale(.985)' }], { duration: 210, fill: 'forwards' })
      await exit.finished.catch(() => {})
      dialog.close()
      exit.cancel()
      dialog.classList.remove('is-closing')
    } else dialog.close()
    leaving = false
  }
  dialog.querySelector('.dialog-close').addEventListener('click', close)
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close() })
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close() })
}
