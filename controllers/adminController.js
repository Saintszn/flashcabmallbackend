const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/admin/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage }).single('profileImage');


exports.uploadProfileImage = (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(500).json({ message: 'Upload failed', error: err });

    const imageUrl = `/uploads/admin/${req.file.filename}`;

    // Save path in DB under settings as 'adminProfileImage'
    const db = require('../config/db');
    const query = `INSERT INTO Admin (imageUrl,) VALUES (?)`;
    db.query(query, ['adminProfileImage', imageUrl, imageUrl], (err) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });

      res.status(200).json({ message: 'Profile image updated', imageUrl });
    });
  });
};

const db = require('../config/db');
// Get ProfileDetails
exports.getProfileDetails = (req, res) => {
  const query = 'SELECT * FROM Admin Where name = ?, email = ?, phone = ?';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
};

exports.getProfileImage = (req, res) => {
  const query = 'SELECT * FROM Admin Where imageUrl = ?';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
};


exports.createProfileDetails = (req, res) => {
  let {
    name = null,
    email = null,
    phone = null,
  } = req.body;

  // Validate required fields
  if (name == null || email == null || phone == null) {
    return res
      .status(400)
      .json({ message: 'Name, email and phone are required.' });
  }

  // Convert/parse values accordingly
  const validName = parseFloat(name);
  const validEmail = parseFloat(email);
  const validPhone = parseFloat(phone);

  const query = `INSERT INTO Admin (name, email, phone) VALUES (?, ?, ?) `;

  db.query(
    query,
    [
      validName,
      validEmail,
      validPhone, 
    ],
    (err, results) => {
      if (err) {
        console.error('Database error inserting ProfileDetails', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(201).json({ message: 'Profile Details updated successfully', profilDetailsId: results.insertId });
    }
  );
};


