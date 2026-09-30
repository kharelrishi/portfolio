# Rishiram Kharel — Portfolio

Personal portfolio website: supply chain & logistics operations, with data analysis in Power BI.

**Live:** https://kharelrishi.github.io/portfolio/ (GitHub Pages)

## What's inside

- `index.html` — home page: profile, career route, experience, projects, skills, education, contact
- `sales-dashboard.html` — case study: how the Sales Performance Dashboard (Power BI) was built
- `tesla-forecast.html` — Tesla Forecast Lab: my Excel delivery/revenue forecast to 2029, running live (`tesla-model.js` is a port of the workbook, `tesla.js` wires the controls), plus a forecast-vs-actual check
- `saldi-ledger.html` — Saldi Ledger: a financial year booked in 15 transactions, with a step-through balance sheet, P&L bridge and KPIs (`saldi.js`)
- `viz.js` — small dependency-free SVG charts used by the case studies (theme- and language-aware)
- `style.css`, `main.js` — styles and small interactions (no framework, no build step)
- `sales-*.jpg` — report page screenshots · `Rishiram_Kharel_CV.pdf` (EN) · `Rishiram_Kharel_Lebenslauf.pdf` (DE) · `favicon.svg`

The site is bilingual (English / Deutsch) and has a light and a dark theme. Both switches sit in the header; the choice is remembered, and first-time visitors get their browser's language and system theme. Links can force a language with `?lang=de` or `?lang=en`.

The featured Power BI report is embedded live from Power BI "Publish to web"; it loads on click to keep the page fast.

## Run locally

It's a static site — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Hosting

Published with GitHub Pages from the `main` branch (root). Every push to `main` updates the live site within a minute or two.

### Optional: deploy to Vercel instead

1. Go to vercel.com → **Add New… → Project** and import this GitHub repository.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Click **Deploy**. Every push to `main` redeploys automatically.
