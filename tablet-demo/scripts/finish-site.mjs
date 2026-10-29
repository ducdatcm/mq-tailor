// Last step of `npm run build:site`: the copy of the app that goes on the website must not carry the
// local spreadsheet address (public/config.json is copied into every build). Each tablet gets its own
// address on the setup page (#/setup), or the host can place a config.json next to index.html.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../../tablet-app/', import.meta.url));
writeFileSync(out + 'config.json', JSON.stringify({ orderSheetUrl: '', orderSheetToken: '' }, null, 2) + '\n');
console.log('tablet-app/config.json reset to empty');
