const db = require('../config/db');

const Category = {
  // Predefined categories: these should already be in the database
  findAll: (callback) => {
    const query = 'SELECT * FROM Categories';
    db.query(query, callback);
  },
  // Admin can update categories dynamically
  update: (id, categoryData, callback) => {
    const query = 'UPDATE Categories SET ? WHERE id = ?';
    db.query(query, [categoryData, id], callback);
  }
};

module.exports = Category;
