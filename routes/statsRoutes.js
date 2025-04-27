// /routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');

// Define the route that returns the dashboard statistics
router.get('/', authMiddleware, statsController.getStats);

module.exports = router;
