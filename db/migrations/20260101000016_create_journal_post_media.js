exports.up = function (knex) {
  return knex.schema.createTable('journal_post_media', (t) => {
    t.increments('id').primary();
    t.integer('journal_post_id').unsigned().notNullable().references('id').inTable('journal_posts').onDelete('CASCADE');
    t.integer('media_id').unsigned().notNullable();
    t.integer('sort_order').defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('journal_post_media');
};
