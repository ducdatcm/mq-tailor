const db = require('../../config/db');
const { getPageContent } = require('../../utils/content');
const { getMediaByIds, resolveMedia } = require('../../utils/media');
const { sendEnquiryNotification } = require('../../utils/mailer');
const { buildLocalBusinessJsonLd } = require('../../utils/jsonld');

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
      jsonld: buildLocalBusinessJsonLd(res.locals.settings, res.locals.baseUrl),
    });
  } catch (err) {
    next(err);
  }
}

async function submitEnquiry(req, res, next) {
  try {
    const { name, phone, email, message, website } = req.body;

    // Honeypot: a real visitor never fills the hidden "website" field.
    if (website) return res.redirect(`/${res.locals.lang}/visit?sent=1`);

    if (!name || !name.trim() || (!phone && !email)) {
      return res.redirect(`/${res.locals.lang}/visit?error=1`);
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

    await db('enquiries').insert(enquiry);
    sendEnquiryNotification(enquiry).catch(() => {}); // fire-and-forget; enquiry is already saved either way

    res.redirect(`/${res.locals.lang}/visit?sent=1`);
  } catch (err) {
    next(err);
  }
}

module.exports = { show, submitEnquiry };
