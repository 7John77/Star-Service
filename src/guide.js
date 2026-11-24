import { make, tr } from './locale.js'

const scenes = {
  store: {
    name: ['Κατάστημα / γραφείο', 'Retail / office'],
    hint: ['Πατήστε τα σημεία στην κάτοψη για να δείτε παραδείγματα εξοπλισμού.', 'Select the points on the floor plan to explore equipment examples.'],
    points: [
      [215, 478, 'powder', 'Φορητός πυροσβεστήρας', 'Portable extinguisher', 'Δείτε φορητά μοντέλα ξηράς σκόνης και συγκρίνετε τις σημάνσεις και τις χωρητικότητες.', 'Explore portable dry powder models and compare their ratings and capacities.'],
      [823, 174, 'co2', 'Ηλεκτρολογικός εξοπλισμός', 'Electrical equipment', 'Δείτε τη σειρά CO₂. Η καταλληλότητα εξαρτάται από τη σήμανση και τα χαρακτηριστικά του μοντέλου.', 'Explore the CO₂ range. Suitability depends on the model’s marking and specifications.'],
    ],
  },
  kitchen: {
    name: ['Επαγγελματική κουζίνα', 'Commercial kitchen'],
    hint: ['Πατήστε τα σημεία δίπλα στη ζώνη μαγειρέματος και στην είσοδο.', 'Select the points near the cooking area and the entrance.'],
    points: [
      [728, 187, 'wet', 'Ζώνη μαγειρέματος', 'Cooking area', 'Δείτε τα μοντέλα υγρού χημικού. Η σήμανση F αφορά μαγειρικά έλαια και λίπη.', 'Browse wet chemical models. Class F covers cooking oils and fats.'],
      [213, 467, 'co2', 'Βοηθητικός εξοπλισμός', 'Support equipment', 'Εξερευνήστε τη σειρά CO₂ και συγκρίνετε τα επιμέρους χαρακτηριστικά.', 'Explore the CO₂ range and compare individual specifications.'],
    ],
  },
  vehicle: {
    name: ['Όχημα', 'Vehicle'],
    hint: ['Στο σχέδιο φαίνονται η καμπίνα και ο χώρος φορτίου ενός οχήματος.', 'The drawing shows a vehicle cabin and its cargo area.'],
    points: [
      [348, 393, 'powder', 'Εξοπλισμός οχήματος', 'Vehicle equipment', 'Δείτε φορητούς πυροσβεστήρες ξηράς σκόνης. Για προσφορά αναφέρετε την κατηγορία του οχήματος.', 'Browse portable dry powder models. Include the vehicle category when requesting a quote.'],
      [690, 242, 'mounts', 'Βάση στήριξης', 'Mounting bracket', 'Εξερευνήστε τις βάσεις του καταλόγου και ζητήστε έλεγχο συμβατότητας με τον εξοπλισμό σας.', 'Explore mounting brackets and ask the store to check compatibility with your equipment.'],
    ],
  },
  industry: {
    name: ['Βιομηχανία / αποθήκη', 'Industry / warehouse'],
    hint: ['Εξερευνήστε τον χώρο φόρτωσης, τα ράφια και το βοηθητικό δωμάτιο.', 'Explore the loading area, shelves and utility room.'],
    points: [
      [211, 477, 'powder', 'Χώρος φόρτωσης', 'Loading area', 'Στον κατάλογο υπάρχουν φορητές και τροχήλατες επιλογές ξηράς σκόνης.', 'The catalogue includes portable and wheeled dry powder models.'],
      [346, 179, 'foam', 'Αποθήκευση', 'Storage area', 'Δείτε τη σειρά αφρού. Συγκρίνετε τις σημάνσεις και τις τεχνικές προδιαγραφές ανά μοντέλο.', 'Explore foam models. Compare markings and specifications for each model.'],
      [817, 430, 'co2', 'Βοηθητικός χώρος', 'Utility room', 'Δείτε πυροσβεστήρες CO₂ στον κατάλογο, με χωρητικότητες και τεχνικά στοιχεία ανά μοντέλο.', 'Browse CO₂ extinguishers with capacities and specifications for individual models.'],
    ],
  },
}

