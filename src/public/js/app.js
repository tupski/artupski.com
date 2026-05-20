(function () {
  'use strict';

  // ── Hamburger menu toggle ──────────────────────────────────────────────
  var menuToggle = document.getElementById('mobile-menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  var iconMenu   = document.getElementById('icon-menu');
  var iconClose  = document.getElementById('icon-close');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden', isOpen);
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      if (iconMenu)  iconMenu.classList.toggle('hidden', !isOpen);
      if (iconClose) iconClose.classList.toggle('hidden', isOpen);
    });

    // Close menu when a nav link is clicked (mobile UX)
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        menuToggle.setAttribute('aria-expanded', 'false');
        if (iconMenu)  iconMenu.classList.remove('hidden');
        if (iconClose) iconClose.classList.add('hidden');
      });
    });
  }

  // ── Theme toggle ───────────────────────────────────────────────────────
  var themeToggle = document.getElementById('theme-toggle');
  var iconSun     = document.getElementById('icon-sun');
  var iconMoon    = document.getElementById('icon-moon');

  function syncThemeIcons() {
    var isDark = document.documentElement.classList.contains('dark');
    if (iconSun)  iconSun.classList.toggle('hidden', !isDark);
    if (iconMoon) iconMoon.classList.toggle('hidden', isDark);
  }

  // Sync icons on initial load
  syncThemeIcons();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      if (typeof toggleTheme === 'function') {
        toggleTheme();
      }
      syncThemeIcons();
    });
  }

  // ── IntersectionObserver scroll animations ─────────────────────────────
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ── Smooth scrolling for anchor links ─────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

}());
