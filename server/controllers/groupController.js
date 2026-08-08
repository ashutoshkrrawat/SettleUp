const groupService = require('../services/groupService');

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await groupService.createGroup({
      name,
      description,
      userId: req.user._id,
    });
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    const statusCode = error.message.includes('Please add') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const groups = await groupService.getUserGroups(req.user._id);
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const group = await groupService.getGroupById({
      groupId: req.params.id,
      userId: req.user._id,
    });
    res.json(group);
  } catch (error) {
    console.error('Get single group error:', error);
    const statusCode = error.message.includes('Not authorized') ? 401 : error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const updatedGroup = await groupService.inviteUserByEmail({
      groupId: req.params.id,
      email,
      senderId: req.user._id,
    });
    res.json(updatedGroup);
  } catch (error) {
    console.error('Invite member error:', error);
    const statusCode = error.message.includes('Not authorized')
      ? 401
      : error.message.includes('not found') || error.message.includes('does not exist')
      ? 404
      : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const joinGroup = async (req, res) => {
  try {
    const updatedGroup = await groupService.joinGroupByInviteCode({
      inviteCode: req.params.inviteCode,
      userId: req.user._id,
    });
    res.json(updatedGroup);
  } catch (error) {
    console.error('Join group error:', error);
    const statusCode = error.message.includes('expired')
      ? 410
      : error.message.includes('not found')
      ? 404
      : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const resetInviteCode = async (req, res) => {
  try {
    const result = await groupService.resetInviteLink({
      groupId: req.params.id,
      userId: req.user._id,
    });
    res.json(result);
  } catch (error) {
    console.error('Reset invite error:', error);
    const statusCode = error.message.includes('Only the group creator')
      ? 403
      : error.message.includes('not found')
      ? 404
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const updatedGroup = await groupService.removeMember({
      groupId: req.params.id,
      targetUserId: userId,
      requesterId: req.user._id,
    });
    res.json(updatedGroup);
  } catch (error) {
    console.error('Remove member error:', error);
    const statusCode = error.message.includes('Only the group creator')
      ? 403
      : error.message.includes('not found')
      ? 404
      : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const getSettlements = async (req, res) => {
  try {
    const settlements = await groupService.getGroupSettlements({
      groupId: req.params.id,
      userId: req.user._id,
    });
    res.json(settlements);
  } catch (error) {
    console.error('Get settlements controller error:', error);
    const statusCode = error.message.includes('Not authorized')
      ? 401
      : error.message.includes('not found')
      ? 404
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Send reminders to all debtors in the group
 * @route   POST /api/groups/:id/remind
 * @access  Private
 */
const sendGroupReminders = async (req, res) => {
  try {
    const groupId = req.params.id;
    const requestorId = req.user._id;

    const result = await groupService.sendGroupReminders({
      groupId,
      requestorId,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Send reminders controller error:', error);
    const statusCode = error.message.includes('Not authorized')
      ? 401
      : error.message.includes('not found')
      ? 404
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};


module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  inviteMember,
  joinGroup,
  resetInviteCode,
  removeMember,
  getSettlements,
  sendGroupReminders,
};
