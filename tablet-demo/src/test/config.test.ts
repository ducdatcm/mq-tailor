import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSheetConfig, readLocalSheetConfig, resetSheetConfig, saveLocalSheetConfig } from '../sheet/config';

const fromFile = { orderSheetUrl: 'https://script.example/file/exec', orderSheetToken: 'file-token' };

describe('spreadsheet address of this tablet', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetSheetConfig();
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(fromFile))) as unknown as typeof fetch;
  });
  afterEach(() => window.localStorage.clear());

  it('uses config.json when nothing was typed on the tablet', async () => {
    expect(await loadSheetConfig()).toEqual(fromFile);
  });

  it('what was typed on the tablet wins, and forgetting it brings config.json back', async () => {
    saveLocalSheetConfig({ orderSheetUrl: '  https://script.example/local/exec ', orderSheetToken: ' secret ' });
    expect(readLocalSheetConfig()).toEqual({ orderSheetUrl: 'https://script.example/local/exec', orderSheetToken: 'secret' });
    expect(await loadSheetConfig()).toEqual({ orderSheetUrl: 'https://script.example/local/exec', orderSheetToken: 'secret' });
    saveLocalSheetConfig(null);
    expect(readLocalSheetConfig()).toBeNull();
    expect(await loadSheetConfig()).toEqual(fromFile);
  });

  it('an empty address is not kept', () => {
    saveLocalSheetConfig({ orderSheetUrl: '   ', orderSheetToken: 'x' });
    expect(readLocalSheetConfig()).toBeNull();
  });
});
