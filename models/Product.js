const db = require('../config/db');

const Product = {
  create: (productData, callback) => {
    const query = 'INSERT INTO Products SET ?';
    db.query(query, productData, callback);
  },
  findAll: (callback) => {
    const query = 'SELECT * FROM Products';
    db.query(query, callback);
  },
  findById: (id, callback) => {
    const query = 'SELECT * FROM Products WHERE id = ?';
    db.query(query, [id], callback);
  },
  update: (id, productData, callback) => {
    const query = 'UPDATE Products SET ? WHERE id = ?';
    db.query(query, [productData, id], callback);
  },
  delete: (id, callback) => {
    const query = 'DELETE FROM Products WHERE id = ?';
    db.query(query, [id], callback);
  }
};

module.exports = Product;
