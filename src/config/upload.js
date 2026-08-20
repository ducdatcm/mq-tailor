const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const slugify = require('slugify');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'public', 'uploads');
const RESPONSIVE_WIDTHS = [480, 768, 1200, 1920];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB — originals can be large, we downsize server-side
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG or WebP images are accepted.'), ok);
  },
});

/**
 * Processes an uploaded image buffer into a set of responsive WebP variants
 * (meets the brief's "modern image formats, responsive image sizes, lazy
 * loading" performance requirement) and saves them under
 * public/uploads/<group>/. Returns metadata ready to insert into `media`.
 */
async function processAndSaveImage(buffer, originalName, group = 'other') {
  const groupDir = path.join(UPLOAD_ROOT, group);
  fs.mkdirSync(groupDir, { recursive: true });

  const base = slugify(path.parse(originalName).name, { lower: true, strict: true }) || 'image';
  const stamp = Date.now();
  const filename = `${base}-${stamp}`;

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
        .webp({ quality: 78 })
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
  };
}

module.exports = { upload, processAndSaveImage, RESPONSIVE_WIDTHS };
