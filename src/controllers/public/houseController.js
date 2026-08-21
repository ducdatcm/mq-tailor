const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');

async function show(req, res, next) {
  try {
    const content = await getPageContent('house');

    // Unlimited heritage stories/photos live in the Journal under the
    // "house-stories" category, rather than as fixed Page Copy slots — add
    // as many as needed from Admin > Journal and they show up here too.
    const stories = await db('journal_posts')
      .where({ status: 'published', category: 'house-stories' })
      .orderBy('published_at', 'desc');

    const mediaMap = await getMediaByIds([
      ...Object.values(content).map((c) => c.media_id),
      ...stories.map((s) => s.cover_media_id),
    ]);
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });
    stories.forEach((s) => {
      s.cover = resolveMedia(mediaMap[s.cover_media_id], res.locals.lang);
    });

    res.render('pages/house', {
      title: res.locals.t('nav.house'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      stories,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
