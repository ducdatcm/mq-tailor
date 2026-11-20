import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import { App } from '../App';
import { vi } from '../content/vi';
import { refreshOptionPhotos, setOptionPhotosForTest } from '../photos/optionPhotos';

const photo = (id: number, extra = {}) => ({
  id,
  src: `api/photo/${id}/1200.webp`,
  width: 1200,
  height: 800,
  altVi: `Ảnh ${id}: ve nhọn`,
  altEn: `Photo ${id}: peak lapel`,
  focalX: 40,
  focalY: 30,
  ...extra,
});

const json = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));

beforeEach(() => {
  window.location.hash = '';
  localStorage.clear();
  setOptionPhotosForTest({});
});
afterEach(() => {
  vitest.unstubAllGlobals();
});

async function openClosure(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(document.querySelector<HTMLButtonElement>('[data-product="blazer"]')!);
  await user.click(screen.getByRole('button', { name: vi.start.cta }));
}

describe('real photos of the choices, from the website Media Library', () => {
  it('marks the choices that have photos and shows them beside the drawing when enlarged', async () => {
    vitest.stubGlobal('fetch', vitest.fn(() => json({ photos: { 'closure.sb2': [photo(7), photo(9)] } })));
    const user = userEvent.setup();
    await openClosure(user);

    await waitFor(() => expect(document.querySelectorAll('[data-has-photos]')).toHaveLength(1));
    const card = document.querySelector('[data-option="closure.sb2"]')!;
    expect(within(card as HTMLElement).getByText(vi.configure.hasPhotos)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Phóng to hình: Một hàng 2 khuy/ }));
    const dialog = screen.getByRole('dialog');
    const img = within(dialog).getByRole('img', { name: 'Ảnh 7: ve nhọn' });
    expect(img).toHaveAttribute('src', 'api/photo/7/1200.webp');
    expect(within(dialog).getByText('Ảnh 1/2')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: vi.configure.nextPhoto }));
    expect(within(dialog).getByRole('img', { name: 'Ảnh 9: ve nhọn' })).toBeInTheDocument();
    expect(within(dialog).getByText('Ảnh 2/2')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: vi.configure.nextPhoto }));
    expect(within(dialog).getByText('Ảnh 1/2')).toBeInTheDocument();
  });

  it('a choice without photos enlarges to its drawing alone', async () => {
    vitest.stubGlobal('fetch', vitest.fn(() => json({ photos: { 'closure.sb2': [photo(7)] } })));
    const user = userEvent.setup();
    await openClosure(user);
    await user.click(screen.getByRole('button', { name: /Phóng to hình: Một hàng 1 khuy/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('[data-photo-viewer]')).toBeNull();
  });

  it('ignores malformed entries, and keeps the saved list when the website cannot be reached', async () => {
    vitest.stubGlobal(
      'fetch',
      vitest.fn(() => json({ photos: { 'closure.sb2': [photo(7, { src: 'https://elsewhere.example/x.jpg' })], 'lapel.peak': [photo(3)] } })),
    );
    await act(() => refreshOptionPhotos());
    const saved = JSON.parse(localStorage.getItem('mq-tablet-demo/option-photos')!);
    expect(Object.keys(saved.photos)).toEqual(['lapel.peak']);

    vitest.stubGlobal('fetch', vitest.fn(() => Promise.reject(new TypeError('offline'))));
    await act(() => refreshOptionPhotos());
    expect(JSON.parse(localStorage.getItem('mq-tablet-demo/option-photos')!).photos['lapel.peak']).toHaveLength(1);
  });

  it('works without a website behind it: no photos, nothing breaks', async () => {
    vitest.stubGlobal('fetch', vitest.fn(() => Promise.resolve(new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } }))));
    const user = userEvent.setup();
    await openClosure(user);
    expect(document.querySelectorAll('[data-has-photos]')).toHaveLength(0);
  });

  it('rejects a full-screen copy that does not come from the website', async () => {
    vitest.stubGlobal('fetch', vitest.fn(() => json({ photos: { 'lapel.peak': [photo(3, { full: { src: 'https://elsewhere.example/big.jpg', width: 1920, height: 1280 } })], 'lapel.notch': [photo(4, { full: { src: 'api/photo/4/1920.webp', width: 1920, height: 1280 } })] } })));
    await act(() => refreshOptionPhotos());
    expect(Object.keys(JSON.parse(localStorage.getItem('mq-tablet-demo/option-photos')!).photos)).toEqual(['lapel.notch']);
  });

  it('the setup page says how many photo files are kept on the tablet', async () => {
    vitest.stubGlobal('fetch', vitest.fn(() => json({ photos: {} })));
    window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    window.location.hash = '#/setup';
    render(<App />);
    await waitFor(() => expect(document.querySelector('[data-photo-status]')).toHaveTextContent('Chưa có ảnh nào được gắn'));
  });
});
