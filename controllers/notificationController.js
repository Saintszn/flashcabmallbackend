// /backend/controllers/notificationController.js
const db = require('../config/db');

// Admin: send a notification to every user
exports.sendNotification = (req, res) => {
  const { title, iconUrl, message } = req.body;
  if (!title == null || icon ==null || message==null) {
    return res.status(400).json({ message: 'Title, iconUrl, and message are required.' });
  }

  // Get all user IDs
  db.query('SELECT id FROM Users', (err, users) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (users.length === 0) {
      return res.status(400).json({ message: 'No users to notify.' });
    }

    // Prepare bulk insert values
    const values = users.map(u => [u.id, title, iconUrl, message, 0]);
    const insertQuery = `
      INSERT INTO Notifications (userId, title, iconUrl, message, isRead) VALUES ?,?,?,?,?`;
    db.query(insertQuery, [values], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.status(201).json({
        message: 'Notification sent to all users successfully',
        sentCount: result.affectedRows
      });
    });
  });
};

// ── NEW ── Mark all unread notifications for current user as read
exports.markAllReadForUser = (req, res) => {
  const userId = req.user.id;
  const sql = 'UPDATE Notifications SET isRead = 1 WHERE userId = ? AND isRead = 0';
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({
      message: 'All notifications marked as read',
      updatedCount: result.affectedRows
    });
  });
};

// ── NEW ── Get unread notification count for current user
exports.getUnreadCountForUser = (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT COUNT(*) AS count FROM Notifications WHERE userId = ? AND isRead = 0';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json({ count: results[0].count });
  });
};

// URL‑param single‑mark (used by PATCH /:id/read)
exports.markAsReadById = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ message: 'Notification ID is required.' });
  }
  db.query(
    'UPDATE Notifications SET isRead = 1 WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        console.error('markAsReadById error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
};

exports.getNotifications = (req, res) => {
  const query = 'SELECT * FROM Notifications';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(200).json(results);
  });
};
