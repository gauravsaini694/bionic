(function () {
  var boxes = document.querySelectorAll(".clinic-qs");
  if (!boxes.length) return;

  var MAX = 8;
  var clinics = null, loading = null;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : s;
    return d.innerHTML;
  }

  // Fetched lazily, and only once for all search boxes on the page.
  function load() {
    if (clinics) return Promise.resolve(clinics);
    if (!loading) {
      loading = fetch("/locations/index.json")
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          clinics = (d.clinics || []).map(function (c) {
            c._name = String(c.name || "").toLowerCase();
            c._city = String(c.city || "").toLowerCase();
            c._state = String(c.state || "").toLowerCase();
            c._zip = String(c.zip || "").toLowerCase();
            c._addr = String(c.address || "").toLowerCase();
            return c;
          });
          return clinics;
        })
        .catch(function () { loading = null; clinics = null; return []; });
    }
    return loading;
  }

  function score(c, q) {
    if (c._name.indexOf(q) === 0) return 0;
    if (c._city.indexOf(q) === 0) return 1;
    if (c._state.indexOf(q) === 0) return 2;
    if (c._zip.indexOf(q) === 0) return 3;
    if (c._name.indexOf(q) !== -1 || c._city.indexOf(q) !== -1) return 4;
    if (c._state.indexOf(q) !== -1 || c._zip.indexOf(q) !== -1) return 5;
    if (c._addr.indexOf(q) !== -1) return 6;
    return -1;
  }

  function search(list, q) {
    var out = [];
    list.forEach(function (c) {
      var s = score(c, q);
      if (s >= 0) out.push({ c: c, s: s });
    });
    out.sort(function (a, b) { return a.s - b.s || (a.c.name > b.c.name ? 1 : -1); });
    return out.slice(0, MAX).map(function (x) { return x.c; });
  }

  boxes.forEach(function (box, n) {
    var input = box.querySelector(".clinic-qs-input");
    var list = box.querySelector(".clinic-qs-results");
    var active = -1;
    var token = 0;
    var listId = "clinic-qs-results-" + n;
    list.id = listId;
    input.setAttribute("aria-controls", listId);

    // main.js closes every dropdown on any document click; keep clicks inside the search box from reaching it.
    box.addEventListener("click", function (e) { e.stopPropagation(); });

    function items() { return list.querySelectorAll("li[data-url]"); }

    function setActive(i) {
      var els = items();
      if (!els.length) { active = -1; input.removeAttribute("aria-activedescendant"); return; }
      active = (i + els.length) % els.length;
      els.forEach(function (el, k) {
        var on = k === active;
        el.classList.toggle("is-active", on);
        el.setAttribute("aria-selected", on ? "true" : "false");
      });
      var cur = els[active];
      input.setAttribute("aria-activedescendant", cur.id);
      if (cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
    }

    function hide() {
      list.hidden = true;
      list.textContent = "";
      active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function render(results, q) {
      list.textContent = "";
      active = -1;
      if (!results.length) {
        var none = document.createElement("li");
        none.className = "clinic-qs-empty";
        none.textContent = "No clinics found for “" + q + "”";
        list.appendChild(none);
      } else {
        results.forEach(function (c, i) {
          var li = document.createElement("li");
          li.id = listId + "-" + i;
          li.setAttribute("role", "option");
          li.setAttribute("aria-selected", "false");
          li.setAttribute("data-url", c.url);
          var a = document.createElement("a");
          a.href = c.url;
          a.className = "clinic-qs-item";
          var name = document.createElement("strong");
          name.textContent = c.name;
          var meta = document.createElement("span");
          meta.textContent = [c.address, c.city, c.state, c.zip].filter(function (x, k, arr) {
            return x && arr.indexOf(x) === k && !(k > 0 && String(arr[0]).toLowerCase().indexOf(String(x).toLowerCase()) !== -1);
          }).join(", ");
          a.appendChild(name);
          a.appendChild(meta);
          li.appendChild(a);
          li.addEventListener("mousemove", function () { if (active !== i) setActive(i); });
          list.appendChild(li);
        });
      }
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function run() {
      var q = input.value.trim().toLowerCase();
      var my = ++token;
      if (!q) { hide(); return; }
      load().then(function (data) {
        if (my !== token) return; // a newer keystroke superseded this one
        render(search(data, q), input.value.trim());
      });
    }

    input.addEventListener("focus", load);
    input.addEventListener("input", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (!list.hidden) setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (!list.hidden) setActive(active < 0 ? -1 : active - 1); }
      else if (e.key === "Enter") {
        var els = items();
        var cur = active >= 0 ? els[active] : (els.length === 1 ? els[0] : null);
        if (cur) { e.preventDefault(); window.location.href = cur.getAttribute("data-url"); }
      } else if (e.key === "Escape") {
        if (input.value || !list.hidden) { e.preventDefault(); e.stopPropagation(); input.value = ""; token++; hide(); }
      }
    });
  });

  // Focus the search box as soon as the dropdown is opened (click/tap on the trigger).
  document.querySelectorAll(".has-dropdown").forEach(function (item) {
    var input = item.querySelector(".clinic-qs-input");
    if (!input) return;
    new MutationObserver(function () {
      if (item.classList.contains("is-open")) setTimeout(function () { input.focus(); }, 40);
    }).observe(item, { attributes: true, attributeFilter: ["class"] });
  });
})();
