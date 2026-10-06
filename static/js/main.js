(function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    // stagger siblings (max 6 steps) unless a card already carries its own --delay
    var counts = new Map();
    revealEls.forEach(function (el) {
      var n = counts.get(el.parentNode) || 0;
      counts.set(el.parentNode, n + 1);
      if (!el.style.getPropertyValue("--delay")) el.style.setProperty("--delay", Math.min(n, 6) * 0.08 + "s");
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
    // safety net: never leave anything half-faded (items near the page bottom or taller than the viewport)
    var pending = false;
    var sweep = function () {
      pending = false;
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      revealEls.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        if (atBottom || el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      });
    };
    var schedule = function () { if (!pending) { pending = true; requestAnimationFrame(sweep); } };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  document.querySelectorAll("details.faq-item").forEach(function (d) {
    var s = d.querySelector("summary");
    if (!s) return;
    s.setAttribute("aria-expanded", d.open ? "true" : "false");
    d.addEventListener("toggle", function () { s.setAttribute("aria-expanded", d.open ? "true" : "false"); });
  });

  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      mainNav.classList.toggle("is-open");
    });
  }

  var dropdowns = document.querySelectorAll(".has-dropdown");
  dropdowns.forEach(function (item) {
    var toggle = item.querySelector(".nav-link-toggle, .dropdown-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = item.classList.contains("is-open");
      dropdowns.forEach(function (other) {
        other.classList.remove("is-open");
        var otherToggle = other.querySelector(".nav-link-toggle, .dropdown-toggle");
        if (otherToggle) otherToggle.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", function () {
    dropdowns.forEach(function (item) {
      item.classList.remove("is-open");
      var toggle = item.querySelector(".nav-link-toggle, .dropdown-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-carousel]").forEach(function (track) {
    var wrap = track.parentNode;
    var step = function (dir) {
      var card = track.firstElementChild;
      if (!card) return;
      track.scrollBy({ left: dir * (card.getBoundingClientRect().width + 22), behavior: prefersReducedMotion ? "auto" : "smooth" });
    };
    var prev = wrap.querySelector("[data-carousel-prev]"), next = wrap.querySelector("[data-carousel-next]");
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
  });

  document.querySelectorAll("[data-copy-link]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-copy-link");
      var done = function () { btn.setAttribute("aria-label", "Link copied"); btn.classList.add("is-copied"); setTimeout(function () { btn.setAttribute("aria-label", "Copy link"); btn.classList.remove("is-copied"); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done); else { window.prompt("Copy this link", url); }
    });
  });
})();
