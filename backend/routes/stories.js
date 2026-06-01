const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createStory,
  getStories,
  deleteStory
} = require('../controllers/storyController');

router.route('/')
  .get(protect, getStories)
  .post(protect, upload.single('file'), createStory);

router.route('/:id')
  .delete(protect, deleteStory);

module.exports = router;
