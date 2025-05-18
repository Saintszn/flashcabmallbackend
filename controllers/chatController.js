const db = require('../config/db');
const pusher = require('../config/pusher');  // ← remains as Pusher-only

/**
 * List all users who have ever sent a message,
 * along with their name, last message snippet & timestamp.
 */
exports.getChatUsers = (req, res) => {
  const query = `
    SELECT u.id, u.name,
           m.text AS lastText,
           m.fileUrl,
           m.fromAdmin,
           m.createdAt
    FROM (
      SELECT chatUserId, MAX(createdAt) AS lastTime
      FROM Messages
      GROUP BY chatUserId
    ) lm
    JOIN Messages m 
      ON m.chatUserId = lm.chatUserId 
     AND m.createdAt = lm.lastTime
    JOIN Users u 
      ON u.id = lm.chatUserId
    ORDER BY lm.lastTime DESC
  `;
  db.query(query, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error fetching chat users', error: err });
    const chats = rows.map(r => ({
      id: r.id,
      name: r.name,
      lastMessage: r.fileUrl ? '[Attachment]' : r.lastText,
      timestamp: r.createdAt
    }));
    res.json(chats);
  });
};

/**
 * Retrieve full conversation history for a given user ID.
 */
exports.getMessages = (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: 'userId parameter is required' });

  const query = `
    SELECT id, chatUserId AS userId, text, fileUrl, fromAdmin AS fromAdmin, createdAt
    FROM Messages
    WHERE chatUserId = ?
    ORDER BY createdAt ASC
  `;
  db.query(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error fetching messages', error: err });
    res.json(rows);
  });
};

/**
 * Post a new admin (or user) reply. Supports text + optional file.
 * Broadcasts the new message via Pusher.
 */
exports.postMessage = (req, res) => {
  const { userId, text } = req.body;
  const file = req.file;

  if (!text && !file) {
    return res.status(400).json({ message: 'Text or file is required' });
  }

  const fromAdmin = req.user.role === 'admin';
  const chatUserId = fromAdmin ? userId : req.user.id;
  const fileUrl = file ? `/${file.path.replace(/\\/g, '/')}` : null;

  const query = `
    INSERT INTO Messages (chatUserId, text, fileUrl, fromAdmin)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [chatUserId, text || null, fileUrl, fromAdmin], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error saving message', error: err });

    const newMsg = {
      id: result.insertId,
      chatUserId,
      text,
      fileUrl,
      fromAdmin,
      createdAt: new Date()
    };

    // Trigger real-time events via Pusher
    pusher.trigger(`private-user_${chatUserId}`, 'newMessage', newMsg);
    if (fromAdmin) {
      pusher.trigger('private-admin', 'newMessage', newMsg);
    }

    res.status(201).json(newMsg);
  });
};
