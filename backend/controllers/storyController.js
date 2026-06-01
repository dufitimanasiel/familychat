const Story = require('../models/Story');

// @desc    Create story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const { caption } = req.body;

    // Handle file upload
    let media_url = null;
    let media_type = 'image';
    
    if (req.file) {
      media_url = `/uploads/stories/${req.file.filename}`;
      media_type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    }

    if (!media_url) {
      return res.status(400).json({
        success: false,
        message: 'Media file is required for stories'
      });
    }

    const storyId = await Story.create({
      user_id: req.user.id,
      media_url,
      media_type,
      caption
    });

    const story = await Story.findById(storyId);

    res.status(201).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all stories (last 24 hours)
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
  try {
    const { user_id } = req.query;
    const filters = {};

    if (user_id) {
      filters.user_id = user_id;
    }

    const stories = await Story.findAll(filters);

    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    if (story.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this story'
      });
    }

    await Story.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
