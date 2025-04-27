const db = require('../config/db');



// Get user profile
exports.getUserProfileImage = (req, res) => {
  const { id } = req.user; // from auth middleware
  const query = 'SELECT imageUrl FROM Users WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'profile image not found' });
    res.status(200).json(results[0]);
  });
};

exports.getUserProfile = (req, res) => {
  const { id } = req.user;
  const query = 'SELECT id, name, email, phone, imageUrl FROM Users WHERE id = ?';
  db.query(query, [id], (err, results) => { 
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(results[0]);
   });
};

// Update user profile
exports.updateUserProfile = (req, res) => {
  const { id } = req.user;
  const { name, email, phone } = req.body;
  const query = 'UPDATE Users SET name = ?, email = ?, phone = ? WHERE id = ?';
  db.query(query, [name, email, phone, id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ message: 'User profile updated successfully' });
  });
};

// Get user notifications
exports.getUserNotifications = (req, res) => {
  const { id } = req.user;
  const query = 'SELECT * FROM Notifications WHERE userId = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
};


// Validate JWT and return user info
exports.validateToken = (req, res) => {
// If we’re here, authMiddleware has already verified the token and set req.user
  res.status(200).json({
    valid: true,
    user: req.user
  });
};