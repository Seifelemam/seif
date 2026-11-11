/* ==========================================================================
   CONTACT FORM — validation, spam protection and real delivery.
   The page is static (GitHub Pages), so the message is posted to a form service:
   FormSubmit (default, uses CONFIG.email) or Formspree (CONFIG.form.endpoint).
   A success message is shown ONLY when the service confirms that it accepted the message.
   Everything else is reported honestly: not connected, waiting for activation, rejected, offline.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.App, CFG = window.CONFIG || {}, F = CFG.form || {};
  if (!A) return;
  var form = A.$('#contact-form'); if (!form) return;
  var t = A.t, el = A.el;

  var fields = {
    name: { input: A.$('#f-name'), err: A.$('#e-name') },
    email: { input: A.$('#f-email'), err: A.$('#e-email') },
    subject: { input: A.$('#f-subject'), err: A.$('#e-subject') },
    message: { input: A.$('#f-message'), err: A.$('#e-message') },
    consent: { input: A.$('#f-consent'), err: A.$('#e-consent') }
  };
  var honey = A.$('#f-honey'), sendBtn = A.$('#f-send'), sendLabel = A.$('#f-send-label'), statusEl = A.$('#form-status');
  var consentText = A.$('#consent-text'), privacyEl = A.$('#form-privacy');
  var provider = F.provider === 'formspree' ? 'formspree' : 'formsubmit';
  var providerName = F.providerName || (provider === 'formspree' ? 'Formspree' : 'FormSubmit');
  var minMs = Math.max(0, +F.minSeconds || 0) * 1000, coolMs = Math.max(0, +F.cooldownSeconds || 0) * 1000;
  var COOL_KEY = 'se-form-last';
  var loadedAt = Date.now(), sending = false;
  var errKeys = {}, statusKey = '', statusState = '';

  /* ---------------- text that depends on the language ---------------- */
  var TOKEN = '\u0001';
  function renderStatic() {
    var raw = t('form.consent', { provider: providerName, link: TOKEN }), parts = raw.split(TOKEN);
    A.clear(consentText);
    consentText.appendChild(document.createTextNode(parts[0]));
    if (parts.length > 1) {
      consentText.appendChild(el('a', { href: 'legal.html#datenschutz', target: '_blank', rel: 'noopener', text: t('form.consent.link') }));
      consentText.appendChild(document.createTextNode(parts.slice(1).join('')));
    }
    privacyEl.textContent = t('form.privacy', { provider: providerName });
    Object.keys(errKeys).forEach(function (k) { if (errKeys[k]) fields[k].err.textContent = t(errKeys[k]); });
    if (statusKey) statusEl.textContent = t(statusKey);
    if (sending) sendLabel.textContent = t('form.sending');
  }

  /* ---------------- validation ---------------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function rule(name) {
    var f = fields[name], v = f.input.value.trim();
    if (name === 'name') return v.length < 2 ? 'form.err.name' : '';
    if (name === 'email') return !v ? 'form.err.email' : (!EMAIL.test(v) ? 'form.err.email2' : '');
    if (name === 'message') return v.length < 5 ? 'form.err.message' : '';
    if (name === 'consent') return f.input.checked ? '' : 'form.err.consent';
    return '';
  }
  function show(name, key) {
    var f = fields[name]; errKeys[name] = key;
    f.err.textContent = key ? t(key) : '';
    if (key) f.input.setAttribute('aria-invalid', 'true'); else f.input.removeAttribute('aria-invalid');
  }
  function validate() {
    var first = null;
    ['name', 'email', 'message', 'consent'].forEach(function (n) {
      var k = rule(n); show(n, k); if (k && !first) first = fields[n].input;
    });
    return first;
  }
  ['name', 'email', 'message'].forEach(function (n) {
    fields[n].input.addEventListener('blur', function () { if (fields[n].input.value.trim() || errKeys[n]) show(n, rule(n)); });
    fields[n].input.addEventListener('input', function () { if (errKeys[n] && !rule(n)) show(n, ''); });
  });
  fields.consent.input.addEventListener('change', function () { if (errKeys.consent && !rule('consent')) show('consent', ''); });

  /* ---------------- status ---------------- */
  function setStatus(key, state) {
    statusKey = key; statusState = state || '';
    statusEl.textContent = key ? t(key) : '';
    if (state) statusEl.setAttribute('data-state', state); else statusEl.removeAttribute('data-state');
  }
  function busy(on) {
    sending = on; sendBtn.disabled = on; sendBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    sendLabel.textContent = on ? t('form.sending') : t('form.send');
  }

  /* ---------------- sending ---------------- */
  function lastSent() { try { return +sessionStorage.getItem(COOL_KEY) || 0; } catch (e) { return 0; } }
  function markSent() { try { sessionStorage.setItem(COOL_KEY, String(Date.now())); } catch (e) {} }
  function clean(s) { return String(s).replace(/[\r\n]+/g, ' ').trim(); }

  function payload() {
    var name = fields.name.input.value.trim(), subject = fields.subject.input.value.trim();
    var o = {
      name: name,
      email: fields.email.input.value.trim(),
      subject: subject || '(no subject)',
      message: fields.message.input.value.trim(),
      consent: 'Agreed to data processing via ' + providerName + ' on ' + new Date().toISOString()
    };
    var subj = 'Portfolio message from ' + clean(name) + (subject ? ': ' + clean(subject) : '');
    o._subject = subj.slice(0, 150);
    if (provider === 'formspree') o._gotcha = honey.value;
    else { o._honey = honey.value; o._template = 'table'; o._captcha = 'false'; }
    return o;
  }

  /* Reads the service's answer. Returns 'ok' | 'pending' | 'fail'. */
  function judge(res, data) {
    var msg = data && (data.message || data.error || '') || '';
    if (provider === 'formspree') return res.ok && data && data.ok === true ? 'ok' : 'fail';
    if (/activat/i.test(msg)) return 'pending';          /* FormSubmit: the address must be confirmed once */
    var yes = data && (data.success === true || data.success === 'true');
    return res.ok && yes ? 'ok' : 'fail';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    setStatus('', '');
    var bad = validate();
    if (bad) { bad.focus(); return; }
    if (honey.value) { setStatus('form.fail', 'error'); return; }
    if (Date.now() - loadedAt < minMs || (coolMs && Date.now() - lastSent() < coolMs)) { setStatus('form.wait', 'error'); return; }
    if (!F.endpoint) { setStatus('form.noendpoint', 'pending'); return; }

    busy(true);
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 20000) : 0;
    fetch(F.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload()),
      signal: ctl ? ctl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) { return judge(res, data); });
    }).then(function (verdict) {
      if (verdict === 'ok') {
        form.reset(); Object.keys(fields).forEach(function (n) { show(n, ''); });
        markSent(); loadedAt = Date.now();
        setStatus('form.ok', 'ok');
      } else if (verdict === 'pending') setStatus('form.pending', 'pending');
      else setStatus('form.fail', 'error');
    }).catch(function () {
      setStatus('form.net', 'error');
    }).then(function () {
      clearTimeout(timer); busy(false);
    });
  });

  renderStatic();
  A.onLang(renderStatic);
})();
