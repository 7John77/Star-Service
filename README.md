# Star Service στο Vercel

Οι νέες προσφορές, μαζί με τυχόν PDF, JPG ή PNG, αποστέλλονται μέσω Resend στο `starpirosvestika@gmail.com`. Το πεδίο Απάντηση χρησιμοποιεί τη διεύθυνση του πελάτη. Τα αιτήματα της προηγούμενης φιλοξενίας παραμένουν στη διαχείρισή της.

## Vercel

- Στην ομάδα NS Group (Pro) επιλέξτε το GitHub repository Star-Service. Το `vercel.json` ορίζει το build.
- Στις **Environment Variables → Production** ορίστε `RESEND_API_KEY` ως μυστική μεταβλητή και `QUOTE_FROM_EMAIL=prosfores@starservicefire.com`. Χρησιμοποιήστε κλειδί με **Sending access** για το επαληθευμένο `starservicefire.com`.
- Για συνημμένα έως 10 MB, στις ρυθμίσεις Functions επιλέξτε **Fluid Compute → Performance (4 GB)** και ορίστε `VERCEL_SUPPORT_LARGE_REQUEST_BODY=1`. Το αυξημένο όριο εισόδου είναι δημόσια beta του Vercel.
- Στο **Domains** προσθέστε `starservicefire.com` και περάστε στο Cloudflare τις εγγραφές που δίνει το Vercel για τον ιστότοπο.

## Τοπική προβολή

Τρέξτε `npm ci` και `npm run dev` για προβολή στο `http://localhost:3000`. Η τοπική προβολή λειτουργεί χωρίς διαπιστευτήρια αποστολής.
