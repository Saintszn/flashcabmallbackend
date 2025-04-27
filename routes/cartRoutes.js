// backend/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const cart = require('../controllers/cartController');

router.get('/',            auth, cart.getCart);
router.post('/',           auth, cart.addToCart);
router.put('/:id',         auth, cart.updateCart);
router.delete('/remove/:productId', auth, cart.removeFromCart);
router.patch('/apply-coupon',       auth, cart.applyCoupon);

module.exports = router;
