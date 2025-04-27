const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');



// Create product (admin-only endpoint; ensure admin check in authMiddleware as needed)
router.post('/', authMiddleware, productController.createProduct);

router.get('/search', productController.searchProducts);

// Get all products
router.get('/', productController.getProducts);

// Get product by id
router.get('/:id', productController.getProductById);


// Update product
router.put('/:id', authMiddleware, productController.updateProduct);

// Delete product
router.delete('/:id', authMiddleware, productController.deleteProduct);




module.exports = router;
