/**
 * Where order rows are sent. Read at run time from ./config.json (next to index.html) so the
 * house can set it on the host without rebuilding the app. Leave orderSheetUrl empty to run
 * without a spreadsheet connection.
 */
export interface SheetConfig {
  /** The Google Apps Script web app URL (see docs/google-sheets/GUIDE.md). */
  orderSheetUrl: string;
  /** Optional shared secret, also set in the script's properties. */
  orderSheetToken: string;
}

const EMPTY: SheetConfig = { orderSheetUrl: '', orderSheetToken: '' };
let cached: Promise<SheetConfig> | null = null;

export function loadSheetConfig(): Promise<SheetConfig> {
  cached ??= fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    .then((r): Promise<Partial<SheetConfig>> => (r.ok ? r.json() : Promise.resolve({})))
    .then((c) => ({
      orderSheetUrl: typeof c.orderSheetUrl === 'string' ? c.orderSheetUrl.trim() : '',
      orderSheetToken: typeof c.orderSheetToken === 'string' ? c.orderSheetToken.trim() : '',
    }))
    .catch(() => EMPTY);
  return cached;
}

/** For tests. */
export function resetSheetConfig(): void {
  cached = null;
}
