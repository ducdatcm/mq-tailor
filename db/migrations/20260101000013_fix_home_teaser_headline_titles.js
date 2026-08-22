/**
 * Data fix: the homepage's House/Craft/People/Visit teaser headlines were
 * hardcoded in the template instead of reading page_content.title_*, so
 * editing "Title" in Admin > Page Copy only ever changed the small eyebrow
 * label, never the big heading text underneath it — confusing, and not
 * what "editable" is supposed to mean. Now that the template reads
 * title_* for the real headline, backfill these rows with the text that
 * was actually showing on the page, so nothing visually changes for
 * anyone who hasn't touched these fields yet. Only rows still holding the
 * original short seed value are touched, so it can't clobber a real edit.
 */
exports.up = async function (knex) {
  const updates = [
    {
      section_key: 'house_teaser',
      match: { title_en: 'The House', title_vi: 'Nhà May' },
      set: { title_en: 'Discover the House', title_vi: 'Khám Phá Nhà May' },
    },
    {
      section_key: 'craft_teaser',
      match: { title_en: 'The Craft', title_vi: 'Tay Nghề' },
      set: { title_en: 'The Process', title_vi: 'Quy Trình' },
    },
    {
      section_key: 'people_teaser',
      match: { title_en: 'The People', title_vi: 'Con Người' },
      set: { title_en: 'Meet the people behind the house', title_vi: 'Gặp gỡ những con người của nhà may' },
    },
    {
      section_key: 'visit_teaser',
      match: { title_en: 'Visit', title_vi: 'Ghé Thăm' },
      set: { title_en: 'Visit the House', title_vi: 'Ghé Thăm Nhà May' },
    },
  ];

  for (const u of updates) {
    await knex('page_content')
      .where({ page_key: 'home', section_key: u.section_key, ...u.match })
      .update(u.set);
  }
};

exports.down = function () {
  // Not meaningfully reversible without risking overwriting a real edit made
  // after this migration ran — intentionally a no-op.
  return Promise.resolve();
};
