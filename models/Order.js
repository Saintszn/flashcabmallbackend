const db = require('../config/db');

const Order = {
  create: (orderData, callback) => {
    const query = 'INSERT INTO Orders SET ?';
    db.query(query, orderData, callback);
  },
  findById: (id, callback) => {
    const query = 'SELECT * FROM Orders WHERE id = ?';
    db.query(query, [id], callback);
  },
  updateStatus: (id, status, callback) => {
    const query = 'UPDATE Orders SET status = ? WHERE id = ?';
    db.query(query, [status, id], callback);
  }
};

module.exports = Order;
