const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');

async function show(req, res, next) {
  try {
    const content = await getPageContent('cloth');
    const mills = await db('cloth_mills').where({ active: true }).orderBy('sort_order', 'asc');

    const mediaMap = await getMediaByIds(Object.values(content).map((c) => c.media_id));
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });

    res.render('pages/cloth', {
      title: res.locals.t('cloth.heading'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      mills,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
