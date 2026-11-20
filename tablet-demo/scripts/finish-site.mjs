// Last step of `npm run build:site`.
//
// 1. The copy of the app that goes on the website must not carry the local spreadsheet address
//    (public/config.json is copied into every build). Each tablet gets its own address on the setup
//    page (#/setup), or the host can place a config.json next to index.html.
// 2. options.json lists every choice the app offers (piece › group › option, Vietnamese names), so the
//    website's Media Library can offer them when a photo is linked to a choice.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GROUP_LIST, PRODUCT_IDS, PRODUCTS } from '../src/catalog/catalog.ts';
import { vi } from '../src/content/vi.ts';

const out = fileURLToPath(new URL('../../tablet-app/', import.meta.url));
writeFileSync(out + 'config.json', JSON.stringify({ orderSheetUrl: '', orderSheetToken: '' }, null, 2) + '\n');
console.log('tablet-app/config.json reset to empty');

// pieces of the products on offer (in catalogue order), then the trims shared by the order
const garments = [...new Set(PRODUCT_IDS.flatMap((p) => PRODUCTS[p].pieces)), 'trims'];
const options = {
  garments: garments.map((garment) => ({
    id: garment,
    name: vi.garments[garment],
    groups: GROUP_LIST.filter((g) => g.garment === garment).map((g) => ({
      id: g.id,
      name: vi.groups[g.id].name,
      options: g.options.map((o) => ({ id: o, label: vi.options[o].label })),
    })),
  })),
};
writeFileSync(out + 'options.json', JSON.stringify(options, null, 2) + '\n');
console.log(`tablet-app/options.json: ${options.garments.reduce((n, g) => n + g.groups.reduce((m, gr) => m + gr.options.length, 0), 0)} choices`);
