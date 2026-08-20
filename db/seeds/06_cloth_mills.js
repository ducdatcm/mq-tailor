/**
 * Deliberately left empty at build time.
 *
 * The brief lists mills (Scabal, Dormeuil, Vitale Barberis Canonico, etc.)
 * only as *examples* of the kind of houses a tailor might work with — not
 * as confirmed suppliers for Minh Quang. Publishing specific mill names
 * without a real sourcing relationship would be a false claim, so none are
 * seeded here. Add the mills you actually buy cloth from via
 * Admin > Cloth > Mills — a handful is plenty; the Cloth page is written
 * to work with zero, a few, or many.
 */
exports.seed = async function (knex) {
  await knex('cloth_mills').del();
};
