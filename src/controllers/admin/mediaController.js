const db = require('../../config/db');
const { processAndSaveImage } = require('../../config/upload');
const { deleteObjectByUrl } = require('../../config/storage');
const { readTabletOptions } = require('../../utils/tabletPhotos');

// "garments" stays as a general-purpose tag (detail shots reused elsewhere
// on the site); "product_collection" is the one specific tag that actually
// feeds the Our Garments showcase page — kept separate on purpose so
// tagging something "garments" for general use doesn't silently publish it
// to that page too.
const GROUPS = ['house', 'workshop', 'people', 'garments', 'product_collection', 'fitting', 'cloth', 'hanoi', 'journal', 'other'];

// Simple filter buckets for the Our Garments page (Group="product_collection"
// only) — blank/anything else is treated as "Others" on the public page.
const GARMENT_CATEGORIES = ['suits_jackets', 'trousers', 'shirts'];

async function list(req, res, next) {
  try {
    const group = GROUPS.includes(req.query.group) ? req.query.group : null;
    // ?tablet=1: only the photos linked to choices in the in-store tablet app
    const tabletOnly = req.query.tablet === '1';
    const query = db('media').orderBy('created_at', 'desc');
    if (group) query.where({ group });
    if (tabletOnly) query.whereIn('id', db('media_tablet_options').select('media_id'));
    const [media, links] = await Promise.all([
      query,
      db('media_tablet_options').select('media_id').count({ n: '*' }).groupBy('media_id'),
    ]);
    const tabletCounts = Object.fromEntries(links.map((l) => [l.media_id, Number(l.n)]));
    res.render('admin/media/list', { title: 'Media Library', media, groups: GROUPS, activeGroup: group, tabletOnly, tabletCounts });
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

    req.flash('success', 'Image uploaded - original kept in full quality, site copy optimized for speed.');
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
    const garmentCategory = GARMENT_CATEGORIES.includes(req.body.garment_category) ? req.body.garment_category : null;
    await db('media')
      .where({ id: req.params.id })
      .update({ alt_en: req.body.alt_en || '', alt_vi: req.body.alt_vi || '', garment_category: garmentCategory });
    req.flash('success', 'Alt text updated.');
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
}

async function updateGroup(req, res, next) {
  try {
    const group = GROUPS.includes(req.body.group) ? req.body.group : 'other';
    await db('media').where({ id: req.params.id }).update({ group });
    req.flash('success', 'Group updated.');
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
        req.flash('error', 'This image is still used on a page - remove it there first.');
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

/** Which choices of the in-store tablet app this photo shows (see utils/tabletPhotos.js). */
async function tabletOptionsForm(req, res, next) {
  try {
    const item = await db('media').where({ id: req.params.id }).first();
    if (!item) return res.redirect('/admin/media');
    const [links, all] = await Promise.all([
      db('media_tablet_options').where({ media_id: item.id }).select('option_id'),
      db('media_tablet_options').select('option_id').count({ n: '*' }).groupBy('option_id'),
    ]);
    const { garments } = readTabletOptions();
    res.render('admin/media/tablet-options', {
      title: 'Tablet choices',
      item,
      garments,
      selected: new Set(links.map((l) => l.option_id)),
      counts: Object.fromEntries(all.map((r) => [r.option_id, Number(r.n)])),
    });
  } catch (err) {
    next(err);
  }
}

async function updateTabletOptions(req, res, next) {
  try {
    const item = await db('media').where({ id: req.params.id }).first();
    if (!item) return res.redirect('/admin/media');
    const { byId } = readTabletOptions();
    const sent = [].concat(req.body.options || []).map(String);
    const chosen = [...new Set(sent)].filter((id) => byId.has(id));
    await db.transaction(async (trx) => {
      await trx('media_tablet_options').where({ media_id: item.id }).del();
      if (chosen.length) await trx('media_tablet_options').insert(chosen.map((option_id) => ({ media_id: item.id, option_id })));
    });
    req.flash(
      'success',
      chosen.length ? `Photo linked to ${chosen.length} tablet choice${chosen.length === 1 ? '' : 's'}.` : 'Photo no longer used on the tablet.'
    );
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  upload,
  updateAlt,
  updateGroup,
  remove,
  focalPointForm,
  updateFocalPoint,
  tabletOptionsForm,
  updateTabletOptions,
  GROUPS,
  GARMENT_CATEGORIES,
};
