import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { vi } from '../content/vi';
import { isCurrentScript } from '../sheet/config';
import { buildPayload, sheetLayout } from '../sheet/payload';
import { orderRecord, snapshotOf } from './helpers';

/** A tiny in-memory stand-in for the part of Google's spreadsheet API that Code.gs uses. */
class FakeSheet {
  grid: unknown[][] = [];
  maxColumns = 6;
  frozen = 0;
  formats: Record<string, string> = {};
  merges: string[] = [];
  backgrounds: Record<string, string> = {};
  constructor(public name: string) {}
  setName(name: string) {
    this.name = name;
  }
  getLastRow() {
    return this.grid.length;
  }
  getLastColumn() {
    return this.grid.reduce((n, row) => Math.max(n, row.length), 0);
  }
  getMaxColumns() {
    return Math.max(this.maxColumns, this.getLastColumn());
  }
  getMaxRows() {
    return 1000;
  }
  insertColumnsAfter(after: number, count: number) {
    this.maxColumns = Math.max(this.maxColumns, after + count);
  }
  insertColumnsBefore(before: number, count: number) {
    for (const row of this.grid) {
      while (row.length < before - 1) row.push('');
      row.splice(before - 1, 0, ...Array(count).fill(''));
    }
    this.maxColumns += count;
  }
  setFrozenRows(n: number) {
    this.frozen = n;
  }
  setColumnWidths() {}
  /** Moves whole columns, data and all, like Google Sheets: `dest` is the 1-based column they go before. */
  moveColumns(range: { col: number; cols: number }, dest: number) {
    const width = this.getLastColumn();
    for (const row of this.grid) {
      while (row.length < width) row.push('');
      const moved = row.splice(range.col - 1, range.cols);
      row.splice(dest > range.col ? dest - 1 - range.cols : dest - 1, 0, ...moved);
    }
  }
  setRowHeight() {}
  setColumnWidth() {}
  getRange(row: number, col: number, rows = 1, cols = 1) {
    const sheet = this;
    const at = `${row}:${col}:${rows}:${cols}`;
    return {
      col,
      cols,
      getValue: () => sheet.grid[row - 1]?.[col - 1] ?? '',
      getValues: () => Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => sheet.grid[row - 1 + r]?.[col - 1 + c] ?? '')),
      setValues: (values: unknown[][]) => {
        if (col - 1 + cols > sheet.getMaxColumns()) throw new Error('beyond the last column');
        values.forEach((vals, r) => {
          const line = (sheet.grid[row - 1 + r] ??= []);
          while (line.length < col - 1) line.push('');
          vals.forEach((v, c) => (line[col - 1 + c] = v));
        });
      },
      setNumberFormat: (f: string) => {
        sheet.formats[at] = f;
      },
      // like Google Sheets: a merged range keeps only its top-left value
      merge: () => {
        sheet.merges.push(at);
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) if ((r || c) && sheet.grid[row - 1 + r]) sheet.grid[row - 1 + r][col - 1 + c] = '';
      },
      breakApart: () => {
        sheet.merges = [];
      },
      setBackground: (colour: string) => {
        sheet.backgrounds[at] = colour;
      },
      setFontWeight: () => undefined,
      setHorizontalAlignment: () => undefined,
      setVerticalAlignment: () => undefined,
      setWrap: () => undefined,
      setBorder: () => undefined,
    };
  }
}

