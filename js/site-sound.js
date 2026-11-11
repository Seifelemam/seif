/* ==========================================================================
   SITE SOUND — the round music button in the header.
   The music from the entrance keeps playing inside the site (softer, see IntroAudio.setMode); this button
   switches it on and off. If someone reloads the page or follows a link in the same session, the music
   resumes with their first tap, because browsers do not allow sound before that.
   ========================================================================== */
(function () {
  'use strict';
  var AU = window.IntroAudio, btn = document.getElementById('site-snd'), root = document.documentElement;
  if (!btn || !AU || !AU.supported) return;
  btn.hidden = false;

  function ss(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  var pending = ss('se-music') === '1' && ss('se-sound') !== 'off' && ss('se-intro') === 'done' && !root.classList.contains('has-entrance');

  function paint() {
    var live = AU.isPlaying() && AU.isOn();
    btn.setAttribute('aria-pressed', live ? 'true' : 'false');
    var u = btn.querySelector('use'); if (u) u.setAttribute('href', live ? '#i-sound' : '#i-mute');
    btn.classList.toggle('is-wait', pending && !AU.isPlaying());
  }
  btn.addEventListener('click', function () {
    pending = false;
    if (!AU.isPlaying()) {
      AU.setMode(root.classList.contains('has-entrance') ? 'intro' : 'site', 0.01);
      AU.setOn(true); AU.unlock(); AU.startMusic();
    } else AU.setOn(!AU.isOn());
    paint();
  });
  document.addEventListener('se-sound', paint);

  if (pending) {
    var resume = function (e) {
      if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Escape')) return;
      if (e.target && e.target.closest && e.target.closest('#site-snd')) return;
      document.removeEventListener('click', resume, true); document.removeEventListener('keydown', resume, true);
      pending = false;
      if (!AU.isPlaying() && AU.isOn()) { AU.setMode('site', 0.01); if (AU.unlock()) AU.startMusic(); }
      paint();
    };
    document.addEventListener('click', resume, true); document.addEventListener('keydown', resume, true);
  }
  paint();
})();
