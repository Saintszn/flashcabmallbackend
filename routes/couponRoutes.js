const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');

// GET all coupons (added to prevent 404 error on GET /api/coupons)
router.get('/', couponController.getCoupons);

// Create coupon (admin)
router.post('/', authMiddleware, couponController.createCoupon);

// Update coupon (admin)
router.put('/:id', authMiddleware, couponController.updateCoupon);

// Validate coupon (open to users)
router.post('/validate', couponController.validateCoupon);

module.exports = router;