function loadScript(properties: Record<string, string> = {}, existing: FakeSheet[] = []) {
  const sheets = [...existing];
  const book = {
    getSheetByName: (name: string) => sheets.find((s) => s.name === name) ?? null,
    insertSheet: (name: string) => {
      const s = new FakeSheet(name);
      sheets.push(s);
      return s;
    },
  };
  const source = readFileSync(join(process.cwd(), 'docs', 'google-sheets', 'Code.gs'), 'utf8');
  const factory = new Function(
    'SpreadsheetApp',
    'LockService',
    'PropertiesService',
    'ContentService',
    'Utilities',
    `${source}\nreturn { doGet, doPost, DEFAULT_LAYOUT };`,
  );
  const script = factory(
    { getActiveSpreadsheet: () => book, BorderStyle: { SOLID_MEDIUM: 'solid-medium' } },
    { getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }) },
    { getScriptProperties: () => ({ getProperty: (k: string) => properties[k] ?? null }) },
    {
      createTextOutput: (text: string) => ({ text, setMimeType() { return this; } }),
      MimeType: { JSON: 'json' },
    },
    {
      parseDate: (text: string) => {
        const m = /^(\d\d)\/(\d\d)\/(\d{4}) (\d\d):(\d\d)$/.exec(text);
        if (!m) throw new Error('bad date');
        return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]));
      },
    },
  ) as {
    doGet: () => { text: string };
    doPost: (e: { postData: { contents: string } }) => { text: string };
    DEFAULT_LAYOUT: unknown;
  };
  const post = (payload: unknown) => JSON.parse(script.doPost({ postData: { contents: JSON.stringify(payload) } }).text) as Record<string, unknown>;
  const orders = () => book.getSheetByName('Đơn hàng')!;
  /** The 0-based column of a band's column, reading the bands across their merged cells. */
  const col = (band: string, name: string) => {
    const [bands, names] = orders().grid as string[][];
    let current = '';
    for (let c = 0; c < names.length; c++) {
      if (bands[c]) current = bands[c];
      if (current === band && names[c] === name) return c;
    }
    return -1;
  };
  return { script, sheets, orders, post, col };
}

const payloadFor = (spec: Parameters<typeof snapshotOf>[0], overrides = {}) => buildPayload(orderRecord(overrides), snapshotOf(spec));
const BANDS = ['ĐƠN HÀNG', 'ÁO', 'GILE', 'QUẦN', 'SƠ MI', 'NGUYÊN PHỤ LIỆU', 'GHI NHẬN'];
/** A spreadsheet column letter (0 -> A, 30 -> AE). */
const letter = (i: number): string => (i >= 26 ? letter(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));

