/**
 * Minh Quang tablet app -> Google Sheets.
 *
 * Receives one order from the tablet app and adds it to this spreadsheet, one line per kind of
 * piece and design: "Áo", "Quần", "Gile" or "Sơ mi", with how many of it are made. Two pairs of trousers
 * made the same are one line (Quần, 2); made differently they are two lines (Quần, 1 and Quần, 1).
 * Set up with docs/google-sheets/GUIDE.md. Paste this whole file into the
 * spreadsheet's Apps Script editor (Extensions > Apps Script).
 */

// The tab that rows are added to (created on the first order).
const SHEET_NAME = 'Đơn hàng';
// The columns on the left, in order. The design columns (one per choice: closure, lapel...) come next,
// named like the app's groups, and any new group the app gets is added there too.
const FIXED_HEADERS = ['Ngày', 'Order ID', 'Tên khách', 'Số điện thoại', 'Sản phẩm', 'Số lượng'];
// Kept on the right: which confirmation of the design this is, and the id that stops an order being stored twice.
const VERSION_HEADER = 'Lần xác nhận';
const ID_HEADER = 'Mã gửi';
const TAIL_HEADERS = [VERSION_HEADER, ID_HEADER];
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DATE_FORMAT = 'dd/MM/yyyy HH:mm';

/**
 * Open the web app URL in a browser: "OK" means the script is deployed. The app's setup page also
 * looks for "v3", so it can tell this version from an older one.
 */
function doGet() {
  return ContentService.createTextOutput('OK v3 - Minh Quang order sheet is running.');
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

    // An order saved on a tablet by an older app has one design and no lines.
    const lines = data.rows && data.rows.length ? data.rows : [{ item: data.product || '', quantity: '', design: data.design || {} }];

    const sheet = getSheet();
    const designNames = [];
    lines.forEach(function (line) {
      Object.keys(line.design || {}).forEach(function (name) {
        if (designNames.indexOf(name) === -1) designNames.push(name);
      });
    });
    const headers = ensureHeaders(sheet, designNames);

    // The same order delivered twice (a lost answer, a retry) is stored once.
    const idCol = headers.indexOf(ID_HEADER) + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === data.submissionId) return reply({ ok: true, duplicate: true });
      }
    }

    const rows = lines.map(function (line) {
      return headers.map(function (h) { return valueFor(h, data, line); });
    });
    const first = lastRow + 1;
    const target = sheet.getRange(first, 1, rows.length, headers.length);
    // Plain text, so "0912..." keeps its zero, "0001" is not turned into 1, and nothing typed
    // by a customer can be read as a formula. The date and the quantity are set afterwards.
    target.setNumberFormat('@');
    target.setValues(rows);

    const dateCol = headers.indexOf('Ngày') + 1;
    const dateRange = sheet.getRange(first, dateCol, rows.length, 1);
    dateRange.setNumberFormat(DATE_FORMAT);
    dateRange.setValues(rows.map(function (row) { return [row[dateCol - 1]]; }));

    // A real number, so the column can be added up.
    const qtyCol = headers.indexOf('Số lượng') + 1;
    const qtyRange = sheet.getRange(first, qtyCol, rows.length, 1);
    qtyRange.setNumberFormat('0');
    qtyRange.setValues(rows.map(function (row) { return [row[qtyCol - 1]]; }));

    return reply({ ok: true, rows: rows.length });
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

function readHeaders(sheet) {
  if (sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].filter(String);
}

function writeHeaders(sheet, startCol, names) {
  const needed = startCol + names.length - 1;
  if (sheet.getMaxColumns() < needed) sheet.insertColumnsAfter(sheet.getMaxColumns(), needed - sheet.getMaxColumns());
  const range = sheet.getRange(1, startCol, 1, names.length);
  range.setValues([names]);
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Writes the header row on the first order, and adds a column for any name not seen yet. New design
 * columns go in before "Lần xác nhận" and "Mã gửi", which stay on the right.
 */
function ensureHeaders(sheet, designNames) {
  let headers = readHeaders(sheet);
  if (!headers.length) {
    writeHeaders(sheet, 1, FIXED_HEADERS.concat(designNames, TAIL_HEADERS));
    return readHeaders(sheet);
  }
  const missing = FIXED_HEADERS.concat(designNames).filter(function (name) { return headers.indexOf(name) === -1; });
  if (missing.length) {
    // before the first of the right-hand columns that exists, else at the end
    let at = headers.length + 1;
    TAIL_HEADERS.forEach(function (name) {
      const i = headers.indexOf(name);
      if (i !== -1) at = Math.min(at, i + 1);
    });
    if (at <= headers.length) sheet.insertColumnsBefore(at, missing.length);
    writeHeaders(sheet, at, missing);
    headers = readHeaders(sheet);
  }
  const noTail = TAIL_HEADERS.filter(function (name) { return headers.indexOf(name) === -1; });
  if (noTail.length) {
    writeHeaders(sheet, headers.length + 1, noTail);
    headers = readHeaders(sheet);
  }
  return headers;
}

function valueFor(header, data, line) {
  switch (header) {
    case 'Ngày': return parseDate(data.date);
    case 'Order ID': return data.orderId;
    case 'Tên khách': return data.customerName;
    case 'Số điện thoại': return data.phone;
    case 'Sản phẩm': return line.item;
    case 'Số lượng': return line.quantity;
    case VERSION_HEADER: return data.revision;
    case ID_HEADER: return data.submissionId;
    default: return (line.design && line.design[header]) || '';
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