const careScenes = {
  bedroom: {
    name: ['Υπνοδωμάτιο', 'Bedroom'],
    hint: ['Πατήστε στην κλίνη, στο στρώμα ή στην περιοχή μεταφοράς.', 'Select the bed, mattress or transfer area.'],
    points: [
      [271, 245, 'care-beds', 'Κλίνες και εξαρτήματα', 'Beds and accessories', 'Συγκρίνετε κλίνες, κάγκελα και εξαρτήματα με βάση τις διαστάσεις και τους διαθέσιμους μηχανισμούς.', 'Compare beds, rails and accessories by dimensions and available mechanisms.'],
      [550, 326, 'care-pressure', 'Στρώματα και μαξιλάρια', 'Mattresses and cushions', 'Δείτε στρώματα, μαξιλάρια και αεραντλίες, με τα τεχνικά χαρακτηριστικά κάθε μοντέλου.', 'Explore mattresses, cushions and air pumps with specifications for each model.'],
      [755, 421, 'care-transfer', 'Βοηθήματα μεταφοράς', 'Transfer aids', 'Εξερευνήστε καρέκλες ανύψωσης, γερανούς, σάκους και σανίδες μεταφοράς.', 'Explore lift chairs, hoists, slings and transfer boards.'],
    ],
  },
  bathroom: {
    name: ['Μπάνιο', 'Bathroom'],
    hint: ['Εξερευνήστε τη ζώνη του ντους, της τουαλέτας και του νιπτήρα.', 'Explore the shower, toilet and washbasin areas.'],
    points: [
      [313, 252, 'care-bathroom', 'Καθίσματα μπάνιου', 'Shower seats', 'Δείτε σταθερά και ρυθμιζόμενα καθίσματα μπάνιου και τις διαστάσεις τους.', 'Browse fixed and adjustable shower seats and compare their dimensions.'],
      [742, 234, 'care-bathroom', 'Βοηθήματα τουαλέτας', 'Toilet aids', 'Στον κατάλογο θα βρείτε ανυψωτικά, πλαίσια στήριξης και καρέκλες με δοχείο.', 'Browse raised seats, support frames and commode chairs.'],
      [579, 423, 'care-daily', 'Καθημερινή φροντίδα', 'Daily living aids', 'Δείτε μικρά βοηθήματα και αναλώσιμα για την καθημερινή φροντίδα στο σπίτι.', 'Explore daily living aids and consumables for home care.'],
    ],
  },
  mobility: {
    name: ['Μετακίνηση', 'Getting around'],
    hint: ['Πατήστε σε ένα σημείο της διαδρομής για να ανοίξετε τα σχετικά είδη.', 'Select a point along the route to open the relevant products.'],
    points: [
      [258, 324, 'care-walking', 'Βοηθήματα βάδισης', 'Walking aids', 'Δείτε μπαστούνια, πατερίτσες και περιπατητήρες. Τα φίλτρα του καταλόγου ξεχωρίζουν τους τύπους.', 'Explore canes, crutches and rollators. The catalogue filters let you browse by type.'],
      [553, 238, 'care-wheelchairs', 'Αναπηρικά αμαξίδια', 'Wheelchairs', 'Συγκρίνετε χειροκίνητα, ηλεκτροκίνητα και αμαξίδια μεταφοράς.', 'Compare manual, powered and transport wheelchairs.'],
      [745, 413, 'care-transfer', 'Ανύψωση και μεταφορά', 'Lifting and transfer', 'Δείτε τα βοηθήματα μεταφοράς μαζί με τις διαστάσεις και τα εξαρτήματά τους.', 'Explore transfer equipment, dimensions and accessories.'],
    ],
  },
}

