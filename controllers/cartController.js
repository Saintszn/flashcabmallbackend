// backend/controllers/cartController.js
const db = require('../config/db');

exports.getCart = (req, res) => {
  const userId = req.user.id;
  const cartSql = `
    SELECT
      c.id            AS cartItemId,
      p.id            AS productId,
      p.name          AS name,
      p.price         AS price,
      p.imageUrl      AS imageUrl,
      c.quantity      AS quantity,
      c.size          AS size
    FROM Cart c
    JOIN Products p ON c.productId = p.id
    WHERE c.userId = ?
  `;
  db.query(cartSql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    // check for active flash sale
    db.query(
      'SELECT discount FROM Flashsale WHERE expiryDate > NOW() LIMIT 1',
      (err2, flashResults) => {
        let discountPct = 0;
        if (!err2 && flashResults.length) {
          discountPct = parseFloat(flashResults[0].discount);
        }
        // build items
        const items = results.map(row => {
          let finalPrice = parseFloat(row.price);
          if (discountPct) {
            finalPrice = parseFloat((finalPrice * (1 - discountPct / 100)).toFixed(2));
          }
          return {
            id: row.cartItemId,
            quantity: row.quantity,
            size: row.size,
            product: {
              id: row.productId,
              name: row.name,
              price: finalPrice,
              imageUrl: row.imageUrl,
            }
          };
        });
        // summary
        const subTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        const deliveryFee = 0;
        const couponDiscount = 0;
        const total = parseFloat((subTotal + deliveryFee - couponDiscount).toFixed(2));
        res.json({
          items,
          summary: {
            subTotal: parseFloat(subTotal.toFixed(2)),
            deliveryFee,
            discount: couponDiscount,
            total
          }
        });
      }
    );
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
