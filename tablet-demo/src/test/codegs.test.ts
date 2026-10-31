import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPayload } from '../sheet/payload';
import { orderRecord, snapshotOf } from './helpers';

/** A tiny in-memory stand-in for the part of Google's spreadsheet API that Code.gs uses. */
class FakeSheet {
  grid: unknown[][] = [];
  maxColumns = 6;
  frozen = 0;
  formats: Record<string, string> = {};
  getLastRow() {
    return this.grid.length;
  }
  getLastColumn() {
    return this.grid.reduce((n, row) => Math.max(n, row.length), 0);
  }
  getMaxColumns() {
    return Math.max(this.maxColumns, this.getLastColumn());
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
  getRange(row: number, col: number, rows = 1, cols = 1) {
    const sheet = this;
    return {
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
        sheet.formats[`${row}:${col}:${cols}`] = f;
      },
      setFontWeight: () => undefined,
      setValue: () => undefined,
    };
  }
}

function loadScript(properties: Record<string, string> = {}) {
  const sheet = new FakeSheet();
  const book = { getSheetByName: () => null as FakeSheet | null, insertSheet: () => sheet };
  let created = false;
  book.getSheetByName = () => (created ? sheet : null);
  book.insertSheet = () => {
    created = true;
    return sheet;
  };
  const source = readFileSync(join(process.cwd(), 'docs', 'google-sheets', 'Code.gs'), 'utf8');
  const factory = new Function(
    'SpreadsheetApp',
    'LockService',
    'PropertiesService',
    'ContentService',
    'Utilities',
    `${source}\nreturn { doGet, doPost };`,
  );
  const script = factory(
    { getActiveSpreadsheet: () => book },
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
  ) as { doGet: () => { text: string }; doPost: (e: { postData: { contents: string } }) => { text: string } };
  const post = (payload: unknown) => JSON.parse(script.doPost({ postData: { contents: JSON.stringify(payload) } }).text) as Record<string, unknown>;
  return { script, sheet, post };
}

const payloadFor = (spec: Parameters<typeof snapshotOf>[0], overrides = {}) => buildPayload(orderRecord(overrides), snapshotOf(spec));

describe('the Google Sheets script (Code.gs)', () => {
  it('says which version it is, for the setup page', () => {
    expect(loadScript().script.doGet().text).toMatch(/^OK v3\b/);
  });

  it('writes the template: Ngày, Order ID, Tên khách, Số điện thoại, Sản phẩm, Số lượng, the design columns, then the technical ones', () => {
    const { post, sheet } = loadScript();
    expect(post(payloadFor('suit'))).toEqual({ ok: true, rows: 2 });
    const headers = sheet.grid[0] as string[];
    expect(headers.slice(0, 6)).toEqual(['Ngày', 'Order ID', 'Tên khách', 'Số điện thoại', 'Sản phẩm', 'Số lượng']);
    expect(headers.slice(-2)).toEqual(['Lần xác nhận', 'Mã gửi']);
    expect(headers).toContain('Kiểu cài áo');
    expect(headers).toContain('Gấu quần');
    expect(headers).toContain('Loại khuy');
  });

  it('one line per kind of piece, with its quantity as a number', () => {
    const { post, sheet } = loadScript();
    post(payloadFor({ suit: 1, trousers: 2 }));
    const headers = sheet.grid[0] as string[];
    const col = (name: string) => headers.indexOf(name);
    expect(sheet.grid).toHaveLength(3);
    expect(sheet.grid.slice(1).map((r) => [r[col('Order ID')], r[col('Sản phẩm')], r[col('Số lượng')]])).toEqual([
      ['MQ-9', 'Áo', 1],
      ['MQ-9', 'Quần', 3],
    ]);
    expect(sheet.grid[1][col('Kiểu cài áo')]).toBe('Một hàng 2 khuy');
    expect(sheet.grid[1][col('Gấu quần')]).toBe(''); // a jacket has no trousers hem
    expect(sheet.grid[2][col('Gấu quần')]).toBe('Gấu thường');
    expect(sheet.grid[2][col('Loại khuy')]).toBe('Khuy nhựa (tiêu chuẩn)'); // the trims are on every line
    expect(sheet.grid[1][col('Mã gửi')]).toBe('sub-9');
  });

  it('an order delivered twice is stored once', () => {
    const { post, sheet } = loadScript();
    const payload = payloadFor('suit3Trousers');
    expect(post(payload)).toEqual({ ok: true, rows: 2 });
    expect(post(payload)).toEqual({ ok: true, duplicate: true });
    expect(sheet.grid).toHaveLength(3);
  });

  it('a new kind of piece adds its columns before the technical ones, and keeps old rows in line', () => {
    const { post, sheet } = loadScript();
    post(payloadFor('trousers', { submissionId: 'first', orderId: 'A-1' }));
    post(payloadFor('shirt', { submissionId: 'second', orderId: 'A-2' }));
    const headers = sheet.grid[0] as string[];
    const col = (name: string) => headers.indexOf(name);
    expect(headers.slice(-2)).toEqual(['Lần xác nhận', 'Mã gửi']);
    expect(col('Kiểu cổ áo')).toBeGreaterThan(col('Gấu quần'));
    expect(col('Kiểu cổ áo')).toBeLessThan(col('Lần xác nhận'));
    // the first order's row still has its id under "Mã gửi"
    expect(sheet.grid[1][col('Mã gửi')]).toBe('first');
    expect(sheet.grid[1][col('Order ID')]).toBe('A-1');
    expect(sheet.grid[2][col('Mã gửi')]).toBe('second');
    expect(sheet.grid[2][col('Sản phẩm')]).toBe('Sơ mi');
    expect(sheet.grid[2][col('Kiểu cổ áo')]).toBe('Cổ vuông tiêu chuẩn');
    expect(sheet.grid[1][col('Kiểu cổ áo')]).toBe('');
  });

  it('refuses an order with the wrong secret, and accepts the right one', () => {
    const { post, sheet } = loadScript({ SECRET: 'abc' });
    expect(post(payloadFor('trousers'))).toEqual({ ok: false, error: 'unauthorized' });
    expect(sheet.grid).toHaveLength(0);
    expect(post({ ...payloadFor('trousers'), token: 'abc' })).toMatchObject({ ok: true });
  });

  it('still takes an order saved on a tablet by an older app (one design, no lines)', () => {
    const { post, sheet } = loadScript();
    const legacy = { submissionId: 'old', orderId: 'OLD-1', customerName: 'A', phone: '0912', date: '03/11/2026 09:05', product: 'Suit hai mảnh', revision: 1, design: { 'Kiểu cài áo': 'Một hàng 2 khuy' } };
    expect(post(legacy)).toEqual({ ok: true, rows: 1 });
    const headers = sheet.grid[0] as string[];
    expect(sheet.grid[1][headers.indexOf('Kiểu cài áo')]).toBe('Một hàng 2 khuy');
    expect(sheet.grid[1][headers.indexOf('Sản phẩm')]).toBe('Suit hai mảnh');
  });
});
