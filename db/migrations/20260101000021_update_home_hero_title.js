/**
 * Data fix: update the homepage hero headline to the wording requested by
 * the user. Only touches the row if it still holds the original seed
 * value, so a real edit made since launch (via Admin > Page Copy > Home)
 * won't be overwritten.
 */
exports.up = async function (knex) {
  await knex('page_content')
    .where({
      page_key: 'home',
      section_key: 'hero',
      title_en: 'A tailoring house in Hanoi.',
      title_vi: 'Một nhà may ở Hà Nội.',
    })
    .update({
      title_en: 'Three generations of tailoring in Hanoi, since 1955.',
      title_vi: 'Ba thế hệ may đo tại Hà Nội, từ năm 1955.',
    });
};

exports.down = function () {
  // Not meaningfully reversible without risking overwriting a real edit
  // made after this migration ran — intentionally a no-op.
  return Promise.resolve();
};
