const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, getMediaByGroup, resolveMedia } = require('../../utils/media');

async function show(req, res, next) {
  try {
    const content = await getPageContent('process');
    const steps = await db('process_steps').orderBy('sort_order', 'asc');

    const mediaMap = await getMediaByIds([
      ...Object.values(content).map((c) => c.media_id),
      ...steps.map((s) => s.media_id),
    ]);
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });
    steps.forEach((s) => {
      s.media = resolveMedia(mediaMap[s.media_id], res.locals.lang);
    });

    // Unlimited behind-the-scenes workshop photos — tag an upload's Group
    // as "workshop" in Admin > Media Library and it appears here.
    const usedIds = steps.map((s) => s.media_id).filter(Boolean);
    const gallery = await getMediaByGroup('workshop', { excludeIds: usedIds, lang: res.locals.lang });

    res.render('pages/process', {
      title: res.locals.t('process.heading'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      steps,
      gallery,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
