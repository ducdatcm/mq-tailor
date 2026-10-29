const pad = (n: number) => String(n).padStart(2, '0');

/** dd/MM/yyyy, from the device clock. */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** dd/MM/yyyy HH:mm, from the device clock. */
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${formatDate(ms)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A file-name-safe version of an order ID. */
export function safeFileName(text: string): string {
  const s = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, 40) || 'don';
}
