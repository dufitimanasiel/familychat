const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createGroup,
  getGroups,
  getGroup,
  getMyGroups,
  updateGroup,
  addMember,
  removeMember,
  deleteGroup
} = require('../controllers/groupController');

router.route('/')
  .get(protect, getGroups)
  .post(protect, upload.single('file'), createGroup);

router.route('/my')
  .get(protect, getMyGroups);

router.route('/:id')
  .get(protect, getGroup)
  .put(protect, upload.single('file'), updateGroup)
  .delete(protect, deleteGroup);

router.route('/:id/members')
  .post(protect, addMember);

router.route('/:id/members/:userId')
  .delete(protect, removeMember);

module.exports = router;
