const Group = require('../models/Group');
const Message = require('../models/Message');

// @desc    Create group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, description, group_picture, is_private, max_members, members } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    const groupId = await Group.create({
      name,
      description,
      group_picture,
      created_by: req.user.id,
      is_private: is_private || false,
      max_members: max_members || 500
    });

    // Add creator as admin
    await Group.addMember(groupId, req.user.id, 'admin');

    // Add selected members
    if (members && members.length > 0) {
      for (const memberId of members) {
        try {
          await Group.addMember(groupId, memberId, 'member');
        } catch (error) {
          // Ignore duplicate member errors
          if (error.code !== '23505') {
            console.error('Error adding member:', error);
          }
        }
      }
    }

    const group = await Group.findById(groupId);

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
exports.getGroups = async (req, res) => {
  try {
    const { user_id } = req.query;
    const filters = {};

    if (user_id) {
      filters.user_id = user_id;
    }

    const groups = await Group.findAll(filters);

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const members = await Group.getMembers(req.params.id);

    res.status(200).json({
      success: true,
      data: { ...group, members }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user groups
// @route   GET /api/groups/my
// @access  Private
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.getUserGroups(req.user.id);

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const members = await Group.getMembers(req.params.id);
    const userMember = members.find(m => m.user_id === req.user.id);
    
    if (!userMember || (userMember.role !== 'admin' && group.created_by !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this group'
      });
    }

    const { name, description, group_picture, is_private, max_members } = req.body;

    await Group.update(req.params.id, {
      name,
      description,
      group_picture,
      is_private,
      max_members
    });

    const updatedGroup = await Group.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    await Group.addMember(req.params.id, user_id, role || 'member');

    res.status(200).json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin or removing themselves
    const members = await Group.getMembers(req.params.id);
    const userMember = members.find(m => m.user_id === req.user.id);
    
    if (!userMember || (userMember.role !== 'admin' && req.user.id !== req.params.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this member'
      });
    }

    await Group.removeMember(req.params.id, req.params.userId);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this group'
      });
    }

    await Group.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
