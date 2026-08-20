/**
 * Singleton site settings row — edit all of this later from Admin > Settings.
 * NOTE: no phone number or WhatsApp link was provided at build time, so both
 * are left blank on purpose. Add a phone number in Admin > Settings once you
 * have one you want published, and the "Call" button will appear automatically.
 */
exports.seed = async function (knex) {
  await knex('site_settings').del();

  const hours = [
    { day_en: 'Monday', day_vi: 'Thứ Hai', open: '08:30', close: '12:00', open2: '13:30', close2: '18:30', closed: false },
    { day_en: 'Tuesday', day_vi: 'Thứ Ba', open: '08:30', close: '12:00', open2: '13:30', close2: '18:30', closed: false },
    { day_en: 'Wednesday', day_vi: 'Thứ Tư', open: '08:30', close: '12:00', open2: '13:30', close2: '18:30', closed: false },
    { day_en: 'Thursday', day_vi: 'Thứ Năm', open: '08:30', close: '12:00', open2: '13:30', close2: '18:30', closed: false },
    { day_en: 'Friday', day_vi: 'Thứ Sáu', open: '08:30', close: '12:00', open2: '13:30', close2: '18:30', closed: false },
    { day_en: 'Saturday', day_vi: 'Thứ Bảy', open: '08:30', close: '12:00', open2: '13:30', close2: '18:30', closed: false },
    { day_en: 'Sunday', day_vi: 'Chủ Nhật', open: null, close: null, open2: null, close2: null, closed: true },
  ];

  await knex('site_settings').insert({
    id: 1,
    address_line: '175 Phùng Hưng, Hoàn Kiếm, Hà Nội',
    map_embed_url:
      'https://www.google.com/maps?q=175+Ph%C3%B9ng+H%C6%B0ng%2C+Ho%C3%A0n+Ki%E1%BA%BFm%2C+H%C3%A0+N%E1%BB%99i&output=embed',
    hours: JSON.stringify(hours),
    phone: null,
    zalo_url: 'https://zalo.me/3842203526242220664',
    whatsapp_url: null,
    instagram_handle: '@mqtailor.hanoi',
    instagram_url: 'https://instagram.com/mqtailor.hanoi',
    email: 'minhquanghotline@gmail.com',
    founding_note_en: 'Since 1955',
    founding_note_vi: 'Từ năm 1955',
    logo_media_id: null,
    ga_measurement_id: null,
  });
};
