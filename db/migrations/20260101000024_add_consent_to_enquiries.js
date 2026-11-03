/**
 * Records when a visitor ticked the consent box on the enquiry form, and
 * which version of the Privacy Policy was current — so consent can be
 * shown later if asked (Law 91/2025/QH15 Art. 9). Enquiries received
 * before the box existed keep NULL here.
 */
exports.up = function (knex) {
  return knex.schema.alterTable('enquiries', (t) => {
    t.timestamp('consent_at').nullable();
    t.string('consent_version', 20).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('enquiries', (t) => {
    t.dropColumn('consent_at');
    t.dropColumn('consent_version');
  });
};
