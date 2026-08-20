const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null; // email relay is optional — enquiries are always saved to the DB regardless
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

/**
 * Notifies the house by email when a new enquiry comes in. Silently no-ops
 * if SMTP isn't configured yet — the enquiry is still saved in the admin
 * Enquiries inbox either way, so nothing is lost.
 */
async function sendEnquiryNotification(enquiry) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'smtp-not-configured' };

  const to = process.env.ENQUIRY_NOTIFY_TO || process.env.SMTP_USER;
  if (!to) return { sent: false, reason: 'no-recipient' };

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      replyTo: enquiry.email || undefined,
      subject: `New enquiry from ${enquiry.name} — Minh Quang website`,
      text: [
        `Name: ${enquiry.name}`,
        `Phone: ${enquiry.phone || '-'}`,
        `Email: ${enquiry.email || '-'}`,
        `Language: ${enquiry.locale}`,
        `Page: ${enquiry.source_page}`,
        '',
        enquiry.message || '',
      ].join('\n'),
    });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] failed to send enquiry notification:', err.message);
    return { sent: false, reason: 'send-failed' };
  }
}

module.exports = { sendEnquiryNotification };
