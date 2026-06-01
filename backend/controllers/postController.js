const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const db = require('../config/database');

// @desc    Create post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content, post_type, privacy, location, feeling } = req.body;

    // Handle file uploads
    let media_urls = [];
    if (req.files && req.files.length > 0) {
      media_urls = req.files.map(file => `/uploads/posts/${file.filename}`);
    }

    // Debug logging
    console.log('Post creation - Content:', content);
    console.log('Post creation - Files:', req.files);
    console.log('Post creation - Media URLs:', media_urls);

    // Check if we have valid content or media
    const hasValidContent = content && content.trim() !== '';
    const hasMedia = media_urls.length > 0;

    if (!hasValidContent && !hasMedia) {
      return res.status(400).json({
        success: false,
        message: 'Content or media is required'
      });
    }

    // Use empty string if no content but media exists
    const finalContent = hasValidContent ? content.trim() : '';

    // Determine post type based on content and media
    let finalPostType = post_type || 'text';
    if (hasMedia && hasValidContent) {
      finalPostType = 'mixed';
    } else if (hasMedia) {
      finalPostType = 'image';
    }

    const postId = await Post.create({
      user_id: req.user.id,
      content: finalContent,
      post_type: finalPostType,
      media_urls: media_urls,
      privacy: privacy || 'public',
      location,
      feeling,
      original_post_id: req.body.original_post_id
    });

    const post = await Post.findById(postId);

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const { user_id, limit = 20, offset = 0 } = req.query;

    const filters = { limit: parseInt(limit), offset: parseInt(offset) };
    if (user_id) {
      filters.user_id = user_id;
    }

    const posts = await Post.findAll(filters, req.user.id);

    // Debug logging
    console.log('Fetched posts:', posts.map(p => ({ id: p.id, content: p.content, media_urls: p.media_urls, post_type: p.post_type })));

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { content, privacy, location, feeling } = req.body;

    await Post.update(req.params.id, { content, privacy, location, feeling });

    const updatedPost = await Post.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await Post.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Like post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const existingLike = await Like.checkLike(req.user.id, req.params.id);

    if (existingLike) {
      await Like.delete(req.user.id, req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Post unliked',
        liked: false
      });
    } else {
      const { like_type } = req.body;
      await Like.create({
        user_id: req.user.id,
        post_id: req.params.id,
        like_type: like_type || 'like'
      });

      res.status(200).json({
        success: true,
        message: 'Post liked',
        liked: true
      });
    }
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Private
exports.getPostComments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const comments = await Comment.getPostComments(req.params.id, limit);

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content, parent_id } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const commentId = await Comment.create({
      post_id: req.params.id,
      user_id: req.user.id,
      content,
      parent_id
    });

    const comment = await Comment.findById(commentId);

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
exports.sharePost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const postId = await Post.create({
      user_id: req.user.id,
      content: `Shared a post`,
      post_type: 'text',
      media_urls: originalPost.media_urls,
      privacy: 'public'
    });

    // Increment share count
    await db.query(`UPDATE posts SET share_count = share_count + 1 WHERE id = $1`, [req.params.id]);

    const post = await Post.findById(postId);

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
