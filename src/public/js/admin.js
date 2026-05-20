// src/public/js/admin.js
// Admin panel client-side JavaScript
// Requirements: 10.10, 10.11, 10.12, 14.6

(function () {
  'use strict';

  // ── Unread badge polling ───────────────────────────────────────────────
  var badge = document.getElementById('unread-badge');

  function updateUnreadBadge() {
    fetch('/api/unread-count')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!badge) return;
        var count = data.count || 0;
        badge.textContent = count;
        if (count > 0) {
          badge.classList.remove('d-none');
          badge.setAttribute('aria-label', count + ' unread messages');
        } else {
          badge.classList.add('d-none');
          badge.setAttribute('aria-label', '0 unread messages');
        }
      })
      .catch(function () {
        // Silently ignore errors — badge stays as-is
      });
  }

  // Run once on page load, then poll every 30 seconds
  updateUnreadBadge();
  setInterval(updateUnreadBadge, 30000);

  // ── Delete confirmation ────────────────────────────────────────────────
  // Intercept any form with data-confirm attribute and show a confirm dialog
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var confirmMsg = form.getAttribute('data-confirm');
    if (confirmMsg && !window.confirm(confirmMsg)) {
      e.preventDefault();
    }
  });

  // ── Theme toggle ───────────────────────────────────────────────────────
  var themeBtn = document.getElementById('theme-toggle');
  var iconSun  = document.getElementById('icon-sun');
  var iconMoon = document.getElementById('icon-moon');

  /**
   * Sync sun/moon icon visibility to the current theme.
   * Sun icon is shown in dark mode (click to switch to light).
   * Moon icon is shown in light mode (click to switch to dark).
   */
  function syncAdminThemeIcons() {
    var isDark = document.documentElement.classList.contains('dark');
    if (iconSun)  iconSun.classList.toggle('d-none', !isDark);
    if (iconMoon) iconMoon.classList.toggle('d-none', isDark);
  }

  // Sync icons on initial load
  syncAdminThemeIcons();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      // Prefer the global toggleTheme from theme.js if available
      if (typeof toggleTheme === 'function') {
        toggleTheme();
      } else {
        // Fallback: manual toggle without localStorage persistence
        var isDark = document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', !isDark);
        try {
          localStorage.setItem('theme', isDark ? 'light' : 'dark');
        } catch (e) {
          // localStorage not available — continue without persisting
        }
      }
      syncAdminThemeIcons();
    });
  }

})();
