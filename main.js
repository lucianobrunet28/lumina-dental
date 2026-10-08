/* LUMINA — main.js (IIFE, no modules) */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn('[init] ' + name + ' failed:', e); }
  }

  /* ---------- Intro curtain (once per session) ---------- */
  function initIntro(done) {
    var intro = document.getElementById('intro');
    var seen = false;
    try { seen = sessionStorage.getItem('od-intro') === '1'; } catch (e) {}
    if (!intro || seen || reduced) {
      if (intro) intro.remove();
      done();
      return;
    }
    document.body.classList.add('is-loading');
    var finish = function () {
      intro.classList.add('is-done');
      document.body.classList.remove('is-loading');
      try { sessionStorage.setItem('od-intro', '1'); } catch (e) {}
      setTimeout(done, 250);
      setTimeout(function () { intro.remove(); }, 1300);
    };
    var t0 = Date.now();
    var go = function () { setTimeout(finish, Math.max(0, 1250 - (Date.now() - t0))); };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go);
    setTimeout(finish, 2800); // never block longer than this
  }

  /* ---------- Nav state + hide on scroll down ---------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var bar = document.getElementById('progress');
    if (!nav) return;
    var lastY = window.scrollY, ticking = false;
    function update() {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 30);
      var menuOpen = document.body.classList.contains('menu-open');
      nav.classList.toggle('is-hidden', !menuOpen && y > 500 && y > lastY + 4);
      if (y < lastY - 4 || y < 500) nav.classList.remove('is-hidden');
      lastY = y;
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      }
      ticking = false;
    }
    update();
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var burger = document.getElementById('burger');
    var menu = document.getElementById('mobile-menu');
    if (!burger || !menu) return;
    function set(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { set(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) set(false); });
  }

  /* ---------- Hero title line mask ---------- */
  function initHeroTitle() {
    document.querySelectorAll('.hero-title .line').forEach(function (line) {
      if (line.firstElementChild && line.firstElementChild.classList.contains('li')) return;
      var span = document.createElement('span');
      span.className = 'li';
      while (line.firstChild) span.appendChild(line.firstChild);
      line.appendChild(span);
    });
  }

  /* ---------- Reveal on scroll (with sibling stagger) ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal, .wave-reveal');
    // stagger cards inside grids
    document.querySelectorAll('.svc-grid, .reviews-grid, .faq-list, .hero-inner').forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) {
        if (c.classList.contains('reveal')) c.style.setProperty('--d', (i % 4) * 0.08 + 's');
      });
    });
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { el.classList.add('is-in'); }); }, 7000);
  }

  /* ---------- Hero parallax ---------- */
  function initParallax() {
    var pic = document.querySelector('.hero-media picture');
    var hero = document.querySelector('.hero');
    if (!pic || !hero || reduced) return;
    var ticking = false;
    function update() {
      var y = window.scrollY;
      if (y < hero.offsetHeight) pic.style.setProperty('--py', (y * 0.28).toFixed(1) + 'px');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ---------- Card spotlight ---------- */
  function initSpotlight() {
    if (!canHover) return;
    document.querySelectorAll('.svc').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!canHover || reduced) return;
    document.querySelectorAll('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- Live clock + open/closed status (visitor's local time) ---------- */
  var HOURS = { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 16] };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function baNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      return { d: wd, h: +o.hour % 24, m: +o.minute, s: +o.second };
    } catch (e) {
      var n = new Date();
      return { d: n.getDay(), h: n.getHours(), m: n.getMinutes(), s: n.getSeconds() };
    }
  }

  function statusFor(t) {
    var today = HOURS[t.d];
    var mins = t.h * 60 + t.m;
    if (today && mins >= today[0] * 60 && mins < today[1] * 60) {
      return { open: true, text: '<strong>Open now</strong> · until ' + today[1] + ':00', short: 'Open now · Suite 2' };
    }
    if (today && mins < today[0] * 60) {
      return { open: false, text: '<strong>Closed</strong> · we open today at ' + today[0] + ':00', short: 'Opening today at ' + today[0] + ':00' };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (t.d + i) % 7;
      if (HOURS[d]) {
        var when = i === 1 ? 'tomorrow' : 'on ' + DAYS[d];
        return { open: false, text: '<strong>Closed</strong> · we open ' + when + ' at ' + HOURS[d][0] + ':00', short: 'Opening ' + when + ' at ' + HOURS[d][0] + ':00' };
      }
    }
    return { open: false, text: 'Closed', short: 'Lumina Dental · Suite 2' };
  }

  function initClock() {
    var ticks = document.getElementById('clockTicks');
    if (ticks && !ticks.children.length) {
      var html = '';
      for (var i = 0; i < 60; i++) {
        var major = i % 5 === 0;
        var a = i * 6 * Math.PI / 180;
        var r1 = major ? 94 : 99, r2 = 105;
        html += '<line class="' + (major ? 'major' : '') + '" x1="' + (120 + r1 * Math.sin(a)).toFixed(2) + '" y1="' + (120 - r1 * Math.cos(a)).toFixed(2) +
          '" x2="' + (120 + r2 * Math.sin(a)).toFixed(2) + '" y2="' + (120 - r2 * Math.cos(a)).toFixed(2) + '"/>';
      }
      ticks.innerHTML = html;
    }
    var hH = document.getElementById('handH');
    var hM = document.getElementById('handM');
    var hS = document.getElementById('handS');
    var arc = document.getElementById('clockArc');
    var labels = document.querySelectorAll('[data-clock-text]');
    var texts = document.querySelectorAll('[data-open-text]');
    var shorts = document.querySelectorAll('[data-open-short]');
    var dots = document.querySelectorAll('[data-open-dot]');
    var rows = document.querySelectorAll('.hours-table li');
    var lastSec = -1, turns = 0, lastMin = -1;

    function tick() {
      var t = baNow();
      if (t.s < lastSec) turns++;
      lastSec = t.s;
      if (hH) hH.style.transform = 'rotate(' + ((t.h % 12) * 30 + t.m * 0.5) + 'deg)';
      if (hM) hM.style.transform = 'rotate(' + (t.m * 6 + t.s * 0.1) + 'deg)';
      if (hS) hS.style.transform = 'rotate(' + (turns * 360 + t.s * 6) + 'deg)';
      var txt = (t.h < 10 ? '0' : '') + t.h + ':' + (t.m < 10 ? '0' : '') + t.m;
      labels.forEach(function (l) { if (l.textContent !== txt) l.textContent = txt; });

      if (t.m !== lastMin) {
        lastMin = t.m;
        var st = statusFor(t);
        texts.forEach(function (el) { el.innerHTML = st.text; });
        shorts.forEach(function (el) { el.textContent = st.short; });
        dots.forEach(function (el) { el.classList.toggle('is-closed', !st.open); });
        rows.forEach(function (r) {
          var days = (r.getAttribute('data-days') || '').split(',').map(Number);
          r.classList.toggle('is-today', days.indexOf(t.d) !== -1);
        });
        // arc = progress through today's opening hours
        if (arc) {
          var today = HOURS[t.d], pct = 0;
          if (today) {
            var mins = t.h * 60 + t.m, a0 = today[0] * 60, a1 = today[1] * 60;
            pct = Math.max(0, Math.min(100, (mins - a0) / (a1 - a0) * 100));
          }
          arc.style.strokeDasharray = pct.toFixed(1) + ' 100';
        }
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Glass sign: 3D tilt + sheen ---------- */
  function initSign() {
    var p = document.querySelector('.glass-sign');
    if (!p || !canHover) return;
    p.addEventListener('pointermove', function (e) {
      var r = p.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      p.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
      p.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      p.style.setProperty('--sx', (x * 60).toFixed(1) + '%');
    });
    p.addEventListener('pointerleave', function () {
      p.style.setProperty('--ry', '0deg');
      p.style.setProperty('--rx', '0deg');
      p.style.setProperty('--sx', '-30%');
    });
  }

  /* ---------- Only one FAQ open at a time ---------- */
  function initFaq() {
    var items = document.querySelectorAll('.faq-list details');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function boot() {
    safe(initNav, 'nav');
    safe(initMenu, 'menu');
    safe(initHeroTitle, 'heroTitle');
    safe(initClock, 'clock');
    safe(initParallax, 'parallax');
    safe(initSpotlight, 'spotlight');
    safe(initMagnetic, 'magnetic');
    safe(initSign, 'sign');
    safe(initFaq, 'faq');
    safe(initYear, 'year');
    safe(function () { initIntro(function () { safe(initReveal, 'reveal'); }); }, 'intro');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
