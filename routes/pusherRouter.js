const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pusher = require('../config/pusher');

router.post('/auth', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Missing token');

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const socketId = req.body.socket_id;
    const channelName = req.body.channel_name;

    // Enforce naming rule for private-user_{id}
    if (!channelName.startsWith(`private-user_${user.id}`)) {
      return res.status(403).send('Forbidden: Channel mismatch');
    }

    const auth = pusher.authenticate(socketId, channelName);
    res.send(auth);
  } catch (err) {
    return res.status(403).send('Invalid or expired token');
  }
});

module.exports = router;
