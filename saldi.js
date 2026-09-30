// Saldi ledger player — steps through the 15 transactions of FY2015 and keeps the balance sheet balanced.
(function () {
  const $ = id => document.getElementById(id);
  const lang = () => (document.documentElement.getAttribute("data-lang") === "de" ? "de" : "en");
  const loc = () => (lang() === "de" ? "de-DE" : "en-US");
  const L = (en, de) => ({ en, de });
  const tr = o => (typeof o === "string" ? o : o[lang()]);
  const money = (v, d) => {
    d = d == null ? 1 : d;
    const s = Math.abs(v).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d });
    return (v < 0 ? "−" : "") + (lang() === "de" ? s + " Mio. $" : "$" + s + "M");
  };

  // Balance-sheet accounts ($ millions). Colour = series slot; liabilities are grouped for the bar.
  const ASSETS = [
    ["cash", "--s1", L("Cash", "Kasse &amp; Bank")],
    ["inv", "--s2", L("Inventory", "Vorräte")],
    ["ar", "--s3", L("Receivables", "Forderungen")],
    ["fa", "--s4", L("Fixed assets", "Anlagevermögen")],
  ];
  const LIABS = [
    ["tp", "--s5", L("Trade payables", "Lieferantenverbindl.")],
    ["emp", "--s5", L("Owed to staff", "Verbindl. ggü. Mitarbeitern")],
    ["ol", "--s5", L("Other liabilities (incl. tax)", "Sonstige Verbindl. (inkl. Steuer)")],
    ["prov", "--s5", L("Provisions", "Rückstellungen")],
    ["debt", "--s6", L("Bank loan", "Bankdarlehen")],
    ["eq", "--s7", L("Equity", "Eigenkapital")],
  ];
  const OPEN = { cash: 65, inv: 32, ar: 18, fa: 150, tp: 20, emp: 0, ol: 15, prov: 0, debt: 140, eq: 90 };
  const NAMES = {};
  ASSETS.concat(LIABS).forEach(a => (NAMES[a[0]] = a[2]));
  Object.assign(NAMES, {
    rev: L("Revenue", "Umsatzerlöse"), orev: L("Other income (rent)", "Sonstige Erträge (Miete)"),
    da: L("Depreciation", "Abschreibungen"), pers: L("Personnel costs", "Personalaufwand"), serv: L("Services", "Dienstleistungen"),
    cogs: L("Cost of goods sold", "Materialaufwand"), log: L("Logistics costs", "Logistikkosten"), util: L("Utilities", "Energie &amp; Nebenkosten"),
    int: L("Interest", "Zinsaufwand"), provx: L("Provision expense", "Aufwand für Rückstellungen"), opex: L("Other operating costs", "Sonstige betriebliche Aufwendungen"),
    tax: L("Income tax", "Ertragsteuern"), shares: L("Equity — share capital", "Eigenkapital — gezeichnetes Kapital"),
  });
  const PL_INCOME = ["rev", "orev"];

  // dr / cr: [account, amount]; bs: change per balance-sheet account; profit-and-loss lines hit equity.
  const TX = [
    { t: L("New shares issued", "Kapitalerhöhung"), d: L("Saldi issues 10 million new shares at $3 each and receives $30M in cash.", "Saldi gibt 10 Mio. neue Aktien zu je 3 $ aus und erhält 30 Mio. $ in bar."),
      dr: [["cash", 30]], cr: [["shares", 30]], bs: { cash: 30, eq: 30 } },
    { t: L("New machines, and a year of depreciation", "Neue Maschinen und ein Jahr Abschreibung"), d: L("Buys $80M of fixed assets in cash. Depreciation for the year is $20M: $15M on the old assets and $5M on the new ones.", "Kauft Anlagen für 80 Mio. $ in bar. Die Jahresabschreibung beträgt 20 Mio. $: 15 Mio. auf die alten und 5 Mio. auf die neuen Anlagen."),
      dr: [["fa", 80], ["da", 20]], cr: [["cash", 80], ["fa", 20]], bs: { fa: 60, cash: -80, eq: -20 } },
    { t: L("Salaries", "Gehälter"), d: L("Personnel costs are $12.5M. $10M is paid; $2.5M is still owed to staff at year end.", "Der Personalaufwand beträgt 12,5 Mio. $. 10 Mio. werden gezahlt, 2,5 Mio. schuldet Saldi den Mitarbeitern zum Jahresende noch."),
      dr: [["pers", 12.5]], cr: [["cash", 10], ["emp", 2.5]], bs: { cash: -10, emp: 2.5, eq: -12.5 } },
    { t: L("External services", "Fremdleistungen"), d: L("Services worth $5.5M, paid in cash.", "Dienstleistungen über 5,5 Mio. $, bar bezahlt."),
      note: L("The transactions are yearly totals, not in date order — that is why cash dips just below zero here.", "Die Buchungen sind Jahressummen, nicht nach Datum sortiert — deshalb fällt die Kasse hier knapp unter null."),
      dr: [["serv", 5.5]], cr: [["cash", 5.5]], bs: { cash: -5.5, eq: -5.5 } },
    { t: L("Sales", "Umsatz"), d: L("Sales of $524.4M. Customers pay $509.0M during the year and owe the other $15.5M.", "Umsatz von 524,4 Mio. $. Kunden zahlen im Jahr 509,0 Mio. und schulden die übrigen 15,5 Mio."),
      dr: [["cash", 508.964], ["ar", 15.485]], cr: [["rev", 524.449]], bs: { cash: 508.964, ar: 15.485, eq: 524.449 } },
    { t: L("Raw materials bought", "Rohstoffeinkauf"), d: L("Buys $240M of raw materials: $230M paid, $10M on supplier credit.", "Kauft Rohstoffe für 240 Mio. $: 230 Mio. bezahlt, 10 Mio. auf Lieferantenkredit."),
      dr: [["inv", 240]], cr: [["cash", 230], ["tp", 10]], bs: { inv: 240, cash: -230, tp: 10 } },
    { t: L("Other direct costs", "Sonstige direkte Kosten"), d: L("$32.45M of other production costs, paid in cash.", "32,45 Mio. $ sonstige Produktionskosten, bar bezahlt."),
      dr: [["cogs", 32.45]], cr: [["cash", 32.45]], bs: { cash: -32.45, eq: -32.45 } },
    { t: L("Materials used in production", "Materialverbrauch in der Produktion"), d: L("$238M of stock goes into products that were sold. $34M of raw materials is left at year end.", "Bestand für 238 Mio. $ geht in verkaufte Produkte. 34 Mio. $ Rohstoffe bleiben zum Jahresende übrig."),
      dr: [["cogs", 238]], cr: [["inv", 238]], bs: { inv: -238, eq: -238 } },
    { t: L("Rent received", "Mieteinnahmen"), d: L("Saldi rents out space and receives $2M.", "Saldi vermietet Flächen und erhält 2 Mio. $."),
      dr: [["cash", 2]], cr: [["orev", 2]], bs: { cash: 2, eq: 2 } },
    { t: L("Logistics", "Logistik"), d: L("Transport and warehousing cost $35M, paid in cash.", "Transport und Lagerung kosten 35 Mio. $, bar bezahlt."),
      dr: [["log", 35]], cr: [["cash", 35]], bs: { cash: -35, eq: -35 } },
    { t: L("Utilities", "Energie und Nebenkosten"), d: L("Utilities cost $10M: $9.5M paid, $0.5M still open.", "Nebenkosten von 10 Mio. $: 9,5 Mio. bezahlt, 0,5 Mio. noch offen."),
      dr: [["util", 10]], cr: [["cash", 9.5], ["tp", 0.5]], bs: { cash: -9.5, tp: 0.5, eq: -10 } },
    { t: L("Loan repayment and interest", "Tilgung und Zinsen"), d: L("Repays $20M of the $140M loan and pays 4% interest ($5.6M) on the opening balance.", "Tilgt 20 Mio. $ des 140-Mio.-Darlehens und zahlt 4 % Zinsen (5,6 Mio. $) auf den Anfangsbestand."),
      dr: [["debt", 20], ["int", 5.6]], cr: [["cash", 25.6]], bs: { cash: -25.6, debt: -20, eq: -5.6 } },
    { t: L("Provision for a risk", "Rückstellung für ein Risiko"), d: L("Sets aside $3M for an expected future cost. No cash moves yet.", "Bildet 3 Mio. $ für erwartete künftige Kosten. Noch fließt kein Geld."),
      dr: [["provx", 3]], cr: [["prov", 3]], bs: { prov: 3, eq: -3 } },
    { t: L("Other operating costs", "Sonstige Betriebskosten"), d: L("$35M of other costs: $30M paid, $5M still open.", "35 Mio. $ sonstige Kosten: 30 Mio. bezahlt, 5 Mio. noch offen."),
      dr: [["opex", 35]], cr: [["cash", 30], ["ol", 5]], bs: { cash: -30, ol: 5, eq: -35 } },
    { t: L("Income tax", "Ertragsteuer"), d: L("Tax at 15% of the $129.4M profit before tax: $19.4M, payable next year.", "Steuer von 15 % auf 129,4 Mio. $ Gewinn vor Steuern: 19,4 Mio. $, fällig im Folgejahr."),
      dr: [["tax", 19.40985]], cr: [["ol", 19.40985]], bs: { ol: 19.40985, eq: -19.40985 } },
  ];

  // Balance and P&L after n transactions
  function stateAt(n) {
    const b = Object.assign({}, OPEN);
    let inc = 0, exp = 0;
    for (let i = 0; i < n; i++) {
      const x = TX[i];
      for (const k in x.bs) b[k] += x.bs[k];
      x.dr.forEach(([a, v]) => { if (NAMES[a] && !(a in OPEN) && !PL_INCOME.includes(a)) exp += v; });
      x.cr.forEach(([a, v]) => { if (PL_INCOME.includes(a)) inc += v; });
    }
    return { b, inc, exp };
  }

  // Bars share one scale: the largest balance sheet during the year (mid-year, before stock is used up)
  let SCALE = 0;
  for (let n = 0; n <= 15; n++) { const b = stateAt(n).b; SCALE = Math.max(SCALE, ASSETS.reduce((t, a) => t + b[a[0]], 0)); }
  SCALE = Math.ceil(SCALE / 50) * 50;
  let step = 0, timer = null;

  function bar(el, items, b) {
    // group same-colour liabilities into one segment
    const groups = [];
    items.forEach(([k, c]) => {
      const g = groups.find(x => x.c === c);
      const v = Math.max(0, b[k]);
      if (g) g.v += v; else groups.push({ c, v });
    });
    el.innerHTML = groups.map(g => `<i style="background:var(${g.c});--v:${(g.v / SCALE) * 100}%"></i>`).join("");
  }

  function list(el, items, b, prev, total) {
    el.innerHTML = items.map(([k, c, name]) => {
      const chg = Math.abs(b[k] - prev[k]) > 1e-9;
      return `<li class="${chg ? "chg" : ""}"><i style="background:var(${c})"></i><span>${tr(name)}</span><b>${money(b[k])}</b></li>`;
    }).join("") + `<li class="total"><i></i><span>${lang() === "de" ? "Summe" : "Total"}</span><b>${money(total)}</b></li>`;
  }

  function render() {
    const s = stateAt(step), p = stateAt(Math.max(0, step - 1));
    const A = ASSETS.reduce((t, a) => t + s.b[a[0]], 0), E = LIABS.reduce((t, a) => t + s.b[a[0]], 0);
    bar($("barA"), ASSETS, s.b); bar($("barL"), LIABS, s.b);
    list($("listA"), ASSETS, s.b, step ? p.b : s.b, A); list($("listL"), LIABS, s.b, step ? p.b : s.b, E);
    $("bsBalanced").innerHTML = Math.abs(A - E) < 1e-6
      ? `✓ ${lang() === "de" ? "Bilanz ausgeglichen" : "Balanced"} · ${money(A)}` : `✗ ${money(A - E)}`;

    const card = $("txCard");
    if (step === 0) {
      card.innerHTML = `<span class="tx-n">${lang() === "de" ? "ERÖFFNUNGSBILANZ · 31.12.2014" : "OPENING BALANCE · 31 DEC 2014"}</span>
        <h3>${lang() === "de" ? "Hier startet das Jahr" : "Where the year starts"}</h3>
        <p>${lang() === "de" ? "Saldi beginnt 2015 mit 265 Mio. $ Vermögen, finanziert größtenteils über einen Bankkredit. Drücken Sie auf Abspielen oder springen Sie zu einer Buchung." : "Saldi starts 2015 with $265M of assets, mostly financed by a bank loan. Press play, or jump to any transaction."}</p>`;
    } else {
      const x = TX[step - 1];
      const rows = x.dr.map(([a, v]) => `<div class="journal-row"><span class="dc">${lang() === "de" ? "SOLL" : "DR"}</span><span class="acct">${tr(NAMES[a])}</span><span class="amt">${money(v, (v * 10) % 1 ? 2 : 1)}</span></div>`).join("")
        + x.cr.map(([a, v]) => `<div class="journal-row cr"><span class="dc">${lang() === "de" ? "HABEN" : "CR"}</span><span class="acct">${tr(NAMES[a])}</span><span class="amt">${money(v, (v * 10) % 1 ? 2 : 1)}</span></div>`).join("");
      card.innerHTML = `<span class="tx-n">${lang() === "de" ? "BUCHUNG" : "TRANSACTION"} ${String(step).padStart(2, "0")} / 15</span>
        <h3>${tr(x.t)}</h3><p>${tr(x.d)}</p>
        <div class="journal"><div class="journal-row journal-head"><span></span><span>${lang() === "de" ? "Buchungssatz" : "Journal entry"}</span><span>${lang() === "de" ? "Betrag" : "Amount"}</span></div>${rows}</div>
        ${x.note ? `<p class="ctrl-hint" style="margin-top:10px">${tr(x.note)}</p>` : ""}`;
    }
    $("plInc").textContent = money(s.inc); $("plExp").textContent = money(-s.exp); $("plProfit").textContent = money(s.inc - s.exp);
    $("txCount").textContent = `${step} / 15`;
    $("txPrev").disabled = step === 0; $("txNext").disabled = step === 15;
    document.querySelectorAll("#txTrack button").forEach((b, i) => {
      b.classList.toggle("done", i < step);
      if (i === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    $("txPlayLabel").textContent = timer ? (lang() === "de" ? "Pause" : "Pause") : step === 15 ? (lang() === "de" ? "Neu starten" : "Replay") : (lang() === "de" ? "Abspielen" : "Play");
  }

  function go(n) { step = Math.max(0, Math.min(15, n)); render(); }
  function stop() { clearInterval(timer); timer = null; render(); }
  $("txPrev").addEventListener("click", () => { stop(); go(step - 1); });
  $("txNext").addEventListener("click", () => { stop(); go(step + 1); });
  $("txPlay").addEventListener("click", () => {
    if (timer) return stop();
    if (step === 15) step = 0;
    timer = setInterval(() => { if (step >= 15) stop(); else go(step + 1); }, 2400);
    go(step + (step === 0 ? 1 : 0));
  });
  const track = $("txTrack");
  track.innerHTML = Array.from({ length: 16 }, (_, i) =>
    `<button type="button" aria-label="${i ? "Transaction " + i : "Opening balance"}"></button>`).join("");
  track.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => { stop(); go(i); }));
  document.addEventListener("keydown", e => {
    if (!$("ledger").contains(document.activeElement)) return;
    if (e.key === "ArrowRight") { stop(); go(step + 1); } else if (e.key === "ArrowLeft") { stop(); go(step - 1); }
  });
  document.addEventListener("rk:lang", render);

  // ---- P&L bridge (horizontal waterfall) ----
  const BRIDGE = [
    [L("Revenue incl. rent", "Umsatz inkl. Miete"), 526.449, "total"],
    [L("Materials &amp; direct costs", "Material &amp; direkte Kosten"), -270.45],
    [L("Gross profit", "Bruttogewinn"), 255.999, "total"],
    [L("Operating costs", "Betriebskosten"), -98],
    [L("EBITDA", "EBITDA"), 157.999, "total"],
    [L("Depreciation", "Abschreibungen"), -20],
    [L("Interest &amp; provision", "Zinsen &amp; Rückstellung"), -8.6],
    [L("Income tax", "Ertragsteuer"), -19.40985],
    [L("Net income", "Jahresüberschuss"), 109.98915, "total"],
  ];
  function bridge() {
    const el = $("bridge"); if (!el) return;
    const max = 526.449; let run = 0;
    el.innerHTML = BRIDGE.map(([name, v, kind]) => {
      let a, b;
      if (kind) { a = 0; b = v; run = v; } else { a = run + v; b = run; run += v; }
      const color = kind ? "--s1" : "--s2";
      return `<div class="wf-row${kind ? " wf-total" : ""}"><span class="wf-name">${tr(name)}</span>
        <span class="wf-track"><i style="left:${(a / max) * 100}%;width:${Math.max(0.4, ((b - a) / max) * 100)}%;background:var(${color})"></i></span>
        <b class="wf-val">${money(v)}</b></div>`;
    }).join("");
  }
  bridge();
  document.addEventListener("rk:lang", bridge);

  render();
})();
