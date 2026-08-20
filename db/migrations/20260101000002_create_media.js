exports.up = function (knex) {
  return knex.schema.createTable('media', (t) => {
    t.increments('id').primary();
    t.string('filename', 255).notNullable(); // base name without extension, e.g. "house-facade-1699..."
    t.string('original_name', 255);
    t.string('alt_en', 255);
    t.string('alt_vi', 255);
    t.string('group', 50); // house | workshop | people | garments | fitting | hanoi | journal | other
    t.integer('width');
    t.integer('height');
    t.json('variants'); // { original, avif: {480,768,1200,1920}, webp: {...} } -> paths under /uploads
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('media');
};
