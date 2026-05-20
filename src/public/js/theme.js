// src/public/js/theme.js
// Theme_Controller — manages dark/light mode preference
// Requirements: 14.1, 14.2, 14.3, 14.4, 14.5

(function () {
  /**
   * Safely read a value from localStorage.
   * Returns null if localStorage is unavailable (e.g. private browsing, security restrictions).
   * @returns {string|null}
   */
  function getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  }

  /**
   * Safely write a value to localStorage.
   * Silently continues if localStorage is unavailable.
   * @param {string} theme - 'dark' or 'light'
   */
  function setStoredTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // localStorage not available — continue without persisting preference
    }
  }

  // Apply theme immediately on script execution to prevent flash of wrong theme.
  // Default to 'dark' if no preference is stored (dark-mode-first per AGENTS.md).
  var storedTheme = getStoredTheme();
  var theme = storedTheme !== null ? storedTheme : 'dark';

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  /**
   * Toggle between dark and light mode.
   * Switches the 'dark' class on <html> and persists the new preference to localStorage.
   * Safe to call even when localStorage is unavailable — the class toggle still works.
   */
  window.toggleTheme = function () {
    var isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setStoredTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      setStoredTheme('dark');
    }
  };
})();
