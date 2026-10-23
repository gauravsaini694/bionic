/* Bionic — Grow page application form -> Google Apps Script (sheet tab "Grow Applications" + email)
   Markup needed on the <form>:
     id="growForm"  data-endpoint="<Apps Script /exec URL>"  data-thankyou="/thank-you/" (optional)
   Fields used: first-name, last-name, email, phone, position, location, resume (file), hp_g7x (honeypot) */
(function () {
  var form = document.getElementById('growForm');
  if (!form) return;
  var endpoint = form.getAttribute('data-endpoint');
  var started = Date.now();
  var busy = false;
  // spinner + disabled look for the submit button (scoped to this form)
  var css = document.createElement('style');
  css.textContent = '#growForm [type=submit]:disabled{opacity:.75;cursor:not-allowed}' +
    '#growForm .is-loading{display:inline-flex;align-items:center;justify-content:center;gap:10px}' +
    '#growForm .is-loading::before{content:"";width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:gf-spin .7s linear infinite}' +
    '@keyframes gf-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(css);
  function lock(on, text) {
    var btn = form.querySelector('[type="submit"]');
    busy = on;
    if (!btn) return;
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    btn.textContent = on ? (text || 'Sending…') : btn.dataset.label;
  }
  var MAX_MB = 5;
  var OK_EXT = ['pdf', 'doc', 'docx', 'rtf', 'txt'];

  var msg = form.querySelector('.form-status');
  if (!msg) {
    msg = document.createElement('p');
    msg.className = 'form-status';
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    form.appendChild(msg);
  }
  function say(text, ok) {
    msg.textContent = text;
    msg.style.color = ok ? 'var(--accent-hover,#6f9a37)' : '#c62828';
  }
  function val(n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; }
  function readFile(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1] || ''); };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (busy) return;                       // ignore double clicks / Enter while sending
    if (!form.reportValidity()) return;
    if (!endpoint) { say('Form is not configured yet. Please call us at 1-855-524-6642.'); return; }

    var body = new URLSearchParams({
      form: 'grow',
      first_name: val('first-name'),
      last_name: val('last-name'),
      email: val('email'),
      phone: val('phone'),
      position: val('position'),
      location: val('location'),
      hp_g7x: val('hp_g7x'),
      elapsed_ms: String(Date.now() - started),
      page_url: location.href.split('?')[0]
    });

    var fileEl = form.elements['resume'];
    var file = fileEl && fileEl.files && fileEl.files[0];
    if (file) {
      var ext = file.name.split('.').pop().toLowerCase();
      if (OK_EXT.indexOf(ext) === -1) { say('Resume must be a PDF, DOC, DOCX, RTF or TXT file.'); return; }
      if (file.size > MAX_MB * 1024 * 1024) { say('Resume must be smaller than ' + MAX_MB + ' MB.'); return; }
    }

    lock(true);
    say('', true);
    try {
      if (file) {
        body.append('resume_name', file.name);
        body.append('resume_type', file.type || '');
        body.append('resume_data', await readFile(file));
      }
      // same as the Contact form: no-cors POST (Google's redirect reply can't always be read by the browser,
      // but the row is saved). Field checks already happened in the browser above.
      await fetch(endpoint, { method: 'POST', mode: 'no-cors', body: body });
      var data = {};
      var ty = form.getAttribute('data-thankyou');
      if (ty) { lock(true, 'Sent ✓'); location.href = ty; return; }   // stays disabled while the thank-you page loads
      form.reset();
      say('Thank you! Your application was received' + (data.ref ? ' (ref ' + data.ref + ')' : '') + '. We will be in touch soon.', true);
      lock(false);
    } catch (err) {
      say((err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not send your application') +
          '. Please try again or call 1-855-524-6642.');
      lock(false);
    }
  });
})();
