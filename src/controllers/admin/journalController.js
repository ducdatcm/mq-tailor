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
    res.render('admin/journal/form', { title: 'New Journal Post', post: null, media });
  } catch (err) {
    next(err);
  }
}

async function editForm(req, res, next) {
  try {
    const post = await db('journal_posts').where({ id: req.params.id }).first();
    if (!post) return res.redirect('/admin/journal');
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/journal/form', { title: 'Edit Journal Post', post, media });
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

async function create(req, res, next) {
  try {
    await db('journal_posts').insert(buildPayload(req.body));
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
