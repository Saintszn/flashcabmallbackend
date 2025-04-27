const db = require('../config/db');

const SubCategory = {
  findAll: (callback) => {
    const query = 'SELECT * FROM SubCategories';
    db.query(query, callback);
  },
  update: (id, subCategoryData, callback) => {
    const query = 'UPDATE SubCategories SET ? WHERE id = ?';
    db.query(query, [subCategoryData, id], callback);
  }
};

module.exports = SubCategory;
