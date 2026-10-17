// VOLFAI tanıtım sayfası: Master Tool ?theme=dark|light parametresini uygular (CSP: harici betik)
(function () {
  try {
    var q = new URLSearchParams(location.search);
    var theme = q.get('theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
    var lang = q.get('lang');
    if (lang) document.documentElement.setAttribute('data-lang', lang);
    // HEMEN OYNA bağlantısına parametreleri aktar
    var play = document.getElementById('play');
    if (play && location.search) play.href = play.getAttribute('href') + location.search;
  } catch (e) { /* yok say */ }
})();
