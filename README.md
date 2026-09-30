# Rishiram Kharel — Portfolio

Personal portfolio website: supply chain & logistics operations, with data analysis in Power BI.

**Live:** _coming soon on Vercel_

## What's inside

- `index.html` — home page: profile, career route, experience, projects, skills, education, contact
- `sales-dashboard.html` — case study: how the Sales Performance Dashboard (Power BI) was built
- `style.css`, `main.js` — styles and small interactions (no framework, no build step)
- `sales-*.jpg` — report page screenshots · `Rishiram_Kharel_CV.pdf` · `favicon.svg`

The featured Power BI report is embedded live from Power BI "Publish to web"; it loads on click to keep the page fast.

## Run locally

It's a static site — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploy to Vercel

1. Go to vercel.com → **Add New… → Project** and import this GitHub repository.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Click **Deploy**. Every push to `main` redeploys automatically.
