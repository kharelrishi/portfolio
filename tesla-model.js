// Tesla revenue & gross-profit forecast — a faithful JavaScript port of the Excel model
// ("Tesla Case Study", base date Dec 2020). All money in USD millions.
(function (root) {
  const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];
  const FIRST_FCST = 5; // index of 2020

  // Actual deliveries 2015–2019 (Tesla reports)
  const ACT = {
    m3: [0, 0, 1764, 146055, 300815],
    sx: [50580, 76230, 101312, 98865, 66385],
  };
  // Average prices ($) from the "Average Prices" sheet
  const PRICE = { m3: 54156.67, sx: 102052.5, my: 61000, rd: 225000, pk: 58400, se: 175000 };
  // Gross margin by model: historic Tesla automotive GP% for Model 3 / S&X; comparables for new models
  const GPM = { m3: 0.2234439, sx: 0.2234439, my: 0.1564153, rd: 0.4409654, pk: 0.1564153, se: 0.2021558 };
  // Historic automotive revenue & gross profit 2015–2019 ($M, from the 10-K input sheet)
  const AUTO_REV_ACT = [3740.973, 6350.766, 9641.300, 18514.983, 20821.000];
  const AUTO_GP_ACT = [917.671, 1600.685, 2208.596, 4340.986, 4423.000];
  const ENERGY_REV_ACT = [305.052, 649.366, 2117.451, 2946.285, 3757.000];
  const ENERGY_GROWTH_BASE = [0.18, 0.12, 0.08, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06];
  const INFLATION = 0.02; // best/worst case spread on Energy growth
  const SCEN = { worst: 0.98, base: 1.0, best: 1.02 }; // price factor on automotive revenue
  const ENERGY_GP = { worst: -0.02, base: 0.0, best: 0.02 };

  // Growth ladder after a model's first two ramp years: g1 for 2 years, g2 for 2 years, g3 onwards
  const DEFAULTS = { g1: 0.10, g2: 0.08, g3: 0.04, scenario: "base" };

  function compute(p) {
    p = Object.assign({}, DEFAULTS, p || {});
    const { g1, g2, g3 } = p;
    const n = YEARS.length, z = () => new Array(n).fill(0);
    const d = { m3: z(), sx: z(), my: z(), rd: z(), pk: z(), se: z() };
    for (let i = 0; i < 5; i++) { d.m3[i] = ACT.m3[i]; d.sx[i] = ACT.sx[i]; }
    // Model 3: +60% in 2020, then g1, g1, g2, g2, g3...
    const m3g = [0.60, g1, g1, g2, g2, g3, g3, g3, g3, g3];
    for (let k = 0; k < 10; k++) d.m3[5 + k] = d.m3[4 + k] * (1 + m3g[k]);
    // Model S/X: mature, g3 every year
    for (let k = 0; k < 10; k++) d.sx[5 + k] = d.sx[4 + k] * (1 + g3);
    // Model Y follows Model 3's launch curve, three years later
    const m3HistG = [ACT.m3[3] / ACT.m3[2] - 1, ACT.m3[4] / ACT.m3[3] - 1]; // 2018, 2019 ramp
    const myg = [m3HistG[0], m3HistG[1], 0.60, g1, g1, g2, g2, g3, g3];
    d.my[5] = ACT.m3[2];
    for (let k = 0; k < 9; k++) d.my[6 + k] = d.my[5 + k] * (1 + myg[k]);
    // Roadster: 500 units in 2022, doubling, +50%, then the ladder
    d.rd[7] = 500;
    const rdg = [1.0, 0.5, g1, g1, g2, g2, g3];
    for (let k = 0; k < 7; k++) d.rd[8 + k] = d.rd[7 + k] * (1 + rdg[k]);
    // Pickup & Semi: 250 units in 2021, then Model 3's launch ramp, then the ladder
    const newg = [m3HistG[0], m3HistG[1], 0.60, g1, g1, g2, g2, g3];
    for (const key of ["pk", "se"]) {
      d[key][6] = 250;
      for (let k = 0; k < 8; k++) d[key][7 + k] = d[key][6 + k] * (1 + newg[k]);
    }
    const models = Object.keys(d);
    const total = z().map((_, i) => models.reduce((s, m) => s + d[m][i], 0));

    const f = SCEN[p.scenario] || 1;
    const rev = {}, gp = {};
    for (const m of models) {
      rev[m] = d[m].map((v, i) => i < FIRST_FCST ? null : v * PRICE[m] * f / 1e6);
      gp[m] = rev[m].map(v => v == null ? null : v * GPM[m]);
    }
    const autoRev = z().map((_, i) => i < FIRST_FCST ? AUTO_REV_ACT[i] : models.reduce((s, m) => s + rev[m][i], 0));
    const autoGP = z().map((_, i) => i < FIRST_FCST ? AUTO_GP_ACT[i] : models.reduce((s, m) => s + gp[m][i], 0));
    const eAdj = p.scenario === "best" ? INFLATION : p.scenario === "worst" ? -INFLATION : 0;
    const energyRev = z();
    for (let i = 0; i < n; i++) energyRev[i] = i < FIRST_FCST ? ENERGY_REV_ACT[i] : energyRev[i - 1] * (1 + ENERGY_GROWTH_BASE[i - FIRST_FCST] + eAdj);
    const energyGP = energyRev.map((v, i) => i < FIRST_FCST ? null : v * ENERGY_GP[p.scenario]);
    return { years: YEARS, firstForecast: FIRST_FCST, deliveries: d, total, autoRev, autoGP, energyRev, energyGP, params: p };
  }

  const api = { compute, YEARS, DEFAULTS, PRICE, GPM,
    // Reported deliveries after the model was built (Tesla quarterly reports / SEC 8-K)
    ACTUAL_LATER: { 2020: 499550, 2021: 936172, 2022: 1313851, 2023: 1808581, 2024: 1789226, 2025: 1636129 } };
  if (typeof module !== "undefined") module.exports = api; else root.TeslaModel = api;
})(this);
