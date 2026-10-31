// A stand-in for the Google Apps Script web app, for trying the order flow without Google.
// It answers the same way (POST a JSON order as text/plain, get { ok: true, rows: n }), ignores a
// submissionId it has already stored, and keeps the orders in memory (each has its lines in `rows`).
//
//   node scripts/mock-sheet-server.mjs [port]      -> http://localhost:8787
//   GET /rows    the rows received so far (JSON)
//   POST /reset  forget them
import { createServer } from 'node:http';

export function startMockSheet(port = 8787) {
  const rows = [];
  const server = createServer((req, res) => {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
    const send = (code, body) => {
      res.writeHead(code, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    if (req.method === 'OPTIONS') return send(204, {});
    if (req.method === 'GET' && (req.url === '/' || req.url === '/exec')) {
      res.writeHead(200, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('OK v3 - Minh Quang order sheet is running.');
    }
    if (req.method === 'GET' && req.url === '/rows') return send(200, rows);
    if (req.method === 'POST' && req.url === '/reset') {
      rows.length = 0;
      return send(200, { ok: true });
    }
    if (req.method === 'POST') {
      let text = '';
      req.on('data', (c) => (text += c));
      req.on('end', () => {
        try {
          const data = JSON.parse(text);
          if (!data.submissionId || !data.orderId) return send(200, { ok: false, error: 'missing fields' });
          if (rows.some((r) => r.submissionId === data.submissionId)) return send(200, { ok: true, duplicate: true });
          rows.push(data);
          send(200, { ok: true, rows: Array.isArray(data.rows) ? data.rows.length : 1 });
        } catch (err) {
          send(200, { ok: false, error: String(err) });
        }
      });
      return;
    }
    send(404, { ok: false });
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, rows, port })));
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const port = Number(process.argv[2]) || 8787;
  await startMockSheet(port);
  console.log(`Mock order sheet listening on http://localhost:${port}  (GET /rows to see what it received)`);
}
