/**
 * Link to the house's Google Business Profile (the Google Maps listing).
 * Set in Admin > Site Settings; used for "Get Directions" links and listed
 * in the structured data so Google can tie the website to the listing.
 */
exports.up = function (knex) {
  return knex.schema.alterTable('site_settings', (t) => {
    t.string('google_business_url', 500).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('site_settings', (t) => {
    t.dropColumn('google_business_url');
  });
};
