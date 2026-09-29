/**
 * Lets a photo tagged Group="product_collection" (the Our Garments gallery)
 * also be tagged with a simple garment category, so the public page can
 * offer All / Suit & Jackets / Trousers / Shirts / Others filter buttons.
 * Nullable/blank means "Others" — nothing needs re-tagging immediately.
 */
exports.up = function (knex) {
  return knex.schema.alterTable('media', (t) => {
    t.string('garment_category', 30).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('media', (t) => {
    t.dropColumn('garment_category');
  });
};
