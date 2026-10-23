/* Bionic — Grow page application form -> Google Apps Script (sheet tab "Grow Applications" + email)
   Markup needed on the <form>:
     id="growForm"  data-endpoint="<Apps Script /exec URL>"  data-thankyou="/thank-you/" (optional)
   Fields used: first-name, last-name, email, phone, position, location, resume (file), hp_g7x (honeypot) */
(function () {
  var form = document.getElementById('growForm');
  if (!form) return;
  var endpoint = form.getAttribute('data-endpoint');
  var started = Date.now();
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
    if (!form.reportValidity()) return;
    if (!endpoint) { say('Form is not configured yet. Please call us at 1-855-524-6642.'); return; }

    var btn = form.querySelector('[type="submit"]');
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

    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
    say('', true);
    try {
      if (file) {
        body.append('resume_name', file.name);
        body.append('resume_type', file.type || '');
        body.append('resume_data', await readFile(file));
      }
      var r = await fetch(endpoint, { method: 'POST', body: body });
      var data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Something went wrong');
      var ty = form.getAttribute('data-thankyou');
      if (ty) { location.href = ty; return; }
      form.reset();
      say('Thank you! Your application was received' + (data.ref ? ' (ref ' + data.ref + ')' : '') + '. We will be in touch soon.', true);
    } catch (err) {
      say((err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not send your application') +
          '. Please try again or call 1-855-524-6642.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Submit'; }
    }
  });
})();
