/**
 * The owner prefers a plain hyphen (-) to the long em dash (—) everywhere on
 * the site. Most visible text lives in the database (edited in the admin),
 * so rewrite it there too: "word — word" becomes "word - word". En dashes
 * (–) in time ranges such as 08:30–12:00 are left untouched.
 *
 * Only plain-text content columns are touched (titles, bodies, captions,
 * bios...), never ids, slugs, URLs or JSON.
 */
const TABLES = {
  page_content: ['title_en', 'title_vi', 'body_en', 'body_vi'],
  process_steps: ['title_en', 'title_vi', 'body_en', 'body_vi', 'stage_en', 'stage_vi'],
  people: ['name', 'role_en', 'role_vi', 'bio_en', 'bio_vi'],
  cloth_mills: ['name', 'description_en', 'description_vi'],
  journal_posts: ['title_en', 'title_vi', 'excerpt_en', 'excerpt_vi', 'body_en', 'body_vi'],
  media: ['alt_en', 'alt_vi'],
  faqs: ['question_en', 'question_vi', 'answer_en', 'answer_vi'],
  site_settings: ['founding_note_en', 'founding_note_vi', 'address_line'],
};

function dehyphen(text) {
  return text.replace(/([^\s])[ \t]*—[ \t]*([^\s])/g, '$1 - $2').replace(/—/g, '-');
}

exports.up = async function (knex) {
  for (const [table, wanted] of Object.entries(TABLES)) {
    if (!(await knex.schema.hasTable(table))) continue;
    const info = await knex(table).columnInfo();
    const columns = wanted.filter((c) => info[c]);
    if (!columns.length) continue;

    const rows = await knex(table).select('id', ...columns);
    for (const row of rows) {
      const changes = {};
      for (const c of columns) {
        if (typeof row[c] === 'string' && row[c].includes('—')) changes[c] = dehyphen(row[c]);
      }
      if (Object.keys(changes).length) await knex(table).where({ id: row.id }).update(changes);
    }
  }
};

exports.down = function () {
  // Not reversible: there is no record of which hyphens used to be em dashes.
  return Promise.resolve();
};
