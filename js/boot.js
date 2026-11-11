/* Runs first (in <head>): decides language/direction and whether the entrance screen shows,
   so the page never flashes the wrong state. */
(function () {
  var d = document.documentElement;
  d.classList.remove('no-js'); d.classList.add('js');
  var lang = 'en', skip = false;
  try { lang = localStorage.getItem('se-lang') || 'en'; } catch (e) {}
  if (lang !== 'en' && lang !== 'de' && lang !== 'ar') lang = 'en';
  d.lang = lang; d.dir = lang === 'ar' ? 'rtl' : 'ltr';
  try { skip = sessionStorage.getItem('se-intro') === 'done'; } catch (e) {}
  if (location.hash && location.hash.length > 1) skip = true;          /* deep link: go straight to the content */
  if (/[?&]intro=0/.test(location.search)) skip = true;
  if (/[?&]intro=1/.test(location.search)) skip = false;               /* ?intro=1 always shows the entrance */
  d.classList.add(skip ? 'no-entrance' : 'has-entrance');
})();
