# Star Service στο Vercel

Οι νέες προσφορές, μαζί με τυχόν PDF, JPG ή PNG, αποστέλλονται μέσω Resend στο `starpirosvestika@gmail.com`. Το πεδίο Απάντηση χρησιμοποιεί τη διεύθυνση του πελάτη. Τα αιτήματα της προηγούμενης φιλοξενίας παραμένουν στη διαχείρισή της.

## Vercel

- Στο project **star-service** επιλέξτε το GitHub repository Star-Service. Το `vercel.json` ορίζει το build.
- Στις **Environment Variables → Production** ορίστε `RESEND_API_KEY` ως μυστική μεταβλητή και `QUOTE_FROM_EMAIL=prosfores@starservicefire.com`. Χρησιμοποιήστε κλειδί με **Sending access** για το επαληθευμένο `starservicefire.com`.
- Για συνημμένα έως 10 MB, στις ρυθμίσεις Functions επιλέξτε **Fluid Compute → Performance (4 GB)** και ορίστε `VERCEL_SUPPORT_LARGE_REQUEST_BODY=1`. Το αυξημένο όριο εισόδου είναι δημόσια beta του Vercel.
- Στο **Domains** προσθέστε `starservicefire.com` και περάστε στο Cloudflare τις εγγραφές που δίνει το Vercel για τον ιστότοπο.

## Διαχείριση τιμών

- Στο project **star-service**, συνδέστε Upstash Redis από **Storage** με το περιβάλλον **Production**. Υποστηρίζονται τα ζεύγη `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` και `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
- Στις **Environment Variables → Production** ορίστε το `STAR_SERVICE_ADMIN_PASSWORD` ως μυστική μεταβλητή με δικό σας ισχυρό κωδικό, τουλάχιστον 16 χαρακτήρων. Κάντε redeploy ώστε να ενεργοποιηθούν οι μεταβλητές.
- Ανοίξτε το `/admin/` και συνδεθείτε. Μπορείτε να αναζητήσετε προϊόν με κωδικό ή όνομα, να φιλτράρετε ανά κατηγορία και να δημοσιεύετε ή να αφαιρείτε τιμές σε ευρώ. Η τιμή που εισάγετε εμφανίζεται στο δημόσιο προϊόν όπως την αποθηκεύετε.
- Για τοπική διαχείριση, περάστε τις ίδιες μεταβλητές με στοιχεία ξεχωριστής βάσης και τρέξτε `node --env-file=.env.local dev.mjs`.

## Τοπική προβολή

Τρέξτε `npm ci` και `npm run dev` για προβολή στο `http://localhost:3000`. Η τοπική προβολή λειτουργεί χωρίς διαπιστευτήρια αποστολής.
