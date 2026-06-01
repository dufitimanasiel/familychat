const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getFriends,
  removeFriend
} = require('../controllers/friendController');

router.route('/request')
  .post(protect, sendFriendRequest);

router.route('/requests')
  .get(protect, getFriendRequests);

router.route('/requests/:id/accept')
  .put(protect, acceptFriendRequest);

router.route('/requests/:id/decline')
  .put(protect, declineFriendRequest);

router.route('/requests/:id')
  .delete(protect, cancelFriendRequest);

router.route('/')
  .get(protect, getFriends);

router.route('/:id')
  .delete(protect, removeFriend);

module.exports = router;
