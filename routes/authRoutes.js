const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

router.delete('/delete-account', authMiddleware, authController.deleteAccount );

router.post('/forgot-password', authController.forgotPassword);

// Validate JWT
router.post(
  '/validate',
  authMiddleware,
  (req, res) => {
    // If this middleware runs, token is valid
    res.status(200).json({ valid: true, user: req.user });
  }
);

// Complete profile (phone, gender, image) — unprotected, uses userId in formData
router.post('/complete-profile', authController.completeProfile);

// Update password (protected)
router.patch('/update-password', authMiddleware, authController.updatePassword);


module.exports = router;

