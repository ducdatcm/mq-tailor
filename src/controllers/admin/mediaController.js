const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const { processAndSaveImage } = require('../../config/upload');

const GROUPS = ['house', 'workshop', 'people', 'garments', 'fitting', 'hanoi', 'journal', 'other'];

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
    const result = await processAndSaveImage(req.file.buffer, req.file.originalname, group);

    await db('media').insert({
      filename: result.filename,
      original_name: req.file.originalname,
      alt_en: req.body.alt_en || '',
      alt_vi: req.body.alt_vi || '',
      group: result.group,
      width: result.width,
      height: result.height,
      variants: JSON.stringify(result.variants),
    });

    req.flash('success', 'Image uploaded and resized.');
    res.redirect('/admin/media');
  } catch (err) {
    req.flash('error', err.message || 'Upload failed.');
    res.redirect('/admin/media');
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

      if (row.variants && row.variants.webp) {
        Object.values(row.variants.webp).forEach((relPath) => {
          const abs = path.join(__dirname, '..', '..', '..', 'public', relPath);
          fs.unlink(abs, () => {});
        });
      }
      await db('media').where({ id: row.id }).del();
    }
    req.flash('success', 'Image deleted.');
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, upload, updateAlt, remove, GROUPS };
