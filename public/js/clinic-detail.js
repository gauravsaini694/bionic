(function () {
  /* ---------- map ---------- */
  var mapEl = document.getElementById("clinic-detail-map");
  function initMap() {
    if (!mapEl || typeof L === "undefined") return;
    var lat = parseFloat(mapEl.dataset.lat), lng = parseFloat(mapEl.dataset.lng);
    if (isNaN(lat) || isNaN(lng)) return;
    var map = L.map(mapEl, { scrollWheelZoom: false }).setView([lat, lng], 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    function esc(s) { var d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }
    L.marker([lat, lng]).addTo(map).bindPopup(
      '<div class="clinic-popup"><strong>' + esc(mapEl.dataset.name) + '</strong><p>' + esc(mapEl.dataset.address) + '</p>' +
      (mapEl.dataset.dir ? '<a class="clinic-popup-dir" href="' + esc(mapEl.dataset.dir) + '" target="_blank" rel="noopener">Get Directions</a>' : "") + '</div>'
    ).openPopup();
  }
  if (typeof L === "undefined") window.addEventListener("load", initMap); else initMap();

  /* ---------- hours: highlight today + Open Now badge ---------- */
  var table = document.getElementById("clinic-hours");
  var badge = document.getElementById("clinic-open-badge");
  if (!table) return;
  var tz = table.dataset.tz || undefined;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function nowInTz() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: DAYS.indexOf(o.weekday), min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function mins(t) { var p = t.split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function fmt(t) {
    var p = t.split(":"), h = parseInt(p[0], 10), ap = h >= 12 ? "PM" : "AM";
    return ((h % 12) || 12) + ":" + p[1] + " " + ap;
  }

  var rows = {};
  table.querySelectorAll("tr[data-day]").forEach(function (r) { rows[r.dataset.day] = r; });
  var now = nowInTz();
  var today = rows[now.day];
  if (today) {
    today.classList.add("is-today");
    var tag = document.createElement("span");
    tag.className = "cl-today-tag"; tag.textContent = "Today";
    today.querySelector("th").appendChild(tag);
  }
  if (!badge) return;

  var open = false, text = "";
  if (today && today.dataset.open && now.min >= mins(today.dataset.open) && now.min < mins(today.dataset.close)) {
    open = true; text = "Open Now · Closes " + fmt(today.dataset.close);
  } else {
    var label = "";
    if (today && today.dataset.open && now.min < mins(today.dataset.open)) {
      label = "today " + fmt(today.dataset.open);
    } else {
      for (var i = 1; i <= 7 && !label; i++) {
        var d = (now.day + i) % 7, r = rows[d];
        if (r && r.dataset.open) label = (i === 1 ? "tomorrow" : DAYS[d]) + " " + fmt(r.dataset.open);
      }
    }
    text = "Closed" + (label ? " · Opens " + label : "");
  }
  badge.textContent = text;
  badge.classList.add(open ? "is-open" : "is-closed");
  badge.hidden = false;
})();
