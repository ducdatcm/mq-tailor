exports.up = function (knex) {
  return knex.schema.createTable('cloth_mills', (t) => {
    t.increments('id').primary();
    t.string('name', 150).notNullable();
    t.string('description_en', 255);
    t.string('description_vi', 255);
    t.integer('sort_order').defaultTo(0);
    t.boolean('active').defaultTo(true);
    t.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cloth_mills');
};
