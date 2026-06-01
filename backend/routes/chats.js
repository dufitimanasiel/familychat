const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getChats,
  createChat,
  archiveChat,
  unarchiveChat,
  pinChat,
  unpinChat,
  muteChat,
  unmuteChat,
  deleteChat
} = require('../controllers/chatController');

router.route('/')
  .get(protect, getChats)
  .post(protect, createChat);

router.route('/:id/archive')
  .put(protect, archiveChat);

router.route('/:id/unarchive')
  .put(protect, unarchiveChat);

router.route('/:id/pin')
  .put(protect, pinChat);

router.route('/:id/unpin')
  .put(protect, unpinChat);

router.route('/:id/mute')
  .put(protect, muteChat);

router.route('/:id/unmute')
  .put(protect, unmuteChat);

router.route('/:id')
  .delete(protect, deleteChat);

module.exports = router;
