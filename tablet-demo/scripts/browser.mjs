// Shared helper: drive the app in a locally installed Chrome/Edge (no browser download needed).
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

export async function launch() {
  const executablePath = CANDIDATES.find((p) => existsSync(p));
  if (!executablePath) throw new Error('No Chrome/Edge found. Set BROWSER_PATH to a browser executable.');
  return chromium.launch({ executablePath, headless: true });
}

export const BASE_URL = process.env.DEMO_URL ?? 'http://localhost:5173/';

export const VIEWPORTS = {
  'tablet-1024x768': { width: 1024, height: 768 },
  'tablet-1280x800': { width: 1280, height: 800 },
  'portrait-768x1024': { width: 768, height: 1024 },
};

export async function newPage(browser, viewport) {
  const context = await browser.newContext({ viewport, hasTouch: true, deviceScaleFactor: 1, locale: 'vi-VN' });
  const page = await context.newPage();
  return { context, page };
}
