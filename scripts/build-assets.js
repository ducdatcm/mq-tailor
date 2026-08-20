/**
 * Minifies public/css/style.css -> style.min.css and public/js/main.js ->
 * main.min.js. Run automatically as part of deploy (`npm run build`).
 * Source files stay untouched and tracked in git; the .min files are
 * git-ignored and regenerated on every deploy.
 */
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

async function buildCss() {
  const src = path.join(__dirname, '..', 'public', 'css', 'style.css');
  const out = path.join(__dirname, '..', 'public', 'css', 'style.min.css');
  const input = fs.readFileSync(src, 'utf8');
  const output = new CleanCSS({ level: 2 }).minify(input);
  if (output.errors.length) throw new Error(output.errors.join('\n'));
  fs.writeFileSync(out, output.styles);
  console.log(`CSS: ${input.length} -> ${output.styles.length} bytes`);
}

async function buildJs() {
  const src = path.join(__dirname, '..', 'public', 'js', 'main.js');
  const out = path.join(__dirname, '..', 'public', 'js', 'main.min.js');
  const input = fs.readFileSync(src, 'utf8');
  const result = await minify(input);
  fs.writeFileSync(out, result.code);
  console.log(`JS: ${input.length} -> ${result.code.length} bytes`);
}

Promise.all([buildCss(), buildJs()])
  .then(() => console.log('Asset build complete.'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
