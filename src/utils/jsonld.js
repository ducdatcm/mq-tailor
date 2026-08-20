/**
 * Builds a schema.org LocalBusiness JSON-LD block from site_settings.
 * Used on Home and Visit so search engines can pick up address/hours
 * without us hand-writing meta tags for every field.
 */
function buildLocalBusinessJsonLd(settings, baseUrl) {
  if (!settings) return null;

  const openingHours = Array.isArray(settings.hours)
    ? settings.hours
        .filter((h) => !h.closed && h.open && h.close)
        .map((h) => {
          const dayCode = h.day_en ? h.day_en.slice(0, 2) : '';
          // schema.org wants e.g. "Mo 08:30-12:00", second block appended separately
          const blocks = [`${dayCode} ${h.open}-${h.close}`];
          if (h.open2 && h.close2) blocks.push(`${dayCode} ${h.open2}-${h.close2}`);
          return blocks;
        })
        .flat()
    : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TailorShop',
    name: 'Minh Quang Tailoring House',
    image: baseUrl ? `${baseUrl}/img/og-image.jpg` : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address_line,
      addressLocality: 'Hanoi',
      addressCountry: 'VN',
    },
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    url: baseUrl || undefined,
    sameAs: [settings.instagram_url, settings.zalo_url].filter(Boolean),
    openingHours: openingHours.length ? openingHours : undefined,
  };
}

module.exports = { buildLocalBusinessJsonLd };
