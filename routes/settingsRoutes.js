// backend/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// flashsale
router.get('/flashsale', settingsController.getFlashsale);
router.post('/flashsale', authMiddleware, settingsController.createFlashsale);
router.get('/flashsale/:id', authMiddleware, settingsController.getFlashsaleById);

// notifications
router.get('/notification', settingsController.getNotification);
router.post('/notification', authMiddleware, settingsController.createNotification);
router.get('/notification/:id', authMiddleware, settingsController.getNotificationById);

// adverts
router.get('/advert', settingsController.getAdvert);
router.post('/advert', authMiddleware, settingsController.createAdvert);
router.get('/advert/:id', authMiddleware, settingsController.getAdvertById);

module.exports = router;