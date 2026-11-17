/**
 * Correct social profiles requested by the owner. They can still be changed
 * later in Admin > Site Settings > Contact & Social.
 */
exports.up = async function (knex) {
  await knex('site_settings').where({ id: 1 }).update({
    instagram_handle: '@minhquanghanoi.official',
    instagram_url: 'https://www.instagram.com/minhquanghanoi.official/',
    facebook_url: 'https://web.facebook.com/minhquang.bespoke/',
  });
};

exports.down = function () {
  // Previous values were placeholders; nothing meaningful to restore.
  return Promise.resolve();
};
