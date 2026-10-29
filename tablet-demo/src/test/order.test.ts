import { afterEach, beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import { formatDate, formatDateTime, safeFileName } from '../order/format';
import { cleanOrder, isOrderValid, validateOrder } from '../order/validate';
import { buildImagePdf } from '../pdf/pdfWriter';
import { flushQueue, queuedCount, sendOrder } from '../sheet/client';
import { resetSheetConfig } from '../sheet/config';
import { buildPayload } from '../sheet/payload';
import { presetSelections, relevantSelections } from '../catalog/rules';
import type { OrderRecord, Snapshot } from '../state/types';

describe('order validation', () => {
  const ok = { orderId: 'MQ-1', customerName: 'Lan', phone: '0912 345 678' };

  it('accepts a normal order and common phone formats', () => {
    expect(isOrderValid(ok)).toBe(true);
    for (const phone of ['0912345678', '+84 912 345 678', '(024) 3825.1234', '024-3825-1234']) {
      expect(validateOrder({ ...ok, phone })).toEqual({});
    }
  });

  it('asks for each missing field, ignoring blanks made of spaces', () => {
    expect(validateOrder({ orderId: ' ', customerName: '', phone: '  ' })).toEqual({
      orderId: 'required',
      customerName: 'required',
      phone: 'required',
    });
  });

  it('rejects phone numbers that are too short, too long or contain letters', () => {
    for (const phone of ['1234567', '1234567890123456', '09123abc78', '--------', 'điện thoại']) {
      expect(validateOrder({ ...ok, phone }).phone).toBe('phoneInvalid');
    }
  });

  it('limits the length of each field', () => {
    expect(validateOrder({ ...ok, orderId: 'x'.repeat(41) }).orderId).toBe('tooLong');
    expect(validateOrder({ ...ok, customerName: 'x'.repeat(81) }).customerName).toBe('tooLong');
  });

  it('tidies spacing before saving', () => {
    expect(cleanOrder({ orderId: '  A 1 ', customerName: ' Trần   Thị  B ', phone: ' 0912   345 ' })).toEqual({
      orderId: 'A 1',
      customerName: 'Trần Thị B',
      phone: '0912 345',
    });
  });
});

describe('dates and file names', () => {
  it('formats the device date as dd/MM/yyyy', () => {
    const d = new Date(2026, 10, 3, 9, 5).getTime();
    expect(formatDate(d)).toBe('03/11/2026');
    expect(formatDateTime(d)).toBe('03/11/2026 09:05');
  });

  it('makes order IDs safe for file names', () => {
    expect(safeFileName('MQ/2026 Đơn #12')).toBe('MQ-2026-Don-12');
    expect(safeFileName('///')).toBe('don');
  });
});

const snapshot = (product: 'suit' | 'trousers' = 'suit'): Snapshot => ({
  revision: 2,
  confirmedAt: 1,
  product,
  selections: relevantSelections(product, presetSelections(product)),
  previousSelections: null,
});
const order: OrderRecord = {
  orderId: 'MQ-1',
  customerName: 'Nguyễn Văn A',
  phone: '0912345678',
  revision: 2,
  confirmedAt: new Date(2026, 10, 3, 9, 5).getTime(),
  submissionId: 'sub-1',
};

describe('spreadsheet row', () => {
  it('has the four order fields, the product, the version and one column per design group, in Vietnamese', () => {
    const p = buildPayload(order, snapshot('suit'));
    expect(p).toMatchObject({
      submissionId: 'sub-1',
      date: '03/11/2026 09:05',
      orderId: 'MQ-1',
      customerName: 'Nguyễn Văn A',
      phone: '0912345678',
      product: 'Suit hai mảnh',
      revision: 2,
    });
    expect(Object.keys(p.design)).toHaveLength(16);
    expect(p.design['Kiểu cài áo']).toBe('Một hàng 2 khuy');
    expect(p.design['Gấu quần']).toBe('Gấu thường');
  });

  it('only has the groups of the product', () => {
    expect(Object.keys(buildPayload(order, snapshot('trousers')).design)).toHaveLength(7);
  });
});

describe('sending to the spreadsheet', () => {
  const payload = buildPayload(order, snapshot());
  let calls: { url: string; body: string }[];

  const mockFetch = (handler: (url: string, init?: RequestInit) => Promise<Response> | Response) => {
    globalThis.fetch = vitest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('config.json')) {
        return new Response(JSON.stringify({ orderSheetUrl: 'https://script.example/exec', orderSheetToken: 'tok' }));
      }
      calls.push({ url, body: String(init?.body) });
      return handler(url, init);
    }) as typeof fetch;
  };

  beforeEach(() => {
    calls = [];
    window.localStorage.clear();
    resetSheetConfig();
  });
  afterEach(() => {
    vitest.restoreAllMocks();
  });

  it('is sent once with the shared secret, as plain text so no preflight is needed', async () => {
    mockFetch(() => new Response(JSON.stringify({ ok: true })));
    expect(await sendOrder(payload)).toBe('sent');
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0].body)).toMatchObject({ submissionId: 'sub-1', token: 'tok', orderId: 'MQ-1' });
    expect(queuedCount()).toBe(0);
  });

  it('is kept on the device when the spreadsheet cannot be reached, and sent later without duplicates', async () => {
    mockFetch(() => {
      throw new TypeError('offline');
    });
    expect(await sendOrder(payload)).toBe('queued');
    expect(await sendOrder(payload)).toBe('queued'); // retrying the same order does not queue it twice
    expect(queuedCount()).toBe(1);

    mockFetch(() => new Response(JSON.stringify({ ok: true })));
    expect(await flushQueue()).toBe(1);
    expect(queuedCount()).toBe(0);
  });

  it('treats an answer that is not { ok: true } as a failure', async () => {
    mockFetch(() => new Response(JSON.stringify({ ok: false, error: 'bad token' })));
    expect(await sendOrder(payload)).toBe('queued');
  });

  it('does nothing when no spreadsheet is configured', async () => {
    globalThis.fetch = vitest.fn(async () => new Response(JSON.stringify({ orderSheetUrl: '' }))) as typeof fetch;
    expect(await sendOrder(payload)).toBe('unconfigured');
    expect(queuedCount()).toBe(0);
  });
});

describe('PDF file', () => {
  it('is a valid one-page PDF around the image, with a correct cross-reference table', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 0xff, 0xd9]);
    const bytes = buildImagePdf({ jpeg, width: 1985, height: 2808, title: 'Phiếu thiết kế MQ-1' });
    const text = new TextDecoder('latin1').decode(bytes);

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('/Count 1');
    expect(text).toContain('/Filter /DCTDecode');
    expect(text).toContain('/Width 1985 /Height 2808');
    expect(text).toContain(`/Length ${jpeg.length}`);
    // page is A4 wide and as tall as the image's proportions
    expect(text).toContain('/MediaBox [0 0 595.28 842.0');

    // every xref offset points at the start of its object
    const xrefAt = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(xrefAt, xrefAt + 4)).toBe('xref');
    const entries = [...text.slice(xrefAt).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]));
    expect(entries).toHaveLength(6);
    entries.forEach((offset, i) => expect(text.slice(offset, offset + 8)).toBe(`${i + 1} 0 obj\n`));
  });
});
