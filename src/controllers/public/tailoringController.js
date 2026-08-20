const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');

const CATEGORY_ORDER = ['suits', 'jackets', 'trousers', 'shirts', 'wedding'];

async function show(req, res, next) {
  try {
    const content = await getPageContent('tailoring');
    const mediaMap = await getMediaByIds(Object.values(content).map((c) => c.media_id));
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });

    const categories = CATEGORY_ORDER.map((key) => content[key]).filter(Boolean);

    res.render('pages/tailoring', {
      title: res.locals.t('nav.tailoring'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      categories,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
