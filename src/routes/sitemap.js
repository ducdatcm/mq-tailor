const express = require('express');
const router = express.Router();
const db = require('../config/db');

const STATIC_PATHS = ['', 'the-house', 'tailoring', 'our-garments', 'the-process', 'our-people', 'cloth', 'journal', 'visit'];

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const posts = await db('journal_posts').where({ status: 'published' }).select('slug', 'updated_at');

    const urls = [];
    ['en', 'vi'].forEach((lang) => {
      STATIC_PATHS.forEach((p) => {
        urls.push(`${base}/${lang}/${p}`.replace(/\/$/, '') || `${base}/${lang}`);
      });
      posts.forEach((post) => {
        urls.push(`${base}/${lang}/journal/${post.slug}`);
      });
    });

    res.type('application/xml');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
        `\n</urlset>`
    );
  } catch (err) {
    next(err);
  }
});

router.get('/robots.txt', (req, res) => {
  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${base}/sitemap.xml\n`);
});

module.exports = router;
