# ⚙️ How to edit your site settings

Everything you commonly change lives in **one file**:

```
src/config/site.ts
```

Edit it, save, commit & push — Cloudflare rebuilds automatically.

## What you can change there

| Setting | What it controls |
|---------|------------------|
| `name` | Brand name shown in the nav, footer, page titles |
| `logoEmoji` | The little logo mark (use an emoji or a single letter) |
| `tagline` / `shortDescription` | Used in SEO + footer |
| `email` | Contact email (footer) |
| `credit.text` / `credit.url` | The **website credit** in the footer bottom bar |
| `social.*` | Instagram / WhatsApp / Telegram / YouTube links (empty = hidden) |
| `followTasks` | The “follow to unlock” steps for **Pro** template downloads |

## Making a template “Pro” (follow-to-download)

In any template file under `src/content/templates/<name>.md`, set:

```yaml
pro: true
```

Now that template's download form will ask the visitor to complete the
`followTasks` (follow Instagram, join WhatsApp/Telegram, subscribe YouTube)
before the download unlocks. Normal templates (`pro: false` or omitted) download
after the usual name/email/WhatsApp form.

## Changing the footer credit

Set `credit.text` and `credit.url` in `src/config/site.ts`. Example:

```ts
credit: { text: 'Made by Pro CSC Tools', url: 'https://procsctools.in' },
```
