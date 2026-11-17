const db = require('../../config/db');

async function list(req, res, next) {
  try {
    const faqs = await db('faqs').orderBy('sort_order', 'asc').orderBy('id', 'asc');
    res.render('admin/faqs/list', { title: 'FAQ', faqs });
  } catch (err) {
    next(err);
  }
}

function newForm(req, res) {
  res.render('admin/faqs/form', { title: 'New Question', faq: null });
}

async function editForm(req, res, next) {
  try {
    const faq = await db('faqs').where({ id: req.params.id }).first();
    if (!faq) return res.redirect('/admin/faqs');
    res.render('admin/faqs/form', { title: 'Edit Question', faq });
  } catch (err) {
    next(err);
  }
}

function buildPayload(body) {
  return {
    question_en: (body.question_en || '').trim(),
    question_vi: (body.question_vi || '').trim() || null,
    answer_en: (body.answer_en || '').trim() || null,
    answer_vi: (body.answer_vi || '').trim() || null,
    sort_order: Number(body.sort_order) || 0,
    active: body.active === 'on',
  };
}

async function create(req, res, next) {
  try {
    await db('faqs').insert(buildPayload(req.body));
    req.flash('success', 'Question added.');
    res.redirect('/admin/faqs');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    await db('faqs').where({ id: req.params.id }).update({ ...buildPayload(req.body), updated_at: new Date() });
    req.flash('success', 'Question updated.');
    res.redirect('/admin/faqs');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await db('faqs').where({ id: req.params.id }).del();
    req.flash('success', 'Question removed.');
    res.redirect('/admin/faqs');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, newForm, editForm, create, update, remove };
