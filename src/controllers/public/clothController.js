const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, getMediaByGroup, resolveMedia } = require('../../utils/media');

async function show(req, res, next) {
  try {
    const content = await getPageContent('cloth');
    const mills = await db('cloth_mills').where({ active: true }).orderBy('sort_order', 'asc');

    const mediaMap = await getMediaByIds([
      ...Object.values(content).map((c) => c.media_id),
      ...mills.map((m) => m.media_id),
    ]);
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });
    mills.forEach((m) => {
      m.photo = resolveMedia(mediaMap[m.media_id], res.locals.lang);
    });

    // Unlimited fabric reference/swatch photos — tag an upload's Group as
    // "cloth" in Admin > Media Library and it appears here.
    const usedIds = mills.map((m) => m.media_id).filter(Boolean);
    const gallery = await getMediaByGroup('cloth', { excludeIds: usedIds, lang: res.locals.lang });

    res.render('pages/cloth', {
      title: res.locals.t('cloth.heading'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      mills,
      gallery,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
