const db = require('../config/db');

const Coupon = {
  create: (couponData, callback) => {
    const query = 'INSERT INTO Coupons SET ?';
    db.query(query, couponData, callback);
  },
  findByCode: (code, callback) => {
    const query = 'SELECT * FROM Coupons WHERE code = ?';
    db.query(query, [code], callback);
  },
  update: (id, couponData, callback) => {
    const query = 'UPDATE Coupons SET ? WHERE id = ?';
    db.query(query, [couponData, id], callback);
  }
};

module.exports = Coupon;
