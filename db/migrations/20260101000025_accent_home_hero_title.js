/**
 * The homepage headline now supports a highlighted phrase: words wrapped in
 * *asterisks* render in italic warm beige. Mark "since 1955." in the current
 * headline — only if it still holds the wording set by migration 21, so a
 * headline rewritten by the owner since then is left alone.
 */
exports.up = async function (knex) {
  await knex('page_content')
    .where({
      page_key: 'home',
      section_key: 'hero',
      title_en: 'Three generations of tailoring in Hanoi, since 1955.',
      title_vi: 'Ba thế hệ may đo tại Hà Nội, từ năm 1955.',
    })
    .update({
      title_en: 'Three generations of tailoring in Hanoi, *since 1955.*',
      title_vi: 'Ba thế hệ may đo tại Hà Nội, *từ năm 1955.*',
    });
};

exports.down = async function (knex) {
  await knex('page_content')
    .where({
      page_key: 'home',
      section_key: 'hero',
      title_en: 'Three generations of tailoring in Hanoi, *since 1955.*',
      title_vi: 'Ba thế hệ may đo tại Hà Nội, *từ năm 1955.*',
    })
    .update({
      title_en: 'Three generations of tailoring in Hanoi, since 1955.',
      title_vi: 'Ba thế hệ may đo tại Hà Nội, từ năm 1955.',
    });
};
