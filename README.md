# Star Service στο Vercel

Το project περιλαμβάνει την ελληνική και αγγλική έκδοση, τη φόρμα προσφοράς, τις μελέτες και τη διαχείριση αιτημάτων.

## GitHub και Vercel

1. Ανοίξτε αυτόν τον φάκελο στο VS Code και ανεβάστε τον σε νέο ιδιωτικό GitHub repository. Το `package.json` και το `vercel.json` πρέπει να είναι στη ρίζα του repository.
2. Στο Vercel επιλέξτε την ομάδα NS Group και **Add New → Project → Import** για το νέο repository. Το `vercel.json` ορίζει το build και τις διαδρομές της φόρμας.
3. Δημιουργήστε ιδιωτικό **R2 bucket** στο Cloudflare και κλειδί **Object Read & Write** περιορισμένο σε αυτό το bucket. Αφήστε την πρόσβαση από δημόσιο URL απενεργοποιημένη. Το νέο bucket ξεκινά κενό. Τα υπάρχοντα αιτήματα του ChatGPT Sites είναι ακόμη διαθέσιμα στην παλιά διαχείριση.
4. Προσθέστε τις μεταβλητές του `.env.example` στις **Vercel Project Settings → Environment Variables → Production**. Βάλτε τα κλειδιά και τον κωδικό ως μυστικές τιμές εκεί. Χρησιμοποιήστε κλειδί Resend με **Sending access** για το `starservicefire.com` και έναν τυχαίο, μοναδικό κωδικό τουλάχιστον 24 χαρακτήρων για τη διαχείριση. Ο παραλήπτης των προσφορών είναι `starpirosvestika@gmail.com`.
5. Για αρχεία έως **10 MB**, επιλέξτε **Fluid Compute → Performance (4 GB)** και ορίστε `VERCEL_SUPPORT_LARGE_REQUEST_BODY=1` πριν κάνετε deploy. Η μεγαλύτερη χωρητικότητα εισόδου είναι λειτουργία δημόσιας beta στο Vercel.
6. Στο **Vercel → Domains** προσθέστε `starservicefire.com` και περάστε στο Cloudflare μόνο τις εγγραφές που θα δώσει το Vercel για το site. Οι υφιστάμενες εγγραφές Resend εξυπηρετούν την αποστολή email. Χρησιμοποιήστε τις συγκεκριμένες τιμές της οθόνης Domains.
7. Μόλις ενεργοποιηθεί το domain, ανοίξτε την αρχική και το `/inbox`. Η διαχείριση ζητά χρήστη `star-service` και τον κωδικό από το `STAR_SERVICE_INBOX_PASSWORD`. Για έλεγχο χωρίς αποστολή email, επαληθεύστε μόνο αυτές τις σελίδες και την κατάσταση του domain στο Vercel.

## Τοπική προβολή

`npm ci` και `npm run dev`. Η τοπική προβολή χρησιμοποιεί προσωρινή αποθήκευση και δεν συνδέεται με Resend.
