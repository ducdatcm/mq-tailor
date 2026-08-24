const db = require('../../config/db');
const slugify = require('slugify');

async function list(req, res, next) {
  try {
    const posts = await db('journal_posts').orderBy('created_at', 'desc');
    res.render('admin/journal/list', { title: 'Journal', posts });
  } catch (err) {
    next(err);
  }
}

async function newForm(req, res, next) {
  try {
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/journal/form', { title: 'New Journal Post', post: null, media, galleryIds: [] });
  } catch (err) {
    next(err);
  }
}

async function editForm(req, res, next) {
  try {
    const post = await db('journal_posts').where({ id: req.params.id }).first();
    if (!post) return res.redirect('/admin/journal');
    const media = await db('media').orderBy('created_at', 'desc');
    const galleryRows = await db('journal_post_media')
      .where({ journal_post_id: post.id })
      .orderBy('sort_order', 'asc');
    const galleryIds = galleryRows.map((r) => r.media_id);
    res.render('admin/journal/form', { title: 'Edit Journal Post', post, media, galleryIds });
  } catch (err) {
    next(err);
  }
}

function buildPayload(body) {
  return {
    slug: slugify(body.slug || body.title_en || '', { lower: true, strict: true }),
    category: body.category,
    title_en: body.title_en,
    title_vi: body.title_vi,
    excerpt_en: body.excerpt_en,
    excerpt_vi: body.excerpt_vi,
    body_en: body.body_en,
    body_vi: body.body_vi,
    cover_media_id: body.cover_media_id || null,
    status: body.status === 'published' ? 'published' : 'draft',
    published_at: body.status === 'published' ? new Date() : null,
  };
}

/** <select multiple> submits repeated keys — normalize to a clean id array. */
function parseGalleryIds(raw) {
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return arr.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
}

async function saveGallery(postId, mediaIds) {
  await db('journal_post_media').where({ journal_post_id: postId }).del();
  if (mediaIds.length === 0) return;
  await db('journal_post_media').insert(
    mediaIds.map((mediaId, i) => ({ journal_post_id: postId, media_id: mediaId, sort_order: i }))
  );
}

async function create(req, res, next) {
  try {
    const [id] = await db('journal_posts').insert(buildPayload(req.body));
    await saveGallery(id, parseGalleryIds(req.body.gallery_media_ids));
    req.flash('success', 'Journal post created.');
    res.redirect('/admin/journal');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const payload = buildPayload(req.body);
    if (!req.body.status || req.body.status !== 'published') delete payload.published_at; // don't clear an existing publish date on plain edits
    await db('journal_posts').where({ id: req.params.id }).update(payload);
    await saveGallery(Number(req.params.id), parseGalleryIds(req.body.gallery_media_ids));
    req.flash('success', 'Journal post updated.');
    res.redirect('/admin/journal');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await db('journal_posts').where({ id: req.params.id }).del();
    req.flash('success', 'Journal post deleted.');
    res.redirect('/admin/journal');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, newForm, editForm, create, update, remove };
