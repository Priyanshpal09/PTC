/* ============================================================
   PTC — Supabase data layer

   Reads the live content from Supabase and hands it to the page in
   exactly the same shape data.js uses, so nothing else has to know
   where the data came from. data.js stays in the page as the offline
   baseline: it renders first, then this file replaces it with the
   database content and asks the page to re-render.

   SETUP — paste the two values below from
   Supabase dashboard → Project Settings → API.
   Both are public (they ship to the browser); access is controlled by
   the row level security policies in supabase/schema.sql. Leave them
   empty and the site simply keeps using data.js.
   ============================================================ */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://ysmlssbxmqxzsbaqdtor.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbWxzc2J4bXF4enNiYXFkdG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMDU4MDksImV4cCI6MjEwNzg4MTgwOX0.UTWH9Xt0gNG_AirEvl-qV6nfNm1ConRZZPw77dU3bYU';

  /* tables holding the content */
  var TABLES = {
    projects: 'projects',
    indexEntries: 'index_entries',
    gallery: 'gallery_photos'
  };

  var SESSION_KEY = 'ptc-staff-session';

  var PTC = window.PTC = window.PTC || {};

  var DB = {
    configured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
    ready: false,
    source: 'static',      /* 'static' | 'supabase' */
    counts: { projects: 0, indexEntries: 0, gallery: 0 },
    error: null,
    session: null,
    signedIn: false,
    user: null
  };
  window.PTC_DB = DB;

  function baseURL() {
    return SUPABASE_URL.replace(/\/+$/, '');
  }

  function headers(extra) {
    var token = DB.session && DB.session.access_token ? DB.session.access_token : SUPABASE_ANON_KEY;
    var out = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + token
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    }
    return out;
  }

  function request(url, options, what) {
    return fetch(url, options).then(function (res) {
      return res.text().then(function (text) {
        var body = null;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
        if (!res.ok) {
          var detail = body && (body.message || body.error_description || body.error || body.msg);
          throw new Error((what || 'Supabase request') + ' failed (' + res.status + ')' + (detail ? ': ' + detail : ''));
        }
        return body;
      });
    });
  }

  function select(table, columns) {
    var url = baseURL() + '/rest/v1/' + table +
      '?select=' + encodeURIComponent(columns) + '&order=sort_order.asc';
    return request(url, { headers: headers() }, 'Reading ' + table);
  }

  function text(value) {
    return value == null ? '' : String(value);
  }

  /* ---------------------------------------------------------
     Load the content, keeping data.js as the fallback
     --------------------------------------------------------- */
  function loadContent() {
    if (!DB.configured) {
      DB.ready = true;
      return Promise.resolve(false);
    }

    return Promise.all([
      select(TABLES.projects, 'category,name,location,image,detail'),
      select(TABLES.indexEntries, 'category,name,location,detail'),
      select(TABLES.gallery, 'image,caption,category')
    ]).then(function (rows) {
      var projects = rows[0] || [];
      var indexEntries = rows[1] || [];
      var gallery = rows[2] || [];

      /* only take over when the database actually has rows, so an empty
         or half-filled table can never blank out the site */
      if (projects.length) {
        PTC.projects = projects.map(function (p) {
          return [p.category, p.name, text(p.location), text(p.image), text(p.detail)];
        });
      }
      if (indexEntries.length) {
        PTC.indexEntries = indexEntries.map(function (e) {
          return [e.category, e.name, text(e.location), text(e.detail)];
        });
      }
      if (gallery.length) {
        PTC.gallery = gallery.map(function (g) {
          return [text(g.image), text(g.caption), text(g.category)];
        });
      }

      DB.counts = {
        projects: projects.length,
        indexEntries: indexEntries.length,
        gallery: gallery.length
      };
      DB.source = (projects.length || indexEntries.length || gallery.length) ? 'supabase' : 'static';
      return true;
    }).catch(function (err) {
      /* network down, policy blocked, project paused — the page keeps the
         data.js baseline and says so instead of breaking */
      DB.error = err;
      DB.source = 'static';
      if (window.console && console.warn) console.warn('[PTC] Supabase unavailable, using data.js:', err.message);
      return false;
    }).then(function (ok) {
      DB.ready = true;
      try {
        window.dispatchEvent(new CustomEvent('ptc:content', { detail: { source: DB.source, counts: DB.counts } }));
      } catch (e) { /* older browsers: the page just keeps its first render */ }
      if (window.PTC_UI && typeof window.PTC_UI.refresh === 'function') {
        try { window.PTC_UI.refresh(); } catch (e) { /* re-render is best-effort */ }
      }
      return ok;
    });
  }

  /* ---------------------------------------------------------
     Staff sign-in (Supabase Auth) — used by the admin console
     --------------------------------------------------------- */
  function saveSession(session, user) {
    DB.session = session;
    DB.signedIn = true;
    DB.user = user || (session && session.user) || null;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || (Date.now() + 3600 * 1000),
        email: DB.user && DB.user.email
      }));
    } catch (e) { /* private mode: the session just won't survive a reload */ }
  }

  function clearSession() {
    DB.session = null;
    DB.signedIn = false;
    DB.user = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  function readStoredSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function signIn(email, password) {
    if (!DB.configured) return Promise.reject(new Error('Supabase is not configured yet.'));
    var url = baseURL() + '/auth/v1/token?grant_type=password';
    return request(url, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email: email, password: password })
    }, 'Sign-in').then(function (data) {
      var session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
        user: data.user
      };
      saveSession(session, data.user);
      return DB.user;
    });
  }

  function signOut() {
    var token = DB.session && DB.session.access_token;
    clearSession();
    if (!token || !DB.configured) return Promise.resolve();
    return request(baseURL() + '/auth/v1/logout', {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
    }, 'Sign-out').catch(function () { /* the local session is already gone */ });
  }

  function restoreSession() {
    var stored = readStoredSession();
    if (!stored || !stored.refresh_token) {
      return Promise.resolve(false);
    }
    if (stored.expires_at && stored.expires_at - 60000 > Date.now() && stored.access_token) {
      saveSession(stored, { email: stored.email });
      return Promise.resolve(true);
    }
    return request(baseURL() + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ refresh_token: stored.refresh_token })
    }, 'Session refresh').then(function (data) {
      var session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
        user: data.user
      };
      saveSession(session, data.user);
      return true;
    }).catch(function () {
      clearSession();
      return false;
    });
  }

  DB.signIn = signIn;
  DB.signOut = signOut;
  DB.restoreSession = restoreSession;
  DB.reload = function () {
    DB.ready = false;
    return loadContent();
  };

  restoreSession().then(function () {
    return loadContent();
  });
})();
