exports.up = function (knex) {
  return knex.schema.alterTable('cloth_mills', (t) => {
    t.integer('media_id').unsigned().nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cloth_mills', (t) => {
    t.dropColumn('media_id');
  });
};
