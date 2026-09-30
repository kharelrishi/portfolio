// Portfolio interactions: mobile nav, active section link, report tabs, lazy Power BI embed,
// page lightbox and gentle scroll reveals. Everything works (and is visible) without JS.
(function () {
  const PBI_URL = "https://app.powerbi.com/view?r=eyJrIjoiMGZmODIwZmUtZTc1Ni00MDdiLWE4OWMtOGU0OTI3YjRiNDEyIiwidCI6Ijc1NmI0YzhkLWIwNjktNDg3NS05NmJlLWZhNWEwNWE0N2I3YiIsImMiOjh9";

  const root = document.documentElement;
  const L = (en, de) => '<span data-l="en">' + en + '</span><span data-l="de" lang="de">' + de + '</span>';
  const lang = () => (root.getAttribute("data-lang") === "de" ? "de" : "en");
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // ---- Language (EN / DE) ----
  function applyLang(lg) {
    root.setAttribute("data-lang", lg);
    root.lang = lg;
    const title = document.querySelector("title");
    if (title && title.dataset[lg]) document.title = title.dataset[lg];
    document.querySelectorAll("img[data-alt-de]").forEach(img => {
      if (!img.dataset.altEn) img.dataset.altEn = img.alt;
      img.alt = lg === "de" ? img.dataset.altDe : img.dataset.altEn;
    });
    document.querySelectorAll("[data-set-lang]").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.setLang === lg)));
    document.dispatchEvent(new Event("rk:lang"));
  }
  document.querySelectorAll("[data-set-lang]").forEach(b => b.addEventListener("click", () => {
    applyLang(b.dataset.setLang);
    save("rk-lang", b.dataset.setLang);
    // keep ?lang= in the address bar in sync so shared links open in the same language
    try {
      const u = new URL(location.href);
      if (u.searchParams.has("lang")) { u.searchParams.set("lang", b.dataset.setLang); history.replaceState(null, "", u); }
    } catch (e) {}
  }));
  applyLang(lang());

  // ---- Theme (dark / light) ----
  const themeBtn = document.getElementById("themeToggle");
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  function applyTheme(th) {
    root.setAttribute("data-theme", th);
    if (metaTheme) metaTheme.content = th === "light" ? "#f5f2ea" : "#0b1524";
    if (themeBtn) themeBtn.setAttribute("aria-pressed", String(th === "light"));
  }
  if (themeBtn) themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    save("rk-theme", next);
  });
  applyTheme(root.getAttribute("data-theme") || "dark");
  // Follow the system setting live, unless the visitor chose a theme themselves
  if (window.matchMedia) {
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onChange = e => { let saved = null; try { saved = localStorage.getItem("rk-theme"); } catch (x) {} if (!saved) applyTheme(e.matches ? "light" : "dark"); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
  }

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
      toggle.innerHTML = open ? L("Menu", "Menü") : L("Close", "Schließen");
    });
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      links.dataset.open = "false";
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = L("Menu", "Menü");
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
    iframe.title = lang() === "de" ? "Sales Performance Dashboard — interaktiver Power-BI-Bericht" : "Sales Performance Dashboard — interactive Power BI report";
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
      cap.textContent = (lang() === "de" && b.dataset.captionDe) ? b.dataset.captionDe : (b.dataset.caption || "");
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
