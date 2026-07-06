
/**
 * Google Apps Script — Lead capture webhook for the Checklist site.
 *
 * SETUP:
 * 1. Create a Google Sheet. Add a tab named "Leads".
 *    Row 1 headers: Date | Name | Email | WhatsApp | Purpose | Template | Format | FileKey | IP
 * 2. Extensions -> Apps Script. Paste this code.
 * 3. Deploy -> New deployment -> type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL and set it as GSHEET_WEBHOOK in Cloudflare Pages env vars.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
    sheet.appendRow([
      data.date || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.whatsapp || '',
      data.purpose || '',
      data.template || '',
      data.format || '',
      data.fileKey || '',
      data.ip || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
