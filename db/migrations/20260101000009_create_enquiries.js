exports.up = function (knex) {
  return knex.schema.createTable('enquiries', (t) => {
    t.increments('id').primary();
    t.string('name', 150).notNullable();
    t.string('phone', 50);
    t.string('email', 255);
    t.text('message');
    t.string('source_page', 100);
    t.string('locale', 5);
    t.enu('status', ['new', 'contacted', 'archived']).defaultTo('new');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('enquiries');
};
