/**
 * No real staff names or photos were supplied at build time, so this seed
 * deliberately avoids inventing fictional people. It ships four honest
 * role-group placeholders (matching brief §"OUR PEOPLE") instead of fake
 * individuals with made-up names, organized into the 3 Our People
 * departments (masters / front_of_house / workshop). Replace each with
 * real people — name, role, bio, photo, group — from Admin > People as
 * soon as you have them.
 */
exports.seed = async function (knex) {
  await knex('people').del();

  const rows = [
    {
      name: 'The Cutters', sort_order: 1, active: true, group_key: 'masters',
      role_en: 'Pattern & cutting table', role_vi: 'Rập & bàn cắt',
      bio_en: 'Individual profiles for the workshop team are being prepared and will appear here.',
      bio_vi: 'Hồ sơ từng thành viên của xưởng may đang được chuẩn bị và sẽ được cập nhật tại đây.',
      photo_media_id: null,
    },
    {
      name: 'The Coat & Jacket Makers', sort_order: 1, active: true, group_key: 'workshop',
      role_en: 'Construction & canvassing', role_vi: 'Dựng áo & dựng canvas',
      bio_en: 'Individual profiles for the workshop team are being prepared and will appear here.',
      bio_vi: 'Hồ sơ từng thành viên của xưởng may đang được chuẩn bị và sẽ được cập nhật tại đây.',
      photo_media_id: null,
    },
    {
      name: 'The Trouser Makers', sort_order: 2, active: true, group_key: 'workshop',
      role_en: 'Trouser construction', role_vi: 'May quần âu',
      bio_en: 'Individual profiles for the workshop team are being prepared and will appear here.',
      bio_vi: 'Hồ sơ từng thành viên của xưởng may đang được chuẩn bị và sẽ được cập nhật tại đây.',
      photo_media_id: null,
    },
    {
      name: 'Front of House', sort_order: 1, active: true, group_key: 'front_of_house',
      role_en: 'Consultation & fittings', role_vi: 'Tư vấn & thử đồ',
      bio_en: 'Individual profiles for the workshop team are being prepared and will appear here.',
      bio_vi: 'Hồ sơ từng thành viên của xưởng may đang được chuẩn bị và sẽ được cập nhật tại đây.',
      photo_media_id: null,
    },
  ];

  await knex('people').insert(rows);
};
