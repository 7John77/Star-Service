const feedback = document.getElementById('inbox-status')
const list = document.getElementById('inbox-list')
const more = document.getElementById('more')
let cursor = ''

function add(parent, tag, text) {
  const element = document.createElement(tag)
  element.textContent = text
  parent.append(element)
  return element
}

function show(item) {
  const article = add(list, 'article', '')
  add(article, 'h3', item.purpose)
  const date = new Date(item.date).toLocaleString('el-GR', { timeZone: 'Europe/Athens' })
  add(article, 'p', [item.name, item.email, item.phone, date, item.reference].filter(Boolean).join(' · '))
  if (item.needDetail) add(article, 'p', 'Ανάγκη · ' + item.needDetail)
  if (item.premises) add(article, 'p', 'Χώρος · ' + item.premises)
  if (item.product) add(article, 'p', 'Είδος · ' + item.product)
  if (item.message) add(article, 'p', item.message)
  if (item.filename) {
    const link = add(article, 'a', 'Λήψη αρχείου · ' + item.filename)
    link.href = '/api/inbox/' + encodeURIComponent(item.id)
    link.download = item.filename
  }
  if (item.emailStatus) {
    const emailStatus = add(article, 'p', {
      accepted: 'Email · Η υπηρεσία παρέλαβε την αποστολή.',
      unconfirmed: 'Email · Αναμένεται επιβεβαίωση αποστολής.',
      unconfigured: 'Email · Αναμένεται ενεργοποίηση αποστολέα.',
    }[item.emailStatus])
    emailStatus.setAttribute('role', 'status')
    if (item.emailStatus === 'unconfirmed') {
      const retry = add(article, 'button', 'Επανάληψη αποστολής email')
      retry.type = 'button'
      retry.className = 'text-button'
      retry.addEventListener('click', async () => {
        retry.disabled = true
        try {
          const response = await fetch('/api/inbox/' + encodeURIComponent(item.id) + '/email', { method: 'POST' })
          if (!response.ok) throw new Error()
          emailStatus.textContent = 'Email · Η υπηρεσία παρέλαβε την αποστολή.'
          retry.remove()
        } catch {
          emailStatus.textContent = 'Email · Δεν επιβεβαιώθηκε η αποστολή. Δοκίμασε ξανά.'
          retry.disabled = false
        }
      })
    }
  }
  const button = add(article, 'button', 'Διαγραφή αιτήματος')
  button.type = 'button'
  button.className = 'text-button'
  button.addEventListener('click', async () => {
    if (!confirm('Να διαγραφεί οριστικά αυτό το αίτημα και το αρχείο του;')) return
    button.disabled = true
    try {
      const response = await fetch('/api/inbox/' + encodeURIComponent(item.id), { method: 'DELETE' })
      if (!response.ok) throw new Error()
      article.remove()
      feedback.textContent = list.children.length ? 'Το αίτημα διαγράφηκε.' : 'Δεν υπάρχουν εμφανιζόμενα αιτήματα.'
    } catch {
      button.disabled = false
      feedback.textContent = 'Η διαγραφή απέτυχε. Δοκίμασε ξανά.'
    }
  })
}

async function load() {
  more.disabled = true
  try {
    const response = await fetch('/api/inbox' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''))
    if (response.status === 403) {
      feedback.textContent = 'Η διαχείριση είναι διαθέσιμη από τον λογαριασμό του ιδιοκτήτη.'
      return
    }
    if (!response.ok) throw new Error()
    const data = await response.json()
    data.items.forEach(show)
    cursor = data.cursor || ''
    more.hidden = !cursor
    feedback.textContent = list.children.length ? '' : 'Δεν υπάρχουν αιτήματα ακόμη.'
  } catch {
    feedback.textContent = 'Η φόρτωση απέτυχε.'
    more.hidden = false
    more.textContent = 'Δοκίμασε ξανά'
  } finally {
    more.disabled = false
  }
}

more.addEventListener('click', load)
load()
