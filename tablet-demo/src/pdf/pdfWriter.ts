/**
 * A one-page PDF holding one JPEG, written by hand (no PDF library): the design sheet is
 * drawn by the browser, so every font and sketch looks exactly as on screen.
 */
const enc = new TextEncoder();

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** A PDF text string: UTF-16BE in hex, so Vietnamese titles survive. */
function pdfText(text: string): string {
  let hex = 'FEFF';
  for (let i = 0; i < text.length; i += 1) hex += text.charCodeAt(i).toString(16).padStart(4, '0');
  return `<${hex}>`;
}

export interface PdfImagePage {
  jpeg: Uint8Array;
  /** Pixel size of the JPEG. */
  width: number;
  height: number;
  /** Page width in PDF points (A4 = 595.28); the height follows the image's proportions. */
  pageWidth?: number;
  title?: string;
}

export function buildImagePdf({ jpeg, width, height, pageWidth = 595.28, title = '' }: PdfImagePage): Uint8Array {
  const w = pageWidth;
  const h = Number(((pageWidth * height) / width).toFixed(2));
  const content = enc.encode(`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`);

  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (n: number, body: (Uint8Array | string)[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    body.forEach(push);
    push('\nendobj\n');
  };

  // the second line is four bytes above 127, which tells tools this file is binary
  parts.push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  length += 15;
  object(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  object(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  object(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`]);
  object(4, [
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    jpeg,
    '\nendstream',
  ]);
  object(5, [`<< /Length ${content.length} >>\nstream\n`, content, '\nendstream']);
  object(6, [`<< /Title ${pdfText(title)} /Producer (Minh Quang design sheet) >>`]);

  const xrefAt = length;
  push('xref\n0 7\n0000000000 65535 f \n');
  for (let n = 1; n <= 6; n += 1) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
  return concat(parts);
}

/** Decodes a data URL (data:image/jpeg;base64,...) into bytes. */
export function dataUrlToBytes(url: string): Uint8Array {
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}
