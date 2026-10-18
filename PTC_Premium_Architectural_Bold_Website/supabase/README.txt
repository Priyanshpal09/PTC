PTC — Supabase setup

The website and the admin console can read their content from a Supabase
(Postgres) database instead of the bundled data.js file. This folder holds
everything the database needs.

FILES
  schema.sql          tables, indexes, updated_at triggers, row level security
                      (public read, staff-only writes)
  seed.sql            the content: 50 featured projects, 174 index entries,
                      123 photographs — generated from data.js
  setup.sql           schema.sql + seed.sql in one file: paste this one
  generate-seed.js    rebuilds seed.sql and setup.sql from data.js

WHAT TO DO (once)
  1. Create a project at https://supabase.com/dashboard
     (name it e.g. ptc-premium; keep the database password safe)
  2. SQL Editor → paste the whole of setup.sql → Run
     Creates public.projects, public.index_entries, public.gallery_photos and
     loads all 347 rows. Safe to re-run: the seed only fills empty tables.
  3. Authentication → Users → Add user
     staff email + password, "auto confirm" ticked. That is the account the
     admin console signs in with.
  4. Project Settings → API
     Copy the Project URL and the anon/publishable key into SUPABASE_URL and
     SUPABASE_ANON_KEY at the top of supabase.js, in BOTH:
       ../PTC_Premium_Website/supabase.js
       ../PTC_Premium_Admin/supabase.js
     Both values are public — they ship to the browser. What protects the data
     is the row level security defined in schema.sql, not the secrecy of the key.

AFTER EDITING CONTENT
  The database is the live source once configured. To change content, edit the
  rows in the Supabase table editor (Table Editor → pick a table). To move
  changes back into the bundled fallback file, edit data.js and re-run:

    node supabase/generate-seed.js

CHECKING WHICH SOURCE IS LIVE
  Admin console header badge: "Live · Supabase", "Supabase offline · data.js"
  or "Local data.js". The same state is on window.PTC_DB in the browser console
  (source, counts, error).
