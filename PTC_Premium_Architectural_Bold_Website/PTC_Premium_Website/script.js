/* ============================================================
   PTC — Parvati Techno Consultants
   script.js
   Content sourced from PTC's building works, industrial works
   and residential company profiles.
   ============================================================ */

(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener('change', function (e) { reduceMotion = e.matches; });
  }

  /* ---------------------------------------------------------
     Page loader — hides once the page (or hero image) is ready,
     with a failsafe timeout so it can never trap the visitor
     --------------------------------------------------------- */
  var loader = $('#loader');
  if (loader) {
    if (reduceMotion) {
      loader.classList.add('done');
    } else {
      var hideLoader = function () { loader.classList.add('done'); };
      if (document.readyState === 'complete') hideLoader();
      else window.addEventListener('load', hideLoader);
      setTimeout(hideLoader, 2500);
    }
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function has(el, cls) { return el.classList.contains(cls); }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function esc(str) {
    return String(str)
      .split('&').join('&amp;')
      .split('<').join('&lt;')
      .split('>').join('&gt;')
      .split('"').join('&quot;');
  }

    var categoryLabel = window.PTC.categoryLabel;
  var projects = window.PTC.projects;
  var indexEntries = window.PTC.indexEntries;
  var gallery = window.PTC.gallery;

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Header state, scroll progress bar, back to top
     --------------------------------------------------------- */
  var header = $('#header');
  var progress = $('#progress');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle('scrolled', y > 40);
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (toTop) toTop.classList.toggle('show', y > 640);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  var menuBtn = $('#menu');
  var nav = $('#nav');
  var navShade = $('#navShade');

  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
      if (open) {
        var firstLink = $('a', nav);
        if (firstLink) firstLink.focus({ preventScroll: true });
      }
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    if (navShade) navShade.addEventListener('click', closeMenu);
    document.addEventListener('click', function (e) {
      if (has(nav, 'open') && header && !header.contains(e.target)) closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) closeMenu();
    });
  }

  /* ---------------------------------------------------------
     Active nav link
     --------------------------------------------------------- */
  var navLinks = $$('#nav a[href^="#"]');
  var watchedSections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && watchedSections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('current', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    watchedSections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------------------------------------------------
     Hero slider
     --------------------------------------------------------- */
  var hero = $('#home');
  var slides = $$('.hero .slide');
  var dotsWrap = $('#dots');
  var slideIndex = 0;
  var timer = null;
  var paused = false;
  var DURATION = 6500;
  var dots = [];

  if (dotsWrap && slides.length) {
    slides.forEach(function (s, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('aria-label', 'Show slide ' + (i + 1));
      dot.addEventListener('click', function () { goToSlide(i, true); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  function paintSlides() {
    slides.forEach(function (s, i) { s.classList.toggle('active', i === slideIndex); });
    dots.forEach(function (d, i) { d.classList.toggle('active', i === slideIndex); });
  }

  function stopSlider() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function startSlider() {
    stopSlider();
    if (reduceMotion || paused || document.hidden || slides.length < 2) return;
    timer = setInterval(function () { goToSlide(slideIndex + 1, false); }, DURATION);
  }

  function goToSlide(n, manual) {
    slideIndex = (n + slides.length) % slides.length;
    paintSlides();
    if (manual) startSlider();
  }

  if (slides.length) {
    paintSlides();

    var nextBtn = $('#next');
    var prevBtn = $('#prev');
    if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(slideIndex + 1, true); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(slideIndex - 1, true); });

    if (hero) {
      hero.addEventListener('mouseenter', function () { paused = true; stopSlider(); });
      hero.addEventListener('mouseleave', function () { paused = false; startSlider(); });
      hero.addEventListener('focusin', function () { paused = true; stopSlider(); });
      hero.addEventListener('focusout', function () { paused = false; startSlider(); });
      hero.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(slideIndex + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(slideIndex - 1, true); }
      });

      var touchX = null;
      hero.addEventListener('touchstart', function (e) {
        touchX = e.changedTouches[0].clientX;
      }, { passive: true });
      hero.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) goToSlide(slideIndex + (dx < 0 ? 1 : -1), true);
      }, { passive: true });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopSlider(); else startSlider();
    });

    startSlider();
  }

  /* ---------------------------------------------------------
     Animated counters
     --------------------------------------------------------- */
  var counters = $$('[data-count]');

  function runCounter(el) {
    var target = Number(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion || !isFinite(target)) { el.textContent = fmt(target) + suffix; return; }
    var start = performance.now();
    var dur = 1500;
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && counters.length) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { countObserver.observe(c); });
  }

  /* ---------------------------------------------------------
     Scroll reveals
     --------------------------------------------------------- */
  var revealItems = $$('.reveal:not(.project)');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    $$('.reveal').forEach(function (el) { el.classList.add('visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parent = el.parentElement;
        var step = 0;
        if (parent) {
          var siblings = $$('.reveal:not(.project)', parent).filter(function (s) {
            return !has(s, 'visible');
          });
          step = Math.min(siblings.indexOf(el), 6);
          if (step < 0) step = 0;
        }
        setTimeout(function () {
          el.classList.add('visible');
          obs.unobserve(el);
        }, step * 70);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     Featured projects — render, filter, lightbox
     --------------------------------------------------------- */
  var grid = $('#projectGrid');
  var visible = projects.slice();

  function cardHTML(p, i) {
    var title = esc(p[1]);
    return '<article class="project reveal" data-i="' + i + '" role="button" tabindex="0"' +
      ' aria-label="View project: ' + title + ', ' + esc(p[2]) + '">' +
      '<span class="view">View</span>' +
      '<img loading="lazy" src="assets/' + esc(p[3]) + '" alt="' + title + ' — ' + esc(p[2]) + '">' +
      '<div class="detail">' +
      '<small>' + esc(categoryLabel[p[0]]) + '</small>' +
      '<h3>' + title + ' <span class="arrow">↗</span></h3>' +
      '<p>' + esc(p[2]) + '</p>' +
      '</div></article>';
  }

  function renderProjects(filter) {
    if (!grid) return;
    visible = projects.filter(function (p) { return filter === 'all' || p[0] === filter; });
    grid.innerHTML = visible.map(cardHTML).join('');
    $$('.project', grid).forEach(function (card, i) {
      setTimeout(function () { card.classList.add('visible'); }, reduceMotion ? 0 : Math.min(i, 10) * 55);
    });
  }

  renderProjects('all');

  $$('.filter[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (has(btn, 'active')) return;
      $$('.filter[data-filter]').forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      var filter = btn.getAttribute('data-filter');
      if (reduceMotion || !grid) { renderProjects(filter); return; }
      grid.classList.add('swapping');
      setTimeout(function () {
        renderProjects(filter);
        grid.classList.remove('swapping');
      }, 200);
    });
  });

  /* ---------------------------------------------------------
     Project index — search, filter, show more
     --------------------------------------------------------- */
  var listEl = $('#indexList');
  var searchEl = $('#indexSearch');
  var countEl = $('#indexCount');
  var moreBtn = $('#indexMore');
  var emptyEl = $('#indexEmpty');
  var indexFilter = 'all';
  var indexQuery = '';
  var INDEX_PAGE = 24;
  var indexShown = INDEX_PAGE;
  var indexMatches = indexEntries.slice();

  function indexRow(entry) {
    var note = entry[3] ? '<span class="ixNote">' + esc(entry[3]) + '</span>' : '';
    return '<li class="ixRow">' +
      '<span class="ixTag ' + esc(entry[0]) + '">' + esc(categoryLabel[entry[0]]) + '</span>' +
      '<span class="ixName">' + esc(entry[1]) + '</span>' +
      '<span class="ixLoc">' + esc(entry[2]) + '</span>' +
      note +
      '</li>';
  }

  function renderIndex(resetPage) {
    if (!listEl) return;
    if (resetPage) indexShown = INDEX_PAGE;
    var q = indexQuery.trim().toLowerCase();
    indexMatches = indexEntries.filter(function (e) {
      if (indexFilter !== 'all' && e[0] !== indexFilter) return false;
      if (!q) return true;
      return (e[1] + ' ' + e[2] + ' ' + e[3]).toLowerCase().indexOf(q) !== -1;
    });
    var slice = indexMatches.slice(0, indexShown);
    listEl.innerHTML = slice.map(indexRow).join('');
    if (countEl) {
      countEl.textContent = indexMatches.length
        ? 'Showing ' + slice.length + ' of ' + indexMatches.length + ' projects'
        : '';
    }
    if (emptyEl) emptyEl.hidden = indexMatches.length > 0;
    if (moreBtn) {
      var remaining = indexMatches.length - slice.length;
      moreBtn.hidden = remaining <= 0;
      moreBtn.textContent = 'Show ' + (remaining > 0 ? remaining : 0) + ' more projects';
    }
  }

  if (listEl) {
    renderIndex(true);

    if (searchEl) {
      searchEl.addEventListener('input', function () {
        indexQuery = searchEl.value;
        renderIndex(true);
      });
    }

    $$('.filter[data-indexfilter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.filter[data-indexfilter]').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        indexFilter = btn.getAttribute('data-indexfilter');
        renderIndex(true);
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        indexShown += 48;
        renderIndex(false);
      });
    }

    if (searchEl) {
      searchEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !searchEl.value) return;
        searchEl.value = '';
        indexQuery = '';
        renderIndex(true);
      });
    }
  }

  /* “/” jumps to the project-index search from anywhere on the page */
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || !searchEl) return;
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (typing) return;
    e.preventDefault();
    searchEl.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    searchEl.focus({ preventScroll: true });
    searchEl.select();
  });

  /* ---------------------------------------------------------
     Photo gallery — the remaining profile photographs
     --------------------------------------------------------- */
  var galleryGrid = $('#galleryGrid');
  var galleryCount = $('#galleryCount');
  var galleryMore = $('#galleryMore');
  var galleryFilter = 'all';
  var galleryVisible = gallery.slice();
  var GALLERY_PAGE = 24;
  var galleryShown = GALLERY_PAGE;

  function tileHTML(g, i) {
    return '<figure class="gTile reveal" data-gi="' + i + '" role="button" tabindex="0"' +
      ' aria-label="View photograph: ' + esc(g[1]) + '">' +
      '<img loading="lazy" src="assets/' + esc(g[0]) + '" alt="' + esc(g[1]) + '">' +
      '<span class="gTag">' + esc(g[2]) + '</span>' +
      '<figcaption>' + esc(g[1]) + '</figcaption>' +
      '</figure>';
  }

  function renderGallery(reset) {
    if (!galleryGrid) return;
    if (reset) galleryShown = GALLERY_PAGE;
    galleryVisible = gallery.filter(function (g) {
      return galleryFilter === 'all' || g[2] === galleryFilter;
    });
    var slice = galleryVisible.slice(0, galleryShown);
    galleryGrid.innerHTML = slice.map(tileHTML).join('');
    $$('.gTile', galleryGrid).forEach(function (tile, i) {
      setTimeout(function () { tile.classList.add('visible'); }, reduceMotion ? 0 : Math.min(i, 10) * 45);
    });
    if (galleryCount) {
      galleryCount.textContent = 'Showing ' + slice.length + ' of ' + galleryVisible.length + ' photographs';
    }
    if (galleryMore) {
      var remaining = galleryVisible.length - slice.length;
      galleryMore.hidden = remaining <= 0;
      galleryMore.textContent = 'Show ' + (remaining > 0 ? remaining : 0) + ' more photographs';
    }
  }

  if (galleryGrid) {
    renderGallery(true);

    $$('.filter[data-galleryfilter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (has(btn, 'active')) return;
        $$('.filter[data-galleryfilter]').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        galleryFilter = btn.getAttribute('data-galleryfilter');
        if (reduceMotion) { renderGallery(true); return; }
        galleryGrid.classList.add('swapping');
        setTimeout(function () {
          renderGallery(true);
          galleryGrid.classList.remove('swapping');
        }, 200);
      });
    });

    if (galleryMore) {
      galleryMore.addEventListener('click', function () {
        galleryShown += 48;
        renderGallery(false);
      });
    }

    galleryGrid.addEventListener('click', function (e) {
      var tile = e.target.closest ? e.target.closest('.gTile') : null;
      if (tile) openLightbox(gallerySet(), Number(tile.getAttribute('data-gi')));
    });
    galleryGrid.addEventListener('keydown', function (e) {
      var tile = e.target.closest ? e.target.closest('.gTile') : null;
      if (!tile) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        openLightbox(gallerySet(), Number(tile.getAttribute('data-gi')));
      }
    });
  }

  /* ---------------------------------------------------------
     Lightbox
     --------------------------------------------------------- */
  var lb = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbTitle = $('#lbTitle');
  var lbMeta = $('#lbMeta');
  var lbCat = $('#lbCat');
  var lbCount = $('#lbCount');
  var lbSet = [];
  var lbPos = 0;
  var lastFocused = null;

  function projectSet() {
    return visible.map(function (p) {
      return { img: p[3], title: p[1], meta: p[2] + (p[4] ? ' · ' + p[4] : ''), cat: categoryLabel[p[0]] };
    });
  }

  function gallerySet() {
    return galleryVisible.map(function (g) {
      return { img: g[0], title: g[1], meta: g[2], cat: 'Project profiles' };
    });
  }

  function paintLightbox() {
    var item = lbSet[lbPos];
    if (!item || !lbImg) return;
    lbImg.setAttribute('src', 'assets/' + item.img);
    lbImg.setAttribute('alt', item.title);
    lbTitle.textContent = item.title;
    lbMeta.textContent = item.meta;
    lbCat.textContent = item.cat;
    lbCount.textContent = (lbPos + 1) + ' / ' + lbSet.length;
  }

  function openLightbox(set, i) {
    if (!lb || !set || !set.length) return;
    lbSet = set;
    lbPos = i;
    paintLightbox();
    lastFocused = document.activeElement;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // the dialog is only focusable once its styles have settled, so retry
    // briefly instead of focusing a single time and silently failing
    focusWhenReady($('#lbClose'), 0);
  }

  function focusWhenReady(el, tries) {
    if (!el || tries > 8) return;
    el.focus({ preventScroll: true });
    if (document.activeElement === el) return;
    setTimeout(function () { focusWhenReady(el, tries + 1); }, 40);
  }

  function closeLightbox() {
    if (!lb || !has(lb, 'open')) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  function stepLightbox(dir) {
    if (!lbSet.length) return;
    lbPos = (lbPos + dir + lbSet.length) % lbSet.length;
    paintLightbox();
  }

  if (grid) {
    grid.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.project') : null;
      if (card) openLightbox(projectSet(), Number(card.getAttribute('data-i')));
    });
    grid.addEventListener('keydown', function (e) {
      var card = e.target.closest ? e.target.closest('.project') : null;
      if (!card) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        openLightbox(projectSet(), Number(card.getAttribute('data-i')));
      }
    });
  }

  /* swipe left / right to browse on touch devices */
  if (lb) {
    var lbTouchX = null;
    lb.addEventListener('touchstart', function (e) {
      lbTouchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (lbTouchX === null) return;
      var dx = e.changedTouches[0].clientX - lbTouchX;
      lbTouchX = null;
      if (Math.abs(dx) > 45) stepLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  var lbClose = $('#lbClose');
  var lbPrev = $('#lbPrev');
  var lbNext = $('#lbNext');
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function () { stepLightbox(-1); });
  if (lbNext) lbNext.addEventListener('click', function () { stepLightbox(1); });
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', function (e) {
    if (lb && has(lb, 'open')) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); }
      return;
    }
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------------------------------------------------------
     Contact form — stores enquiry in Supabase and opens mail app
     --------------------------------------------------------- */
  var form = $('#contactForm');
  if (form) {
    var status = $('#formStatus');
    var DB = window.PTC_DB;

    function setStatus(message, isError) {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('error', !!isError);
      status.hidden = false;
    }

    form.addEventListener('input', function (e) {
      if (status && !status.hidden && e.target && e.target.tagName !== 'BUTTON') {
        status.hidden = true;
        status.textContent = '';
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = String(data.get('name') || '').trim();
      var email = String(data.get('email') || '').trim();
      var company = String(data.get('company') || '').trim();
      var message = String(data.get('message') || '').trim();

      if (!name || !email || !message) {
        setStatus('Please complete your name, email address and project details.', true);
        if (form.reportValidity) form.reportValidity();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('That email address does not look right — please check it and try again.', true);
        var emailField = form.querySelector('input[name="email"]');
        if (emailField) emailField.focus();
        return;
      }

      // Save the enquiry to the database so it appears in the admin console.
      // Anonymous inserts are allowed by the enquiries RLS policy; only staff
      // can read them back. The mailto below still runs either way.
      if (DB && DB.configured && typeof DB.submitEnquiry === 'function') {
        DB.submitEnquiry({ name: name, email: email, company: company, message: message })
          .catch(function (err) {
            if (window.console && console.warn) console.warn('[PTC] Could not store enquiry:', err.message);
          });
      }

      // Open mail app as fallback / preview
      var NL = String.fromCharCode(10);
      var subject = encodeURIComponent('PTC website enquiry — ' + name);
      var body = encodeURIComponent([
        'Name: ' + name,
        'Email: ' + email,
        'Company: ' + company,
        '',
        'Project details:',
        message
      ].join(NL));

      setStatus('Your email application should open with the enquiry ready to send to PTC.', false);
      window.location.href = 'mailto:parvaticonsultants@gmail.com' +
        '?subject=' + subject + '&body=' + body;
    });
  }

  /* ---------------------------------------------------------
     Live content — supabase.js calls this once the database has
     answered, so the page moves from the data.js baseline to the
     live content without a reload. Whatever search or filter the
     visitor has already applied is kept — nothing they typed is lost.
     --------------------------------------------------------- */
  window.PTC_UI = {
    refresh: function () {
      categoryLabel = window.PTC.categoryLabel || categoryLabel;
      projects = window.PTC.projects || projects;
      indexEntries = window.PTC.indexEntries || indexEntries;
      gallery = window.PTC.gallery || gallery;

      var activeFilter = $('.filter[data-filter].active');
      renderProjects(activeFilter ? activeFilter.getAttribute('data-filter') : 'all');
      renderIndex(true);
      renderGallery(true);
    }
  };
})();
