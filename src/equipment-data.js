import pok from './pok-links.json'

const hardware = 'Προμήθεια πυροσβεστήρων'
const systems = 'Πυρανίχνευση / πυροπροστασία'

export const equipment = {
  detection: {
    title: ['Πυρανίχνευση & ειδοποίηση', 'Detection & alarm equipment'],
    intro: ['Επιλέξτε την οικογένεια εξοπλισμού που αφορά τον χώρο σας.', 'Choose the equipment family that fits your enquiry.'],
    purpose: systems,
    entries: [
      [['Συμβατική πυρανίχνευση', 'Conventional detection'], ['Συστήματα με πίνακα και ζώνες πυρανίχνευσης. Ο πίνακας, οι ανιχνευτές, τα κομβία και οι συσκευές ειδοποίησης εξετάζονται μαζί.', 'Panel-based systems organised into detection zones. Panels, detectors, manual call points and alarm devices are considered together.']],
      [['Διευθυνσιοδοτούμενη πυρανίχνευση', 'Addressable detection'], ['Συστήματα στα οποία ο πίνακας αναγνωρίζει συσκευές ξεχωριστά. Αναφέρετε τον τύπο πίνακα αν το αίτημα αφορά υπάρχουσα εγκατάσταση.', 'Systems whose panel identifies devices individually. Include your panel model if the request is for an existing installation.']],
      [['Ανίχνευση αερίων', 'Gas detection'], ['Εξοπλισμός ανίχνευσης αερίου. Για εκτίμηση ζητήματος, αναφέρετε το αέριο και το είδος του χώρου.', 'Gas detection equipment. Include the target gas and the type of premises in your enquiry.']],
      [['Φωτισμός ασφαλείας', 'Emergency lighting'], ['Φωτιστικά ασφαλείας και σήμανση εξόδων. Δώστε τις απαιτήσεις της μελέτης ή τον κωδικό του υπάρχοντος φωτιστικού.', 'Emergency luminaires and exit signs. Share the study requirements or the existing luminaire’s model number.']],
    ],
  },
  cabinets: {
    title: ['Πυροσβεστικές φωλιές & σταθμοί', 'Fire hose cabinets & stations'],
    intro: ['Επιλέξτε μέγεθος, υλικό ή είδος σταθμού. Οι παρακάτω εκδόσεις προέρχονται από τον κατάλογο του καταστήματος.', 'Choose a size, material or station type. The versions below come from the store catalogue.'],
    purpose: systems,
    entries: [
      [['Μεγάλη φωλιά', 'Large hose cabinet'], ['700 × 630 × 180 mm. Κενό ερμάριο ή πλήρης έκδοση με ανέμη, σωλήνα, κρουνό, συνδέσμους και ρυθμιζόμενο ακροσωλήνιο.', '700 × 630 × 180 mm. Empty cabinet or complete version with reel, hose, valve, couplings and adjustable nozzle.'], [
        ['Γαλβανιζέ ή γυαλιστερό INOX 304 / 316', 'Galvanised steel or polished 304 / 316 stainless steel'],
        ['Εκδόσεις με διάφανη πόρτα ή με δύο χώρους και θέση πυροσβεστήρα έως 6 kg', 'Clear-door or two-compartment versions with a bay for an extinguisher up to 6 kg'],
      ]],
      [['Μεσαία φωλιά', 'Medium hose cabinet'], ['500 × 470 × 140 mm. Έκδοση με γάντζο. Ο κατάλογος αναφέρει προαιρετικό σετ με λάστιχο 20 m, ρακόρ και ακροφύσιο.', '500 × 470 × 140 mm, hook configuration. The catalogue lists an optional 20 m hose, coupling and nozzle set.'], [
        ['Παραλλαγές γαλβανιζέ, INOX 304 / 316, πολυεστερική και PVC', 'Galvanised, 304 / 316 stainless-steel, polyester and PVC variants'],
      ]],
      [['Μικρή φωλιά', 'Small hose cabinet'], ['400 × 400 × 135 mm. Έκδοση με γάντζο, κενή ή με λάστιχο 20 m, ρακόρ και ακροφύσιο.', '400 × 400 × 135 mm, hook configuration, empty or supplied with a 20 m hose, coupling and nozzle.'], [
        ['Παραλλαγές INOX 304 και πολυεστερική σε διαφορετικές διαστάσεις', '304 stainless-steel and polyester options in other dimensions'],
      ]],
      [['Φωλιά αφρού', 'Foam cabinet'], ['Η έκδοση Spartan Foam Fighter αναφέρεται στον κατάλογο με διαστάσεις 1120 × 700 × 300 mm.', 'The Spartan Foam Fighter cabinet is listed at 1120 × 700 × 300 mm.']],
      [['Σταθμός εργαλείων', 'Firefighting tool station'], ['Ερμάριο 700 × 630 × 180 mm σε RAL 3000. Επιλογές με τέσσερις γάντζους ή δύο χώρους, μεταξύ αυτών και δίχωρη έκδοση INOX 304.', '700 × 630 × 180 mm cabinet in RAL 3000. Four-hook and two-compartment versions, including a two-compartment 304 stainless-steel option.'], [
        ['Εργαλεία χειρός, φωτισμός, πυρίμαχες κουβέρτες και γατζόκλειδα', 'Hand tools, torches, fire blankets and coupling spanners'],
        ['Κράνη, προσωπίδες και αναπνευστικές συσκευές ανά απαίτηση', 'Helmets, facepieces and breathing equipment by requirement'],
      ]],
      [['Κάδοι άμμου', 'Sand bins'], ['Καταχωρισμένες χωρητικότητες 50, 100 και 150 L. Ζητήστε διαστάσεις και χαρακτηριστικά για τη συγκεκριμένη έκδοση.', 'Listed capacities are 50, 100 and 150 L. Ask for the dimensions and details of the specific model.']],
    ],
  },
  mounts: {
    title: ['Βάσεις, θήκες & εξαρτήματα', 'Mounts, cases & spare parts'],
    intro: ['Για ανταλλακτικό ή βάση, ο κωδικός και μια φωτογραφία του πυροσβεστήρα βοηθούν στον έλεγχο συμβατότητας.', 'A model number and photo help establish compatibility when you need a mount or spare part.'],
    purpose: hardware,
    entries: [
      [['Βάσεις στήριξης', 'Mounting brackets'], ['Επιτοίχιες μεταλλικές βάσεις, βάσεις βαρέως τύπου, στηρίξεις για 6 kg ή 12 kg και αντάπτορες.', 'Wall-mounted metal brackets, heavy-duty mounts, brackets for 6 or 12 kg units, and adapters.'], [
        ['Μονές και διπλές επιδαπέδιες βάσεις', 'Single and double floor stands'],
        ['Επιδαπέδιες βάσεις με σήμανση πυροσβεστήρα', 'Floor stands with extinguisher signage'],
      ]],
      [['Θήκες πυροσβεστήρων', 'Extinguisher cases'], ['Πλαστικές θήκες μεταφοράς, διπλές θήκες, πολυεστερικά καλύμματα, TOP LOADER και θήκες PVC βαρέως τύπου.', 'Plastic transport and double cases, polyester covers, TOP LOADER cases and heavy-duty PVC enclosures.']],
      [['Ανταλλακτικά πυροσβεστήρων', 'Extinguisher spare parts'], ['Κλείστρα, μανόμετρα, λάστιχα, χοάνες, ακροφύσια και καρότσια. Στον κατάλογο αναφέρονται επίσης φιαλίδια CO₂, εξαρτήματα τοπικής εφαρμογής και πινακίδες.', 'Valves, gauges, hoses, discharge horns, nozzles and trolleys. The catalogue also lists CO₂ cartridges, local-application system parts and signs.']],
      [['Σύνδεσμοι & δίκτυα', 'Couplings & network parts'], ['Ταχυσύνδεσμοι και τάπες Storz, συστολές, σφιγκτήρες, παρεμβύσματα και κρουνοί.', 'Storz couplings and caps, reducers, clamps, gaskets and valves.']],
    ],
  },
  agents: {
    title: ['Υλικά κατάσβεσης', 'Extinguishing agents'],
    intro: ['Οι τύποι και οι συσκευασίες προέρχονται από τον κατάλογο. Ζητήστε τρέχον τεχνικό δελτίο, διαθεσιμότητα και επιβεβαίωση συμβατότητας πριν την επιλογή.', 'Types and pack sizes come from the catalogue. Ask for a current datasheet, availability and a compatibility check before selecting.'],
    purpose: hardware,
    entries: [
      [['Σκόνες ABC', 'ABC powders'], ['ABC 40% σε 6, 25 ή 1.000 kg και ABC 85% σε 25 kg, σύμφωνα με τον κατάλογο.', 'The catalogue lists ABC 40% in 6, 25 or 1,000 kg packs and ABC 85% in 25 kg packs.']],
      [['Σκόνες BC / BCE', 'BC / BCE powders'], ['BC 90% και BCE 20% σε συσκευασίες 25 kg.', 'BC 90% and BCE 20%, listed in 25 kg packs.']],
      [['Σκόνη τύπου D', 'Class D powder'], ['Καταχωρισμένη συσκευασία 25 kg. Η επιλογή υλικού εξαρτάται από το συγκεκριμένο μέταλλο και το τεχνικό δελτίο.', 'Listed in a 25 kg pack. Agent selection depends on the specific metal and the technical datasheet.']],
      [['Μείγμα ABF –30 °C', 'ABF blend –30 °C'], ['Έτοιμο μείγμα ABF σε συσκευασίες 20 και 200 kg στον παλιό κατάλογο.', 'The legacy catalogue lists a ready-mixed ABF agent in 20 and 200 kg packs.']],
      [['Αφροποιητικά υλικά', 'Foam concentrates'], ['Για αφρούς πυρόσβεσης ζητήστε τρέχουσα σύνθεση και τεκμηρίωση συμμόρφωσης για τη συγκεκριμένη χρήση. Οι παλιές καταχωρίσεις AFFF αποτελούν αναφορά καταλόγου.', 'For firefighting foam, ask for the current composition and compliance documentation for the intended application. Legacy AFFF entries are catalogue references.'], null, 'https://eur-lex.europa.eu/eli/reg/2025/1988/oj'],
      [['Αντιπυρικά υγρά & βερνίκια', 'Fire-retardant liquids & coatings'], ['Ο κατάλογος περιλαμβάνει αντιπυρικό υγρό 20 L και βερνίκια για ξύλο ή μέταλλο. Ζητήστε το δελτίο της συγκεκριμένης εφαρμογής.', 'The catalogue includes a 20 L fire-retardant liquid and coatings for timber or metal. Ask for the datasheet for the intended application.']],
    ],
  },
  rok: {
    title: ['Εξοπλισμός POK', 'POK firefighting equipment'],
    intro: ['Διαλέξτε οικογένεια και ανοίξτε το αντίστοιχο κεφάλαιο του καταλόγου POK. Για συγκεκριμένο μοντέλο, σημειώστε τον κωδικό του στο αίτημά σας.', 'Choose a family and open the matching POK catalogue chapter. Include the product code if you are enquiring about a specific model.'],
    purpose: systems,
    entries: [
      [['Επισκόπηση σειράς', 'Range overview'], ['Το πρώτο κεφάλαιο συγκεντρώνει παρουσιάσεις εξοπλισμού και νέες σειρές κατά την έκδοση του καταλόγου.', 'The first chapter introduces product families and additions at the time of publication.'], null, pok[0]],
      [['Αυλοί χειρός', 'Handline nozzles'], ['Αυλοί πυρόσβεσης και επιλογές ανά ροή και τύπο σύνδεσης.', 'Firefighting nozzles and options by flow and connection type.'], null, pok[1]],
      [['Πυροσβεστικά κανόνια', 'Fire monitors'], ['Κεφάλαιο για χειροκίνητα και μηχανοκίνητα κανόνια σε διαφορετικές διαμορφώσεις.', 'Chapter covering manual and motorised monitors in different configurations.'], null, pok[2]],
      [['Κάνες & ακροφύσια', 'Monitor nozzles & tips'], ['Εξοπλισμός εξόδου και ακροφύσια, ανά σειρά και εφαρμογή.', 'Outlet equipment and nozzles by range and application.'], null, pok[3]],
      [['Αφροποίηση & κρουνοί', 'Foam equipment & outlets'], ['Αφροποιητικός εξοπλισμός, ρυμουλκούμενες μονάδες, διακόπτες και κρουνοί.', 'Foam equipment, trailer units, valves and hydrants.'], null, pok[4]],
      [['Εξέλικτρα & όργανα', 'Reels & measuring equipment'], ['Εξέλικτρα, όργανα μέτρησης και συναφής εξοπλισμός.', 'Reels, measuring equipment and related items.'], null, pok[5]],
      [['Σύνδεσμοι & σωλήνες', 'Couplings & hoses'], ['Ταχυσύνδεσμοι, κλειδιά, σωλήνες και εργαλεία πυρόσβεσης.', 'Couplings, spanners, hoses and firefighting tools.'], null, pok[6]],
    ],
  },
  servicing: {
    title: ['Συντήρηση & αναγόμωση', 'Servicing & refills'],
    intro: ['Ξεκινήστε με τον αριθμό των πυροσβεστήρων, τον τύπο τους και την τελευταία ημερομηνία ελέγχου, αν τη γνωρίζετε.', 'Start with the number and type of fire extinguishers and their last inspection date, if known.'],
    purpose: 'Συντήρηση / αναγόμωση',
    entries: [
      [['Έλεγχος & συντήρηση', 'Inspection & servicing'], ['Η κατάσταση της φιάλης, η σήμανση και τα εξαρτήματα εξετάζονται ανά τύπο πυροσβεστήρα.', 'The condition of the cylinder, label and components is assessed for the extinguisher type.']],
      [['Αναγόμωση', 'Refill'], ['Πείτε μας αν ο πυροσβεστήρας χρησιμοποιήθηκε ή αν υπάρχει ένδειξη φθοράς. Η συμβατότητα του νέου υλικού ελέγχεται για το συγκεκριμένο μοντέλο.', 'Tell us if an extinguisher has been discharged or shows signs of wear. The replacement agent is checked against the specific model.']],
      [['Υδραυλική δοκιμή', 'Hydrostatic testing'], ['Ο έλεγχος της φιάλης προγραμματίζεται όπου απαιτείται, ανάλογα με τον τύπο, τα στοιχεία κατασκευής και το ιστορικό συντήρησης.', 'Cylinder testing is arranged where required, based on unit type, manufacturing details and service history.']],
    ],
  },
  systems: {
    title: ['Συστήματα πυρασφάλειας', 'Fire protection systems'],
    intro: ['Έχετε ήδη κάτοψη ή μελέτη; Μπορείτε να την επισυνάψετε στο τελευταίο βήμα του αιτήματος.', 'Already have a floor plan or study? Attach it at the final step of the request.'],
    purpose: systems,
    entries: [
      [['Πυρανίχνευση & ειδοποίηση', 'Detection & alarm'], ['Πίνακες, ανιχνευτές, κομβία και συσκευές ειδοποίησης. Για υφιστάμενα συστήματα βοηθούν ο κωδικός πίνακα και μια περιγραφή των αναγκών.', 'Panels, detectors, call points and alarm devices. An existing panel model and a description of your needs help identify the right equipment.']],
      [['Αυτόματη κατάσβεση', 'Automatic suppression'], ['Εξοπλισμός αυτόματης και τοπικής κατάσβεσης με βάση τη μελέτη και τον προστατευόμενο χώρο.', 'Automatic and local-application suppression equipment based on the fire protection study and the protected area.']],
      [['Μόνιμα δίκτυα & ειδικές εφαρμογές', 'Fixed networks & specialist applications'], ['Πυροσβεστικές φωλιές, αφρογεννήτριες, πυροσβεστικά κανόνια και κουρτίνες νερού, ανά τεχνική απαίτηση.', 'Fire hose cabinets, foam generators, fire monitors and water curtains according to the technical requirements.']],
    ],
  },
}
