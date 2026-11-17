/**
 * Version of the Privacy Policy page (src/views/pages/privacy.ejs).
 *
 * It is shown as "last updated" on that page and saved with every enquiry
 * form submission, so we can show later which wording a visitor agreed to.
 * Change it (YYYY-MM-DD) whenever the policy's meaning changes.
 */
const PRIVACY_POLICY_VERSION = '2026-11-17';

/** "3 November 2026" (en) or "03/11/2026" (vi) for display. */
function formatPolicyDate(lang) {
  const [y, m, d] = PRIVACY_POLICY_VERSION.split('-').map(Number);
  if (lang === 'vi') return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
}

module.exports = { PRIVACY_POLICY_VERSION, formatPolicyDate };
