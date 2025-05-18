const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config/auth');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');




const storageImg = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/users');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.body.userId}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storageImg }).single('image');

// Signup
exports.signup = (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Please provide name, email, and password.' });
  }

  // Check duplicate email
  db.query('SELECT 1 FROM Users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (results.length) return res.status(400).json({ message: 'User already exists' });

    // **Store raw password directly** 
    db.query(
      `INSERT INTO Users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, password],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', err });
        res.status(201).json({
          message: 'User created successfully',
          userId: result.insertId
        });
      }
    );
  });
};


exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  // Admin shortcut
  if (email === process.env.ADMIN_EMAIL) {
    if (password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ id: 'admin', email, role: 'admin' }, jwtSecret, {
        expiresIn: jwtExpire
      });
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: 'admin', name: 'Admin', email, role: 'admin' }
      });
    } else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  }

  // Regular user
  db.query('SELECT id, name, password FROM Users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (!results.length) return res.status(404).json({ message: 'User not found' });

    const user = results[0];
    if (password !== user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email }, jwtSecret, { expiresIn: jwtExpire });
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email }
    });
  });
};


// COMPLETE PROFILE
exports.completeProfile = (req, res) => {
  upload(req, res, err => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ message: 'Image upload error', error: err });
    }
    console.log('Multer file:', req.file);      // <-- should log your file metadata
    console.log('Form fields:', req.body);
    const { userId, phone, gender } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const imageUrl = req.file
      ? `/uploads/users/${req.file.filename}`
      : null;

    db.query(
      'UPDATE Users SET phone = ?, gender = ?, imageUrl = ? WHERE id = ?',
      [ phone || null, gender || null, imageUrl, userId ],
      err => {
        if (err) {
          console.error('DB error:', err);
          return res.status(500).json({ message: 'Database error', error: err });
        }
        // Return the saved imageUrl so frontend can immediately display it:
        res.status(200).json({ message: 'Profile completed', imageUrl });
      }
    );
  });
};



// Password update
exports.updatePassword = (req, res) => {
  const { id } = req.user;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Provide current and new password.' });
  }

  db.query('SELECT password FROM Users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (!results.length) return res.status(404).json({ message: 'User not found' });

    if (currentPassword !== results[0].password) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // **Store newPassword as plain text**
    db.query('UPDATE Users SET password = ? WHERE id = ?', [newPassword, id], err => {
      if (err) return res.status(500).json({ message: 'Database error', err });
      res.status(200).json({ message: 'Password updated successfully' });
    });
  });
};

exports.deleteAccount = (req, res) => {
  const { id } = req.user;
  db.query('DELETE FROM Users WHERE id = ?', [id], err => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.status(200).json({ message: 'User account deleted successfully' });
  });
};




exports.forgotPassword = (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'Name, phone, and email are required.' });
  }

  db.query(
    'SELECT password FROM Users WHERE name = ? AND phone = ? AND email = ?',
    [name, phone, email],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', err });
      if (!results.length) {
        return res.status(404).json({ message: 'No user account found.' });
      }
      res.status(200).json({ password: results[0].password });
    }
  );
};

 // at the end of the file, after `exports.updatePassword = …`
/**
 * Validate the incoming JWT and return the decoded user.
 */
exports.validate = (req, res) => {
  res.status(200).json({ valid: true, user: req.user });
};
  
