// Applies a saved light/dark theme before first paint to avoid a flash.
// Inlined into index.html at build time; its hash is added to the CSP.
try {
  var s = JSON.parse(localStorage.getItem('vitalslab:v1:settings') || '{}')
  if (s.theme === 'light' || s.theme === 'dark')
    document.documentElement.setAttribute('data-theme', s.theme)
} catch (e) {
  /* storage blocked: fall back to the system theme */
}
