const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const searchController = require('../controllers/searchController');
const authController = require('../controllers/authController');


router.patch('/profile', authMiddleware, userController.updateUserProfile);

// Get user notifications
router.get('/notifications', authMiddleware, userController.getUserNotifications);

// Validate token (new)
router.post('/validate', authMiddleware, userController.validateToken);


// Search history endpoints
router.get('/:userId/searchHistory', authMiddleware, searchController.getHistory);

router.post('/:userId/searchHistory', authMiddleware, searchController.addHistory);

router.delete('/:userId/searchHistory/:id', authMiddleware, searchController.deleteHistoryEntry);

router.delete('/:userId/searchHistory', authMiddleware, searchController.clearHistory);

// Upload profile image
router.post(
  '/upload-profile-image',
  authMiddleware,
  authController.completeProfile
);

module.exports = router;
