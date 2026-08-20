exports.up = function (knex) {
  return knex.schema.createTable('site_settings', (t) => {
    t.increments('id').primary(); // singleton row, id = 1
    t.string('address_line', 255);
    t.string('map_embed_url', 500);
    t.json('hours'); // [{ day_en, day_vi, open, close, open2, close2, closed }]
    t.string('phone', 50);
    t.string('zalo_url', 255);
    t.string('whatsapp_url', 255);
    t.string('instagram_handle', 100);
    t.string('instagram_url', 255);
    t.string('email', 255);
    t.string('founding_note_en', 255); // e.g. "Since 1955"
    t.string('founding_note_vi', 255);
    t.integer('logo_media_id').unsigned().nullable();
    t.string('ga_measurement_id', 50);
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('site_settings');
};
