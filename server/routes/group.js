const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createGroup,
  getUserGroups,
  getGroupDetails,
  inviteMember,
  joinGroup,
  resetInviteCode,
  removeMember,
  getSettlements,
  sendGroupReminders,
  getPendingInvites,
  respondToInvite,
} = require('../controllers/groupController');

// @route   GET /api/groups/invites/pending
// @desc    Get all pending invitations for the logged-in user
// @access  Private
router.get('/invites/pending', protect, getPendingInvites);

// @route   POST /api/groups/:id/respond-invite
// @desc    Accept or decline a pending group invitation
// @access  Private
router.post('/:id/respond-invite', protect, respondToInvite);

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, createGroup);

// @route   GET /api/groups
// @desc    Get all groups the logged-in user is a member of
// @access  Private
router.get('/', protect, getUserGroups);

// @route   GET /api/groups/:id
// @desc    Get a single group's details
// @access  Private
router.get('/:id', protect, getGroupDetails);

// @route   POST /api/groups/:id/invite
// @desc    Invite a user to a group using their email
// @access  Private
router.post('/:id/invite', protect, inviteMember);

// @route   POST /api/groups/:id/remind
// @desc    Send email reminders to all debtors in the group
// @access  Private
router.post('/:id/remind', protect, sendGroupReminders);

// @route   POST /api/groups/join/:inviteCode
// @desc    Join a group using an invite code
// @access  Private
router.post('/join/:inviteCode', protect, joinGroup);

// @route   POST /api/groups/:id/reset-invite
// @desc    Reset/regenerate group invite link
// @access  Private
router.post('/:id/reset-invite', protect, resetInviteCode);

// @route   POST /api/groups/:id/remove-member
// @desc    Remove a member from a group (or leave group)
// @access  Private
router.post('/:id/remove-member', protect, removeMember);

// @route   GET /api/groups/:id/settlements
// @desc    Calculate simplified minimum transactions to settle all group debts
// @access  Private
router.get('/:id/settlements', protect, getSettlements);

module.exports = router;
