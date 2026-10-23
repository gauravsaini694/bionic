(function () {
  var el = document.getElementById("state-map");
  var dataEl = document.getElementById("state-pins");
  if (!el || !dataEl) return;
  function init() {
    if (typeof L === "undefined") return;
    var pins = JSON.parse(dataEl.textContent);
    var map = L.map(el, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    function esc(s) { var d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }
    var markers = pins.map(function (c) {
      var dir = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(c.address || c.lat + "," + c.lng);
      return L.marker([c.lat, c.lng]).addTo(map).bindPopup(
        '<div class="clinic-popup"><strong><a href="' + esc(c.url) + '">' + esc(c.name) + '</a></strong><p>' + esc(c.address) +
        '</p><a class="clinic-popup-dir" href="' + dir + '" target="_blank" rel="noopener">Get Directions</a></div>');
    });
    if (pins.length === 1) map.setView([pins[0].lat, pins[0].lng], 13);
    else map.fitBounds(pins.map(function (c) { return [c.lat, c.lng]; }), { padding: [40, 40], maxZoom: 12 });

    document.querySelectorAll(".clinic-card[data-pin]").forEach(function (card) {
      var m = markers[+card.getAttribute("data-pin")];
      if (!m) return;
      card.addEventListener("mouseenter", function () { card.classList.add("is-hover"); });
      card.addEventListener("mouseleave", function () { card.classList.remove("is-hover"); });
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        map.setView(m.getLatLng(), 14); m.openPopup();
      });
    });
    if (pins.length === 1) markers[0].openPopup();
  }
  if (typeof L === "undefined") window.addEventListener("load", init); else init();
})();
