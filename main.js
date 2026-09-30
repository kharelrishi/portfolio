// Portfolio interactions: mobile nav, active section link, report tabs, lazy Power BI embed,
// page lightbox and gentle scroll reveals. Everything works (and is visible) without JS.
(function () {
  const PBI_URL = "https://app.powerbi.com/view?r=eyJrIjoiMGZmODIwZmUtZTc1Ni00MDdiLWE4OWMtOGU0OTI3YjRiNDEyIiwidCI6Ijc1NmI0YzhkLWIwNjktNDg3NS05NmJlLWZhNWEwNWE0N2I3YiIsImMiOjh9";

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.dataset.open === "true";
      links.dataset.open = String(!open);
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.textContent = open ? "Menu" : "Close";
    });
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      links.dataset.open = "false";
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    }));
  }

  // Active nav link while scrolling
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const sections = navAnchors.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navAnchors.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => spy.observe(s));
  }

  // Report viewer tabs
  const tabs = Array.from(document.querySelectorAll(".viewer-tab"));
  tabs.forEach(tab => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", e => {
      const i = tabs.indexOf(tab);
      if (e.key === "ArrowRight") { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
  });
  function select(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }

  // Power BI embed — loaded on demand so the page stays fast
  function loadEmbed(frame) {
    if (!frame || frame.querySelector("iframe")) return;
    const iframe = document.createElement("iframe");
    iframe.src = PBI_URL;
    iframe.title = "Sales Performance Dashboard — interactive Power BI report";
    iframe.setAttribute("allowfullscreen", "true");
    iframe.loading = "lazy";
    frame.innerHTML = "";
    frame.appendChild(iframe);
  }
  document.querySelectorAll("[data-load-embed], #loadEmbed").forEach(btn => {
    btn.addEventListener("click", () => loadEmbed(btn.closest(".embed-frame")));
  });

  // Lightbox for report pages
  const lb = document.getElementById("lightbox");
  if (lb) {
    const img = document.getElementById("lbImg");
    const cap = document.getElementById("lbCap");
    let items = [], idx = 0, lastFocus = null;
    const show = i => {
      idx = (i + items.length) % items.length;
      const b = items[idx];
      img.src = b.dataset.full;
      img.alt = b.querySelector("img").alt;
      cap.textContent = b.dataset.caption || "";
    };
    document.querySelectorAll("[data-full]").forEach(btn => {
      btn.addEventListener("click", () => {
        items = Array.from(btn.closest(".gallery, .page-gallery").querySelectorAll("[data-full]"));
        lastFocus = btn;
        show(items.indexOf(btn));
        lb.hidden = false;
        document.body.style.overflow = "hidden";
        lb.querySelector(".lb-close").focus();
      });
    });
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
    lb.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    document.addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
  }

  // Scroll reveal (content is already visible if this never runs)
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(el => io.observe(el));
    // Anything already on screen at load shows immediately
    requestAnimationFrame(() => reveals.forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in");
    }));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }
})();
