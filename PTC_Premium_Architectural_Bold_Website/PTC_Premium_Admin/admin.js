/* ============================================================
   PTC — Admin data console
   admin.js
   Reads the shared datasets from data.js (window.PTC) and renders
   the complete content of the website: featured projects, the full
   project index, every photograph, derived statistics and exports.

   NOTE: the PIN gate below is a client-side preview lock, not real
   authentication. Anyone who can read this file can read the data.
   Real access control needs a server (see README).
   ============================================================ */

(function () {
  'use strict';

  var STORE_KEY = 'ptc-admin-unlocked';
  var ADMIN_PIN = 'ptc2026';

  var PTC = window.PTC || {};
  var projects = PTC.projects || [];
  var indexEntries = PTC.indexEntries || [];
  var gallery = PTC.gallery || [];
  var categoryLabel = PTC.categoryLabel || {
    building: 'Institutional & Special',
    residential: 'Residential',
    industrial: 'Industrial & PEB'
  };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(str) {
    return String(str == null ? '' : str)
      .split('&').join('&amp;')
      .split('<').join('&lt;')
      .split('>').join('&gt;')
      .split('"').join('&quot;');
  }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }

  /* ============================================================
     State — declared before the gate below, because unlocking
     immediately renders the console.
     ============================================================ */
  var state = {
    tab: 'overview',
    q: { featured: '', index: '', gallery: '' },
    cat: { featured: 'all', index: 'all', gallery: 'all' }
  };

  var booted = false;

  /* ============================================================
     PIN gate
     ============================================================ */
  var gate = $('#gate');
  var app = $('#app');
  var gateForm = $('#gateForm');
  var pinInput = $('#pin');
  var gateErr = $('#gateErr');
  var signForm = $('#signForm');
  var signEmail = $('#signEmail');
  var signPass = $('#signPass');
  var signErr = $('#signErr');
  var signBtn = $('#signBtn');
  var sourceBadge = $('#source');

  function unlock() {
    gate.hidden = true;
    app.hidden = false;
    document.body.classList.add('unlocked');
    boot();
  }

  function unlocked() {
    try { return sessionStorage.getItem(STORE_KEY) === '1'; } catch (e) { return false; }
  }

  /* ---------------------------------------------------------
     Which gate: real staff sign-in once a Supabase project is
     connected, the PIN screen until then
     --------------------------------------------------------- */
  function showSignIn(focus) {
    if (gateForm) gateForm.hidden = true;
    if (signForm) signForm.hidden = false;
    if (focus && signEmail) signEmail.focus();
  }

  function usePIN() {
    if (signForm) signForm.hidden = true;
    if (gateForm) gateForm.hidden = false;
    if (unlocked()) unlock(); else pinInput.focus();
  }

  function startGate() {
    var DB = window.PTC_DB;
    /* already signed in with a staff account → straight in */
    if (DB && DB.configured && DB.signedIn) { unlock(); return; }
    /* everyone else reaches the console with the staff PIN, so the console is
       never locked behind an account that may not exist yet. Signed-in staff
       still get live Supabase data; PIN access uses the bundled data.js. */
    usePIN();
  }

  /* Always show the PIN gate first. supabase.js restores any stored staff
     session and announces content, so re-evaluate the gate when that lands. */
  window.addEventListener('ptc:content', startGate);
  if (window.PTC_DB && PTC_DB.ready) startGate();
  else setTimeout(startGate, 0);

  if (signForm) {
    signForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = signEmail.value.trim();
      var password = signPass.value;
      if (!email || !password) return;
      signErr.hidden = true;
      if (signBtn) { signBtn.disabled = true; signBtn.textContent = 'Signing in…'; }
      PTC_DB.signIn(email, password).then(function () {
        unlock();
      }).catch(function (err) {
        signErr.textContent = (err && err.message) ? err.message : 'Sign-in failed — please try again.';
        signErr.hidden = false;
        signPass.value = '';
        signPass.focus();
      }).then(function () {
        if (signBtn) { signBtn.disabled = false; signBtn.textContent = 'Sign in ↗'; }
      });
    });
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = pinInput.value.trim().toLowerCase();
    if (value === ADMIN_PIN) {
      try { sessionStorage.setItem(STORE_KEY, '1'); } catch (err) { /* private mode */ }
      gateErr.hidden = true;
      unlock();
    } else {
      gateErr.hidden = false;
      pinInput.value = '';
      pinInput.focus();
      gateForm.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' },
         { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }],
        { duration: 260, easing: 'ease-in-out' }
      );
    }
  });

  function lock() {
    try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    var out = (window.PTC_DB && PTC_DB.configured && PTC_DB.signedIn)
      ? PTC_DB.signOut()
      : Promise.resolve();
    out.then(function () { window.location.reload(); });
  }
  $('#logout').addEventListener('click', lock);

  /* ---------------------------------------------------------
     Live content — swap the data.js baseline for what the database
     holds, and show where the numbers on screen came from
     --------------------------------------------------------- */
  function applyContent() {
    projects = window.PTC.projects || projects;
    indexEntries = window.PTC.indexEntries || indexEntries;
    gallery = window.PTC.gallery || gallery;

    if (booted) {
      renderStats();
      renderOverview();
      renderFeatured();
      renderIndex();
      renderGallery();
    }

    if (sourceBadge) {
      var DB = window.PTC_DB;
      if (!DB || !DB.configured) sourceBadge.textContent = 'Local data.js';
      else if (DB.source === 'supabase') sourceBadge.textContent = 'Live · Supabase';
      else sourceBadge.textContent = 'Supabase offline · data.js';
      sourceBadge.title = DB && DB.error ? DB.error.message : 'Content source';
    }
  }

  window.addEventListener('ptc:content', applyContent);
  applyContent();

  function boot() {
    if (booted) return;
    booted = true;

    renderStats();
    renderOverview();
    renderFeatured();
    renderIndex();
    renderGallery();
    renderEnquirySummary();
    renderEnquiries();
    renderInsights();
    wireEnquiryActions();
    wireTabs();
    wireSearch();
    wireFilters();
    wireExports();
    wireShortcut();
  }

  /* ============================================================
     Stats
     ============================================================ */
  function uniqueLocations() {
    var set = {};
    projects.forEach(function (p) { if (p[2]) set[p[2]] = 1; });
    indexEntries.forEach(function (p) { if (p[2]) set[p[2]] = 1; });
    return Object.keys(set).length;
  }

  function categoryCounts() {
    var out = { building: 0, residential: 0, industrial: 0 };
    projects.forEach(function (p) { if (out[p[0]] != null) out[p[0]]++; });
    return out;
  }

  /* Enquiry totals — updated whenever the enquiries table loads */
  var enquiryStats = { received: 0, done: 0, fresh: 0, read: 0, replied: 0, archived: 0 };

  function setEnquiryStats(list) {
    var s = { received: 0, done: 0, fresh: 0, read: 0, replied: 0, archived: 0 };
    (list || []).forEach(function (e) {
      s.received++;
      var st = String(e.status || 'new');
      if (st === 'new') s.fresh++;
      else if (st === 'read') s.read++;
      else if (st === 'replied') s.replied++;
      else if (st === 'archived') s.archived++;
      if (st === 'replied' || st === 'archived') s.done++;
    });
    enquiryStats = s;
    return s;
  }

  function renderEnquirySummary() {
    var el = $('#enquirySummary');
    if (!el) return;
    var cards = [
      ['Emails received', enquiryStats.received],
      ['Emails done', enquiryStats.done],
      ['New', enquiryStats.fresh],
      ['Read', enquiryStats.read],
      ['Replied', enquiryStats.replied],
      ['Archived', enquiryStats.archived]
    ];
    el.innerHTML = cards.map(function (it) {
      return '<div class="stat"><b>' + fmt(it[1]) + '</b><span>' + it[0] + '</span></div>';
    }).join('');
    var countEl = $('#enquiriesCount');
    if (countEl) {
      countEl.textContent = fmt(enquiryStats.received) + ' received · ' +
        fmt(enquiryStats.done) + ' done';
    }
  }

  function renderStats() {
    var cats = categoryCounts();
    var items = [
      ['Featured projects', fmt(projects.length)],
      ['Project index entries', fmt(indexEntries.length)],
      ['Photographs', fmt(gallery.length)],
      ['Locations on record', fmt(uniqueLocations())],
      ['Categories', fmt(Object.keys(cats).length)],
      ['Emails received', fmt(enquiryStats.received)],
      ['Emails done', fmt(enquiryStats.done)]
    ];
    $('#stats').innerHTML = items.map(function (it) {
      return '<div class="stat"><b>' + it[1] + '</b><span>' + it[0] + '</span></div>';
    }).join('');
  }

  /* ============================================================
     Overview
     ============================================================ */
  function renderOverview() {
    /* projects by category */
    var cats = categoryCounts();
    var total = projects.length || 1;
    var order = ['building', 'residential', 'industrial'];

    $('#breakdown').innerHTML = order.map(function (key) {
      var n = cats[key] || 0;
      var pct = Math.round((n / total) * 100);
      return '<div class="brk">' +
        '<div class="brkTop"><span>' + esc(categoryLabel[key]) + '</span>' +
        '<b>' + n + ' · ' + pct + '%</b></div>' +
        '<div class="brkBar"><i data-w="' + pct + '"></i></div>' +
        '</div>';
    }).join('');

    /* index by category, smaller print */
    var idx = { building: 0, residential: 0, industrial: 0 };
    indexEntries.forEach(function (p) { if (idx[p[0]] != null) idx[p[0]]++; });
    $('#breakdown').insertAdjacentHTML('beforeend',
      '<p class="muted" style="margin-top:18px;border-top:1px solid var(--line-soft);padding-top:16px">' +
      'Project index — ' + order.map(function (k) {
        return esc(categoryLabel[k]) + ': ' + idx[k];
      }).join(' · ') + '</p>');

    requestAnimationFrame(function () {
      $$('.brkBar i').forEach(function (bar) {
        bar.style.width = (bar.getAttribute('data-w') || 0) + '%';
      });
    });

    /* most repeated locations */
    var tally = {};
    function bump(loc) {
      if (!loc) return;
      var key = String(loc).trim();
      if (!key || /^various/i.test(key)) return;
      tally[key] = (tally[key] || 0) + 1;
    }
    indexEntries.forEach(function (p) { bump(p[2]); });
    projects.forEach(function (p) { bump(p[2]); });

    var top = Object.keys(tally).map(function (k) {
      return [k, tally[k]];
    }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); }).slice(0, 9);

    $('#topLocations').innerHTML = top.map(function (t) {
      return '<li><span>' + esc(t[0]) + '</span><b>' + t[1] + ' projects</b></li>';
    }).join('');
  }

  /* ============================================================
     Enquiries table
     ============================================================ */
  function renderEnquiries() {
    var DB = window.PTC_DB;
    var table = $('#enquiriesTable');
    if (!DB || !DB.configured || typeof DB.listEnquiries !== 'function') {
      if (table) table.innerHTML = '<tr><td colspan="6" class="muted empty">Connect Supabase and run supabase/schema.sql to store enquiries</td></tr>';
      setEnquiryStats([]); renderEnquirySummary();
      return;
    }

    DB.listEnquiries().then(function (enquiries) {
      enquiries = enquiries || [];
      /* totals always reflect the whole inbox, not the current filter */
      setEnquiryStats(enquiries); renderEnquirySummary(); renderStats();

      if (enquiries.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="muted">No enquiries yet</td></tr>';
        return;
      }

      var q = String(state.q.enquiries || '').toLowerCase();
      var cat = state.cat.enquiries || 'all';
      var rows = enquiries.filter(function (e) {
        var st = String(e.status || 'new');
        if (cat !== 'all' && st !== cat) return false;
        if (!q) return true;
        return (String(e.name || '') + ' ' + String(e.email || '') + ' ' +
          String(e.company || '') + ' ' + String(e.message || '')).toLowerCase().indexOf(q) > -1;
      }).map(function (e) {
        var status = esc(e.status || 'new');
        var done = (status === 'replied' || status === 'archived');
        var action = done
          ? '<span class="muted">✓ done</span>'
          : '<button class="chip" type="button" data-done="' + esc(e.id) + '">Mark done</button>';
        return '<tr>' +
          '<td>' + esc(e.id ? e.id.substring(0, 8) + '…' : '—') + '</td>' +
          '<td>' + esc(e.name || '—') + '</td>' +
          '<td>' + esc(e.email || '—') + '</td>' +
          '<td>' + esc(e.company || '—') + '</td>' +
          '<td><span class="status-' + status + '">' + status + '</span></td>' +
          '<td>' + action + '</td>' +
          '</tr>';
      }).join('');

      table.innerHTML = '<tr>' +
        '<th>ID</th><th>Name</th><th>Email</th><th>Company</th><th>Status</th><th>Action</th>' +
        '</tr>' + (rows || '<tr><td colspan="6" class="muted empty">No enquiries match that search.</td></tr>');
    }).catch(function (err) {
      if (window.console && console.warn) console.warn('[PTC] Could not load enquiries:', err.message);
      var missing = /404|does not exist|relation/i.test(String(err && err.message));
      table.innerHTML = '<tr><td colspan="6" class="muted error">' +
        (missing
          ? 'Enquiries table not created yet — run supabase/enquiries-insights.sql in Supabase.'
          : 'Error loading enquiries') +
        '</td></tr>';
      setEnquiryStats([]); renderEnquirySummary();
    });
  }

  /* ============================================================
     Insights table
     ============================================================ */
  function renderInsights() {
    var DB = window.PTC_DB;
    var table = $('#insightsTable');
    if (!DB || !DB.configured || typeof DB.listInsights !== 'function') {
      if (table) table.innerHTML = '<tr><td colspan="4" class="muted empty">Connect Supabase and run supabase/schema.sql to store insights</td></tr>';
      return;
    }

    DB.listInsights().then(function (insights) {
      if (!insights || insights.length === 0) {
        table.innerHTML = '<tr><td colspan="4" class="muted">No insights yet</td></tr>';
        return;
      }

      var rows = insights.map(function (i) {
        return '<tr>' +
          '<td>' + esc(i.metric || '—') + '</td>' +
          '<td>' + esc(i.value || '—') + '</td>' +
          '<td>' + esc(i.category || 'general') + '</td>' +
          '<td>' + (i.created_at ? new Date(i.created_at).toLocaleDateString() : '—') + '</td>' +
          '</tr>';
      }).join('');

      table.innerHTML = '<tr>' +
        '<th>Metric</th><th>Value</th><th>Category</th><th>Date</th>' +
        '</tr>' + rows;
    }).catch(function (err) {
      if (window.console && console.warn) console.warn('[PTC] Could not load insights:', err.message);
      var missing = /404|does not exist|relation/i.test(String(err && err.message));
      table.innerHTML = '<tr><td colspan="4" class="muted error">' +
        (missing
          ? 'Insights table not created yet — run supabase/enquiries-insights.sql in Supabase.'
          : 'Error loading insights') +
        '</td></tr>';
    });
  }

  /* ============================================================
     Enquiry actions — mark an enquiry as done (replied)
     ============================================================ */
  function wireEnquiryActions() {
    var table = $('#enquiriesTable');
    if (!table) return;
    table.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('[data-done]') : null;
      if (!btn) return;
      var id = btn.getAttribute('data-done');
      var DB = window.PTC_DB;
      if (!id || !DB || typeof DB.updateEnquiryStatus !== 'function') return;
      btn.disabled = true;
      btn.textContent = 'Saving…';
      DB.updateEnquiryStatus(id, 'replied').then(function () {
        renderEnquiries();
      }).catch(function (err) {
        if (window.console && console.warn) console.warn('[PTC] Could not update enquiry:', err.message);
        btn.disabled = false;
        btn.textContent = 'Mark done';
      });
    });
  }

  /* ============================================================
     Tabs
     ============================================================ */
  function wireTabs() {
    $$('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        state.tab = tab;
        $$('.tab').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        ['overview', 'featured', 'index', 'gallery', 'enquiries', 'insights'].forEach(function (name) {
          var panel = $('#panel-' + name);
          if (panel) panel.hidden = name !== tab;
        });
        if (history.replaceState) {
          history.replaceState(null, '', '#' + tab);
        }
      });
    });

    var hash = (window.location.hash || '').replace('#', '');
    if (['overview', 'featured', 'index', 'gallery'].indexOf(hash) > -1) {
      var target = $('.tab[data-tab="' + hash + '"]');
      if (target) target.click();
    }
  }

  /* ============================================================
     Search
     ============================================================ */
  function wireSearch() {
    ['featured', 'index', 'gallery', 'enquiries'].forEach(function (name) {
      var input = $('#q-' + name);
      if (!input) return;
      input.addEventListener('input', function () {
        state.q[name] = input.value.trim().toLowerCase();
        render(name);
      });
    });
  }

  function wireShortcut() {
    document.addEventListener('keydown', function (e) {
      var input = $('#q-' + state.tab);
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        if (!input) return;
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === 'Escape' && document.activeElement === input && input) {
        input.value = '';
        state.q[state.tab] = '';
        render(state.tab);
        input.blur();
      }
    });
  }

  /* ============================================================
     Filters
     ============================================================ */
  function wireFilters() {
    $$('.chips').forEach(function (group) {
      var name = group.getAttribute('data-filters');
      $$('.chip', group).forEach(function (chip) {
        chip.addEventListener('click', function () {
          state.cat[name] = chip.getAttribute('data-cat');
          $$('.chip', group).forEach(function (c) {
            var on = c === chip;
            c.classList.toggle('active', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          render(name);
        });
      });
    });
  }

  function matches(text, q) {
    return !q || String(text).toLowerCase().indexOf(q) > -1;
  }

  /* ============================================================
     Featured projects table
     ============================================================ */
  function renderFeatured() {
    var q = state.q.featured;
    var cat = state.cat.featured;

    var rows = projects.filter(function (p) {
      if (cat !== 'all' && p[0] !== cat) return false;
      return matches(p[1], q) || matches(p[2], q) || matches(p[4], q) || matches(categoryLabel[p[0]], q);
    });

    $('#count-featured').innerHTML = '<b>' + rows.length + '</b> of ' + projects.length + ' featured projects' +
      (q ? ' · matching “' + esc(q) + '”' : '');

    $('#table-featured').querySelector('tbody').innerHTML = rows.map(function (p) {
      return '<tr>' +
        '<td style="width:1%"><img class="thumb" src="assets/' + esc(p[3]) + '" alt="' + esc(p[1]) + '" loading="lazy" width="74" height="50"></td>' +
        '<td class="proj">' + esc(p[1]) + '</td>' +
        '<td><span class="tag ' + esc(p[0]) + '">' + esc(categoryLabel[p[0]] || p[0]) + '</span></td>' +
        '<td class="loc">' + esc(p[2]) + '</td>' +
        '<td class="detail">' + (p[4] ? esc(p[4]) : '<span class="file">—</span>') + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="5" class="muted empty">No projects match that search.</td></tr>';
  }

  /* ============================================================
     Project index table
     ============================================================ */
  function renderIndex() {
    var q = state.q.index;
    var cat = state.cat.index;

    var rows = indexEntries.filter(function (p) {
      if (cat !== 'all' && p[0] !== cat) return false;
      return matches(p[1], q) || matches(p[2], q) || matches(p[3], q) || matches(categoryLabel[p[0]], q);
    });

    $('#count-index').innerHTML = '<b>' + rows.length + '</b> of ' + indexEntries.length + ' index entries' +
      (q ? ' · matching “' + esc(q) + '”' : '');

    $('#table-index').querySelector('tbody').innerHTML = rows.map(function (p, i) {
      return '<tr>' +
        '<td class="num">' + (i + 1) + '</td>' +
        '<td><span class="tag ' + esc(p[0]) + '">' + esc(categoryLabel[p[0]] || p[0]) + '</span></td>' +
        '<td class="proj">' + esc(p[1]) + '</td>' +
        '<td class="loc">' + esc(p[2]) + '</td>' +
        '<td class="detail">' + (p[3] ? esc(p[3]) : '<span class="file">—</span>') + '</td>' +
        '</tr>';
    }).join('');

    var empty = $('#empty-index');
    if (empty) empty.hidden = rows.length > 0;
  }

  /* ============================================================
     Gallery table
     ============================================================ */
  function renderGallery() {
    var q = state.q.gallery;
    var cat = state.cat.gallery;

    var rows = gallery.filter(function (g) {
      if (cat !== 'all' && g[2] !== cat) return false;
      return matches(g[1], q) || matches(g[2], q) || matches(g[0], q);
    });

    $('#count-gallery').innerHTML = '<b>' + rows.length + '</b> of ' + gallery.length + ' photographs' +
      (q ? ' · matching “' + esc(q) + '”' : '');

    $('#table-gallery').querySelector('tbody').innerHTML = rows.map(function (g) {
      return '<tr>' +
        '<td style="width:1%"><img class="thumb" src="assets/' + esc(g[0]) + '" alt="' + esc(g[1]) + '" loading="lazy" width="74" height="50"></td>' +
        '<td class="proj">' + esc(g[1]) + '</td>' +
        '<td><span class="tag">' + esc(g[2]) + '</span></td>' +
        '<td class="file">' + esc(g[0]) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="4" class="muted empty">No photographs match that search.</td></tr>';
  }

  function render(name) {
    if (name === 'featured') renderFeatured();
    else if (name === 'index') renderIndex();
    else if (name === 'gallery') renderGallery();
    else if (name === 'enquiries') renderEnquiries();
  }

  /* ============================================================
     Exports
     ============================================================ */
  function download(filename, mime, text) {
    var blob = new Blob([text], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function csvCell(v) {
    var s = v == null ? '' : String(v);
    return '"' + s.split('"').join('""') + '"';
  }

  function toCsv(headers, rows) {
    return [headers.map(csvCell).join(',')]
      .concat(rows.map(function (r) { return r.map(csvCell).join(','); }))
      .join('\r\n');
  }

  function stamp() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  var builders = {
    'all-json': function () {
      download('ptc-data-' + stamp() + '.json', 'application/json', JSON.stringify({
        generated: new Date().toISOString(),
        categoryLabel: categoryLabel,
        projects: projects,
        indexEntries: indexEntries,
        gallery: gallery
      }, null, 2));
    },
    'index-csv': function () {
      download('ptc-project-index-' + stamp() + '.csv', 'text/csv',
        toCsv(['Category', 'Project', 'Location', 'Detail'],
          indexEntries.map(function (p) { return [categoryLabel[p[0]] || p[0], p[1], p[2], p[3]]; })));
    },
    'featured-csv': function () {
      download('ptc-featured-projects-' + stamp() + '.csv', 'text/csv',
        toCsv(['Category', 'Project', 'Location', 'Image', 'Detail'],
          projects.map(function (p) { return [categoryLabel[p[0]] || p[0], p[1], p[2], p[3], p[4]]; })));
    },
    'gallery-csv': function () {
      download('ptc-gallery-' + stamp() + '.csv', 'text/csv',
        toCsv(['File', 'Caption', 'Category'],
          gallery.map(function (g) { return [g[0], g[1], g[2]]; })));
    },
    'index-json': function () {
      download('ptc-project-index-' + stamp() + '.json', 'application/json',
        JSON.stringify(indexEntries.map(function (p) {
          return { category: categoryLabel[p[0]] || p[0], project: p[1], location: p[2], detail: p[3] };
        }), null, 2));
    },
    'featured-json': function () {
      download('ptc-featured-projects-' + stamp() + '.json', 'application/json',
        JSON.stringify(projects.map(function (p) {
          return { category: categoryLabel[p[0]] || p[0], project: p[1], location: p[2], image: p[3], detail: p[4] };
        }), null, 2));
    },
    'gallery-json': function () {
      download('ptc-gallery-' + stamp() + '.json', 'application/json',
        JSON.stringify(gallery.map(function (g) {
          return { file: g[0], caption: g[1], category: g[2] };
        }), null, 2));
    }
  };

  function wireExports() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-export]') : null;
      if (!btn) return;
      var key = btn.getAttribute('data-export');
      if (builders[key]) {
        e.preventDefault();
        builders[key]();
      }
    });
  }

})();
