Drop your designed checklist templates here as .webp files.

The file name (without extension) MUST match "fileBase" in the matching
markdown file at src/content/templates/<name>.md

Example:
  template-source/branding-checklist.webp   <->   src/content/templates/branding-checklist.md (fileBase: "branding-checklist")

Then run:
  npm run templates

This creates:
  public/templates/preview/<name>.webp   (public watermarked preview -> commit to git)
  template-files/<name>.jpg              (upload to your private R2 bucket)
  template-files/<name>.pdf              (upload to your private R2 bucket)
