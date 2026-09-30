// Tesla Forecast Lab — wires the sliders and scenario buttons to TeslaModel and draws the charts.
(function () {
  const M = window.TeslaModel, V = window.Viz;
  if (!M || !V) return;
  const $ = id => document.getElementById(id);
  const L = (en, de) => ({ en, de });
  const tr = o => o[V.lang()];
  const pct = v => (v * 100).toLocaleString(V.loc(), { maximumFractionDigits: 1 }) + (V.lang() === "de" ? " %" : "%");

  const MODELS = [
    ["m3", "--s1", L("Model 3", "Model 3")],
    ["sx", "--s2", L("Model S / X", "Model S / X")],
    ["my", "--s3", L("Model Y", "Model Y")],
    ["rd", "--s4", L("Roadster", "Roadster")],
    ["pk", "--s5", L("Pickup (Cybertruck)", "Pickup (Cybertruck)")],
    ["se", "--s6", L("Semi", "Semi")],
  ];

  const state = Object.assign({}, M.DEFAULTS);
  let res = M.compute(state);
  const cats = M.YEARS.map(String);

  // ---- views: chart or table ----
  const views = {};
  function setupToggle(key) {
    const box = document.querySelector(`[data-view-for="${key}"]`);
    if (!box) return;
    views[key] = "chart";
    box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      views[key] = b.dataset.view;
      box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      $(key + "Chart").hidden = views[key] !== "chart";
      $(key + "Table").hidden = views[key] !== "table";
      if (views[key] === "chart") redraw[key]();
    }));
  }

  function table(head, rows) {
    return `<div class="table-wrap"><table><thead><tr>${head.map((h, i) => `<th${i ? ' class="num"' : ""}>${h}</th>`).join("")}</tr></thead><tbody>` +
      rows.map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ""}>${c}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>";
  }

  // ---- deliveries (stacked) ----
  function drawDeliv(c) {
    V.stacked(c, {
      cats, forecastFrom: res.firstForecast, height: 340,
      series: MODELS.map(([k, color, label]) => ({ color, label, values: res.deliveries[k] })),
      labelTotals: [4, 14], unit: L("cars", "Fahrzeuge"),
    });
  }
  function delivTable() {
    const head = [tr(L("Year", "Jahr")), ...MODELS.map(m => tr(m[2])), tr(L("Total", "Gesamt"))];
    const rows = cats.map((y, i) => [y + (i >= res.firstForecast ? " ·" + tr(L(" F", " P")) : ""),
      ...MODELS.map(([k]) => V.full(res.deliveries[k][i])), "<b>" + V.full(res.total[i]) + "</b>"]);
    $("delivTable").innerHTML = table(head, rows) + `<p class="ctrl-hint" style="margin-top:8px">${tr(L("F = forecast. 2015–2019 are reported deliveries.", "P = Prognose. 2015–2019 sind berichtete Auslieferungen."))}</p>`;
  }

  // ---- revenue & gross profit (grouped) ----
  const REV = [
    ["autoRev", "--s1", L("Automotive revenue", "Automobilumsatz")],
    ["autoGP", "--s3", L("Automotive gross profit", "Bruttogewinn Automobil")],
    ["energyRev", "--s4", L("Energy &amp; other revenue", "Umsatz Energie &amp; Sonstiges")],
  ];
  function drawRev(c) {
    V.grouped(c, {
      cats, forecastFrom: res.firstForecast, height: 320, fmt: { prefix: "$" },
      series: REV.map(([k, color, label]) => ({ color, label, values: res[k].map(v => v * 1e6) })),
      extraTip: i => `<div class="viz-tip-total">${tr(L("Gross margin", "Bruttomarge"))}<b>${pct(res.autoGP[i] / res.autoRev[i])}</b></div>`,
    });
  }
  function revTable() {
    const head = [tr(L("Year", "Jahr")), ...REV.map(r => tr(r[2]).replace("&amp;", "&")), tr(L("Auto GM", "Bruttomarge Auto"))];
    const rows = cats.map((y, i) => [y, ...REV.map(([k]) => V.compact(res[k][i] * 1e6, { prefix: "$" })), pct(res.autoGP[i] / res.autoRev[i])]);
    $("revTable").innerHTML = table(head, rows);
  }

  // ---- reality check (lines) ----
  const base = M.compute(M.DEFAULTS);
  const RY = [2020, 2021, 2022, 2023, 2024, 2025];
  function drawReal(c) {
    V.lines(c, {
      cats: RY.map(String), height: 290,
      series: [
        { color: "--s1", label: L("My model (base case, Dec 2020)", "Mein Modell (Basisfall, Dez. 2020)"), values: RY.map(y => base.total[y - 2015]), dashed: true },
        { color: "--s2", label: L("Actual deliveries (Tesla reports)", "Tatsächliche Auslieferungen (Tesla-Berichte)"), values: RY.map(y => M.ACTUAL_LATER[y]) },
      ],
      extraTip: i => { const y = RY[i], d = base.total[y - 2015] / M.ACTUAL_LATER[y] - 1;
        return `<div class="viz-tip-total">${tr(L("Model vs actual", "Modell vs. Ist"))}<b>${d > 0 ? "+" : ""}${pct(d)}</b></div>`; },
    });
  }
  function realTable() {
    const head = [tr(L("Year", "Jahr")), tr(L("Model (base)", "Modell (Basis)")), tr(L("Actual", "Ist")), tr(L("Difference", "Abweichung"))];
    const rows = RY.map(y => { const m = base.total[y - 2015], a = M.ACTUAL_LATER[y], d = m / a - 1;
      return [String(y), V.full(m), V.full(a), `<span class="delta ${d >= 0 ? "pos" : "neg"}">${d > 0 ? "+" : ""}${pct(d)}</span>`]; });
    $("realTable").innerHTML = table(head, rows);
  }

  const redraw = {
    deliv: () => { if (views.deliv !== "table") drawDeliv($("delivChart")); delivTable(); },
    rev: () => { if (views.rev !== "table") drawRev($("revChart")); revTable(); },
    real: () => { if (views.real !== "table") drawReal($("realChart")); realTable(); },
  };

  function readout() {
    const i = 14, cagr = Math.pow(res.total[i] / res.total[4], 1 / 10) - 1;
    $("roDeliv").textContent = V.compact(res.total[i]);
    $("roRev").textContent = V.compact(res.autoRev[i] * 1e6, { prefix: "$" });
    $("roGM").textContent = pct(res.autoGP[i] / res.autoRev[i]);
    $("roCagr").textContent = pct(cagr);
  }

  function update() {
    res = M.compute(state);
    ["g1", "g2", "g3"].forEach(k => {
      $(k).value = Math.round(state[k] * 100);
      $(k + "Out").textContent = "+" + Math.round(state[k] * 100) + (V.lang() === "de" ? " %" : "%");
    });
    document.querySelectorAll("[data-scen]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.scen === state.scenario)));
    redraw.deliv(); redraw.rev(); readout();
  }

  ["g1", "g2", "g3"].forEach(k => $(k).addEventListener("input", e => { state[k] = +e.target.value / 100; update(); }));
  document.querySelectorAll("[data-scen]").forEach(b => b.addEventListener("click", () => { state.scenario = b.dataset.scen; update(); }));
  $("labReset").addEventListener("click", () => { Object.assign(state, M.DEFAULTS); update(); });

  ["deliv", "rev", "real"].forEach(setupToggle);
  // one registration each: re-runs on resize and on language change
  V.mount($("lab"), update);
  V.mount($("realChart"), () => redraw.real());
})();
