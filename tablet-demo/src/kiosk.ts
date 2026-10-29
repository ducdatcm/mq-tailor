/**
 * Behaviour for an in-store tablet: the screen stays on, a long press or a drag does not open
 * the browser's menus, and the app keeps working without the internet after its first visit.
 */

/** Minimal shape of the Screen Wake Lock API (not in every TypeScript DOM library). */
interface WakeLockLike {
  request(type: 'screen'): Promise<{ addEventListener(type: 'release', cb: () => void): void }>;
}

export function initKiosk(): void {
  // No "copy / save image" menu on a long press, and no dragging of pictures: only text fields keep theirs.
  document.addEventListener('contextmenu', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('input, textarea')) e.preventDefault();
  });
  document.addEventListener('dragstart', (e) => e.preventDefault());

  // Keep the screen awake while the app is on screen (re-asked after the page was hidden).
  const wakeLock = (navigator as unknown as { wakeLock?: WakeLockLike }).wakeLock;
  let held = false;
  const keepAwake = async () => {
    if (!wakeLock || held || document.visibilityState !== 'visible') return;
    try {
      const lock = await wakeLock.request('screen');
      held = true;
      lock.addEventListener('release', () => {
        held = false;
      });
    } catch {
      /* not allowed right now (e.g. battery saver); tried again on the next touch */
    }
  };
  void keepAwake();
  document.addEventListener('visibilitychange', () => void keepAwake());
  window.addEventListener('pointerdown', () => void keepAwake(), { passive: true });

  // Work offline after the first visit: the service worker keeps a copy of the app on the tablet.
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    });
  }
}
