// Runs before styles/Angular to avoid flashing the wrong theme on a saved dark visit.
// Keep the preference rule and key in sync with ThemeService.
(function () {
  var preference;
  try { preference = localStorage.getItem('clinica-theme'); } catch (_) {}
  var mode = preference === 'light' || preference === 'dark'
    ? preference
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.colorScheme = mode;
})();
