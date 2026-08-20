const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');
const { buildLocalBusinessJsonLd } = require('../../utils/jsonld');

async function show(req, res, next) {
  try {
    const content = await getPageContent('home');
    const posts = await db('journal_posts')
      .where({ status: 'published' })
      .orderBy('published_at', 'desc')
      .limit(3);

    const mediaIds = [...Object.values(content).map((c) => c.media_id), ...posts.map((p) => p.cover_media_id)];
    const mediaMap = await getMediaByIds(mediaIds);

    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });
    posts.forEach((p) => {
      p.cover = resolveMedia(mediaMap[p.cover_media_id], res.locals.lang);
    });

    res.render('pages/home', {
      title: res.locals.t('meta.site_tagline'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      posts,
      jsonld: buildLocalBusinessJsonLd(res.locals.settings, res.locals.baseUrl),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
