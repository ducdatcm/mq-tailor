exports.up = function (knex) {
  return knex.schema.createTable('process_steps', (t) => {
    t.increments('id').primary();
    t.string('step_key', 50).notNullable().unique(); // consultation | cloth | measurement | cutting | fitting | making | final-fitting | aftercare
    t.string('title_en', 150).notNullable();
    t.string('title_vi', 150).notNullable();
    t.text('body_en');
    t.text('body_vi');
    t.integer('media_id').unsigned().nullable();
    t.integer('sort_order').defaultTo(0);
    t.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('process_steps');
};
