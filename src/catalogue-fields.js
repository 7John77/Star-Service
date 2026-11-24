export const categories = [
  ['all', 'Όλες οι κατηγορίες', 'All categories'],
  ['powder', 'Ξηράς σκόνης', 'Dry powder'],
  ['co2', 'CO₂', 'CO₂'],
  ['foam', 'Αφρού', 'Foam'],
  ['wet', 'Υγρού χημικού', 'Wet chemical'],
  ['special', 'Ειδικές εφαρμογές', 'Special applications'],
  ['mounts', 'Βάσεις, θήκες & εξαρτήματα', 'Mounts, cases & accessories'],
  ['agents', 'Υλικά κατάσβεσης', 'Extinguishing agents'],
  ['cabinets', 'Φωλιές & σταθμοί', 'Fire hose cabinets & stations'],
  ['detection', 'Πυρανίχνευση', 'Fire detection'],
  ['doors', 'Πόρτες πυράντοχες', 'Fire-resistant doors'],
  ['rok', 'Κατάλογος POK', 'POK catalogue'],
  ['parts', 'Ανταλλακτικά πυροσβεστήρων', 'Extinguisher spare parts'],
  ['hoses', 'Σωλήνες, αυλοί & σύνδεσμοι', 'Hoses, nozzles & couplings'],
  ['systems', 'Συστήματα κατάσβεσης', 'Fire suppression systems'],
  ['curtains', 'Πυροκουρτίνες', 'Fire curtains'],
  ['safety', 'Μέσα προστασίας & πρώτες βοήθειες', 'Protective equipment & first aid'],
  ['gadgets', 'Είδη πυρασφάλειας', 'Fire safety accessories'],
  ['other', 'Λοιπός εξοπλισμός', 'Other equipment'],
]

export const productKey = (product) => JSON.stringify([
  product.category, product.path || '', product.code || '', product.sku || '', product.path ? '' : product.title,
])

export const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().replace(/₂/g, '2').replace(/[^\p{L}\p{N}]/gu, '')
