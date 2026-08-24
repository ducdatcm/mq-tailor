const db = require('../../config/db');

const GROUPS = {
  masters: 'The Masters',
  front_of_house: 'Front of House',
  workshop: 'The Workshop Team',
};

async function list(req, res, next) {
  try {
    const people = await db('people').orderBy(['group_key', 'sort_order']);
    res.render('admin/people/list', { title: 'People', people, GROUPS });
  } catch (err) {
    next(err);
  }
}

async function newForm(req, res, next) {
  try {
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/people/form', { title: 'New Person', person: null, media, GROUPS });
  } catch (err) {
    next(err);
  }
}

async function editForm(req, res, next) {
  try {
    const person = await db('people').where({ id: req.params.id }).first();
    if (!person) return res.redirect('/admin/people');
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/people/form', { title: 'Edit Person', person, media, GROUPS });
  } catch (err) {
    next(err);
  }
}

function buildPayload(body) {
  return {
    name: body.name,
    group_key: Object.prototype.hasOwnProperty.call(GROUPS, body.group_key) ? body.group_key : 'workshop',
    role_en: body.role_en,
    role_vi: body.role_vi,
    bio_en: body.bio_en,
    bio_vi: body.bio_vi,
    photo_media_id: body.photo_media_id || null,
    sort_order: Number(body.sort_order) || 0,
    active: body.active === 'on',
  };
}

async function create(req, res, next) {
  try {
    await db('people').insert(buildPayload(req.body));
    req.flash('success', 'Person added.');
    res.redirect('/admin/people');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    await db('people').where({ id: req.params.id }).update(buildPayload(req.body));
    req.flash('success', 'Person updated.');
    res.redirect('/admin/people');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await db('people').where({ id: req.params.id }).del();
    req.flash('success', 'Person removed.');
    res.redirect('/admin/people');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, newForm, editForm, create, update, remove };
