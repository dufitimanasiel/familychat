const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateProfile,
  updateProfilePicture,
  uploadProfilePicture,
  getSuggestedUsers,
  getOnlineUsers,
  getAllUsers,
  searchUsers,
  blockUser,
  unblockUser
} = require('../controllers/userController');

router.route('/')
  .get(protect, authorize('admin'), getUsers);

router.route('/search')
  .get(protect, searchUsers);

router.route('/suggested')
  .get(protect, getSuggestedUsers);

router.route('/online')
  .get(protect, getOnlineUsers);

router.route('/all')
  .get(protect, getAllUsers);

router.route('/profile')
  .put(protect, updateProfile);

router.route('/profile-picture')
  .put(protect, upload.single('file'), updateProfilePicture);

router.route('/upload-profile-picture')
  .post(protect, upload.single('file'), uploadProfilePicture);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

router.route('/:id/block')
  .post(protect, blockUser)
  .delete(protect, unblockUser);

module.exports = router;
