/**
 * Redesigns Our People from one flat list into 3 departments (Masters /
 * Front of House / Workshop Team), following the same structure as
 * reference tailoring-house team pages: a short editorial intro per
 * department, then the people within it — rather than a uniform grid of
 * headshots.
 */
exports.up = async function (knex) {
  // Assign the existing placeholder role-groups to their department. Only
  // touches rows still holding their original seed name, so it can't
  // silently reassign something an admin has since renamed.
  const mapping = [
    { name: 'The Cutters', group_key: 'masters' },
    { name: 'The Coat & Jacket Makers', group_key: 'workshop' },
    { name: 'The Trouser Makers', group_key: 'workshop' },
    { name: 'Front of House', group_key: 'front_of_house' },
  ];
  for (const m of mapping) {
    await knex('people').where({ name: m.name }).update({ group_key: m.group_key });
  }

  const introRows = [
    {
      page_key: 'people', section_key: 'masters_intro', sort_order: 2,
      title_en: 'The Masters', title_vi: 'Bậc Thầy',
      body_en: "Cutting is where a garment's shape is decided, and it's the part of the process that takes longest to learn. The house's cutters carry that judgment — pattern, proportion, and the small adjustments that come from years at the table.",
      body_vi: 'Cắt là công đoạn quyết định hình dáng của một bộ trang phục, và cũng là phần mất nhiều thời gian nhất để học. Những người thợ cắt của nhà may mang theo khả năng phán đoán đó — về rập, tỷ lệ, và những điều chỉnh nhỏ chỉ có được sau nhiều năm đứng ở bàn cắt.',
    },
    {
      page_key: 'people', section_key: 'front_of_house_intro', sort_order: 3,
      title_en: 'Front of House', title_vi: 'Đón Tiếp',
      body_en: 'The first conversation about a new commission usually happens here — measurements, cloth, timelines, and the questions that shape everything that follows.',
      body_vi: 'Cuộc trò chuyện đầu tiên về một đơn may mới thường bắt đầu ở đây — số đo, vải, thời gian hoàn thành, và những câu hỏi định hình mọi thứ diễn ra sau đó.',
    },
    {
      page_key: 'people', section_key: 'workshop_intro', sort_order: 4,
      title_en: 'The Workshop Team', title_vi: 'Đội Ngũ Xưởng May',
      body_en: 'Behind every finished garment is a team most clients never meet — coat makers, trouser makers, pressers and finishers, each responsible for one part of the process done well.',
      body_vi: 'Đằng sau mỗi bộ trang phục hoàn thiện là một đội ngũ mà phần lớn khách hàng chưa từng gặp — thợ may áo, thợ may quần, thợ là ủi và hoàn thiện, mỗi người phụ trách một phần của quy trình và làm tốt phần việc đó.',
    },
  ];

  for (const row of introRows) {
    const existing = await knex('page_content')
      .where({ page_key: row.page_key, section_key: row.section_key })
      .first();
    if (!existing) await knex('page_content').insert(row);
  }
};

exports.down = async function (knex) {
  await knex('page_content')
    .where({ page_key: 'people' })
    .whereIn('section_key', ['masters_intro', 'front_of_house_intro', 'workshop_intro'])
    .del();
};
