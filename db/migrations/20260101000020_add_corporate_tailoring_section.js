exports.up = async function (knex) {
  const existing = await knex('page_content').where({ page_key: 'tailoring', section_key: 'corporate' }).first();
  if (existing) return;

  await knex('page_content').insert({
    page_key: 'tailoring',
    section_key: 'corporate',
    sort_order: 6,
    title_en: 'Corporate Tailoring',
    title_vi: 'May Đo Doanh Nghiệp',
    body_en:
      'For companies and organisations, we develop tailored clothing around the requirements of the brand and the people who wear it. Cloth, fit and construction are considered for durability and everyday comfort, with support for on-site measurement and fittings, embroidery, volume production and coordinated delivery.',
    body_vi:
      'Với khách hàng doanh nghiệp và tổ chức, trang phục được phát triển dựa trên tiêu chuẩn thương hiệu và nhu cầu thực tế của người sử dụng. Chất liệu, phom dáng và cấu trúc được cân nhắc để đảm bảo độ bền và sự thoải mái trong quá trình làm việc, cùng dịch vụ đo và thử tận nơi, thêu nhận diện, sản xuất số lượng lớn và giao nhận theo kế hoạch.',
  });
};

exports.down = async function (knex) {
  await knex('page_content').where({ page_key: 'tailoring', section_key: 'corporate' }).del();
};
