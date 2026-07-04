# Checklist — Astro + Cloudflare

A fast, SEO-ready checklist template website with a **gated download** (users fill a form before downloading), a **blog**, and a **professional responsive UI**. Built with **Astro** and deployed on **Cloudflare Pages** with serverless **Pages Functions**.

---

## ✨ What's included

- **Home** landing page (hero, features, featured templates, blog highlights, CTA)
- **Templates** gallery with category filters + individual template pages (with image preview)
- **Gated download form** (name, email, purpose, **format: PDF or JPG**) → logs to **Google Sheet** → serves file from **private R2**
- **Blog** (write posts in Markdown/MDX)
- **SEO**: meta + Open Graph + Twitter cards + JSON-LD + auto **sitemap** + robots.txt
- **Bot protection**: Cloudflare Turnstile
- **Template pipeline**: you design once in **.webp**, the script outputs **JPG + PDF + preview** automatically

---

## 📁 IMPORTANT — template folders (read this)

| Folder | What goes here | Public? |
|--------|----------------|---------|
| `template-source/` | **You upload your designed `.webp` here** (one per template) | no (working files) |
| `public/templates/preview/` | Auto-generated **watermarked preview** (shown on site) | yes (safe) |
| `template-files/` | Auto-generated **`.jpg` + `.pdf`** → **upload these to your private R2 bucket** | no (gated) |

### The workflow (exactly what you asked for)

1. Design your template and export it as **`<name>.webp`** (e.g. `branding-checklist.webp`).
2. Put it in **`template-source/`**. The `<name>` must match `fileBase` in `src/content/templates/<name>.md`.
3. Run:
   ```bash
   npm run templates
   ```
   This auto-creates:
   - `public/templates/preview/<name>.webp` (watermarked preview → commit to git)
   - `template-files/<name>.jpg` (full quality → upload to R2)
   - `template-files/<name>.pdf` (A4 printable → upload to R2)
4. Upload `template-files/*.jpg` and `*.pdf` to your **private R2 bucket**.
5. On the site, visitors fill the form and choose **PDF or JPG** to download. ✅

> You maintain only the `.webp`. JPG + PDF are generated for you.

---

## 🚀 Quick start (local)

```bash
npm install
npm run templates   # convert your webp -> jpg + pdf + preview
npm run dev         # http://localhost:4321
npm run build       # outputs to dist/
```

> Requires Node 18+.

---

## 🌐 Deploy to Cloudflare Pages (from GitHub)

1. Push this folder to a **GitHub repo**.
2. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Build settings: **Framework:** Astro · **Build command:** `npm run build` · **Output:** `dist`.
4. Add environment variables / bindings (Settings → Functions):

| Name | Type | Value |
|------|------|-------|
| `PUBLIC_TURNSTILE_SITEKEY` | Env var | Turnstile **site** key |
| `TURNSTILE_SECRET` | Env var (encrypted) | Turnstile **secret** key |
| `GSHEET_WEBHOOK` | Env var | Google Apps Script Web App URL |
| `PUBLIC_BASE` | Env var | your domain, e.g. `https://checklist.com` |
| `TEMPLATES` | **R2 bucket binding** | your private R2 bucket |

5. Set your real domain in `astro.config.mjs` (`SITE`) and `public/robots.txt`.
6. Every `git push` auto-builds and deploys. ✅

### Upload template files to R2

Upload from the Cloudflare dashboard (R2 → your bucket) or with Wrangler:

```bash
npx wrangler r2 object put YOUR_BUCKET/branding-checklist.jpg --file ./template-files/branding-checklist.jpg
npx wrangler r2 object put YOUR_BUCKET/branding-checklist.pdf --file ./template-files/branding-checklist.pdf
```

---

## 🔒 How the gated download works (copy-safe)

1. Full-quality **JPG/PDF live in a private R2 bucket** — NOT in this repo or the public site.
2. The public template page only shows a **watermarked, lower-res preview**.
3. `POST /api/download` → verifies **Turnstile** → logs the lead to your **Google Sheet** → returns a **signed link that expires in 5 minutes** for the chosen format.
4. `GET /api/file` validates the signature and **streams the file** from R2.

---

## 📊 Google Sheet lead capture

See `google-apps-script/Code.gs` — create a Sheet with a `Leads` tab, paste the script, deploy as a Web App, put the URL in `GSHEET_WEBHOOK`.

---

## ✍️ Adding content

**New template:** (1) add `template-source/<name>.webp`, (2) add `src/content/templates/<name>.md` with `fileBase: "<name>"`, (3) `npm run templates`, (4) upload the new JPG+PDF to R2.

**New blog post:** add a markdown file in `src/content/blog/`.

Pages and sitemap generate automatically on build.

---

## 🛡️ Notes on “can't be copied”

No website is 100% copy-proof (browsers must receive HTML/CSS). This project protects what matters: full-quality **template files stay server-side** behind the form + Turnstile + expiring links, the public preview is **watermarked**, and content is yours. Keep the copyright + Terms in place.

---

## 📦 Demo assets included

The project ships with 5 sample designs (branding, travel, onboarding, daily, SEO) already converted to `.webp` + `.jpg` + `.pdf` + previews, so you can deploy and test immediately, then replace them with your own designs.
