// backend/controllers/cartController.js
const db = require('../config/db');

// GET /api/cart
exports.getCart = (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT
      c.id,
      c.quantity,
      c.size,
      p.id AS productId,
      p.name,
      p.price,
      p.imageUrl
    FROM Cart c
    JOIN Products p ON c.productId = p.id
    WHERE c.userId = ?
    ORDER BY c.addedAt DESC
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    // Build summary
    let subTotal = 0;
    rows.forEach(r => { subTotal += r.price * r.quantity; });
    const deliveryFee = 0;
    const discount = 0;
    const total = subTotal + deliveryFee - discount;
    res.json({
      items: rows.map(r => ({
        id: r.id,
        quantity: r.quantity,
        size: r.size,
        product: {
          id: r.productId,
          name: r.name,
          price: r.price,
          imageUrl: r.imageUrl
        }
      })),
      summary: { subTotal, deliveryFee, discount, total }
    });
  });
};

// POST /api/cart
exports.addToCart = (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1, size = null } = req.body;
  const sql = `
    INSERT INTO Cart (userId, productId, quantity, size)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
  `;
  db.query(sql, [userId, productId, quantity, size], err => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({ message: 'Added to cart' });
  });
};

// PUT /api/cart/:id
exports.updateCart = (req, res) => {
  const userId = req.user.id;
  const cartId = req.params.id;
  const { quantity } = req.body;
  const sql = `UPDATE Cart SET quantity = ? WHERE id = ? AND userId = ?`;
  db.query(sql, [quantity, cartId, userId], err => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Quantity updated' });
  });
};

// DELETE /api/cart/remove/:id
exports.removeFromCart = (req, res) => {
  const userId = req.user.id;
  const cartId = req.params.productId;
  const sql = `DELETE FROM Cart WHERE id = ? AND userId = ?`;
  db.query(sql, [cartId, userId], err => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json({ message: 'Removed from cart' });
  });
};

// PATCH /api/cart/apply-coupon
exports.applyCoupon = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  // Validate coupon
  db.query(`SELECT * FROM Coupons WHERE code = ?`, [code], (e, coupons) => {
    if (e) return res.status(500).json({ message: 'Coupon lookup error', error: e });
    if (!coupons.length) return res.status(404).json({ message: 'Coupon not found' });
    const discount = parseFloat(coupons[0].discount);
    // Re-fetch cart summary
    const sql = `
      SELECT c.quantity, p.price
      FROM Cart c JOIN Products p ON c.productId = p.id
      WHERE c.userId = ?
    `;
    db.query(sql, [userId], (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      let subTotal = 0;
      rows.forEach(r => (subTotal += r.price * r.quantity));
      const deliveryFee = 0;
      const total = subTotal + deliveryFee - discount;
      res.json({
        summary: { subTotal, deliveryFee, discount, total }
      });
    });
  });
};