describe('the Google Sheets script (Code.gs v5)', () => {
  it('says which version it is, and the setup page takes v4 and later', () => {
    const answer = loadScript().script.doGet().text;
    expect(answer).toMatch(/^OK v5\b/);
    expect(isCurrentScript(answer)).toBe(true);
    expect(isCurrentScript('OK v4 - Minh Quang order sheet is running.')).toBe(true);
    expect(isCurrentScript('OK v3 - Minh Quang order sheet is running.')).toBe(false);
    expect(isCurrentScript('<html>Sign in</html>')).toBe(false);
  });

  it('knows the same layout as the app, for orders from an older app', () => {
    expect(loadScript().script.DEFAULT_LAYOUT).toEqual(sheetLayout());
  });

  it('lays out two header rows: the bands ĐƠN HÀNG › ÁO › GILE › QUẦN › SƠ MI › NGUYÊN PHỤ LIỆU › GHI NHẬN, the names below', () => {
    const { post, orders, col } = loadScript();
    expect(post(payloadFor('suit'))).toEqual({ ok: true, rows: 2 });
    const sheet = orders();
    const [bands, names] = sheet.grid as string[][];
    expect(bands.filter(Boolean)).toEqual(BANDS); // one merged cell per band
    expect(names.slice(0, 7)).toEqual(['Ngày', 'Order ID', 'Tên khách', 'Số điện thoại', 'Sản phẩm', 'Số lượng', 'Ghi chú']);
    expect(names.slice(-2)).toEqual(['Lần xác nhận', 'Mã gửi']);
    // every column of every band is there from the first order, whatever was ordered
    const all = sheetLayout().reduce((n, s) => n + s.columns.length, 0);
    expect(names).toHaveLength(7 + all + 2);
    // the shirt in W–AD, the trims in AE–AF
    expect([letter(col('SƠ MI', 'Chiều dài tay')), letter(col('SƠ MI', 'Vạt áo'))]).toEqual(['W', 'AD']);
    expect([letter(col('NGUYÊN PHỤ LIỆU', 'Loại khuy')), letter(col('NGUYÊN PHỤ LIỆU', 'Khuyết Milan'))]).toEqual(['AE', 'AF']);
    expect([letter(col('GHI NHẬN', 'Lần xác nhận')), letter(col('GHI NHẬN', 'Mã gửi'))]).toEqual(['AG', 'AH']);
    expect(col('GILE', 'Kiểu gile')).toBeGreaterThan(col('ÁO', 'Lót áo'));
    expect(col('QUẦN', 'Xếp ly trước')).toBeGreaterThan(col('GILE', 'Kiểu gile'));
    expect(sheet.frozen).toBe(2);
    expect(sheet.merges.length).toBe(BANDS.length - 1); // GILE is one column wide, nothing to merge
  });

  it("the jacket's chest pocket and the shirt's are two columns, each in its band", () => {
    const { post, orders, col } = loadScript();
    const snap = snapshotOf({ blazer: 1, shirt: 1 });
    snap.selections.shirt1 = { ...snap.selections.shirt1, chestPocket: 'chestPocket.square', pocketFlap: 'pocketFlap.flap' };
    post(buildPayload(orderRecord(), snap));
    const [, , jacket, shirt] = orders().grid as string[][];
    expect(col('ÁO', 'Túi ngực')).not.toBe(col('SƠ MI', 'Túi ngực'));
    expect(jacket[col('ÁO', 'Túi ngực')]).toBe(vi.options['breastPocket.barchetta'].label);
    expect(jacket[col('SƠ MI', 'Túi ngực')]).toBe('');
    expect(shirt[col('SƠ MI', 'Túi ngực')]).toBe('Túi vuông');
    expect(shirt[col('SƠ MI', 'Nắp túi')]).toBe('Có nắp');
    expect(shirt[col('ÁO', 'Túi ngực')]).toBe('');
    // the shirt has no trims; the jacket has them
    expect(shirt[col('NGUYÊN PHỤ LIỆU', 'Loại khuy')]).toBe('');
    expect(jacket[col('NGUYÊN PHỤ LIỆU', 'Loại khuy')]).toBe('Khuy nhựa (tiêu chuẩn)');
  });

  it('one line per kind of piece, with its quantity as a number, its own band tinted', () => {
    const { post, orders, col } = loadScript();
    post(payloadFor({ suit: 1, trousers: 2 }));
    const sheet = orders();
    const rows = sheet.grid.slice(2) as unknown[][];
    expect(rows.map((r) => [r[col('ĐƠN HÀNG', 'Order ID')], r[col('ĐƠN HÀNG', 'Sản phẩm')], r[col('ĐƠN HÀNG', 'Số lượng')]])).toEqual([
      ['MQ-9', 'Áo', 1],
      ['MQ-9', 'Quần', 3],
    ]);
    expect(rows[0][col('ÁO', 'Kiểu cài áo')]).toBe('Một hàng 2 khuy');
    expect(rows[0][col('QUẦN', 'Gấu quần')]).toBe('');
    expect(rows[1][col('QUẦN', 'Gấu quần')]).toBe('Gấu thường');
    expect(rows[1][col('NGUYÊN PHỤ LIỆU', 'Loại khuy')]).toBe('Khuy nhựa (tiêu chuẩn)');
    expect(rows[0][col('GHI NHẬN', 'Mã gửi')]).toBe('sub-9');
    // the trousers line (row 4) is tinted across the QUẦN band
    expect(sheet.backgrounds[`4:${col('QUẦN', 'Xếp ly trước') + 1}:1:5`]).toBe('#f1f8f2');
  });

  it("the sale's note goes in \"Ghi chú\" on every line of the order; an order without one leaves it empty", () => {
    const { post, orders, col } = loadScript();
    post(buildPayload(orderRecord({ note: 'Thêu tên ở cổ tay\nLấy trước 20/12' }), snapshotOf({ suit: 1, shirt: 1 })));
    post(payloadFor('trousers', { submissionId: 'no-note', orderId: 'MQ-10' }));
    const rows = orders().grid.slice(2) as string[][];
    expect(rows.map((r) => r[col('ĐƠN HÀNG', 'Ghi chú')])).toEqual(['Thêu tên ở cổ tay\nLấy trước 20/12', 'Thêu tên ở cổ tay\nLấy trước 20/12', 'Thêu tên ở cổ tay\nLấy trước 20/12', '']);
  });

  it('a tab laid out by v4 (trims before the shirt) has its columns moved, data and all; an older app does not move them back', () => {
    // lay a tab out the v4 way: the app's old order of bands
    const { post, orders, col } = loadScript();
    const v4 = payloadFor({ blazer: 1, shirt: 1 }, { submissionId: 'v4' });
    post(v4);
    const sheet = orders();
    const v4Order = ['ĐƠN HÀNG', 'ÁO', 'GILE', 'QUẦN', 'NGUYÊN PHỤ LIỆU', 'SƠ MI', 'GHI NHẬN'];
    const byBand = (band: string) => sheet.grid.map((row) => (row as unknown[]).filter((_, c) => bandAt(c) === band));
    const bandAt = (c: number) => {
      let current = '';
      for (let i = 0; i <= c; i++) if ((sheet.grid[0] as string[])[i]) current = (sheet.grid[0] as string[])[i];
      return current;
    };
    sheet.grid = sheet.grid.map((row) => v4Order.flatMap((band) => (row as unknown[]).filter((_, c) => bandAt(c) === band)));
    // the merged band cells: only the first of each band keeps its name
    sheet.grid[0] = (sheet.grid[0] as string[]).map((v, i, all) => (i > 0 && all[i - 1] === v ? '' : v));
    expect(col('NGUYÊN PHỤ LIỆU', 'Loại khuy')).toBeLessThan(col('SƠ MI', 'Chiều dài tay'));
    const jacketTrims = (sheet.grid[2] as string[])[col('NGUYÊN PHỤ LIỆU', 'Loại khuy')];

    // an older app sends its layout in the v4 order; the tab follows this script's order all the same
    const older = payloadFor({ blazer: 1, shirt: 1 }, { submissionId: 'older' });
    older.layout = v4Order.flatMap((band) => older.layout.filter((x) => x.name === band));
    expect(post(older)).toEqual({ ok: true, rows: 2 });

    expect((sheet.grid[0] as string[]).filter(Boolean)).toEqual(BANDS);
    expect(letter(col('SƠ MI', 'Chiều dài tay'))).toBe('W');
    expect(letter(col('NGUYÊN PHỤ LIỆU', 'Loại khuy'))).toBe('AE');
    // the first order's cells moved with their columns
    const [, , jacket, shirt, jacket2] = sheet.grid as string[][];
    expect(jacket[col('NGUYÊN PHỤ LIỆU', 'Loại khuy')]).toBe(jacketTrims);
    expect(jacket[col('ÁO', 'Túi ngực')]).toBe(vi.options['breastPocket.barchetta'].label);
    expect(shirt[col('SƠ MI', 'Túi ngực')]).toBe('Không túi');
    expect(shirt[col('NGUYÊN PHỤ LIỆU', 'Loại khuy')]).toBe('');
    expect(jacket2[col('NGUYÊN PHỤ LIỆU', 'Loại khuy')]).toBe(jacketTrims);
    expect(byBand('SƠ MI')[4].every((v) => v === '')).toBe(true); // the second jacket fills no shirt cell
  });

  it('an order delivered twice is stored once', () => {
    const { post, orders } = loadScript();
    const payload = payloadFor('suit3Trousers');
    expect(post(payload)).toEqual({ ok: true, rows: 2 });
    expect(post(payload)).toEqual({ ok: true, duplicate: true });
    expect(orders().grid).toHaveLength(4);
  });

  it('a column the app adds later goes in at the end of its band, and the rows already there stay in line', () => {
    const { post, orders, col } = loadScript();
    post(payloadFor('trousers', { submissionId: 'first', orderId: 'A-1' }));
    const later = payloadFor('trousers', { submissionId: 'second', orderId: 'A-2' });
    later.layout = later.layout.map((s) => (s.name === 'QUẦN' ? { ...s, columns: [...s.columns, 'Đỉa quần'] } : s));
    later.rows[0].cells['QUẦN|Đỉa quần'] = 'Có đỉa';
    post(later);
    const [, , first, second] = orders().grid as string[][];
    expect(col('QUẦN', 'Đỉa quần')).toBe(col('QUẦN', 'Gấu quần') + 1);
    expect(first[col('GHI NHẬN', 'Mã gửi')]).toBe('first');
    expect(first[col('QUẦN', 'Gấu quần')]).toBe('Gấu thường');
    expect(first[col('QUẦN', 'Đỉa quần')]).toBe('');
    expect(second[col('QUẦN', 'Đỉa quần')]).toBe('Có đỉa');
    expect(second[col('GHI NHẬN', 'Mã gửi')]).toBe('second');
  });

  it('a tab in the old (v3) layout is kept as "Đơn hàng (mẫu cũ)", and an order already in it is not stored again', () => {
    const old = new FakeSheet('Đơn hàng');
    old.grid = [
      ['Ngày', 'Order ID', 'Tên khách', 'Số điện thoại', 'Sản phẩm', 'Số lượng', 'Túi ngực', 'Lần xác nhận', 'Mã gửi'],
      ['01/11/2026', 'OLD-1', 'A', '0912', 'Áo', 1, 'Túi hộp', 1, 'sub-old'],
    ];
    const { post, sheets, orders } = loadScript({}, [old]);
    expect(post(payloadFor('suit', { submissionId: 'sub-old' }))).toEqual({ ok: true, duplicate: true });
    expect(post(payloadFor('suit'))).toEqual({ ok: true, rows: 2 });
    expect(sheets.map((s) => s.name)).toEqual(['Đơn hàng (mẫu cũ)', 'Đơn hàng']);
    expect(old.grid[1][1]).toBe('OLD-1');
    expect(orders().grid).toHaveLength(4);
  });

  it('refuses an order with the wrong secret, and accepts the right one', () => {
    const { post, sheets } = loadScript({ SECRET: 'abc' });
    expect(post(payloadFor('trousers'))).toEqual({ ok: false, error: 'unauthorized' });
    expect(sheets).toHaveLength(0);
    expect(post({ ...payloadFor('trousers'), token: 'abc' })).toMatchObject({ ok: true });
  });

  it('still takes an order from an older app: lines by column name only, or one design and no lines', () => {
    const { post, orders, col } = loadScript();
    const v3 = payloadFor({ blazer: 1, shirt: 1 }, { submissionId: 'v3' }) as unknown as Record<string, unknown>;
    delete v3.layout;
    for (const row of v3.rows as Record<string, unknown>[]) delete row.cells;
    expect(post(v3)).toEqual({ ok: true, rows: 2 });
    const legacy = { submissionId: 'old', orderId: 'OLD-1', customerName: 'A', phone: '0912', date: '03/11/2026 09:05', product: 'Suit hai mảnh', revision: 1, design: { 'Kiểu cài áo': 'Một hàng 2 khuy' } };
    expect(post(legacy)).toEqual({ ok: true, rows: 1 });
    const [, , jacket, shirt, old] = orders().grid as string[][];
    expect(jacket[col('ÁO', 'Túi ngực')]).toBe(vi.options['breastPocket.barchetta'].label);
    expect(jacket[col('NGUYÊN PHỤ LIỆU', 'Loại khuy')]).toBe('Khuy nhựa (tiêu chuẩn)');
    expect(shirt[col('SƠ MI', 'Túi ngực')]).toBe('Không túi');
    expect(shirt[col('ÁO', 'Túi ngực')]).toBe('');
    expect(old[col('ÁO', 'Kiểu cài áo')]).toBe('Một hàng 2 khuy');
    expect(old[col('ĐƠN HÀNG', 'Sản phẩm')]).toBe('Suit hai mảnh');
  });
});
