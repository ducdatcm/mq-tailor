(function () {
  'use strict';

  // --- Mobile nav toggle ---
  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // --- Subtle reveal-on-scroll (respects prefers-reduced-motion via CSS) ---
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // --- Horizontal photo sliders (e.g. Journal post galleries) ---
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.slider__track');
    var prevBtn = slider.querySelector('[data-slider-prev]');
    var nextBtn = slider.querySelector('[data-slider-next]');
    if (!track) return;

    function scrollByItem(direction) {
      var item = track.querySelector('.slider__item');
      if (!item) return;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: direction * (item.getBoundingClientRect().width + gap), behavior: 'smooth' });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { scrollByItem(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollByItem(1); });

    function updateButtons() {
      if (!prevBtn || !nextBtn) return;
      var maxScroll = track.scrollWidth - track.clientWidth - 1;
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = maxScroll <= 0 || track.scrollLeft >= maxScroll;
    }
    updateButtons();
    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
  });

  // --- Our Garments category filter (All / Suit & Jackets / Trousers / Shirts / Others) ---
  var garmentFilter = document.querySelector('[data-garment-filter]');
  var garmentGrid = document.querySelector('[data-garment-grid]');
  if (garmentFilter && garmentGrid) {
    var filterPills = garmentFilter.querySelectorAll('.filter-pill');
    var garmentCards = garmentGrid.querySelectorAll('.card');

    filterPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        filterPills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        var wanted = pill.getAttribute('data-filter');
        garmentCards.forEach(function (card) {
          var show = wanted === 'all' || card.getAttribute('data-category') === wanted;
          card.hidden = !show;
        });
      });
    });
  }

  // --- Cookie consent + Google Analytics ---
  // Analytics only loads after the visitor presses Accept. The choice is kept
  // for 6 months in a small first-party cookie (mq_consent), and can be
  // changed any time from "Cookie settings" in the footer.
  (function () {
    var box = document.querySelector('[data-consent]');
    var gaId = box && box.getAttribute('data-ga-id');
    var MAX_AGE = 60 * 60 * 24 * 180;

    // Remember the UTM tags of the landing page, so a visit from e.g. the
    // Google Business Profile still counts if consent comes a page later.
    try {
      if (/[?&]utm_/.test(location.search) && !sessionStorage.getItem('mq_landing_utm')) {
        sessionStorage.setItem('mq_landing_utm', location.search.slice(1).split('&').filter(function (p) {
          return p.indexOf('utm_') === 0;
        }).join('&'));
      }
    } catch (e) { /* storage blocked: UTM only counts if accepted on the landing page */ }

    function readChoice() {
      var m = document.cookie.match(/(?:^|; )mq_consent=(granted|denied)/);
      return m ? m[1] : null;
    }
    function saveChoice(value) {
      document.cookie = 'mq_consent=' + value + '; Max-Age=' + MAX_AGE + '; Path=/; SameSite=Lax' +
        (location.protocol === 'https:' ? '; Secure' : '');
    }

    function loadAnalytics() {
      if (!gaId || window.gtag) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      var config = {};
      try {
        var utm = sessionStorage.getItem('mq_landing_utm');
        if (utm && !sessionStorage.getItem('mq_landing_utm_sent') && !/[?&]utm_/.test(location.search)) {
          config.page_location = location.origin + location.pathname +
            (location.search ? location.search + '&' : '?') + utm + location.hash;
        }
        if (utm) sessionStorage.setItem('mq_landing_utm_sent', '1');
      } catch (e) { /* ignore */ }
      window.gtag('config', gaId, config);
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
      document.head.appendChild(s);
    }

    function clearAnalyticsCookies() {
      var host = location.hostname;
      var domains = [host, '.' + host, '.' + host.replace(/^www\./, '')];
      document.cookie.split('; ').forEach(function (c) {
        var name = c.split('=')[0];
        if (name !== '_ga' && name !== '_gid' && name.indexOf('_ga_') !== 0) return;
        document.cookie = name + '=; Max-Age=0; Path=/';
        domains.forEach(function (d) { document.cookie = name + '=; Max-Age=0; Path=/; Domain=' + d; });
      });
    }

    if (!box) return;
    var choice = readChoice();
    if (choice === 'granted') loadAnalytics();
    else if (!choice) box.hidden = false;

    box.querySelector('[data-consent-accept]').addEventListener('click', function () {
      saveChoice('granted');
      box.hidden = true;
      loadAnalytics();
    });
    box.querySelector('[data-consent-decline]').addEventListener('click', function () {
      var wasRunning = !!window.gtag;
      saveChoice('denied');
      box.hidden = true;
      clearAnalyticsCookies();
      if (wasRunning) location.reload(); // stop the analytics already running on this page
    });
    document.querySelectorAll('[data-consent-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        box.hidden = false;
        box.querySelector('[data-consent-accept]').focus();
      });
    });
  })();

  // --- Analytics event hooks (brief §27: phone/Zalo/map/enquiry clicks) ---
  function track(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    track(el.getAttribute('data-track'), { link_url: el.href || '' });
  });

  var enquiryForm = document.querySelector('[data-enquiry-form]');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function () {
      track('enquiry_submit', {});
    });
  }
})();
