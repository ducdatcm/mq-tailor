/**
 * Minh Quang tablet app -> Google Sheets (v4).
 *
 * Receives one order from the tablet app and adds it to this spreadsheet, one line per kind of piece
 * and design: "Áo", "Gile", "Quần" or "Sơ mi", with how many of it are made. Two pairs of trousers made
 * the same are one line (Quần, 2); made differently they are two lines (Quần, 1 and Quần, 1).
 *
 * The tab has two header rows. Row 1 holds coloured bands, row 2 the column names:
 *
 *   ĐƠN HÀNG                     | ÁO ...  | GILE | QUẦN ... | NGUYÊN PHỤ LIỆU | SƠ MI ... | GHI NHẬN
 *   Ngày, Order ID, ..., Số lượng, Ghi chú | Kiểu cài áo ... Túi ngực ... | ... | Túi ngực, Nắp túi, Vạt áo | Lần xác nhận, Mã gửi
 *
 * A line fills only the band of its piece (and, for a jacket, waistcoat or trousers, the trims band:
 * the buttons are chosen once for the whole order), so the jacket's "Túi ngực" and the shirt's
 * "Túi ngực" are separate columns.
 *
 * Set up with docs/google-sheets/GUIDE.md. Paste this whole file into the spreadsheet's Apps Script
 * editor (Extensions > Apps Script) and deploy a new version.
 */

// The tab that orders are added to (created on the first order).
const SHEET_NAME = 'Đơn hàng';
// A tab in the v3 layout (one header row) is renamed to this, and kept as it was.
const OLD_SHEET_NAME = 'Đơn hàng (mẫu cũ)';
const HEADER_ROWS = 2;

const ORDER_BAND = 'ĐƠN HÀNG';
const NOTE_HEADER = 'Ghi chú';
const ORDER_COLUMNS = ['Ngày', 'Order ID', 'Tên khách', 'Số điện thoại', 'Sản phẩm', 'Số lượng', NOTE_HEADER];
const RECORD_BAND = 'GHI NHẬN';
const VERSION_HEADER = 'Lần xác nhận';
const ID_HEADER = 'Mã gửi';
const RECORD_COLUMNS = [VERSION_HEADER, ID_HEADER];

const TRIMS_BAND = 'NGUYÊN PHỤ LIỆU';
// The design columns, band by band, for an order sent by an older app (the app now sends its own
// layout with every order, and any column it adds is put in its band).
const DEFAULT_LAYOUT = [
  { name: 'ÁO', columns: ['Kiểu cài áo', 'Kiểu ve', 'Dáng vai', 'Túi ngoài', 'Túi ngực', 'Xẻ sau', 'Tay áo', 'Kiểu khuy tay', 'Lót áo'] },
  { name: 'GILE', columns: ['Kiểu gile'] },
  { name: 'QUẦN', columns: ['Xếp ly trước', 'Chi tiết cạp quần', 'Túi trước', 'Túi sau', 'Gấu quần'] },
  { name: TRIMS_BAND, columns: ['Loại khuy', 'Khuyết Milan'] },
  { name: 'SƠ MI', columns: ['Chiều dài tay', 'Kiểu cổ áo', 'Cổ tay áo', 'Măng sét đúp', 'Nẹp áo', 'Túi ngực', 'Nắp túi', 'Vạt áo'] },
];
// "Sản phẩm" -> band, for an order sent by an older app.
const ITEM_BANDS = { 'Áo': 'ÁO', 'Gile': 'GILE', 'Quần': 'QUẦN', 'Sơ mi': 'SƠ MI' };

