const express = require('express');
const router = express.Router();
const {
  createMessage,
  getAllMessages,
  deleteMessage,
  replyToMessage,
  getMyMessages
} = require('../controllers/contactController');
const { protect, authorize, identifyUser } = require('../middleware/auth');

router.post('/', identifyUser, createMessage);
router.get('/my-messages', protect, getMyMessages);
router.get('/', protect, authorize('admin'), getAllMessages);
router.put('/:id/reply', protect, authorize('admin'), replyToMessage);
router.delete('/:id', protect, authorize('admin'), deleteMessage);

module.exports = router;
