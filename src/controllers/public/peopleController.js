const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');

const GROUP_ORDER = ['masters', 'front_of_house', 'workshop'];

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

    // Redesigned as 3 departments (reference: tailoring-house team pages
    // organized by role rather than one flat grid) — each with its own
    // short intro from Page Copy (masters_intro/front_of_house_intro/
    // workshop_intro) and the people assigned to it in Admin > People.
    const groups = GROUP_ORDER.map((key) => ({
      key,
      intro: content[`${key}_intro`] || null,
      people: people.filter((p) => (p.group_key || 'workshop') === key),
    })).filter((g) => g.people.length > 0 || g.intro);

    res.render('pages/people', {
      title: res.locals.t('people.heading'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      groups,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
