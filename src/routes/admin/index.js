const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../../middleware/auth');
const { upload } = require('../../config/upload');

const authController = require('../../controllers/admin/authController');
const dashboardController = require('../../controllers/admin/dashboardController');
const journalController = require('../../controllers/admin/journalController');
const peopleController = require('../../controllers/admin/peopleController');
const clothController = require('../../controllers/admin/clothController');
const mediaController = require('../../controllers/admin/mediaController');
const settingsController = require('../../controllers/admin/settingsController');
const contentController = require('../../controllers/admin/contentController');
const processStepsController = require('../../controllers/admin/processStepsController');
const enquiriesController = require('../../controllers/admin/enquiriesController');

// Make flash messages + the admin layout available to every admin view.
// (express-ejs-layouts picks the layout from options.layout, falling back to
// res.locals.layout — the login route overrides this with 'layouts/admin-auth'.)
router.use((req, res, next) => {
  res.locals.flashSuccess = req.flash('success');
  res.locals.flashError = req.flash('error');
  res.locals.adminUsername = req.session ? req.session.adminUsername : null;
  res.locals.layout = 'layouts/admin';
  next();
});

// --- Auth (public) ---
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// --- Everything below requires a session ---
router.use(requireAdmin);

router.get('/', dashboardController.show);

router.get('/journal', journalController.list);
router.get('/journal/new', journalController.newForm);
router.post('/journal/new', journalController.create);
router.get('/journal/:id/edit', journalController.editForm);
router.post('/journal/:id/edit', journalController.update);
router.post('/journal/:id/delete', journalController.remove);

router.get('/people', peopleController.list);
router.get('/people/new', peopleController.newForm);
router.post('/people/new', peopleController.create);
router.get('/people/:id/edit', peopleController.editForm);
router.post('/people/:id/edit', peopleController.update);
router.post('/people/:id/delete', peopleController.remove);

router.get('/cloth', clothController.list);
router.get('/cloth/new', clothController.newForm);
router.post('/cloth/new', clothController.create);
router.get('/cloth/:id/edit', clothController.editForm);
router.post('/cloth/:id/edit', clothController.update);
router.post('/cloth/:id/delete', clothController.remove);

router.get('/media', mediaController.list);
router.post('/media/upload', upload.single('image'), mediaController.upload);
router.post('/media/:id/alt', mediaController.updateAlt);
router.post('/media/:id/delete', mediaController.remove);

router.get('/settings', settingsController.show);
router.post('/settings', upload.single('logo'), settingsController.update);

router.get('/content/:pageKey', contentController.show);
router.post('/content/:pageKey/:sectionKey', contentController.updateSection);

router.get('/process-steps', processStepsController.show);
router.post('/process-steps/:id', processStepsController.updateStep);

router.get('/enquiries', enquiriesController.list);
router.post('/enquiries/:id/status', enquiriesController.updateStatus);

module.exports = router;
