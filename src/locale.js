export const english = document.documentElement.lang === 'en'
export const tr = (el, en) => english ? en : el
export function make(tag, text, cssClass) {
  const node = document.createElement(tag)
  if (text) node.textContent = text
  if (cssClass) node.className = cssClass
  return node
}
