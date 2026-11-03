const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');
const { sendEnquiryNotification } = require('../../utils/mailer');
const { buildLocalBusinessJsonLd } = require('../../utils/jsonld');
const { PRIVACY_POLICY_VERSION } = require('../../config/privacy');

async function show(req, res, next) {
  try {
    const content = await getPageContent('visit');
    const mediaMap = await getMediaByIds(Object.values(content).map((c) => c.media_id));
    Object.values(content).forEach((c) => {
      c.media = resolveMedia(mediaMap[c.media_id], res.locals.lang);
    });

    res.render('pages/visit', {
      title: res.locals.t('visit.heading'),
      metaDescription: content.intro ? content.intro[`body_${res.locals.lang}`] : '',
      content,
      formSuccess: req.query.sent === '1',
      formError: req.query.error === '1',
      consentError: req.query.error === 'consent',
      jsonld: buildLocalBusinessJsonLd(res.locals.settings, res.locals.baseUrl),
    });
  } catch (err) {
    next(err);
  }
}

async function submitEnquiry(req, res, next) {
  try {
    const { name, phone, email, message, website, consent } = req.body;

    // Honeypot: a real visitor never fills the hidden "website" field.
    if (website) return res.redirect(`/${res.locals.lang}/visit?sent=1`);

    if (!name || !name.trim() || (!phone && !email)) {
      return res.redirect(`/${res.locals.lang}/visit?error=1`);
    }

    // Personal data is only processed with the visitor's explicit, unticked-by-default
    // consent (Law 91/2025/QH15 Art. 9) — the checkbox is also `required` in the
    // form, this catches anyone bypassing the browser check.
    if (consent !== '1') {
      return res.redirect(`/${res.locals.lang}/visit?error=consent`);
    }

    const enquiry = {
      name: name.trim().slice(0, 150),
      phone: (phone || '').trim().slice(0, 50),
      email: (email || '').trim().slice(0, 255),
      message: (message || '').trim().slice(0, 2000),
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

    res.redirect(`/${res.locals.lang}/visit?sent=1`);
  } catch (err) {
    next(err);
  }
}

module.exports = { show, submitEnquiry };
