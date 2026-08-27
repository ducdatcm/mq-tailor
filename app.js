require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const helmet = require('helmet');

const { runStartupTasks } = require('./src/config/bootstrap');
const privateDomainGate = require('./src/middleware/privateDomain');
const basicAuthGate = require('./src/middleware/basicAuthGate');
const siteSettingsMiddleware = require('./src/middleware/siteSettings');
const publicRouter = require('./src/routes/public');
const adminRouter = require('./src/routes/admin');
const sitemapRouter = require('./src/routes/sitemap');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Static assets are cached in the browser for 7 days (see express.static
// below) and always served from the same URL (style.min.css, main.min.js),
// so without something to invalidate that cache a CSS/JS change made today
// can stay invisible to a returning visitor for up to a week. Appending
// ?v=<boot time> to those two URLs (see seo-head.ejs / footer.ejs) forces a
// fresh copy on every deploy, since this host gives each deploy a brand-new
// process (and disposable folder) with a new boot time.
app.locals.assetVersion = Date.now();

app.set('trust proxy', 1);
app.use(privateDomainGate);
app.use(basicAuthGate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
// NOT extracting <script> blocks: express-ejs-layouts would pull them out
// of the page body expecting the layout to reinsert them via <%- script %>,
// but neither layout does — any inline <script> in a page view would
// silently vanish before reaching the browser. Leaving scripts in place
// where the page actually wrote them avoids that trap entirely.

// Photos are served from Cloudflare R2 (a different origin than the site
// itself — see src/config/storage.js), so its public URL must be explicitly
// allowed or the browser's CSP silently blocks every <img>.
const r2Origin = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).origin : null;
  } catch (e) {
    return null;
  }
})();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', r2Origin].filter(Boolean),
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
        connectSrc: ["'self'", 'https://www.google-analytics.com'],
        frameSrc: ["'self'", 'https://www.google.com'], // map embed
      },
    },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '7d' : 0 }));

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
});

app.use(
  session({
    key: 'mq_session',
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);
app.use(flash());

app.use(siteSettingsMiddleware);

// Global template locals that don't depend on request state.
app.use((req, res, next) => {
  res.locals.gaId = (res.locals.settings && res.locals.settings.ga_measurement_id) || null;
  res.locals.currentYear = new Date().getFullYear();
  // Admin textareas store multi-paragraph body text as plain text with a
  // blank line between paragraphs (same convention as the Journal body
  // field) — HTML collapses that into one run-on paragraph unless it's
  // split into separate <p> tags. Every template renders long-form body
  // text through this instead of a bare <%= %> now.
  res.locals.paragraphs = (text) =>
    (text || '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  next();
});

app.use('/', sitemapRouter);
app.get('/', (req, res) => res.redirect(302, '/en/'));
app.use('/:lang(en|vi)', publicRouter);
app.use('/admin', adminRouter);

// 404
app.use((req, res) => {
  const lang = ['en', 'vi'].includes(req.path.split('/')[1]) ? req.path.split('/')[1] : 'en';
  res.status(404).render('pages/404', {
    lang,
    t: require('./src/config/i18n').translator(lang),
    altLang: lang === 'en' ? 'vi' : 'en',
    altLangPath: `/${lang === 'en' ? 'vi' : 'en'}/`,
    currentPath: req.path,
    baseUrl: process.env.BASE_URL || '',
    title: 'Page Not Found',
    metaDescription: '',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong. Please try again shortly.');
});

const port = Number(process.env.PORT) || 3000;

// Run migrations/first-boot seed/admin-account setup before accepting
// traffic — see src/config/bootstrap.js for why this replaces the usual
// `npm run migrate && npm run seed` manual steps on this host.
runStartupTasks()
  .catch((err) => console.error('[bootstrap] unexpected startup error:', err))
  .finally(() => {
    app.listen(port, () => {
      console.log(`Minh Quang website listening on port ${port}`);
    });
  });