function paint(canvas, key) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const ink = '#436158'
  const wall = '#203e37'
  const tile = '#f6f3e9'
  const green = '#d8e9dc'
  const light = '#eaf0e7'
  const wood = '#e9d9bd'
  const steel = '#c5d6cd'
  const trim = '#819b90'

  function box(x, y, w, h, fill, stroke = ink, radius = 7, line = 2) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radius)
    if (fill) { ctx.fillStyle = fill; ctx.fill() }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke() }
  }
  function line(x, y, x2, y2, color = trim, width = 2) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x2, y2)
    ctx.lineWidth = width
    ctx.strokeStyle = color
    ctx.stroke()
  }
  function circle(x, y, r, fill, stroke = ink) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()
  }
  function label(text, x, y) {
    ctx.font = '700 20px Inter, sans-serif'
    ctx.fillStyle = '#47635a'
    ctx.fillText(text, x, y)
  }
  function frame() {
    box(104, 80, 792, 457, tile, wall, 12, 11)
    ctx.save()
    ctx.beginPath()
    ctx.rect(111, 87, 778, 443)
    ctx.clip()
    for (let x = 112; x < 895; x += 45) line(x, 88, x, 531, '#dddcd0', 1)
    for (let y = 90; y < 535; y += 45) line(110, y, 890, y, '#dddcd0', 1)
    ctx.restore()
    line(112, 534, 185, 534, wall, 8)
    line(184, 534, 184, 464, wall, 3)
    ctx.beginPath()
    ctx.arc(184, 534, 70, -Math.PI / 2, 0)
    ctx.strokeStyle = '#779787'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  function desk(x,y) {
    box(x,y,150,67,wood)
    box(x+18,y+14,42,25,steel)
    line(x+38,y+39,x+38,y+48,ink,3)
    box(x+97,y+14,33,39,'#fcfbf4')
    box(x+56,y+79,48,35,green)
  }
  function counter(x,y,w,h) {
    box(x,y,w,h,steel)
    line(x+8,y+12,x+w-8,y+12,'#ecf3ec',3)
  }
  function rack(x,y,w) {
    box(x,y,w,65,wood)
    const cells = Math.floor(w/35)
    for (let i=0;i<cells;i++) box(x+10+i*35,y+11,23,42,i%2 ? light : green)
  }
  function plant(x,y) {
    circle(x,y,17,wood)
    circle(x-8,y,10,green)
    circle(x+7,y-2,10,'#b7d1ba')
    circle(x,y+7,8,'#9fbeaa')
  }

  ctx.fillStyle = '#edf2ea'
  ctx.fillRect(0,0,1000,620)
  for (let x=20;x<1000;x+=26) for (let y=20;y<620;y+=26) {
    ctx.fillStyle='#c7d5ca'
    ctx.fillRect(x,y,1.5,1.5)
  }
  if (key === 'store') {
    frame()
    box(716,92,164,170,light,wall,5,5)
    counter(738,111,119,42)
    desk(166,156)
    desk(389,156)
    desk(166,315)
    desk(389,315)
    box(626,341,218,65,green)
    box(650,424,169,53,wood)
    plant(850,477)
    label(tr('ΘΕΣΕΙΣ ΕΡΓΑΣΙΑΣ','WORKSTATIONS'),163,133)
    label(tr('ΥΠΟΔΟΧΗ','RECEPTION'),642,318)
  } else if (key === 'kitchen') {
    frame()
    counter(143,116,660,73)
    for (let i=0;i<5;i++) circle(383+i*29,151,10,'#647f76')
    for (let i=0;i<2;i++) box(550+i*42,132,31,35,'#f9f6ec')
    counter(780,195,82,235)
    for (let i=0;i<3;i++) box(796,219+i*61,49,41,'#f4f2e8')
    counter(304,271,322,75)
    counter(314,385,297,58)
    for (let i=0;i<5;i++) line(334+i*49,396,334+i*49,431)
    box(130,247,111,128,green)
    label(tr('ΜΑΓΕΙΡΕΜΑ','COOKING'),151,220)
    label(tr('ΠΡΟΕΤΟΙΜΑΣΙΑ','PREPARATION'),314,262)
  } else if (key === 'vehicle') {
    box(109,135,792,350,'#dce7df',trim,30)
    for (let x=132;x<880;x+=58) line(x,305,x+28,305,'#fff',3)
    for (const x of [286,737]) for (const y of [191,405]) box(x,y,90,34,'#29463d',wall,12)
    box(185,211,630,209,'#f9f6ec',wall,48,7)
    box(208,232,56,167,steel,wall,20,3)
    box(282,235,125,161,light)
    box(304,254,53,47,green)
    box(304,330,53,47,green)
    circle(293,274,13,steel)
    line(428,220,428,411,wall,7)
    rack(460,230,303)
    for (let i=0;i<4;i++) box(465+i*73,338,58,51,wood)
    line(785,239,785,392,trim,4)
    label(tr('ΚΑΜΠΙΝΑ','CABIN'),268,173)
    label(tr('ΧΩΡΟΣ ΦΟΡΤΙΟΥ','CARGO AREA'),510,173)
  } else if (key === 'bedroom') {
    frame()
    box(192, 137, 362, 221, steel, wall, 12, 5)
    box(206, 150, 333, 192, '#fffdf5')
    for (const y of [171, 238]) box(223, y, 58, 49, light)
    box(299, 159, 231, 171, green)
    for (let x = 320; x < 523; x += 27) line(x, 163, x, 325, '#b4cbba')
    box(622, 130, 171, 56, wood)
    box(701, 345, 119, 96, light)
    plant(830, 476)
    label(tr('ΚΛΙΝΗ','BED'), 194, 120)
    label(tr('ΖΩΝΗ ΜΕΤΑΦΟΡΑΣ','TRANSFER AREA'), 627, 325)
  } else if (key === 'bathroom') {
    frame()
    box(172, 121, 279, 252, '#cde5e4', wall, 8, 5)
    for (let x = 199; x < 445; x += 35) line(x, 135, x, 356, '#aecece')
    for (let y = 148; y < 360; y += 35) line(182, y, 442, y, '#aecece')
    box(218, 193, 93, 68, light)
    circle(389, 318, 12, '#90b1b1')
    box(688, 131, 106, 49, steel)
    circle(741, 224, 52, '#f9f9ee')
    circle(741, 224, 31, '#d8e5df')
    box(508, 394, 188, 81, steel)
    circle(588, 431, 27, '#f9f9ee')
    label(tr('ΝΤΟΥΣ','SHOWER'), 175, 109)
    label(tr('ΤΟΥΑΛΕΤΑ','TOILET'), 664, 111)
  } else if (key === 'mobility') {
    frame()
    box(167, 147, 661, 324, '#dcebe2', trim, 30)
    for (let x = 194; x < 792; x += 58) line(x, 310, x + 28, 310, '#fffaf1', 4)
    box(210, 229, 62, 83, '#f9fcf7')
    for (const x of [209, 274]) for (const y of [229, 313]) circle(x, y, 8, '#729387')
    box(501, 182, 85, 66, green, ink, 10, 3)
    for (const x of [497, 593]) box(x, 179, 13, 76, steel, ink, 4)
    box(688, 359, 119, 65, wood)
    label(tr('ΔΙΑΔΡΟΜΗ','ROUTE'), 328, 148)
    label(tr('ΣΗΜΕΙΟ ΜΕΤΑΦΟΡΑΣ','TRANSFER POINT'), 573, 457)
  } else {
    frame()
    rack(152,120,592)
    rack(152,224,592)
    rack(152,333,556)
    box(742,363,132,145,light,wall,5,5)
    counter(757,385,104,38)
    box(770,460,40,31,wood)
    for (let x=285;x<615;x+=70) box(x,452,49,42,steel)
    for (let x=172;x<712;x+=45) line(x,312,x+21,312,'#8b9b79',3)
    label(tr('ΡΑΦΙΑ','SHELVES'),777,148)
    label(tr('ΦΟΡΤΩΣΗ','LOADING'),283,442)
  }
}

