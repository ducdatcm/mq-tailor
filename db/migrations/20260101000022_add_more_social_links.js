/**
 * Adds Facebook, TikTok, YouTube and Pinterest links alongside the existing
 * Zalo/WhatsApp/Instagram fields, so the footer's social icon row can show
 * whichever platforms the house actually uses. All optional — an empty
 * field simply hides that icon, same as the existing WhatsApp link.
 */
exports.up = function (knex) {
  return knex.schema.alterTable('site_settings', (t) => {
    t.string('facebook_url', 255);
    t.string('tiktok_url', 255);
    t.string('youtube_url', 255);
    t.string('pinterest_url', 255);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('site_settings', (t) => {
    t.dropColumn('facebook_url');
    t.dropColumn('tiktok_url');
    t.dropColumn('youtube_url');
    t.dropColumn('pinterest_url');
  });
};
