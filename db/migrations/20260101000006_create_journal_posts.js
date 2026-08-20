exports.up = function (knex) {
  return knex.schema.createTable('journal_posts', (t) => {
    t.increments('id').primary();
    t.string('slug', 200).notNullable().unique();
    t.string('category', 50); // craft | cloth | house-stories | hanoi | wardrobe
    t.string('title_en', 255).notNullable();
    t.string('title_vi', 255).notNullable();
    t.string('excerpt_en', 500);
    t.string('excerpt_vi', 500);
    t.text('body_en', 'longtext');
    t.text('body_vi', 'longtext');
    t.integer('cover_media_id').unsigned().nullable();
    t.enu('status', ['draft', 'published']).defaultTo('draft');
    t.timestamp('published_at').nullable();
    t.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('journal_posts');
};
