exports.up = function (knex) {
  return knex.schema.createTable('admin_users', (t) => {
    t.increments('id').primary();
    t.string('username', 100).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_users');
};
