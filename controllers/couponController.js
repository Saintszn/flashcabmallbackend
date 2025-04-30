const db = require('../config/db');

// Create coupon
exports.createCoupon = (req, res) => {
  // Destructure both expiryDate and expiry (from the front-end)
  let { code, discount, expiryDate, expiry } = req.body;
  
  // If expiryDate is not provided but expiry is, use expiry.
  if (!expiryDate && expiry) {
    expiryDate = expiry;
  }
  
  // Normalize the inputs
  code = code?.trim() || null;
  discount = discount === '' ? null : discount;
  expiryDate = expiryDate === '' ? null : expiryDate;
  
  if (!code || discount == null || !expiryDate) {
    return res.status(400).json({
      message: 'Coupon code, discount, and expiry date are required.',
    });
  }
  
  const validDiscount = parseFloat(discount);
  
  const query = 'INSERT INTO Coupons (code, discount, expiryDate) VALUES (?, ?, ?)';
  db.query(query, [code, validDiscount, expiryDate], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({
      message: 'Coupon created successfully',
      couponId: results.insertId,
    });
  });
};


// Update coupon
exports.updateCoupon = (req, res) => {
  const { id } = req.params;
  let { code, discount, expiryDate, expiry } = req.body;
  
  // If expiryDate is not provided but expiry is, use it.
  if (!expiryDate && expiry) {
    expiryDate = expiry;
  }
  
  code = code?.trim() || null;
  discount = discount === '' ? null : discount;
  expiryDate = expiryDate === '' ? null : expiryDate;
  
  if (!code || discount == null || !expiryDate) {
    return res.status(400).json({ message: 'Coupon code, discount, and expiry date are required.' });
  }
  
  const validDiscount = parseFloat(discount);
  const query = 'UPDATE Coupons SET code = ?, discount = ?, expiryDate = ? WHERE id = ?';
  db.query(query, [code, validDiscount, expiryDate, id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ message: 'Coupon updated successfully' });
  });
};


// Get all coupons
exports.getCoupons = (req, res) => {
  const query = 'SELECT * FROM Coupons';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
};

exports.deleteCoupon = (req, res) => {
  const { code } = req.params;
  const query = 'DELETE FROM Coupons WHERE code = ?';
  db.query(query, [code], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    return res.status(200).json({ message: 'Coupon redeemed successfully' });
  });
};



// Validate coupon
exports.validateCoupon = (req, res) => {
  const { code } = req.body;
  const query = 'SELECT * FROM Coupons WHERE code = ?';
  db.query(query, [code], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Coupon not found' });
    // Add additional validation logic (e.g., expiry checks) as needed.
    const currentDate = new Date();
    const expiryDate = new Date(results[0].expiryDate);
    if (currentDate > expiryDate) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }
    res.status(200).json({ valid: true, coupon: results[0] });
  });
};
