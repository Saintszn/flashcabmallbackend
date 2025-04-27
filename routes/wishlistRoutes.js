// backend/routes/wishlistRoutes.js
const express = require('express');
const router  = express.Router();
const wishlist = require('../controllers/wishlistController');
const auth    = require('../middleware/authMiddleware');

router.get('/',           auth, wishlist.getWishlist);
router.post('/',          auth, wishlist.addToWishlist);
router.delete('/:productId', auth, wishlist.removeFromWishlist);

module.exports = router;
