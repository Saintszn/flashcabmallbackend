// /backend/controllers/settingsController.js

const db = require('../config/db');

exports.createFlashsale = (req, res) => {
  let { title, discount, expiryDate } = req.body;

  title = title === '' ? null : title;
  discount = discount === '' ? null : discount;

  if (title == null || discount == null || !expiryDate) {
    return res.status(400).json({
      message: 'Flashsale title, discount, and expiry date are required.',
    });
  }
  const validTitle = title;
  const validDiscount = parseFloat(discount);

  const query = `INSERT INTO Flashsale (title, discount, expiryDate) VALUES (?, ?, ?)`;
  db.query(query, [validTitle, validDiscount, expiryDate], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    const flashsaleId = results.insertId;
    res.status(201).json({
      message: 'Flashsale set and started successfully',
      flashsaleId,
    });

    // --- Real-time emit to all users ---
    const io = req.app.get('io');
    io.emit('flashSaleStarted', {
      flashsaleId,
      title: validTitle,
      discount: validDiscount,
      expiryDate,
    });
  });
};

// Get all Flashsales
exports.getFlashsale = (req, res) => {
  const query = 'SELECT * FROM Flashsale';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
};

// Get Flashsale by id
exports.getFlashsaleById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Flashsale WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Flashsale not found' });
    res.status(200).json(results[0]);
  });
};

exports.createNotification = (req, res) => {
  const { title, iconUrl, message, date } = req.body;

  if (!title || !iconUrl || !message || !date) {
    return res.status(400).json({ message: 'Title, iconUrl, date and message are required.' });
  }

  // Create a new group first
  const groupInsert = 'INSERT INTO NotificationGroup () VALUES ()';

  db.query(groupInsert, (err, groupResult) => {
    if (err) return res.status(500).json({ message: 'Error creating notification group', error: err });

    const groupId = groupResult.insertId;

    // Get all user IDs
    db.query('SELECT id FROM Users', (err, users) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });

      const values = users.map(u => [u.id, title, iconUrl, message, date, 0, groupId]);
      const insertQuery = `
        INSERT INTO Notifications (userId, title, iconUrl, message, date, isRead, notificationGroupId)
        VALUES ?
      `;

      db.query(insertQuery, [values], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });

        res.status(201).json({
          message: 'Notification sent to all users successfully',
          sentCount: result.affectedRows,
          groupId: groupId
        });

        // Real-time notification emit
        const io = req.app.get('io');
        users.forEach(u => {
          io.to(`user_${u.id}`).emit('notificationReceived', {
            notificationGroupId: groupId,
            title,
            message,
            date,
          });
        });
      });
    });
  });
};

// new: group all user-copies by notificationGroupId
exports.getNotification = (req, res) => {
  const query = `
    SELECT
      notificationGroupId   AS id,
      title,
      iconUrl,
      message,
      date,
      COUNT(*)             AS totalRecipients,
      MAX(createdAt)       AS sentAt
    FROM Notifications
    GROUP BY notificationGroupId, title, iconUrl, message, date
    ORDER BY sentAt DESC
  `;
  db.query(query, (err, groups) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(groups);
  });
};

// Get Notification by id
exports.getNotificationById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Notifications WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json(results[0]);
  });
};

exports.createAdvert = (req, res) => {
  const { title, imageUrl, link, date } = req.body;

  if (!title || !imageUrl || !link || !date) {
    return res.status(400).json({ message: 'Title, imageUrl, link and date are required.' });
  }

  const query = `
    INSERT INTO Adverts (title, imageUrl, link, date)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [title, imageUrl, link, date], (err, results) => {
    if (err) {
      console.error('Database error inserting Advert:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    const advertId = results.insertId;
    res.status(201).json({
      message: 'Advert created successfully',
      advertId
    });

    // --- Real-time emit to all users ---
    const io = req.app.get('io');
    io.emit('advertPosted', {
      advertId,
      title,
      imageUrl,
      link,
      date,
    });
  });
};

// Get all Adverts
exports.getAdvert = (req, res) => {
  const query = 'SELECT * FROM Adverts';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
};

// Get Advert by id
exports.getAdvertById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Adverts WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Advert not found' });
    res.status(200).json(results[0]);
  });
};
