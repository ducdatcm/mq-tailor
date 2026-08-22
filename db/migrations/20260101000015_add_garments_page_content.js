/**
 * New "Our Garments" page — backfills its page_content row on the live
 * database (the seed file only runs once, on first boot, so a brand-new
 * page_key needs an explicit migration to appear without re-seeding).
 */
exports.up = async function (knex) {
  const existing = await knex('page_content').where({ page_key: 'garments', section_key: 'intro' }).first();
  if (existing) return;

  await knex('page_content').insert({
    page_key: 'garments',
    section_key: 'intro',
    sort_order: 1,
    title_en: null,
    title_vi: null,
    body_en:
      'A closer look at finished work — suits, shirts and trousers as they come off the cutting table, photographed rather than described. No price list here, just the clothes themselves.',
    body_vi:
      'Một góc nhìn gần hơn về những sản phẩm đã hoàn thiện — suit, sơ mi và quần âu sau khi rời bàn cắt, được ghi lại bằng hình ảnh thay vì lời miêu tả. Ở đây không có bảng giá, chỉ có chính những bộ trang phục.',
  });
};

exports.down = async function (knex) {
  await knex('page_content').where({ page_key: 'garments', section_key: 'intro' }).del();
};
