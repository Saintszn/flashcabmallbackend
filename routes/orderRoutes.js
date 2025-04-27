const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// Place an order
router.post('/', authMiddleware, orderController.placeOrder);

// Update order status (admin)
router.put('/status', authMiddleware, orderController.updateOrderStatus);


router.get('/live', authMiddleware, orderController.getLiveOrders);

// NEW: Get all orders (admin)
router.get('/', authMiddleware, orderController.getAllOrders);


// Get order details
router.get('/:orderId', authMiddleware, orderController.getOrderDetails);


module.exports = router;
