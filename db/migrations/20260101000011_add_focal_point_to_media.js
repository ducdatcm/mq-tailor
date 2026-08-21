exports.up = function (knex) {
  return knex.schema.alterTable('media', (t) => {
    // Percentage (0-100) of the point that must always stay visible when
    // the image is cropped by CSS object-fit:cover into a fixed-ratio
    // frame (hero, cards, etc.) — set from the Media Library by clicking
    // on the important part of the photo (e.g. a face). Defaults to dead
    // centre, matching the previous (fixed) behaviour.
    t.decimal('focal_x', 5, 2).notNullable().defaultTo(50);
    t.decimal('focal_y', 5, 2).notNullable().defaultTo(50);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('media', (t) => {
    t.dropColumn('focal_x');
    t.dropColumn('focal_y');
  });
};
