PTC Admin Data Console — standalone deployment

This folder is deployed on its own, completely separate from the public website.
It is NOT linked from the website and nothing in the website folder is served here.

FILES
  admin.html   console markup (also served at the project root, see vercel.json)
  admin.css    console styling
  admin.js     console logic: PIN gate, statistics, tables, search, filters, exports
  data.js      COPY of the website's content data, so the console has something to show
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
  Default PIN: ptc2026 (ADMIN_PIN in admin.js), and the unlock lasts for the
  browser session. This gate is client-side only: the data and the PIN both ship
  to the browser, so anyone who loads this URL can read them. Treat the URL as
  unlisted, not private, and put the console behind real server-side
  authentication before it holds anything sensitive.
