const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer config for file attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/messages/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// GET /api/messages/chats
router.get('/chats', chatController.getChatUsers);

// GET /api/messages?userId=xxx
router.get('/', chatController.getMessages);

// POST /api/messages  (text + optional single file)
router.post('/', upload.single('file'), chatController.postMessage);

// Get only current user's messages
router.get(
  '/me',
  (req, res, next) => {
    // Inject userId for getMessages
    req.query.userId = req.user.id;
    next();
  },
  chatController.getMessages
);

router.get('/:userId', (req, res) => {
    req.query.userId = req.params.userId; // transform path param to query param
    chatController.getMessages(req, res);
  });

module.exports = router;
