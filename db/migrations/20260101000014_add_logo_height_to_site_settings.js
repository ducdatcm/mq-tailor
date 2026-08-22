exports.up = function (knex) {
  return knex.schema.alterTable('site_settings', (t) => {
    // Header logo height in pixels — the logo image was previously capped
    // at a fixed 40px in CSS with no way to change it from Admin.
    t.integer('logo_height').notNullable().defaultTo(40);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('site_settings', (t) => {
    t.dropColumn('logo_height');
  });
};
