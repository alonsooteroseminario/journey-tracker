// Returns a JS string injected into <head> before React hydrates.
// Reads localStorage["theme"] (or falls back to system preference),
// then sets the "dark" class on <html> so the first paint matches
// the stored preference — no white-flash on dark mode.
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'dark' || (stored !== 'light' && systemDark) ? 'dark' : 'light';
    var root = document.documentElement;
    if (resolved === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = resolved;
  } catch (e) {
    // localStorage may throw in private mode — render in light.
  }
})();
`;
