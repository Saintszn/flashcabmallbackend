const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, notificationController.getNotifications);

// Send notification (admin or user)
router.post('/', authMiddleware, notificationController.sendNotification);

// Mark one as read
router.patch('/:id/read', authMiddleware, notificationController.markAsReadById);

// ── NEW ── Mark all unread as read for current user
router.patch('/read-all', authMiddleware, notificationController.markAllReadForUser);

// ── NEW ── Get unread count for current user
router.get('/unread-count', authMiddleware, notificationController.getUnreadCountForUser);

module.exports = router;
