/* Bionic — blog post reading path (TOC scrollspy + progress) and 2-step consultation form */
(function () {
  var body = document.querySelector('.article-body');
  var toc = document.querySelector('.pr-toc');

  /* ---------------- reading path ---------------- */
  if (body && toc) {
    var nav = toc.querySelector('nav') || toc;
    var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
    var items = links.map(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      return { a: a, li: a.parentElement, h: document.getElementById(id) };
    }).filter(function (x) { return x.h; });
    var tops = [].slice.call(nav.querySelectorAll(':scope > ul > li'));
    var leftEl = toc.querySelector('.pr-left');
    var minutes = parseInt((leftEl && leftEl.textContent) || '0', 10) || 0;
    var stepEl = toc.querySelector('.pr-step');
    var pctEl = toc.querySelector('.pr-pct');
    var rings = [].slice.call(document.querySelectorAll('.pr-ring-fill'));
    var pill = document.querySelector('.pr-pill');
    var pillTitle = pill && pill.querySelector('.pr-pill-title');
    var sheet = document.querySelector('.pr-sheet');
    var OFFSET = 140, ticking = false, lastActive = null;
    var C = 2 * Math.PI * 15.5;
    rings.forEach(function (r) { r.style.strokeDasharray = C; r.style.strokeDashoffset = C; });

    // the block that belongs to each top-level item ends where the next top-level heading starts
    function topHeading(li) { var a = li.querySelector(':scope > a'); return a && document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); }

    function update() {
      ticking = false;
      var br = body.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (OFFSET - br.top) / Math.max(1, br.height - vh + OFFSET)));
      var pct = Math.round(p * 100);
      rings.forEach(function (r) { r.style.strokeDashoffset = C * (1 - p); });
      if (pctEl) pctEl.textContent = pct + '%';

      var active = null;
      items.forEach(function (x) { if (x.h.getBoundingClientRect().top - OFFSET <= 1) active = x; });

      // per-chapter fill for the rail
      var activeTop = -1;
      tops.forEach(function (li, i) {
        var h = topHeading(li); if (!h) return;
        var next = tops[i + 1] && topHeading(tops[i + 1]);
        var start = h.getBoundingClientRect().top - OFFSET;
        var end = next ? next.getBoundingClientRect().top - OFFSET : br.bottom - vh;
        var f = start > 0 ? 0 : Math.min(1, -start / Math.max(1, end - start));
        if (p >= 0.995) f = 1;
        li.style.setProperty('--fill', f.toFixed(3));
        li.classList.toggle('is-done', f >= 0.999);
        var inside = start <= 1 && (!next || end > 1);
        li.classList.toggle('is-open', inside);
        if (inside) activeTop = i;
      });

      if (active !== lastActive) {
        links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        if (active) {
          active.a.classList.add('is-active'); active.a.setAttribute('aria-current', 'location');
          var list = toc.querySelector('nav > ul');
          if (list && list.scrollHeight > list.clientHeight) {
            var t = active.a.offsetTop - list.offsetTop - list.clientHeight / 3;
            list.scrollTo({ top: t, behavior: 'smooth' });
          }
        }
        lastActive = active;
      }
      var title = active ? active.a.textContent.trim() : 'Start reading';
      if (stepEl) stepEl.textContent = activeTop >= 0 ? ('Section ' + (activeTop + 1) + ' of ' + tops.length) : 'Start reading';
      if (leftEl && minutes) leftEl.textContent = p >= 0.995 ? 'Finished' : Math.max(1, Math.ceil(minutes * (1 - p))) + ' min left';
      if (pillTitle) pillTitle.textContent = p >= 0.995 ? 'You finished this article' : title;
      if (pill) {
        var show = window.innerWidth <= 1024 && br.top < vh * 0.5 && br.bottom > vh * 0.6;
        pill.hidden = !show;
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    /* mobile sheet */
    if (pill && sheet) {
      var sb = sheet.querySelector('.pr-sheet-body');
      function openSheet(o) {
        if (o) { sb.innerHTML = ''; sb.appendChild(nav.cloneNode(true)); }
        sheet.hidden = !o; pill.setAttribute('aria-expanded', o ? 'true' : 'false');
        document.documentElement.classList.toggle('pr-lock', o);
      }
      pill.addEventListener('click', function () { openSheet(sheet.hidden); });
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet || e.target.closest('.pr-sheet-close') || e.target.closest('a')) openSheet(false);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) openSheet(false); });
    }
  }

  /* ---------------- image zoom ---------------- */
  if (body) {
    body.addEventListener('click', function (e) {
      var img = e.target.closest('img');
      if (!img || img.closest('a')) return;
      var box = document.createElement('div');
      box.className = 'pr-zoom';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-label', img.alt || 'Image');
      box.innerHTML = '<button type="button" aria-label="Close">×</button>';
      var big = document.createElement('img');
      big.src = img.currentSrc || img.src; big.alt = img.alt || '';
      box.appendChild(big);
      function close() { box.remove(); document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('pr-lock'); }
      function onKey(ev) { if (ev.key === 'Escape') close(); }
      box.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      document.documentElement.classList.add('pr-lock');
      document.body.appendChild(box);
      box.querySelector('button').focus();
    });
  }

  /* ---------------- 2-step form ---------------- */
  var form = document.getElementById('pr-form');
  if (!form) return;
  var started = Date.now();
  var steps = [].slice.call(form.querySelectorAll('.pr-fs'));
  var dots = [].slice.call(form.querySelectorAll('.pr-steps li'));
  var msg = form.querySelector('.pr-msg');
  function say(t, ok) { msg.textContent = t; msg.className = 'pr-msg' + (t ? (ok ? ' is-ok' : ' is-err') : ''); }
  function go(n) {
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    dots.forEach(function (d, i) { d.classList.toggle('is-on', i <= n); });
    var f = steps[n].querySelector('input,select,textarea'); if (f) f.focus({ preventScroll: true });
  }
  function valid(fs) {
    var bad = [].slice.call(fs.querySelectorAll('input,select,textarea')).filter(function (el) { return !el.checkValidity(); });
    if (bad.length) { bad[0].reportValidity(); return false; }
    return true;
  }
  form.querySelector('.pr-next').addEventListener('click', function () { if (valid(steps[0])) { say(''); go(1); } });
  form.querySelector('.pr-back').addEventListener('click', function () { go(0); });
  steps[0].addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); form.querySelector('.pr-next').click(); }
  });

  var busy = false;
  function lock(on, text) {
    var btn = form.querySelector('[type="submit"]');
    var back = form.querySelector('.pr-back');
    busy = on;
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    btn.textContent = on ? (text || 'Sending…') : btn.dataset.label;
    if (back) back.disabled = on;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (busy) return;                       // ignore double clicks / Enter while sending
    if (!valid(steps[0])) { go(0); return; }
    if (!valid(steps[1])) return;
    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) { say('Form is not set up yet. Please call us at 1-855-524-6642.'); return; }
    var data = new URLSearchParams(new FormData(form));
    data.set('form', 'blog');
    data.set('elapsed_ms', String(Date.now() - started));
    data.set('page_url', location.href.split('#')[0].split('?')[0]);
    // Same as the Contact page form: reference number, kept for the Thank You page (sessionStorage only)
    var now = new Date();
    data.set('ref_id', 'BPO-' + String(now.getFullYear()).slice(2) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) +
      '-' + Math.random().toString(36).slice(2, 6).toUpperCase());
    var summary = { _ts: Date.now() };
    data.forEach(function (v, k) { if (k !== 'hp_b3q' && k !== 'elapsed_ms' && k !== 'form') summary[k] = v; });
    try { sessionStorage.setItem('bionicSubmission', JSON.stringify(summary)); } catch (x) {}
    lock(true); say('');
    try {
      // same as the Contact form: no-cors POST (Google's redirect reply can't always be read by the browser,
      // but the row is saved). Field checks already happened in the browser above.
      await fetch(endpoint, { method: 'POST', mode: 'no-cors', body: data });
      var ty = form.getAttribute('data-thankyou');
      if (ty) { lock(true, 'Sent ✓'); location.href = ty; return; }   // stays disabled while the thank-you page loads
      form.reset(); go(0);
      say('Thank you! We will call you within one business day.', true);
      lock(false);
    } catch (err) {
      say((err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not send') + '. Please try again or call 1-855-524-6642.');
      lock(false);
    }
  });
})();
