exports.up = function (knex) {
  return knex.schema.createTable('page_content', (t) => {
    t.increments('id').primary();
    t.string('page_key', 50).notNullable(); // home | house | tailoring | cloth | visit
    t.string('section_key', 50).notNullable(); // hero | intro | suits | jackets | ...
    t.string('title_en', 255);
    t.string('title_vi', 255);
    t.text('body_en', 'longtext');
    t.text('body_vi', 'longtext');
    t.integer('media_id').unsigned().nullable();
    t.integer('sort_order').defaultTo(0);
    t.timestamps(true, true);
    t.unique(['page_key', 'section_key']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('page_content');
};
