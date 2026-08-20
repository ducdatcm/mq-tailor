const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');

async function show(req, res, next) {
  try {
    const content = await getPageContent('house');
    const mediaMap = await getMediaByIds(Object.values(content).map((c) => c.media_id));
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });

    res.render('pages/house', {
      title: res.locals.t('nav.house'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
