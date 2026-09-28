(function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

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
    var toggle = item.querySelector(".nav-link-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = item.classList.contains("is-open");
      dropdowns.forEach(function (other) {
        other.classList.remove("is-open");
        var otherToggle = other.querySelector(".nav-link-toggle");
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
      var toggle = item.querySelector(".nav-link-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  });
})();
