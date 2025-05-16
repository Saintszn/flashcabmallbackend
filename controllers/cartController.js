const db = require('../config/db');

// In-memory store of pending responses per user
const pendingPolls = {};

// Helper to fetch current cart items & summary
function fetchCartData(userId, callback) {
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
    if (err) return callback(err);

    db.query(
      'SELECT discount FROM Flashsale WHERE expiryDate > NOW() LIMIT 1',
      (err2, flashResults) => {
        if (err2) return callback(err2);

        let discountPct = 0;
        if (flashResults.length) {
          discountPct = parseFloat(flashResults[0].discount);
        }

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

        const subTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        const deliveryFee = 0;
        const couponDiscount = 0;
        const total = parseFloat((subTotal + deliveryFee - couponDiscount).toFixed(2));

        const summary = {
          subTotal: parseFloat(subTotal.toFixed(2)),
          deliveryFee,
          discount: couponDiscount,
          total
        };

        callback(null, { items, summary });
      }
    );
  });
}

// ⏳ Long-poll GET /api/cart
exports.getCart = (req, res) => {
  const userId = req.user.id;

  // Hold open the request for up to 30 seconds
  const timeoutId = setTimeout(() => {
    fetchCartData(userId, (err, data) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(data);
    });
    removePending(userId, res);
  }, 30000);

  // Register this pending poll
  if (!pendingPolls[userId]) pendingPolls[userId] = [];
  pendingPolls[userId].push({ res, timeoutId });
};

// Notify any waiting poll for the user with updated cart
function resolvePendingPolls(userId) {
  if (!pendingPolls[userId]) return;
  fetchCartData(userId, (err, data) => {
    if (err) {
      pendingPolls[userId].forEach(({ res }) => res.status(500).json({ message: 'Error', error: err }));
    } else {
      pendingPolls[userId].forEach(({ res }) => res.json(data));
    }
    pendingPolls[userId].forEach(({ timeoutId }) => clearTimeout(timeoutId));
    pendingPolls[userId] = [];
  });
}

function removePending(userId, resToRemove) {
  if (!pendingPolls[userId]) return;
  pendingPolls[userId] = pendingPolls[userId].filter(({ res }) => res !== resToRemove);
}

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

    resolvePendingPolls(userId);
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

    resolvePendingPolls(userId);
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

    resolvePendingPolls(userId);
    res.json({ message: 'Removed from cart' });
  });
};

// PATCH /api/cart/apply-coupon
exports.applyCoupon = (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;

  db.query(`SELECT * FROM Coupons WHERE code = ?`, [code], (e, coupons) => {
    if (e) return res.status(500).json({ message: 'Coupon lookup error', error: e });
    if (!coupons.length) return res.status(404).json({ message: 'Coupon not found' });

    const discount = parseFloat(coupons[0].discount);

    fetchCartData(userId, (err2, data) => {
      if (err2) {
        return res.status(500).json({ message: 'Database error', error: err2 });
      }

      data.summary.discount = discount;
      data.summary.total = parseFloat(
        (data.summary.subTotal + data.summary.deliveryFee - discount).toFixed(2)
      );

      resolvePendingPolls(userId);
      res.json({ summary: data.summary });
    });
  });
};
