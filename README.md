# Checklist — Astro + Cloudflare

A fast, SEO-ready checklist template website with a **gated download** (users fill a form before downloading), a **blog**, and a **professional responsive UI**. Built with **Astro** and deployed on **Cloudflare Pages** with serverless **Pages Functions**.

---

## ✨ What's included

- **Home** landing page (hero, features, featured templates, blog highlights, CTA)
- **Templates** gallery with category filters + individual template pages
- **Gated download form** (name, email, purpose) → logs to **Google Sheet** → serves file from **private R2**
- **Blog** (write posts in Markdown/MDX)
- **SEO**: meta + Open Graph + Twitter cards + JSON-LD + auto **sitemap** + robots.txt
- **Bot protection**: Cloudflare Turnstile
- Clean design system in `src/styles/global.css`

---

## 📁 Project structure

```
cheicklist-site/
├─ src/
│  ├─ components/     # Nav, Footer, SEO, DownloadForm
│  ├─ layouts/        # BaseLayout
│  ├─ pages/          # index, templates/, blog/, about, legal, 404
│  ├─ content/        # templates/*.md and blog/*.md (+ config.ts)
│  └─ styles/         # global.css design system
├─ functions/api/     # Cloudflare Pages Functions (download.ts, file.ts)
├─ google-apps-script/  # Code.gs for Google Sheet lead capture
├─ public/            # favicon, robots.txt, og images, (NOT template files)
└─ astro.config.mjs
```

---

## 🚀 Quick start (local)

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
```

> Requires Node 18+.

---

## 🌐 Deploy to Cloudflare Pages (from GitHub)

1. Push this folder to a **GitHub repo**.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. After the first deploy, add the following in **Settings → Environment variables / bindings**:

| Name | Type | Value |
|------|------|-------|
| `PUBLIC_TURNSTILE_SITEKEY` | Env var | Turnstile **site** key |
| `TURNSTILE_SECRET` | Env var (encrypted) | Turnstile **secret** key |
| `GSHEET_WEBHOOK` | Env var | Google Apps Script Web App URL |
| `PUBLIC_BASE` | Env var | your domain, e.g. `https://checklist.com` |
| `TEMPLATES` | **R2 bucket binding** | your private R2 bucket |

5. Set your real domain in `astro.config.mjs` (`SITE`) and in `public/robots.txt`.
6. Every `git push` now auto-builds and deploys. ✅

---

## 🔒 How the gated download works (copy-safe)

1. Template **PDF files live in a private R2 bucket** — NOT in this repo or the public site, so they can't be bulk-scraped.
2. User fills the form on a template page.
3. `POST /api/download` → verifies **Turnstile** → logs the lead to your **Google Sheet** → returns a **signed link that expires in 5 minutes**.
4. `GET /api/file` validates the signature and **streams the file** from R2.

### Uploading template files to R2

Name each file to match the `fileKey` in the template's markdown front-matter (e.g. `travel-packing-checklist.pdf`). Upload via the Cloudflare dashboard (R2 → your bucket) or Wrangler:

```bash
npx wrangler r2 object put YOUR_BUCKET/travel-packing-checklist.pdf --file ./travel-packing-checklist.pdf
```

---

## 📊 Google Sheet lead capture

See `google-apps-script/Code.gs` — create a Sheet with a `Leads` tab, paste the script, deploy as a Web App, and put the URL in `GSHEET_WEBHOOK`.

---

## ✍️ Adding content

**New template:** add a markdown file in `src/content/templates/` (copy an existing one), set `fileKey`, then upload the matching PDF to R2.

**New blog post:** add a markdown file in `src/content/blog/`.

No code changes needed — pages and sitemap generate automatically on build.

---

## 🛡️ Notes on “can't be copied”

No website can be 100% copy-proof (browsers must receive HTML/CSS). This project protects what matters: your **template files stay server-side behind the form + Turnstile + expiring links**, the build output is optimized/minified, and content is yours. Add a watermark/brand to your PDFs and keep the copyright + Terms in place.
