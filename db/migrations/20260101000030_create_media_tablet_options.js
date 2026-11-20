/**
 * Links Media Library photos to choices in the in-store tablet app (e.g. a close-up of a
 * peak lapel to the option "lapel.peak"). One photo can show several choices and one choice
 * can have several photos; `sort` orders the photos of a choice. Deleting a photo removes
 * its links.
 */
exports.up = function (knex) {
  return knex.schema.createTable('media_tablet_options', (t) => {
    t.increments('id').primary();
    t.integer('media_id').unsigned().notNullable().references('id').inTable('media').onDelete('CASCADE');
    t.string('option_id', 80).notNullable(); // option id from the tablet catalog, e.g. "lapel.peak"
    t.integer('sort').notNullable().defaultTo(0);
    t.unique(['media_id', 'option_id']);
    t.index(['option_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('media_tablet_options');
};
