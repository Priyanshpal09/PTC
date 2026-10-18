PTC Admin Data Console — standalone deployment

This folder is deployed on its own, completely separate from the public website.
It is NOT linked from the website and nothing in the website folder is served here.

FILES
  admin.html   console markup (also served at the project root, see vercel.json)
  admin.css    console styling
  admin.js     console logic: staff gate, statistics, tables, search, filters, exports
  supabase.js  Supabase data layer: reads the live content and holds the staff
               sign-in. Paste SUPABASE_URL and SUPABASE_ANON_KEY here; with them
               empty the console reads data.js only.
  data.js      COPY of the website's content data, and the fallback when the
               database cannot be reached
  assets/      COPY of the website photographs, used for the table thumbnails
  vercel.json  serves / as the console and sends X-Robots-Tag: noindex, nofollow

LIVE URL
  https://ptc-premium-admin.vercel.app

DEPLOY
  cd PTC_Premium_Admin
  vercel deploy --prod

LOCAL PREVIEW
  Open admin.html directly in a browser, or serve the folder with any static
  server. The website folder's serve.js works if copied here.

KEEPING CONTENT IN STEP
  The website and this console each have their own data.js and assets/. Editing
  the console does not change the website. When the content changes, copy both:
    cp ../PTC_Premium_Website/data.js .
    cp -r ../PTC_Premium_Website/assets .

ACCESS
  Once supabase.js is configured, staff sign in with a Supabase Auth email and
  password (Authentication → Users in the Supabase dashboard to add accounts).
  The session is kept in local storage and refreshed automatically; "Lock"
  signs out. Editing rights in the database are granted only to signed-in
  users by the row level security policies in ../supabase/schema.sql.

  Until then, or whenever the database is unreachable, the PIN screen is used:
  default PIN ptc2026 (ADMIN_PIN in admin.js), lasting for the browser session.
  That gate is client-side only — the data and the PIN both ship to the
  browser, so treat this URL as unlisted, not private.

  The header badge shows where the numbers came from: "Live · Supabase",
  "Supabase offline · data.js" or "Local data.js".
