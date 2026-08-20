exports.up = function (knex) {
  return knex.schema.createTable('people', (t) => {
    t.increments('id').primary();
    t.string('name', 150).notNullable();
    t.string('role_en', 150);
    t.string('role_vi', 150);
    t.text('bio_en');
    t.text('bio_vi');
    t.integer('photo_media_id').unsigned().nullable();
    t.integer('sort_order').defaultTo(0);
    t.boolean('active').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('people');
};
