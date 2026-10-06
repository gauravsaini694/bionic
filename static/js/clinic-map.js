(function () {
  var el = document.getElementById("clinic-map");
  if (!el) return;

  var form = document.getElementById("clinic-search-form");
  var input = document.getElementById("clinic-search");
  var locateBtn = document.getElementById("clinic-locate");
  var resultsEl = document.getElementById("clinic-results");
  var link = document.getElementById("clinic-map-state-link");
  var cards = document.querySelectorAll(".state-card");
  var NEAREST = 5, MAX_MILES = 300;

  var map, all, userMarker, clinics = [], markers = [], activeState = null;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : s;
    return d.innerHTML;
  }
  function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
  function hasCoords(c) { return typeof c.lat === "number" && typeof c.lng === "number"; }
  function dirUrl(c) {
    return "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(c.address || (c.lat + "," + c.lng));
  }
  function miles(a, b) {
    var R = 3958.8, r = Math.PI / 180;
    var dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  /* ---------- map ---------- */
  function buildMap() {
    map = L.map(el, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    all = L.featureGroup().addTo(map);
    clinics.forEach(function (c) {
      if (!hasCoords(c)) return;
      var m = L.marker([c.lat, c.lng]).bindPopup(
        '<div class="clinic-popup"><strong><a href="' + esc(c.url) + '">' + esc(c.name) + '</a></strong>' +
        '<p>' + esc(c.address) + '</p>' +
        '<a class="clinic-popup-dir" href="' + dirUrl(c) + '" target="_blank" rel="noopener">Get Directions</a></div>'
      );
      c._marker = m;
      m.addTo(all);
      markers.push(m);
    });
    if (all.getLayers().length) map.fitBounds(all.getBounds(), { padding: [30, 30] });
    else map.setView([39.5, -98.35], 4);
  }

  function highlight(list) {
    var set = list ? list.map(function (c) { return c._marker; }).filter(Boolean) : null;
    markers.forEach(function (m) {
      var on = !set || set.indexOf(m) !== -1;
      m.setOpacity(on ? 1 : 0.35);
      m.setZIndexOffset(set && on ? 1000 : 0);
    });
  }
  function fit(list, extra) {
    var pts = list.filter(hasCoords).map(function (c) { return [c.lat, c.lng]; });
    if (extra) pts.push([extra.lat, extra.lng]);
    if (!pts.length) return;
    if (pts.length === 1) map.setView(pts[0], 11);
    else map.fitBounds(pts, { padding: [40, 40], maxZoom: 11 });
  }

  /* ---------- state cards ---------- */
  function selectState(state) {
    activeState = state;
    cards.forEach(function (c) {
      var on = c.getAttribute("data-state") === state;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (state) {
      var list = clinics.filter(function (c) { return c.state === state; });
      highlight(list);
      fit(list);
      link.textContent = "View all " + state + " clinics →";
      link.href = list.length ? list[0].stateUrl : "/locations/";
      link.hidden = false;
    } else {
      highlight(null);
      if (all.getLayers().length) map.fitBounds(all.getBounds(), { padding: [30, 30] });
      link.hidden = true;
    }
  }

  /* ---------- results ---------- */
  function clearUser() { if (userMarker) { map.removeLayer(userMarker); userMarker = null; } }

  function showResults(title, list, opts) {
    opts = opts || {};
    var html = '<div class="clinic-results-head"><strong>' + esc(title) + '</strong>' +
      '<button type="button" class="clinic-results-reset">Show all clinics</button></div>';
    if (!list.length) {
      html += '<p class="clinic-results-empty">' + esc(opts.empty || "No clinics found.") + '</p>' +
        '<p class="clinic-results-empty-sub">Try a different ZIP, city or state, or <a href="/contact/">contact us</a> and we’ll connect you with the closest care.</p>';
    } else {
      html += '<ul class="clinic-results-list">' + list.map(function (c, i) {
        return '<li class="clinic-result" data-i="' + i + '">' +
          '<div class="clinic-result-top"><a class="clinic-result-name" href="' + esc(c.url) + '">' + esc(c.name) + ', ' + esc(c.state) + '</a>' +
          (c._dist != null ? '<span class="clinic-result-dist">' + c._dist.toFixed(1) + ' mi</span>' : '') + '</div>' +
          '<div class="clinic-result-addr">' + esc(c.address) + '</div>' +
          '<div class="clinic-result-actions">' +
          (c.phone ? '<a href="tel:' + esc(c.phone.replace(/[^\d+]/g, "")) + '">' + esc(c.phone) + '</a>' : '') +
          '<a href="' + dirUrl(c) + '" target="_blank" rel="noopener">Get Directions</a></div></li>';
      }).join("") + '</ul>';
    }
    resultsEl.innerHTML = html;
    resultsEl.hidden = false;
    resultsEl.querySelector(".clinic-results-reset").addEventListener("click", resetAll);
    resultsEl.querySelectorAll(".clinic-result").forEach(function (li) {
      li.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        var c = list[+li.getAttribute("data-i")];
        if (c && c._marker) { map.setView([c.lat, c.lng], 13); c._marker.openPopup(); }
      });
    });
    highlight(list.length ? list : []);
  }

  function resetAll() {
    clearUser();
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    input.value = "";
    selectState(null);
  }

  function nearest(origin, label) {
    var list = clinics.filter(hasCoords).map(function (c) {
      c._dist = miles(origin, c);
      return c;
    }).sort(function (a, b) { return a._dist - b._dist; }).filter(function (c) { return c._dist <= MAX_MILES; }).slice(0, NEAREST);
    selectState(null);
    clearUser();
    userMarker = L.circleMarker([origin.lat, origin.lng], {
      radius: 8, color: "#25318D", fillColor: "#93C251", fillOpacity: 1, weight: 3
    }).addTo(map).bindTooltip(label);
    showResults("Nearest clinics to " + label, list, { empty: "No clinics found within " + MAX_MILES + " miles of " + label + "." });
    fit(list, origin);
    clinics.forEach(function (c) { delete c._dist; });
  }

  function message(title, text) {
    selectState(null);
    clearUser();
    showResults(title, [], { empty: text });
  }

  /* ---------- search ---------- */
  function geocodeZip(zip) {
    var z = zip.slice(0, 5);
    return fetch("https://api.zippopotam.us/us/" + z)
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { return { lat: +j.places[0].latitude, lng: +j.places[0].longitude }; })
      .catch(function () {
        return fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&postalcode=" + z)
          .then(function (r) { return r.json(); })
          .then(function (j) { return j.length ? { lat: +j[0].lat, lng: +j[0].lon } : null; });
      });
  }

  function textSearch(q) {
    var n = q.toLowerCase().replace(/\s+/g, " ").trim();
    var abbr = n.length === 2 ? new RegExp(",\\s*" + n + "\\b", "i") : null;
    var list = clinics.filter(function (c) {
      var s = c.state.toLowerCase();
      if (n.length <= 2) return s === n || (abbr && abbr.test(c.address));
      return s.indexOf(n) === 0 || c.city.toLowerCase().indexOf(n) !== -1 ||
        c.name.toLowerCase().indexOf(n) !== -1 || c.address.toLowerCase().indexOf(n) !== -1;
    });
    if (!list.length) {
      message("Search results", "No clinics found for “" + q + "”.");
      return;
    }
    var stateMatch = clinics.some(function (c) { return c.state.toLowerCase() === n; });
    if (stateMatch) selectState(list[0].state); else selectState(null);
    clearUser();
    showResults(list.length + (list.length === 1 ? " clinic" : " clinics") + " matching “" + q + "”", list);
    fit(list);
  }

  function onSubmit(e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) { resetAll(); return; }
    if (/^\d{5}(-\d{4})?$/.test(q)) {
      resultsEl.hidden = false;
      resultsEl.innerHTML = '<p class="clinic-results-empty-sub">Searching…</p>';
      geocodeZip(q).then(function (pt) {
        if (!pt) message("Search results", "No clinics found — we couldn’t locate ZIP " + q + ".");
        else nearest(pt, "ZIP " + q.slice(0, 5));
      }).catch(function () {
        message("Search results", "We couldn’t look up that ZIP code right now. Try a city or state instead.");
      });
    } else {
      textSearch(q);
    }
  }

  function onLocate() {
    if (!navigator.geolocation) {
      message("Search results", "Your browser doesn’t support location. Try searching by ZIP, city or state.");
      return;
    }
    locateBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(function (pos) {
      locateBtn.disabled = false;
      nearest({ lat: pos.coords.latitude, lng: pos.coords.longitude }, "your location");
    }, function () {
      locateBtn.disabled = false;
      message("Search results", "We couldn’t get your location. Allow location access or search by ZIP, city or state.");
    }, { timeout: 10000 });
  }

  /* ---------- init ---------- */
  function init(data) {
    clinics = data.clinics || [];
    buildMap();
    cards.forEach(function (c) {
      c.addEventListener("click", function () {
        var s = c.getAttribute("data-state");
        resultsEl.hidden = true; clearUser();
        selectState(activeState === s ? null : s);
      });
    });
    form.addEventListener("submit", onSubmit);
    locateBtn.addEventListener("click", onLocate);
  }

  function start() {
    fetch(el.getAttribute("data-src"))
      .then(function (r) { return r.json(); })
      .then(init)
      .catch(function () { el.innerHTML = '<p class="clinic-results-empty-sub">Map is unavailable right now.</p>'; });
  }
  if (typeof L === "undefined") window.addEventListener("load", function () { if (typeof L !== "undefined") start(); });
  else start();
})();
