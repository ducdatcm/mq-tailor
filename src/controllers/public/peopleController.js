const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');

async function show(req, res, next) {
  try {
    const content = await getPageContent('people');
    const people = await db('people').where({ active: true }).orderBy('sort_order', 'asc');

    const mediaMap = await getMediaByIds([
      ...Object.values(content).map((c) => c.media_id),
      ...people.map((p) => p.photo_media_id),
    ]);
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });
    people.forEach((p) => {
      p.photo = resolveMedia(mediaMap[p.photo_media_id], res.locals.lang);
    });

    res.render('pages/people', {
      title: res.locals.t('people.heading'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      people,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