// [header colour, colour of a line's own cells] per band.
const BAND_COLOURS = {
  'ĐƠN HÀNG': ['#e7e1d6', null],
  'ÁO': ['#d6e4f2', '#f1f6fb'],
  'GILE': ['#e3d9ef', '#f6f2fa'],
  'QUẦN': ['#d8ecdc', '#f1f8f2'],
  'NGUYÊN PHỤ LIỆU': ['#f1e6c8', '#fbf7ec'],
  'SƠ MI': ['#f3dcdc', '#fbf1f1'],
  'GHI NHẬN': ['#e7e1d6', null],
};
const OTHER_COLOURS = ['#eeeeee', null];
const BAND_EDGE = '#8c8273';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DATE_FORMAT = 'dd/MM/yyyy HH:mm';

/**
 * Open the web app URL in a browser: "OK" means the script is deployed. The app's setup page also
 * looks for "v4", so it can tell this version from an older one.
 */
function doGet() {
  return ContentService.createTextOutput('OK v4 - Minh Quang order sheet is running.');
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

    const layout = data.layout && data.layout.length ? data.layout : DEFAULT_LAYOUT;
    // An order saved on a tablet by an older app has one design and no lines.
    const lines = (data.rows && data.rows.length ? data.rows : [{ item: data.product || '', quantity: '', design: data.design || {} }]).map(function (line) {
      return line.cells ? line : legacyLine(line, layout);
    });

    const sheet = getSheet();

    // The same order delivered twice (a lost answer, a retry) is stored once.
    if (alreadyStored(sheet, data.submissionId)) return reply({ ok: true, duplicate: true });

    const keys = ensureHeaders(sheet, wantedKeys(layout, lines));

    const rows = lines.map(function (line) {
      return keys.map(function (key) { return valueFor(key, data, line); });
    });
    const first = Math.max(sheet.getLastRow(), HEADER_ROWS) + 1;
    const target = sheet.getRange(first, 1, rows.length, keys.length);
    // Plain text, so "0912..." keeps its zero, "0001" is not turned into 1, and nothing typed
    // by a customer can be read as a formula. The date and the quantity are set afterwards.
    target.setNumberFormat('@');
    target.setValues(rows);

    const dateCol = keys.indexOf(key(ORDER_BAND, 'Ngày')) + 1;
    const dateRange = sheet.getRange(first, dateCol, rows.length, 1);
    dateRange.setNumberFormat(DATE_FORMAT);
    dateRange.setValues(rows.map(function (row) { return [row[dateCol - 1]]; }));

    // A real number, so the column can be added up.
    const qtyCol = keys.indexOf(key(ORDER_BAND, 'Số lượng')) + 1;
    const qtyRange = sheet.getRange(first, qtyCol, rows.length, 1);
    qtyRange.setNumberFormat('0');
    qtyRange.setValues(rows.map(function (row) { return [row[qtyCol - 1]]; }));

    // Tint the bands each line filled, so a line reads at a glance.
    lines.forEach(function (line, i) {
      bandsOf(line).forEach(function (band) {
        const tint = (BAND_COLOURS[band] || OTHER_COLOURS)[1];
        const span = bandSpan(keys, band);
        if (tint && span) sheet.getRange(first + i, span[0], 1, span[1]).setBackground(tint);
      });
    });

    return reply({ ok: true, rows: rows.length });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ── The tab ─────────────────────────────────────────────────────────────── */

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME);
  // A tab in the v3 layout (one header row, starting with "Ngày") is kept under another name.
  if (sheet && sheet.getLastColumn() > 0 && sheet.getRange(1, 1).getValue() === 'Ngày') {
    let name = OLD_SHEET_NAME;
    for (let n = 2; book.getSheetByName(name); n++) name = OLD_SHEET_NAME + ' ' + n;
    sheet.setName(name);
    return book.insertSheet(SHEET_NAME);
  }
  return sheet || book.insertSheet(SHEET_NAME);
}

