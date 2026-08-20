require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const helmet = require('helmet');

const { runStartupTasks } = require('./src/config/bootstrap');
const siteSettingsMiddleware = require('./src/middleware/siteSettings');
const publicRouter = require('./src/routes/public');
const adminRouter = require('./src/routes/admin');
const sitemapRouter = require('./src/routes/sitemap');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
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
