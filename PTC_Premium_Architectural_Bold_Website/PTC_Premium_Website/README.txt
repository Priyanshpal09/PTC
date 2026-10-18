PTC Premium Website Preview

FILES
  index.html   website markup
  styles.css   all styling, responsive layout and animations
  script.js    all website interactivity (plain JavaScript, no dependencies)
  data.js      shared content data: featured projects, the 174-entry project
               index and the photo gallery. Loaded by both the website and the
               admin console, so editing this one file updates both. Also the
               offline baseline when the database is unreachable.
  supabase.js  the Supabase data layer: reads the live content from the
               database in the same shape data.js uses, and provides the staff
               sign-in used by the admin console. Empty config = data.js only.
  admin.html   admin data console markup (NOT part of this deployment — the
  admin.css    live console now deploys on its own from ../PTC_Premium_Admin,
  admin.js     which holds the copy that is actually served. See .vercelignore.)
  assets/      project photographs
  serve.js     tiny static file server (Node, no npm install needed)

HOW TO VIEW
  Option 1 - run "node serve.js" and open http://localhost:8000
             admin console: http://localhost:8000/admin.html
  Option 2 - open index.html directly in a modern browser
  Google Fonts require internet; fallback fonts are provided.

ADMIN DATA CONSOLE (admin.html)
  A staff-only view of everything the website contains, in one place:
    - PIN gate (default PIN: ptc2026 — change ADMIN_PIN in admin.js)
      The unlock lasts for the browser session; "Lock" clears it.
    - Summary counts: featured projects, index entries, photographs,
      locations on record and categories
    - Overview: per-category breakdown bars, the most repeated locations
      in the project index, and one-click exports
    - Tables for featured projects, the full project index and every
      photograph, with live search (press "/") and category filters
    - Export any dataset as CSV or JSON; "Full backup" downloads the
      entire content set as a single JSON file

  IMPORTANT: this gate is a client-side preview lock, not real access
  control. The data ships to the browser, so anyone who can load the page
  can read it (the pages are marked noindex). Before publishing, put the
  console behind server-side authentication or remove it from the build.

DATABASE (SUPABASE)
  The content can live in a Supabase (Postgres) database instead of the file.
    - supabase.js holds two values: SUPABASE_URL and SUPABASE_ANON_KEY.
      Both are public (they ship to the browser) — access is controlled by row
      level security, not by hiding the key.
    - With those filled in, the page renders data.js first, then swaps in the
      database content and re-renders, so the site is never blank and still
      works if the network or the database is down.
    - Tables, policies and seed data: ../supabase/schema.sql, seed.sql and
      setup.sql (regenerate the seed after editing data.js with
      "node supabase/generate-seed.js").
    - Read the console's "source" badge, or window.PTC_DB.source in the
      browser console, to see whether a page is showing live or fallback data.

CONTENT SOURCE
  All text and photographs come from three PTC company profiles:
    - PTC company profile - building works
    - PTC company profile - industrial works
    - PTC company profile - residential project
  Sections cover the practice, vision/mission, core values, the two service
  groups (pre-design & design; procurement & construction phase), the sectors
  served, 50 featured projects with their real photographs, a 174-entry
  searchable project index, the full leadership biographies, clients and
  collaborators, recognition, and the registered office contact details.
  Project photographs were extracted from the source PDFs at their native
  resolution and re-encoded to a maximum width of 1280 px for the web.

WHAT IS INTERACTIVE
  - Branded page loader while the hero imagery loads (skipped for
    reduced-motion, with a failsafe timeout so it can never trap you).
  - Hero slider: auto-advances with a slow Ken Burns drift, dot indicators
    with a progress fill, previous/next buttons, arrow keys, touch swipe.
  - Practice numbers count up when scrolled into view.
  - Services marquee ticker; pauses on hover.
  - Featured projects: category filters with a transition, and a lightbox
    viewer (click any card) with previous/next, arrow keys, Escape to close,
    focus returned to the card, and page scroll locked while open.
  - Project index: live search across project name, city and state, category
    filters, a result counter, and a "show more" pager. Press "/" anywhere
    to jump to the search box; Esc clears it.
  - Fixed header that condenses after scrolling, a scroll progress bar, and
    the nav link for the section you are reading is highlighted.
  - Staggered scroll reveals, back-to-top button, mobile menu.
  - Lightbox: swipe left/right on touch devices.
  - Contact form prepares an enquiry to parvaticonsultants@gmail.com.

EXTRAS
  - "Engagement stages" strip in the Expertise section — the practice's
    four project stages, drawn from the service lists in the profiles.
  - Office map in the contact section (Google Maps embed; needs internet).
  - Footer quick links; SEO: Open Graph / Twitter cards and JSON-LD
    ProfessionalService structured data; preloads the first hero image.
  - Styled scrollbar and text selection; a print stylesheet that produces a
    clean company-profile printout.

DESIGN SYSTEM
  Deliberately restrained: charcoal, warm paper and one deep-red accent,
  all defined as tokens at the top of styles.css (colour, type, geometry,
  elevation, motion) so the whole site moves together.
    - Type: Playfair Display for display headings, Manrope for labels, nav
      and buttons, Inter for running text. Fluid clamp() scale from 320 px
      to ultrawide; 16 px body at 1.7 line-height.
    - Geometry: 16-20 px radii on cards and media, pill buttons and filter
      chips, hairline rules instead of heavy borders.
    - Depth: three shadow steps (resting, raised, overlay) plus a blurred
      frosted header and lightbox rather than hard black panels.
    - Motion: one easing curve and two durations; hover lifts of 2-5 px,
      arrow nudges, image scales — no flashing or auto-playing gimmicks.
  Section rhythm is a single clamp() step (86-130 px), so spacing is even
  down the whole page; every section opens with the same eyebrow + heading
  + supporting paragraph pattern.

ACCESSIBILITY / PERFORMANCE
  - Skip-to-content link; everything is keyboard operable; visible focus
    styles throughout.
  - Mobile navigation is a sliding drawer with a dimmed backdrop; it locks
    page scroll, moves focus into the drawer, closes on Escape, on a link,
    on the backdrop, and when the window widens past the breakpoint.
  - Form: every field has a visible label, required fields are marked, and
    submitting gives an explicit success or error message (a live region)
    instead of failing silently.
  - Text contrast checked against WCAG AA at every surface; muted greys
    sit at 4.9:1 or better on white and on the paper tones.
  - Honours "prefers-reduced-motion": autoplay, counters, reveals and the
    marquee are switched off and all content is shown immediately.
  - Project images are lazy-loaded; no third-party scripts.

NOTE: the page previously began with a stray "/" before the doctype, which
forced browsers into quirks mode. That is fixed — the document now renders
in standards mode (CSS1Compat).

NOTE ON ASSETS
  The files building-*.jpg, industrial-*.jpg and residential-*.jpg in assets/
  are from an earlier extraction and are no longer referenced by the site.
  They can be deleted safely.

THIS IS A STATIC FRONT-END PREVIEW. The contact form opens an email
application. Before publication, confirm project image permissions and
project descriptions, and connect a real form backend if desired.
