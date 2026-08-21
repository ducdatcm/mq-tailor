const db = require('../../config/db');
const { processAndSaveImage } = require('../../config/upload');
const { deleteObjectByUrl } = require('../../config/storage');

const GROUPS = ['house', 'workshop', 'people', 'garments', 'fitting', 'cloth', 'hanoi', 'journal', 'other'];

async function list(req, res, next) {
  try {
    const group = GROUPS.includes(req.query.group) ? req.query.group : null;
    const query = db('media').orderBy('created_at', 'desc');
    if (group) query.where({ group });
    const media = await query;
    res.render('admin/media/list', { title: 'Media Library', media, groups: GROUPS, activeGroup: group });
  } catch (err) {
    next(err);
  }
}

async function upload(req, res, next) {
  try {
    if (!req.file) {
      req.flash('error', 'Choose an image to upload.');
      return res.redirect('/admin/media');
    }
    const group = GROUPS.includes(req.body.group) ? req.body.group : 'other';
    const result = await processAndSaveImage(req.file.buffer, req.file.originalname, req.file.mimetype, group);

    await db('media').insert({
      filename: result.filename,
      original_name: req.file.originalname,
      alt_en: req.body.alt_en || '',
      alt_vi: req.body.alt_vi || '',
      group: result.group,
      width: result.width,
      height: result.height,
      variants: JSON.stringify(result.variants),
      original_path: result.originalPath,
    });

    req.flash('success', 'Image uploaded — original kept in full quality, site copy optimized for speed.');
    res.redirect('/admin/media');
  } catch (err) {
    req.flash('error', err.message || 'Upload failed.');
    res.redirect('/admin/media');
  }
}

async function focalPointForm(req, res, next) {
  try {
    const item = await db('media').where({ id: req.params.id }).first();
    if (!item) return res.redirect('/admin/media');
    res.render('admin/media/focal-point', { title: 'Set Focus Point', item });
  } catch (err) {
    next(err);
  }
}

async function updateFocalPoint(req, res, next) {
  try {
    const clamp = (n) => Math.max(0, Math.min(100, Number(n)));
    const focalX = Number.isFinite(Number(req.body.focal_x)) ? clamp(req.body.focal_x) : 50;
    const focalY = Number.isFinite(Number(req.body.focal_y)) ? clamp(req.body.focal_y) : 50;
    await db('media').where({ id: req.params.id }).update({ focal_x: focalX, focal_y: focalY });
    req.flash('success', 'Focus point saved.');
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
}

async function updateAlt(req, res, next) {
  try {
    await db('media')
      .where({ id: req.params.id })
      .update({ alt_en: req.body.alt_en || '', alt_vi: req.body.alt_vi || '' });
    req.flash('success', 'Alt text updated.');
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const row = await db('media').where({ id: req.params.id }).first();
    if (row) {
      const inUse = await Promise.all([
        db('journal_posts').where({ cover_media_id: row.id }).first(),
        db('people').where({ photo_media_id: row.id }).first(),
        db('page_content').where({ media_id: row.id }).first(),
        db('process_steps').where({ media_id: row.id }).first(),
        db('site_settings').where({ logo_media_id: row.id }).first(),
      ]);
      if (inUse.some(Boolean)) {
        req.flash('error', 'This image is still used on a page — remove it there first.');
        return res.redirect('/admin/media');
      }

      const urlsToDelete = [
        ...(row.variants && row.variants.webp ? Object.values(row.variants.webp) : []),
        row.original_path,
      ].filter(Boolean);
      await Promise.all(urlsToDelete.map((url) => deleteObjectByUrl(url).catch(() => {})));

      await db('media').where({ id: row.id }).del();
    }
    req.flash('success', 'Image deleted.');
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, upload, updateAlt, remove, focalPointForm, updateFocalPoint, GROUPS };