/** Whether this submission is already in the tab, or in the tab kept from v3. */
function alreadyStored(sheet, submissionId) {
  const keys = readKeys(sheet);
  const idCol = keys.indexOf(key(RECORD_BAND, ID_HEADER)) + 1;
  const last = sheet.getLastRow();
  if (idCol > 0 && last > HEADER_ROWS) {
    const ids = sheet.getRange(HEADER_ROWS + 1, idCol, last - HEADER_ROWS, 1).getValues();
    for (let i = 0; i < ids.length; i++) if (ids[i][0] === submissionId) return true;
  }
  const old = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(OLD_SHEET_NAME);
  if (old && old.getLastRow() > 1 && old.getLastColumn() > 0) {
    const headers = old.getRange(1, 1, 1, old.getLastColumn()).getValues()[0];
    const col = headers.indexOf(ID_HEADER) + 1;
    if (col > 0) {
      const ids = old.getRange(2, col, old.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) if (ids[i][0] === submissionId) return true;
    }
  }
  return false;
}

/* ── Columns ─────────────────────────────────────────────────────────────── */

function key(band, name) {
  return band + '|' + name;
}
function bandOf(k) {
  return k.slice(0, k.indexOf('|'));
}
function nameOf(k) {
  return k.slice(k.indexOf('|') + 1);
}

/** The columns an order needs, in order: the order's, each band of the layout, then the record's. */
function wantedKeys(layout, lines) {
  const keys = ORDER_COLUMNS.map(function (n) { return key(ORDER_BAND, n); });
  layout.forEach(function (section) {
    section.columns.forEach(function (n) { keys.push(key(section.name, n)); });
  });
  // a column a line has but the layout does not: at the end of its band
  lines.forEach(function (line) {
    Object.keys(line.cells).forEach(function (k) {
      if (keys.indexOf(k) !== -1) return;
      let at = -1;
      keys.forEach(function (other, i) { if (bandOf(other) === bandOf(k)) at = i; });
      if (at === -1) keys.push(k);
      else keys.splice(at + 1, 0, k);
    });
  });
  RECORD_COLUMNS.forEach(function (n) { keys.push(key(RECORD_BAND, n)); });
  return keys;
}

/** The tab's columns as keys: the band (row 1, merged across its columns) and the name (row 2). */
function readKeys(sheet) {
  const width = sheet.getLastColumn();
  if (width < 1 || sheet.getLastRow() < HEADER_ROWS) return [];
  const head = sheet.getRange(1, 1, HEADER_ROWS, width).getValues();
  const keys = [];
  let band = '';
  for (let c = 0; c < width; c++) {
    if (head[0][c] !== '') band = String(head[0][c]);
    keys.push(head[1][c] === '' ? '' : key(band, String(head[1][c])));
  }
  while (keys.length && keys[keys.length - 1] === '') keys.pop();
  return keys;
}

/**
 * Lays out the header on the first order, and adds any column not there yet, inside its band (after
 * the column that comes before it), so the rows already written stay in line. Columns added by hand
 * are left where they are.
 */
function ensureHeaders(sheet, wanted) {
  const keys = readKeys(sheet);
  const fresh = keys.length === 0;
  let changed = fresh;
  let prev = -1;
  wanted.forEach(function (k) {
    const at = keys.indexOf(k);
    if (at !== -1) {
      prev = at;
      return;
    }
    const col = prev + 2; // 1-based column right after the previous wanted one
    if (col <= sheet.getLastColumn()) sheet.insertColumnsBefore(col, 1);
    keys.splice(prev + 1, 0, k);
    prev += 1;
    changed = true;
  });
  if (changed) writeHeaders(sheet, keys);
  if (fresh) sizeColumns(sheet, keys);
  return keys;
}

