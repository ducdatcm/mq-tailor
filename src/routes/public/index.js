const express = require('express');
const router = express.Router({ mergeParams: true });

const localeMiddleware = require('../../middleware/locale');
const homeController = require('../../controllers/public/homeController');
const houseController = require('../../controllers/public/houseController');
const tailoringController = require('../../controllers/public/tailoringController');
const garmentsController = require('../../controllers/public/garmentsController');
const processController = require('../../controllers/public/processController');
const peopleController = require('../../controllers/public/peopleController');
const clothController = require('../../controllers/public/clothController');
const journalController = require('../../controllers/public/journalController');
const visitController = require('../../controllers/public/visitController');

router.use(localeMiddleware);

router.get('/', homeController.show);
router.get('/the-house', houseController.show);
router.get('/tailoring', tailoringController.show);
router.get('/our-garments', garmentsController.show);
router.get('/the-process', processController.show);
router.get('/our-people', peopleController.show);
router.get('/cloth', clothController.show);
router.get('/journal', journalController.list);
router.get('/journal/:slug', journalController.detail);
router.get('/visit', visitController.show);
router.post('/visit/enquiry', visitController.submitEnquiry);

module.exports = router;
