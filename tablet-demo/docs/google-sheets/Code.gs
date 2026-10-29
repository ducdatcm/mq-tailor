/**
 * Minh Quang tablet app -> Google Sheets.
 *
 * Receives one order row from the tablet app and adds it to this spreadsheet.
 * Set up with docs/google-sheets/GUIDE.md. Paste this whole file into the
 * spreadsheet's Apps Script editor (Extensions > Apps Script).
 */

// The tab that rows are added to (created on the first order).
const SHEET_NAME = 'Đơn hàng';
// The first columns, in order. Design columns (one per choice: closure, lapel...) follow
// automatically, named like the app's groups, and any new group the app gets is added too.
const FIXED_HEADERS = ['Ngày', 'Order ID', 'Tên khách', 'Số điện thoại', 'Sản phẩm', 'Lần xác nhận'];
// Remembers which submissions are already stored, so a repeated delivery is ignored.
const ID_HEADER = 'Mã gửi';
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DATE_FORMAT = 'dd/MM/yyyy HH:mm';

/** Open the web app URL in a browser: "OK" means the script is deployed. */
function doGet() {
  return ContentService.createTextOutput('OK - Minh Quang order sheet is running.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);

    // Optional shared secret: Project Settings > Script properties > SECRET.
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (secret && data.token !== secret) return reply({ ok: false, error: 'unauthorized' });
    if (!data.submissionId || !data.orderId) return reply({ ok: false, error: 'missing fields' });

    const sheet = getSheet();
    const headers = ensureHeaders(sheet, Object.keys(data.design || {}));

    // The same order delivered twice (a lost answer, a retry) is stored once.
    const idCol = headers.indexOf(ID_HEADER) + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === data.submissionId) return reply({ ok: true, duplicate: true });
      }
    }

    const row = headers.map(function (h) { return valueFor(h, data); });
    const target = sheet.getRange(lastRow + 1, 1, 1, row.length);
    // Plain text, so "0912..." keeps its zero, "0001" is not turned into 1, and nothing typed
    // by a customer can be read as a formula. The date and the version are set afterwards.
    target.setNumberFormat('@');
    target.setValues([row]);
    const dateCol = headers.indexOf(FIXED_HEADERS[0]) + 1;
    sheet.getRange(lastRow + 1, dateCol).setNumberFormat(DATE_FORMAT);
    sheet.getRange(lastRow + 1, dateCol).setValue(row[dateCol - 1]);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  return book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
}

/** Writes the header row on the first order and adds a column for any design group not seen yet. */
function ensureHeaders(sheet, designGroups) {
  let headers = [];
  if (sheet.getLastColumn() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].filter(String);
  }
  const wanted = headers.length ? headers.slice() : FIXED_HEADERS.concat([ID_HEADER]);
  designGroups.forEach(function (name) {
    if (wanted.indexOf(name) === -1) wanted.push(name);
  });
  if (wanted.length !== headers.length) {
    const range = sheet.getRange(1, 1, 1, wanted.length);
    range.setValues([wanted]);
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return wanted;
}

function valueFor(header, data) {
  switch (header) {
    case 'Ngày': return parseDate(data.date);
    case 'Order ID': return data.orderId;
    case 'Tên khách': return data.customerName;
    case 'Số điện thoại': return data.phone;
    case 'Sản phẩm': return data.product;
    case 'Lần xác nhận': return data.revision;
    case ID_HEADER: return data.submissionId;
    default: return (data.design && data.design[header]) || '';
  }
}

/** "03/11/2026 09:05" -> a real date, so the column can be sorted and filtered; falls back to the text. */
function parseDate(text) {
  try {
    return Utilities.parseDate(text, TIME_ZONE, DATE_FORMAT);
  } catch (err) {
    return text;
  }
}

function reply(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
