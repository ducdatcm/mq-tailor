const db = require('../../config/db');

async function list(req, res, next) {
  try {
    const status = ['new', 'contacted', 'archived'].includes(req.query.status) ? req.query.status : null;
    const query = db('enquiries').orderBy('created_at', 'desc');
    if (status) query.where({ status });
    const enquiries = await query;
    res.render('admin/enquiries/list', { title: 'Enquiries', enquiries, activeStatus: status });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const status = ['new', 'contacted', 'archived'].includes(req.body.status) ? req.body.status : 'new';
    await db('enquiries').where({ id: req.params.id }).update({ status });
    res.redirect(req.get('Referer') || '/admin/enquiries');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, updateStatus };
