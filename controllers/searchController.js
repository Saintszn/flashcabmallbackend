// backend/controllers/searchController.js
const db = require('../config/db');

// GET /api/search/suggestions?q=…
exports.getSuggestions = (req, res) => {
  const q = `%${req.query.q}%`;
  // Fetch matching categories
  db.query(
    'SELECT id, name FROM Categories WHERE name LIKE ?',
    [q],
    (err, categories) => {
      if (err) return res.status(500).json({ message: 'Error fetching categories', error: err });
      // Fetch matching subcategories & their parent category name
      db.query(
        `SELECT sc.id, sc.name, c.name AS categoryName
         FROM SubCategories sc
         JOIN Categories c ON sc.categoryId = c.id
         WHERE sc.name LIKE ?`,
        [q],
        (err2, subcategories) => {
          if (err2) return res.status(500).json({ message: 'Error fetching subcategories', error: err2 });
          res.json({ categories, subcategories });
        }
      );
    }
  );
};

// GET /api/products/search?q=…
exports.searchProducts = (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ message: 'Query parameter q is required.' });
  const exact = q.trim();
  const like = `%${q}%`;
  db.query(
    `SELECT * FROM Products
     WHERE name = ? OR name LIKE ?`,
    [exact, like],
    (err, products) => {
      if (err) return res.status(500).json({ message: 'Error searching products', error: err });
      res.json(products);
    }
  );
};

// GET /api/users/:userId/searchHistory
exports.getHistory = (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (req.user.id !== userId) return res.status(403).json({ message: 'Forbidden' });
  db.query(
    'SELECT id, term FROM SearchHistory WHERE userId = ? ORDER BY createdAt DESC',
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Error fetching history', error: err });
      res.json(rows);
    }
  );
};

// POST /api/users/:userId/searchHistory
exports.addHistory = (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { term } = req.body;
  if (req.user.id !== userId) return res.status(403).json({ message: 'Forbidden' });
  if (!term) return res.status(400).json({ message: 'Term is required.' });
  db.query(
    'INSERT INTO SearchHistory (userId, term) VALUES (?, ?)',
    [userId, term],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error saving history', error: err });
      res.status(201).json({ id: result.insertId, term });
    }
  );
};

// DELETE /api/users/:userId/searchHistory/:id
exports.deleteHistoryEntry = (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const entryId = parseInt(req.params.id, 10);
  if (req.user.id !== userId) return res.status(403).json({ message: 'Forbidden' });
  db.query(
    'DELETE FROM SearchHistory WHERE id = ? AND userId = ?',
    [entryId, userId],
    err => {
      if (err) return res.status(500).json({ message: 'Error deleting entry', error: err });
      res.json({ message: 'Deleted' });
    }
  );
};

// DELETE /api/users/:userId/searchHistory
exports.clearHistory = (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (req.user.id !== userId) return res.status(403).json({ message: 'Forbidden' });
  db.query(
    'DELETE FROM SearchHistory WHERE userId = ?',
    [userId],
    err => {
      if (err) return res.status(500).json({ message: 'Error clearing history', error: err });
      res.json({ message: 'Cleared' });
    }
  );
};
