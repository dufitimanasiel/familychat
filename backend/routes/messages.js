const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  sendMessage,
  getConversation,
  getGroupMessages,
  updateMessage,
  deleteMessage,
  getUnreadCount
} = require('../controllers/messageController');

router.route('/')
  .post(protect, upload.single('file'), sendMessage);

router.route('/upload')
  .post(protect, upload.single('file'), sendMessage);

router.route('/unread')
  .get(protect, getUnreadCount);

router.route('/conversation/:userId')
  .get(protect, getConversation);

router.route('/group/:groupId')
  .get(protect, getGroupMessages);

router.route('/:id')
  .put(protect, upload.single('file'), updateMessage)
  .delete(protect, deleteMessage);

module.exports = router;
