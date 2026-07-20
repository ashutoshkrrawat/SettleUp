const express = require('express');
const router = express.Router();
const Group = require('../model/Group');
const User = require('../model/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please add a group name' });
    }

    // Create group. The creator is added as the first member and initialized with a 0 balance.
    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
      balances: [
        {
          user: req.user._id,
          balance: 0,
        },
      ],
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error while creating group' });
  }
});

// @route   GET /api/groups
// @desc    Get all groups the logged-in user is a member of
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find groups where req.user._id is in the members array
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
});

// @route   GET /api/groups/:id
// @desc    Get a single group's details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('balances.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify if the logged-in user is a member of this group
    const isMember = group.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(401).json({ message: 'Not authorized to view this group' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get single group error:', error);
    res.status(500).json({ message: 'Server error while fetching group details' });
  }
});

// @route   POST /api/groups/:id/invite
// @desc    Invite a user to a group using their email
// @access  Private
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email to invite' });
    }

    // Find the group
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify that the person sending the invite is currently in the group
    const isSenderMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (!isSenderMember) {
      return res.status(401).json({ message: 'Not authorized to invite members to this group' });
    }

    // Find the user to invite by their email
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Check if the user is already a member
    const isAlreadyMember = group.members.some(
      (memberId) => memberId.toString() === userToInvite._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Add user to group members and initialize their cached balance to 0
    group.members.push(userToInvite._id);
    group.balances.push({
      user: userToInvite._id,
      balance: 0,
    });

    await group.save();

    // Populate the newly updated group before sending it back
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('balances.user', 'name email');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Server error while inviting user' });
  }
});
// @route   POST /api/groups/join/:inviteCode
// @desc    Join a group using an invite code
// @access  Private
router.post('/join/:inviteCode', protect, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    // 1. Find group by invite code
    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code or group not found' });
    }

    // 2. Check if link has expired
    if (group.inviteExpiresAt && new Date() > group.inviteExpiresAt) {
      return res.status(410).json({ message: 'This invite link has expired' });
    }

    // 3. Check if user is already a member
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // 4. Add user to group members and initialize balance to 0
    group.members.push(req.user._id);
    group.balances.push({
      user: req.user._id,
      balance: 0,
    });

    await group.save();

    // 5. Populate and return updated group details
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('balances.user', 'name email');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error while joining group' });
  }
});

// @route   POST /api/groups/:id/reset-invite
// @desc    Reset/regenerate group invite link
// @access  Private
router.post('/:id/reset-invite', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only allow the group creator to reset the invite link
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group creator can reset the invite link' });
    }

    const crypto = require('crypto');
    group.inviteCode = crypto.randomBytes(4).toString('hex');
    group.inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry from now

    await group.save();

    res.json({
      message: 'Invite link reset successfully',
      inviteCode: group.inviteCode,
      inviteExpiresAt: group.inviteExpiresAt,
    });
  } catch (error) {
    console.error('Reset invite error:', error);
    res.status(500).json({ message: 'Server error while resetting invite link' });
  }
});

// @route   POST /api/groups/:id/remove-member
// @desc    Remove a member from a group (or leave group)
// @access  Private
router.post('/:id/remove-member', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide a userId to remove' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // 1. Authorization checks:
    // - Is requester the group creator?
    // - Or is the requester the user being removed (leaving the group)?
    const isCreator = group.createdBy.toString() === req.user._id.toString();
    const isSelf = userId.toString() === req.user._id.toString();

    if (!isCreator && !isSelf) {
      return res.status(403).json({ message: 'Only the group creator can remove members, or members can leave themselves' });
    }

    // 2. Check if the user is currently a member
    const memberIndex = group.members.findIndex(m => m.toString() === userId.toString());
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    // 3. Prevent creator from leaving/being removed if there are other members
    if (group.createdBy.toString() === userId.toString() && group.members.length > 1) {
      return res.status(400).json({ message: 'Group creator cannot leave the group while other members are present.' });
    }

    // 4. Verify balance is zero (allowing for minor rounding errors up to 1 cent)
    const userBalanceObj = group.balances.find(b => b.user.toString() === userId.toString());
    const balance = userBalanceObj ? userBalanceObj.balance : 0;
    if (Math.abs(balance) > 0.01) {
      return res.status(400).json({ 
        message: `Member cannot be removed or leave because they have an active non-zero balance (${balance > 0 ? 'owed' : 'owes'} ${Math.abs(balance)})` 
      });
    }

    // 5. Remove user from members array and balances array
    group.members.splice(memberIndex, 1);
    
    const balanceIndex = group.balances.findIndex(b => b.user.toString() === userId.toString());
    if (balanceIndex > -1) {
      group.balances.splice(balanceIndex, 1);
    }

    await group.save();

    // Populate and return updated group details
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('balances.user', 'name email');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error while removing member' });
  }
});

module.exports = router;
