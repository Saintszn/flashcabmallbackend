// routes/categoryRoutes.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
  db.query('SELECT * FROM Categories', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
});

// GET /api/categories/:id/subcategories
router.get('/:id/subcategories', (req, res) => {
  const sql = 'SELECT id, name FROM SubCategories WHERE categoryId = ?';
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json(rows);
  });
});






module.exports = router;
