/**
 * prepare-templates.mjs
 * ---------------------------------------------------------------
 * You design each template ONCE as a .webp image and drop it in:
 *      template-source/<name>.webp        (e.g. branding-checklist.webp)
 *
 * Run:  npm run templates
 *
 * This generates, for every .webp:
 *   1) public/templates/preview/<name>.webp   -> watermarked PUBLIC preview
 *   2) template-files/<name>.jpg              -> full-quality JPG (upload to R2)
 *   3) template-files/<name>.pdf              -> A4 printable PDF (upload to R2)
 *
 * Then: upload template-files/*.jpg and *.pdf to your private R2 bucket,
 *       and commit the public previews. The <name> must match "fileBase"
 *       in src/content/templates/<name>.md.
 * ---------------------------------------------------------------
 */
import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

const SRC = 'template-source';
const PREVIEW_DIR = 'public/templates/preview';
const FILES_DIR = 'template-files';

async function ensure(dir) { if (!existsSync(dir)) await mkdir(dir, { recursive: true }); }

async function run() {
  if (!existsSync(SRC)) {
    console.error(`\nNo "${SRC}/" folder found. Create it and add your .webp templates.\n`);
    process.exit(1);
  }
  await ensure(PREVIEW_DIR);
  await ensure(FILES_DIR);

  const files = (await readdir(SRC)).filter(f => /\.webp$/i.test(f));
  if (!files.length) { console.log('No .webp files in template-source/'); return; }

  for (const file of files) {
    const name = file.replace(/\.webp$/i, '');
    const input = path.join(SRC, file);
    const buf = await readFile(input);
    const meta = await sharp(buf).metadata();

    // 1) PUBLIC preview: max width 820, light watermark stripe
    const previewW = Math.min(meta.width || 820, 820);
    const wmHeight = Math.round((meta.height || 1000) * (previewW / (meta.width || 820)));
    const watermark = Buffer.from(
      `<svg width="${previewW}" height="${wmHeight}">
         <text x="50%" y="96%" text-anchor="middle" font-family="sans-serif" font-size="20"
           fill="rgba(0,0,0,0.35)">Preview — download full quality on our site</text>
       </svg>`
    );
    await sharp(buf)
      .resize({ width: previewW })
      .composite([{ input: watermark, gravity: 'south' }])
      .webp({ quality: 78 })
      .toFile(path.join(PREVIEW_DIR, `${name}.webp`));

    // 2) Full-quality JPG (for R2)
    const jpgBuf = await sharp(buf).jpeg({ quality: 92 }).toBuffer();
    await writeFile(path.join(FILES_DIR, `${name}.jpg`), jpgBuf);

    // 3) A4 PDF with the image fitted (for R2)
    const pdf = await PDFDocument.create();
    const img = await pdf.embedJpg(jpgBuf);
    const A4 = { w: 595.28, h: 841.89 };
    const margin = 24;
    const maxW = A4.w - margin * 2, maxH = A4.h - margin * 2;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale, h = img.height * scale;
    const page = pdf.addPage([A4.w, A4.h]);
    page.drawImage(img, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h });
    const pdfBytes = await pdf.save();
    await writeFile(path.join(FILES_DIR, `${name}.pdf`), pdfBytes);

    console.log(`✓ ${name}  ->  preview.webp + ${name}.jpg + ${name}.pdf`);
  }
  console.log(`\nDone. Upload template-files/*.jpg and *.pdf to your R2 bucket.\n`);
}
run().catch(e => { console.error(e); process.exit(1); });
