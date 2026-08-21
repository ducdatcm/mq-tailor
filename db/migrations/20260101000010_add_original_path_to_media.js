exports.up = function (knex) {
  return knex.schema.alterTable('media', (t) => {
    // Full-resolution, unmodified copy of exactly what was uploaded — kept
    // alongside the resized WebP display variants so the master file is
    // never lost (e.g. for print/marketing use later).
    t.string('original_path', 500).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('media', (t) => {
    t.dropColumn('original_path');
  });
};
