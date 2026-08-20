const db = require('../../config/db');

const PAGES = {
  home: 'Home',
  house: 'The House',
  tailoring: 'Tailoring',
  people: 'Our People',
  cloth: 'Cloth',
  visit: 'Visit',
};

async function show(req, res, next) {
  try {
    const pageKey = req.params.pageKey;
    if (!PAGES[pageKey]) return res.redirect('/admin');

    const sections = await db('page_content').where({ page_key: pageKey }).orderBy('sort_order', 'asc');
    const media = await db('media').orderBy('created_at', 'desc');

    res.render('admin/content/edit', {
      title: `Edit Content — ${PAGES[pageKey]}`,
      pageKey,
      pageLabel: PAGES[pageKey],
      pages: PAGES,
      sections,
      media,
    });
  } catch (err) {
    next(err);
  }
}

async function updateSection(req, res, next) {
  try {
    const { pageKey, sectionKey } = req.params;
    await db('page_content')
      .where({ page_key: pageKey, section_key: sectionKey })
      .update({
        title_en: req.body.title_en || null,
        title_vi: req.body.title_vi || null,
        body_en: req.body.body_en || null,
        body_vi: req.body.body_vi || null,
        media_id: req.body.media_id || null,
        updated_at: new Date(),
      });
    req.flash('success', 'Section updated.');
    res.redirect(`/admin/content/${pageKey}`);
  } catch (err) {
    next(err);
  }
}

module.exports = { show, updateSection, PAGES };