export function setupGuide() {
  wireGuide('guide', scenes, false)
  wireGuide('care-guide', careScenes, true)
}

function wireGuide(id, guideScenes, care) {
  const root = document.getElementById(id)
  const options = [...root.querySelectorAll('[data-guide]')]
  const plan = root.querySelector('canvas')
  const art = root.querySelector('.plan-art')
  const points = root.querySelector('.plan-points')
  const name = document.getElementById(id + '-name')
  const heading = document.getElementById(id + '-point')
  const text = document.getElementById(id + '-text')
  const link = document.getElementById(id + '-link')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let currentScene

  function select(option, animate) {
    if (currentScene === option.dataset.guide) return
    currentScene = option.dataset.guide
    const scene = guideScenes[currentScene]
    options.forEach((button) => button.setAttribute('aria-pressed', String(button === option)))
    paint(plan, currentScene)
    name.textContent = tr(...scene.name)
    heading.textContent = tr('Επιλέξτε ένα σημείο', 'Select an equipment point')
    text.textContent = tr(...scene.hint)
    link.hidden = true
    points.replaceChildren()
    for (const [x, y, category, title, titleEn, description, descriptionEn] of scene.points) {
      const pin = make('button', '', 'plan-pin')
      if (care) pin.textContent = String(points.children.length + 1)
      else {
        const icon = make('img')
        icon.src = '/star-service-icon.svg'
        icon.alt = ''
        const plus = make('span', '+', 'pin-plus')
        plus.setAttribute('aria-hidden', 'true')
        pin.append(icon, plus)
      }
      pin.type = 'button'
      pin.setAttribute('aria-label', tr(title, titleEn))
      pin.setAttribute('aria-pressed', 'false')
      pin.style.left = x / 10 + '%'
      pin.style.top = y / 6.2 + '%'
      pin.addEventListener('click', () => {
        for (const other of points.children) other.setAttribute('aria-pressed', String(other === pin))
        heading.textContent = tr(title, titleEn)
        text.textContent = tr(description, descriptionEn)
        link.dataset.filterLink = category
        link.hidden = false
        if (!reduce.matches) heading.parentElement.animate([{ opacity: .65, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' })
      })
      points.append(pin)
    }
    if (animate && !reduce.matches) art.animate([{ opacity: .38, transform: 'scale(.99)' }, { opacity: 1, transform: 'none' }], { duration: 355, easing: 'ease-out' })
  }
  options.forEach((option) => option.addEventListener('click', () => select(option, true)))
  select(options[0], false)
}
