const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  getPostComments,
  addComment,
  sharePost
} = require('../controllers/postController');

router.route('/')
  .get(protect, getPosts)
  .post(protect, upload.array('files', 10), createPost);

router.route('/:id')
  .get(protect, getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.route('/:id/like')
  .post(protect, likePost);

router.route('/:id/comments')
  .get(protect, getPostComments)
  .post(protect, addComment);

router.route('/:id/share')
  .post(protect, sharePost);

module.exports = router;