/** Writes both header rows: the bands merged and coloured, the names under them, a line between bands. */
function writeHeaders(sheet, keys) {
  if (sheet.getMaxColumns() < keys.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), keys.length - sheet.getMaxColumns());
  const head = sheet.getRange(1, 1, HEADER_ROWS, keys.length);
  head.breakApart();
  head.setValues([keys.map(bandOf), keys.map(nameOf)]);
  head.setFontWeight('bold');
  head.setVerticalAlignment('middle');
  head.setWrap(true);
  // clear the lines between bands, then draw them where the bands now start
  sheet.getRange(1, 1, sheet.getMaxRows(), keys.length).setBorder(null, false, null, null, false, null);
  bandRuns(keys).forEach(function (run) {
    const colours = BAND_COLOURS[run.band] || OTHER_COLOURS;
    sheet.getRange(1, run.start, HEADER_ROWS, run.width).setBackground(colours[0]);
    const bandCell = sheet.getRange(1, run.start, 1, run.width);
    if (run.width > 1) bandCell.merge();
    bandCell.setHorizontalAlignment('center');
    sheet
      .getRange(1, run.start, sheet.getMaxRows(), 1)
      .setBorder(null, true, null, null, null, null, BAND_EDGE, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });
  sheet.setFrozenRows(HEADER_ROWS);
}

/** On the first order: columns wide enough to read a choice without opening the cell. */
function sizeColumns(sheet, keys) {
  sheet.setColumnWidths(1, keys.length, 130);
  // the sale's note is the longest text of a line
  sheet.setColumnWidth(keys.indexOf(key(ORDER_BAND, NOTE_HEADER)) + 1, 260);
  sheet.setRowHeight(2, 42);
}

/** Runs of neighbouring columns in the same band: { band, start (1-based), width }. */
function bandRuns(keys) {
  const runs = [];
  keys.forEach(function (k, i) {
    const band = bandOf(k);
    const last = runs[runs.length - 1];
    if (last && last.band === band) last.width += 1;
    else runs.push({ band: band, start: i + 1, width: 1 });
  });
  return runs;
}

/** [first column (1-based), width] of a band's design columns. */
function bandSpan(keys, band) {
  const run = bandRuns(keys).filter(function (r) { return r.band === band; })[0];
  return run ? [run.start, run.width] : null;
}

/* ── Values ──────────────────────────────────────────────────────────────── */

function bandsOf(line) {
  const bands = [];
  Object.keys(line.cells).forEach(function (k) {
    if (bands.indexOf(bandOf(k)) === -1) bands.push(bandOf(k));
  });
  return bands;
}

/**
 * A line from an older app has its design by column name only: it goes in the band of its piece, and a
 * name that band does not have goes in the trims band, or the first band that has it.
 */
function legacyLine(line, layout) {
  const own = ITEM_BANDS[line.item];
  const has = function (band, name) {
    return layout.some(function (s) { return s.name === band && s.columns.indexOf(name) !== -1; });
  };
  const cells = {};
  Object.keys(line.design || {}).forEach(function (name) {
    let band = own && has(own, name) ? own : has(TRIMS_BAND, name) ? TRIMS_BAND : '';
    if (!band) {
      const found = layout.filter(function (s) { return s.columns.indexOf(name) !== -1; })[0];
      band = found ? found.name : own || 'KHÁC';
    }
    cells[key(band, name)] = line.design[name];
  });
  return { item: line.item, quantity: line.quantity, cells: cells };
}

function valueFor(k, data, line) {
  switch (k) {
    case key(ORDER_BAND, 'Ngày'): return parseDate(data.date);
    case key(ORDER_BAND, 'Order ID'): return data.orderId;
    case key(ORDER_BAND, 'Tên khách'): return data.customerName;
    case key(ORDER_BAND, 'Số điện thoại'): return data.phone;
    case key(ORDER_BAND, 'Sản phẩm'): return line.item;
    case key(ORDER_BAND, 'Số lượng'): return line.quantity;
    case key(ORDER_BAND, NOTE_HEADER): return data.note || '';
    case key(RECORD_BAND, VERSION_HEADER): return data.revision;
    case key(RECORD_BAND, ID_HEADER): return data.submissionId;
    default: return (line.cells && line.cells[k]) || '';
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
