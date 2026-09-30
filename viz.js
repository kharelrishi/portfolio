// Small, dependency-free SVG charts for the portfolio case studies.
// Colours come from CSS variables (--s1…--s8, --viz-*), so charts follow the light/dark theme.
// Charts re-render on resize and when the language changes (event "rk:lang").
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const lang = () => (document.documentElement.getAttribute("data-lang") === "de" ? "de" : "en");
  const loc = () => (lang() === "de" ? "de-DE" : "en-US");

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Compact number formatting: 1.9M / 1,9 Mio.
  function compact(v, opts) {
    opts = opts || {};
    const de = lang() === "de";
    const a = Math.abs(v);
    let s;
    if (a >= 1e9) s = (v / 1e9).toLocaleString(loc(), { maximumFractionDigits: 1 }) + (de ? " Mrd." : "B");
    else if (a >= 1e6) s = (v / 1e6).toLocaleString(loc(), { maximumFractionDigits: a >= 1e7 ? 0 : 1 }) + (de ? " Mio." : "M");
    else if (a >= 1e3) s = (v / 1e3).toLocaleString(loc(), { maximumFractionDigits: a >= 1e4 ? 0 : 1 }) + (de ? " Tsd." : "K");
    else s = v.toLocaleString(loc(), { maximumFractionDigits: 1 });
    return (opts.prefix || "") + s + (opts.suffix || "");
  }
  const full = v => Math.round(v).toLocaleString(loc());

  // "Nice" axis ticks
  function ticks(max, count) {
    if (max <= 0) return [0];
    const raw = max / count, pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) || raw;
    const out = [];
    for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
    if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
    return out;
  }

  // Shared tooltip
  let tip;
  function tooltip() {
    if (!tip) { tip = document.createElement("div"); tip.className = "viz-tip"; tip.hidden = true; document.body.appendChild(tip); }
    return tip;
  }
  function showTip(html, evt) {
    const t = tooltip(); t.innerHTML = html; t.hidden = false;
    const r = t.getBoundingClientRect();
    let x = evt.clientX + 14, y = evt.clientY + 14;
    if (x + r.width > innerWidth - 8) x = evt.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = evt.clientY - r.height - 14;
    t.style.left = x + "px"; t.style.top = y + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; }

  function frame(container, height) {
    container.innerHTML = "";
    const w = Math.max(280, container.clientWidth || 600);
    const narrow = w < 520;
    const m = { t: 18, r: 12, b: 30, l: narrow ? 46 : 60 };
    const svg = el("svg", { viewBox: `0 0 ${w} ${height}`, width: "100%", height, class: "viz-svg", role: "img" }, container);
    return { svg, w, h: height, m, iw: w - m.l - m.r, ih: height - m.t - m.b, narrow };
  }

  function yAxis(f, max, fmt) {
    const tk = ticks(max, f.narrow ? 4 : 5);
    const top = tk[tk.length - 1];
    const y = v => f.m.t + f.ih - (v / top) * f.ih;
    const g = el("g", { class: "viz-axis" }, f.svg);
    tk.forEach(v => {
      el("line", { x1: f.m.l, x2: f.w - f.m.r, y1: y(v), y2: y(v), class: v === 0 ? "viz-base" : "viz-grid" }, g);
      const t = el("text", { x: f.m.l - 8, y: y(v) + 4, "text-anchor": "end", class: "viz-tick" }, g);
      t.textContent = fmt(v);
    });
    return y;
  }

  function xLabels(f, cats, x, bw) {
    const g = el("g", { class: "viz-axis" }, f.svg);
    const every = f.iw / cats.length < 34 ? 2 : 1;
    cats.forEach((c, i) => {
      if (i % every && i !== cats.length - 1) return;
      const t = el("text", { x: x(i) + bw / 2, y: f.h - 10, "text-anchor": "middle", class: "viz-tick" }, g);
      t.textContent = c;
    });
  }

  // Shade the forecast part of a time axis
  function forecastBand(f, x, from, n, slot) {
    if (from == null || from >= n) return;
    const x0 = x(from) - (slot - 0) * 0.08;
    el("rect", { x: x0, y: f.m.t, width: f.w - f.m.r - x0, height: f.ih, class: "viz-fcst" }, f.svg);
    const t = el("text", { x: x0 + 6, y: f.m.t + 12, class: "viz-fcst-label" }, f.svg);
    t.textContent = lang() === "de" ? "Prognose →" : "Forecast →";
  }

  function legend(container, series) {
    const lg = document.createElement("div");
    lg.className = "viz-legend";
    lg.innerHTML = series.map(s => `<span><i style="background:var(${s.color})"></i>${s.label[lang()] || s.label}</span>`).join("");
    container.appendChild(lg);
  }

  // Stacked columns (e.g. deliveries by model)
  function stacked(container, cfg) {
    const f = frame(container, cfg.height || 340);
    const n = cfg.cats.length;
    const totals = cfg.cats.map((_, i) => cfg.series.reduce((s, se) => s + (se.values[i] || 0), 0));
    const y = yAxis(f, Math.max(...totals) * 1.04, v => compact(v, cfg.fmt));
    const slot = f.iw / n, bw = Math.min(24, slot * 0.62);
    const x = i => f.m.l + i * slot + (slot - bw) / 2;
    forecastBand(f, i => f.m.l + i * slot, cfg.forecastFrom, n, slot);
    const g = el("g", {}, f.svg);
    cfg.cats.forEach((c, i) => {
      let acc = 0;
      const segs = cfg.series.filter(s => (s.values[i] || 0) > 0);
      segs.forEach((s, k) => {
        const v = s.values[i]; const y0 = y(acc), y1 = y(acc + v);
        acc += v;
        const hgt = Math.max(0, y0 - y1 - (k > 0 ? 2 : 0)); // 2px surface gap between segments
        if (hgt <= 0.3) return;
        const isTop = k === segs.length - 1;
        if (isTop && hgt > 4) {
          const r = 4, x0 = x(i), yT = y1;
          el("path", { d: `M${x0},${yT + hgt} V${yT + r} Q${x0},${yT} ${x0 + r},${yT} H${x0 + bw - r} Q${x0 + bw},${yT} ${x0 + bw},${yT + r} V${yT + hgt} Z`,
            fill: `var(${s.color})`, class: i >= (cfg.forecastFrom ?? n) ? "viz-mark viz-fc" : "viz-mark" }, g);
        } else {
          el("rect", { x: x(i), y: y1, width: bw, height: hgt, fill: `var(${s.color})`, class: i >= (cfg.forecastFrom ?? n) ? "viz-mark viz-fc" : "viz-mark" }, g);
        }
      });
      if (cfg.labelTotals && cfg.labelTotals.includes(i)) {
        const t = el("text", { x: x(i) + bw / 2, y: y(totals[i]) - 6, "text-anchor": "middle", class: "viz-value" }, g);
        t.textContent = compact(totals[i], cfg.fmt);
      }
      const hit = el("rect", { x: f.m.l + i * slot, y: f.m.t, width: slot, height: f.ih, class: "viz-hit" }, g);
      const tipHtml = () => {
        const rows = cfg.series.filter(s => s.values[i]).slice().reverse()
          .map(s => `<div><i style="background:var(${s.color})"></i>${s.label[lang()] || s.label}<b>${full(s.values[i])}${cfg.unit ? " " + cfg.unit[lang()] : ""}</b></div>`).join("");
        const kind = i >= (cfg.forecastFrom ?? n) ? (lang() === "de" ? "Prognose" : "forecast") : (lang() === "de" ? "Ist" : "actual");
        return `<strong>${c} · ${kind}</strong>${rows}<div class="viz-tip-total">${lang() === "de" ? "Gesamt" : "Total"}<b>${full(totals[i])}</b></div>`;
      };
      hit.addEventListener("mousemove", e => showTip(tipHtml(), e));
      hit.addEventListener("mouseleave", hideTip);
    });
    xLabels(f, cfg.cats, x, bw);
    legend(container, cfg.series);
  }

  // Grouped columns (e.g. revenue and gross profit)
  function grouped(container, cfg) {
    const f = frame(container, cfg.height || 300);
    const n = cfg.cats.length, k = cfg.series.length;
    const max = Math.max(...cfg.series.flatMap(s => s.values.filter(v => v != null)));
    const minV = Math.min(0, ...cfg.series.flatMap(s => s.values.filter(v => v != null)));
    const y = yAxis(f, max * 1.05, v => compact(v, cfg.fmt));
    const slot = f.iw / n, bw = Math.min(16, (slot * 0.7 - 2 * (k - 1)) / k);
    const gx = i => f.m.l + i * slot + (slot - (bw * k + 2 * (k - 1))) / 2;
    forecastBand(f, i => f.m.l + i * slot, cfg.forecastFrom, n, slot);
    const g = el("g", {}, f.svg);
    cfg.cats.forEach((c, i) => {
      cfg.series.forEach((s, j) => {
        const v = s.values[i]; if (v == null) return;
        const x0 = gx(i) + j * (bw + 2), y0 = y(0), y1 = y(Math.max(0, v));
        const hgt = Math.max(0, y0 - y1);
        if (hgt > 4) {
          const r = 3;
          el("path", { d: `M${x0},${y0} V${y1 + r} Q${x0},${y1} ${x0 + r},${y1} H${x0 + bw - r} Q${x0 + bw},${y1} ${x0 + bw},${y1 + r} V${y0} Z`, fill: `var(${s.color})`, class: i >= (cfg.forecastFrom ?? n) ? "viz-mark viz-fc" : "viz-mark" }, g);
        } else el("rect", { x: x0, y: y1, width: bw, height: Math.max(1, hgt), fill: `var(${s.color})` }, g);
      });
      const hit = el("rect", { x: f.m.l + i * slot, y: f.m.t, width: slot, height: f.ih, class: "viz-hit" }, g);
      hit.addEventListener("mousemove", e => showTip(`<strong>${c}</strong>` + cfg.series.map(s => s.values[i] == null ? "" :
        `<div><i style="background:var(${s.color})"></i>${s.label[lang()]}<b>${compact(s.values[i], cfg.fmt)}</b></div>`).join("") +
        (cfg.extraTip ? cfg.extraTip(i) : ""), e));
      hit.addEventListener("mouseleave", hideTip);
    });
    if (cfg.labelLast) {
      cfg.series.forEach((s, j) => {
        const i = n - 1, v = s.values[i];
        const t = el("text", { x: gx(i) + j * (bw + 2) + bw / 2, y: y(v) - 6, "text-anchor": "middle", class: "viz-value" }, g);
        t.textContent = compact(v, cfg.fmt);
      });
    }
    xLabels(f, cfg.cats, i => gx(i), bw * k + 2 * (k - 1));
    legend(container, cfg.series);
  }

  // Lines with markers (e.g. forecast vs actual)
  function lines(container, cfg) {
    const f = frame(container, cfg.height || 300);
    const n = cfg.cats.length;
    const max = Math.max(...cfg.series.flatMap(s => s.values.filter(v => v != null)));
    const y = yAxis(f, max * 1.08, v => compact(v, cfg.fmt));
    const slot = f.iw / n;
    const x = i => f.m.l + i * slot + slot / 2;
    const g = el("g", {}, f.svg);
    cfg.series.forEach(s => {
      const pts = s.values.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
      el("path", { d: pts.map((p, i) => (i ? "L" : "M") + p[0] + "," + p[1]).join(""), fill: "none", stroke: `var(${s.color})`, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round", "stroke-dasharray": s.dashed ? "6 5" : null }, g);
      pts.forEach(p => el("circle", { cx: p[0], cy: p[1], r: 4.5, fill: `var(${s.color})`, stroke: "var(--viz-surface)", "stroke-width": 2 }, g));
      const last = pts[pts.length - 1];
      if (cfg.endLabels && last) {
        const t = el("text", { x: last[0] + 9, y: last[1] + 4, class: "viz-value" }, g);
        t.textContent = compact(s.values[s.values.length - 1], cfg.fmt);
      }
    });
    const cross = el("line", { y1: f.m.t, y2: f.m.t + f.ih, class: "viz-cross", visibility: "hidden" }, g);
    cfg.cats.forEach((c, i) => {
      const hit = el("rect", { x: f.m.l + i * slot, y: f.m.t, width: slot, height: f.ih, class: "viz-hit" }, g);
      hit.addEventListener("mousemove", e => {
        cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
        showTip(`<strong>${c}</strong>` + cfg.series.map(s => s.values[i] == null ? "" :
          `<div><i style="background:var(${s.color})"></i>${s.label[lang()]}<b>${full(s.values[i])}</b></div>`).join("") + (cfg.extraTip ? cfg.extraTip(i) : ""), e);
      });
      hit.addEventListener("mouseleave", () => { hideTip(); cross.setAttribute("visibility", "hidden"); });
    });
    xLabels(f, cfg.cats, i => x(i) - 0.5, 1);
    legend(container, cfg.series);
  }

  // Re-render registry
  const charts = [];
  function mount(container, draw) {
    const run = () => { if (container.isConnected) draw(container); };
    charts.push(run); run();
    return run;
  }
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => charts.forEach(r => r()), 150); });
  document.addEventListener("rk:lang", () => charts.forEach(r => r()));

  window.Viz = { stacked, grouped, lines, mount, compact, full, lang, loc };
})();
