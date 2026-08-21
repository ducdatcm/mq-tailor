const db = require('../../config/db');

async function list(req, res, next) {
  try {
    const mills = await db('cloth_mills').orderBy('sort_order', 'asc');
    res.render('admin/cloth/list', { title: 'Cloth Mills', mills });
  } catch (err) {
    next(err);
  }
}

async function newForm(req, res, next) {
  try {
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/cloth/form', { title: 'New Mill', mill: null, media });
  } catch (err) {
    next(err);
  }
}

async function editForm(req, res, next) {
  try {
    const mill = await db('cloth_mills').where({ id: req.params.id }).first();
    if (!mill) return res.redirect('/admin/cloth');
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/cloth/form', { title: 'Edit Mill', mill, media });
  } catch (err) {
    next(err);
  }
}

function buildPayload(body) {
  return {
    name: body.name,
    description_en: body.description_en,
    description_vi: body.description_vi,
    sort_order: Number(body.sort_order) || 0,
    active: body.active === 'on',
    media_id: body.media_id || null,
  };
}

async function create(req, res, next) {
  try {
    await db('cloth_mills').insert(buildPayload(req.body));
    req.flash('success', 'Mill added.');
    res.redirect('/admin/cloth');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    await db('cloth_mills').where({ id: req.params.id }).update(buildPayload(req.body));
    req.flash('success', 'Mill updated.');
    res.redirect('/admin/cloth');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await db('cloth_mills').where({ id: req.params.id }).del();
    req.flash('success', 'Mill removed.');
    res.redirect('/admin/cloth');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, newForm, editForm, create, update, remove };
