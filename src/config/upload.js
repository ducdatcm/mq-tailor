const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const slugify = require('slugify');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'public', 'uploads');
const RESPONSIVE_WIDTHS = [480, 768, 1200, 1920, 2560];

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 }, // 40MB — originals can be large DSLR files, kept as-is
  fileFilter: (req, file, cb) => {
    const ok = Object.prototype.hasOwnProperty.call(EXT_BY_MIME, file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG or WebP images are accepted.'), ok);
  },
});

/**
 * Saves an uploaded image twice:
 *  1. The exact original bytes, untouched — the permanent master copy, kept
 *     for reprints/marketing/anything beyond the website itself.
 *  2. A set of responsive WebP variants for the site to actually display,
 *     meeting the brief's "modern image formats, responsive image sizes,
 *     lazy loading" performance requirement without the page ever loading
 *     a full-resolution file it doesn't need.
 * Returns metadata ready to insert into `media`.
 */
async function processAndSaveImage(buffer, originalName, mimetype, group = 'other') {
  const groupDir = path.join(UPLOAD_ROOT, group);
  const originalsDir = path.join(groupDir, 'originals');
  fs.mkdirSync(groupDir, { recursive: true });
  fs.mkdirSync(originalsDir, { recursive: true });

  const base = slugify(path.parse(originalName).name, { lower: true, strict: true }) || 'image';
  const stamp = Date.now();
  const filename = `${base}-${stamp}`;

  // 1. Master copy — written as-is, no resizing or re-encoding.
  const ext = EXT_BY_MIME[mimetype] || path.extname(originalName) || '.jpg';
  const originalFilename = `${filename}-original${ext}`;
  fs.writeFileSync(path.join(originalsDir, originalFilename), buffer);
  const originalPath = `/uploads/${group}/originals/${originalFilename}`;

  // 2. Responsive display variants.
  const image = sharp(buffer).rotate(); // rotate() auto-orients from EXIF
  const meta = await image.metadata();
  const originalWidth = meta.width || 1920;
  const originalHeight = meta.height || 1080;

  const widths = RESPONSIVE_WIDTHS.filter((w) => w <= originalWidth);
  if (widths.length === 0) widths.push(originalWidth);

  const variants = { webp: {} };

  await Promise.all(
    widths.map(async (w) => {
      const outPath = path.join(groupDir, `${filename}-${w}.webp`);
      await sharp(buffer)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outPath);
      variants.webp[w] = `/uploads/${group}/${filename}-${w}.webp`;
    })
  );

  return {
    filename,
    group,
    width: originalWidth,
    height: originalHeight,
    variants,
    originalPath,
  };
}

module.exports = { upload, processAndSaveImage, RESPONSIVE_WIDTHS };
