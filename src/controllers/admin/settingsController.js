const db = require('../../config/db');
const { processAndSaveImage } = require('../../config/upload');
const { invalidateSettingsCache } = require('../../middleware/siteSettings');

const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_VI = {
  Monday: 'Thứ Hai', Tuesday: 'Thứ Ba', Wednesday: 'Thứ Tư', Thursday: 'Thứ Năm',
  Friday: 'Thứ Sáu', Saturday: 'Thứ Bảy', Sunday: 'Chủ Nhật',
};

async function show(req, res, next) {
  try {
    const settings = await db('site_settings').where({ id: 1 }).first();
    if (settings && typeof settings.hours === 'string') settings.hours = JSON.parse(settings.hours);
    const media = await db('media').orderBy('created_at', 'desc');
    res.render('admin/settings/general', { title: 'Site Settings', settings, media, dayKeys: DAY_KEYS });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const b = req.body;

    const hours = DAY_KEYS.map((day) => ({
      day_en: day,
      day_vi: DAY_VI[day],
      closed: b[`closed_${day}`] === 'on',
      open: b[`open_${day}`] || null,
      close: b[`close_${day}`] || null,
      open2: b[`open2_${day}`] || null,
      close2: b[`close2_${day}`] || null,
    }));

    let logoMediaId = b.logo_media_id ? Number(b.logo_media_id) : null;
    if (req.file) {
      const result = await processAndSaveImage(req.file.buffer, req.file.originalname, req.file.mimetype, 'other');
      const [id] = await db('media').insert({
        filename: result.filename,
        original_name: req.file.originalname,
        alt_en: 'Minh Quang Tailoring House logo',
        alt_vi: 'Logo Nhà May Minh Quang',
        group: 'other',
        width: result.width,
        height: result.height,
        variants: JSON.stringify(result.variants),
        original_path: result.originalPath,
      });
      logoMediaId = id;
    }

    await db('site_settings')
      .where({ id: 1 })
      .update({
        address_line: b.address_line,
        map_embed_url: b.map_embed_url,
        hours: JSON.stringify(hours),
        phone: b.phone || null,
        zalo_url: b.zalo_url || null,
        whatsapp_url: b.whatsapp_url || null,
        instagram_handle: b.instagram_handle || null,
        instagram_url: b.instagram_url || null,
        email: b.email || null,
        founding_note_en: b.founding_note_en || null,
        founding_note_vi: b.founding_note_vi || null,
        logo_media_id: logoMediaId,
        ga_measurement_id: b.ga_measurement_id || null,
        updated_at: new Date(),
      });

    invalidateSettingsCache();
    req.flash('success', 'Settings saved.');
    res.redirect('/admin/settings');
  } catch (err) {
    next(err);
  }
}

module.exports = { show, update };
