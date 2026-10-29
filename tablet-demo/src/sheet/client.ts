import { loadSheetConfig } from './config';
import type { SheetPayload } from './payload';

const QUEUE_KEY = 'mq-tablet-demo/order-queue/v1';
const MAX_QUEUED = 100;
const TIMEOUT_MS = 15000;

export type SendOutcome = 'sent' | 'queued' | 'unconfigured';

function readQueue(): SheetPayload[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as SheetPayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SheetPayload[]): void {
  try {
    if (queue.length === 0) window.localStorage.removeItem(QUEUE_KEY);
    else window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUED)));
  } catch {
    /* storage unavailable: the order is still on screen, and can be sent again */
  }
}

export const queuedCount = () => readQueue().length;

/** Posts one row. Resolves true only when the script answered { ok: true }. */
async function post(url: string, payload: SheetPayload): Promise<boolean> {
  const ctl = new AbortController();
  const timer = window.setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    // text/plain keeps this a "simple" request, so the browser sends no CORS preflight
    // (Apps Script web apps do not answer one).
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ctl.signal,
      redirect: 'follow',
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Sends everything waiting in the queue, oldest first; stops at the first failure. */
export async function flushQueue(): Promise<number> {
  const { orderSheetUrl } = await loadSheetConfig();
  if (!orderSheetUrl) return 0;
  let sent = 0;
  for (const item of readQueue()) {
    if (!(await post(orderSheetUrl, item))) break;
    writeQueue(readQueue().filter((q) => q.submissionId !== item.submissionId));
    sent += 1;
  }
  return sent;
}

/**
 * Sends an order row. If the spreadsheet cannot be reached the row is kept on this device and
 * retried later; the script ignores a submissionId it has already stored, so a row that did
 * arrive but whose answer was lost is never written twice.
 */
export async function sendOrder(payload: SheetPayload): Promise<SendOutcome> {
  const { orderSheetUrl, orderSheetToken } = await loadSheetConfig();
  if (!orderSheetUrl) return 'unconfigured';
  const withToken = orderSheetToken ? { ...payload, token: orderSheetToken } : payload;
  if (await post(orderSheetUrl, withToken)) {
    void flushQueue();
    return 'sent';
  }
  const queue = readQueue().filter((q) => q.submissionId !== payload.submissionId);
  writeQueue([...queue, withToken]);
  return 'queued';
}
