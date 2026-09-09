const { getPageContent } = require('../../utils/content');
const { getMediaByGroup, getMediaByIds, resolveMedia } = require('../../utils/media');

async function show(req, res, next) {
  try {
    const content = await getPageContent('garments');

    // Unlimited product photography — tag an upload's Group as
    // "product_collection" in Admin > Media Library and it appears here.
    // Deliberately a different tag than the general "garments" one, so
    // tagging a detail shot "garments" for use elsewhere doesn't also
    // publish it to this page. This page is meant to hold a lot of photos,
    // so no small teaser cap like the other galleries.
    const gallery = await getMediaByGroup('product_collection', { limit: 500, lang: res.locals.lang });

    const mediaMap = await getMediaByIds(Object.values(content).map((c) => c.media_id));
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });

    res.render('pages/garments', {
      title: res.locals.t('nav.garments'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      gallery,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
