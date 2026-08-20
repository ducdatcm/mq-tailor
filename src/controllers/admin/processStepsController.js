const db = require('../../config/db');

async function show(req, res, next) {
  try {
    const steps = await db('process_steps').orderBy('sort_order', 'asc');
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/process-steps/edit', { title: 'The Process', steps, media });
  } catch (err) {
    next(err);
  }
}

async function updateStep(req, res, next) {
  try {
    await db('process_steps')
      .where({ id: req.params.id })
      .update({
        title_en: req.body.title_en,
        title_vi: req.body.title_vi,
        body_en: req.body.body_en,
        body_vi: req.body.body_vi,
        media_id: req.body.media_id || null,
        updated_at: new Date(),
      });
    req.flash('success', 'Step updated.');
    res.redirect('/admin/process-steps');
  } catch (err) {
    next(err);
  }
}

module.exports = { show, updateStep };
