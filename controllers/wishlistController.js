// backend/controllers/wishlistController.js
const db = require('../config/db');

exports.getWishlist = (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT
      p.id         AS productId,
      p.name       AS name,
      p.price      AS price,
      p.imageUrl   AS imageUrl
    FROM Wishlist w
    JOIN Products p ON w.productId = p.id
    WHERE w.userId = ?
    ORDER BY w.createdAt DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    // Apply flash sale discount if active
    const flashSaleSql = 'SELECT discount FROM Flashsale WHERE expiryDate > NOW() LIMIT 1';
    db.query(flashSaleSql, (err2, flashResults) => {
      if (!err2 && flashResults.length > 0) {
        const discount = parseFloat(flashResults[0].discount);
        results = results.map(item => {
          const newPrice = item.price * (1 - discount / 100);
          item.price = parseFloat(newPrice.toFixed(2));
          return item;
        });
      }
      res.json(results);
    });
  });
};


exports.addToWishlist = (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;
  const sql = 'INSERT IGNORE INTO Wishlist (userId, productId) VALUES (?, ?)';
  db.query(sql, [userId, productId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({ message: 'Added to wishlist' });
  });
};

exports.removeFromWishlist = (req, res) => {
  const userId = req.user.id;
  const productId = req.params.productId;
  const sql = 'DELETE FROM Wishlist WHERE userId = ? AND productId = ?';
  db.query(sql, [userId, productId], (err) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Removed from wishlist' });
  });
};
