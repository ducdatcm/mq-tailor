const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');
const { sendEnquiryNotification } = require('../../utils/mailer');
const { buildLocalBusinessJsonLd } = require('../../utils/jsonld');
const { PRIVACY_POLICY_VERSION } = require('../../config/privacy');

const TIME_SLOTS = ['any', 'morning', 'afternoon'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Today's date in Hanoi (UTC+7) as YYYY-MM-DD, whatever the server's clock zone. */
function todayInHanoi() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * Checks an optional preferred visit date from the form. Returns
 * { ok: true, value } with value null when left empty, or { ok: false }
 * when it is malformed, in the past, more than a year ahead, or on a day
 * the house is closed according to Site Settings opening hours.
 */
function checkPreferredDate(raw, settings) {
  const value = (raw || '').trim();
  if (!value) return { ok: true, value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false };
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return { ok: false };

  const today = todayInHanoi();
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCFullYear(limit.getUTCFullYear() + 1);
  if (value < today || date > limit) return { ok: false };

  const hours = settings && Array.isArray(settings.hours) ? settings.hours : [];
  const day = hours.find((h) => h.day_en === DAY_NAMES[date.getUTCDay()]);
  if (day && day.closed) return { ok: false };

  return { ok: true, value };
}

async function show(req, res, next) {
  try {
    const content = await getPageContent('visit');
    const mediaMap = await getMediaByIds(Object.values(content).map((c) => c.media_id));
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });

    const faqs = await db('faqs').where({ active: true }).orderBy('sort_order', 'asc').orderBy('id', 'asc');

    res.render('pages/visit', {
      title: res.locals.t('visit.heading'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      faqs,
      minDate: todayInHanoi(),
      formSuccess: req.query.sent === '1',
      formError: req.query.error === '1',
      consentError: req.query.error === 'consent',
      dateError: req.query.error === 'date',
      jsonld: buildLocalBusinessJsonLd(res.locals.settings, res.locals.baseUrl),
    });
  } catch (err) {
    next(err);
  }
}

async function submitEnquiry(req, res, next) {
  try {
    const { name, phone, email, message, website, consent } = req.body;
    const back = `/${res.locals.lang}/visit`;

    // Honeypot: a real visitor never fills the hidden "website" field.
    if (website) return res.redirect(`${back}?sent=1#enquiry`);

    if (!name || !name.trim() || (!phone && !email)) {
      return res.redirect(`${back}?error=1#enquiry`);
    }

    const preferred = checkPreferredDate(req.body.preferred_date, res.locals.settings);
    if (!preferred.ok) {
      return res.redirect(`${back}?error=date#enquiry`);
    }

    // Personal data is only processed with the visitor's explicit, unticked-by-default
    // consent (Law 91/2025/QH15 Art. 9) — the checkbox is also `required` in the
    // form, this catches anyone bypassing the browser check.
    if (consent !== '1') {
      return res.redirect(`${back}?error=consent#enquiry`);
    }

    const slot = TIME_SLOTS.includes(req.body.preferred_time) ? req.body.preferred_time : 'any';
    const enquiry = {
      name: name.trim().slice(0, 150),
      phone: (phone || '').trim().slice(0, 50),
      email: (email || '').trim().slice(0, 255),
      message: (message || '').trim().slice(0, 2000),
      preferred_date: preferred.value,
      preferred_time: preferred.value ? slot : null,
      source_page: 'visit',
      locale: res.locals.lang,
      status: 'new',
    };

    await db('enquiries').insert({
      ...enquiry,
      consent_at: new Date(),
      consent_version: PRIVACY_POLICY_VERSION,
    });
    sendEnquiryNotification(enquiry).catch(() => {}); // fire-and-forget; enquiry is already saved either way

    res.redirect(`${back}?sent=1#enquiry`);
  } catch (err) {
    next(err);
  }
}

module.exports = { show, submitEnquiry, checkPreferredDate };
