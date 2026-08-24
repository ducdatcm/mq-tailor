exports.up = function (knex) {
  return knex.schema.alterTable('people', (t) => {
    // Which of the 3 Our People sections this person appears under:
    // masters | front_of_house | workshop
    t.string('group_key', 30).notNullable().defaultTo('workshop');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('people', (t) => {
    t.dropColumn('group_key');
  });
};
