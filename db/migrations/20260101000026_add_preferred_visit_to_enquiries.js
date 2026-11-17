/**
 * The enquiry form now asks (optionally) when the visitor would like to
 * come in: a date and a rough time of day ('any' | 'morning' | 'afternoon').
 * Older enquiries keep NULL.
 */
exports.up = function (knex) {
  return knex.schema.alterTable('enquiries', (t) => {
    t.date('preferred_date').nullable();
    t.string('preferred_time', 20).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('enquiries', (t) => {
    t.dropColumn('preferred_date');
    t.dropColumn('preferred_time');
  });
};
