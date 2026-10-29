/**
 * Where order rows are sent. Read at run time from ./config.json (next to index.html) so the
 * house can set it on the host without rebuilding the app, or typed once on the tablet itself
 * (the staff setup page, #/setup), which is kept on the device and wins over config.json.
 * Leave the address empty to run without a spreadsheet connection.
 */
export interface SheetConfig {
  /** The Google Apps Script web app URL (see docs/google-sheets/GUIDE.md). */
  orderSheetUrl: string;
  /** Optional shared secret, also set in the script's properties. */
  orderSheetToken: string;
}

const EMPTY: SheetConfig = { orderSheetUrl: '', orderSheetToken: '' };
const LOCAL_KEY = 'mq-tablet-demo/sheet-config/v1';
let cached: Promise<SheetConfig> | null = null;

/** The address typed on this device, if any. */
export function readLocalSheetConfig(): SheetConfig | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<SheetConfig>;
    const url = typeof c.orderSheetUrl === 'string' ? c.orderSheetUrl.trim() : '';
    return url ? { orderSheetUrl: url, orderSheetToken: typeof c.orderSheetToken === 'string' ? c.orderSheetToken.trim() : '' } : null;
  } catch {
    return null;
  }
}

/** Keeps the address on this device (null forgets it, so config.json applies again). */
export function saveLocalSheetConfig(config: SheetConfig | null): void {
  try {
    if (config && config.orderSheetUrl.trim()) {
      window.localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify({ orderSheetUrl: config.orderSheetUrl.trim(), orderSheetToken: config.orderSheetToken.trim() }),
      );
    } else {
      window.localStorage.removeItem(LOCAL_KEY);
    }
  } catch {
    /* storage unavailable */
  }
  cached = null;
}

export function loadSheetConfig(): Promise<SheetConfig> {
  cached ??= fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    .then((r): Promise<Partial<SheetConfig>> => (r.ok ? r.json() : Promise.resolve({})))
    .then((c) => ({
      orderSheetUrl: typeof c.orderSheetUrl === 'string' ? c.orderSheetUrl.trim() : '',
      orderSheetToken: typeof c.orderSheetToken === 'string' ? c.orderSheetToken.trim() : '',
    }))
    .catch(() => EMPTY)
    .then((fromFile) => readLocalSheetConfig() ?? fromFile);
  return cached;
}

/** For tests. */
export function resetSheetConfig(): void {
  cached = null;
}
