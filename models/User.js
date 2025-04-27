const db = require('../config/db');

const User = {
  create: (userData, callback) => {
    const query = 'INSERT INTO Users SET ?';
    db.query(query, userData, callback);
  },
  findByEmail: (email, callback) => {
    const query = 'SELECT * FROM Users WHERE email = ?';
    db.query(query, [email], callback);
  },
  findById: (id, callback) => {
    const query = 'SELECT * FROM Users WHERE id = ?';
    db.query(query, [id], callback);
  },
  update: (id, userData, callback) => {
    const query = 'UPDATE Users SET ? WHERE id = ?';
    db.query(query, [userData, id], callback);
  }
};

module.exports = User;
