const crypto = require('crypto');
const Group = require('../model/Group');
const User = require('../model/User');

/**
 * Create a new group
 */
const createGroup = async ({ name, description, userId }) => {
  if (!name) {
    throw new Error('Please add a group name');
  }

  const group = await Group.create({
    name,
    description,
    createdBy: userId,
    members: [userId],
    balances: [
      {
        user: userId,
        balance: 0,
      },
    ],
  });

  return group;
};

/**
 * Get all groups for a user
 */
const getUserGroups = async (userId) => {
  return await Group.find({ members: userId })
    .populate('members', 'name email')
    .populate('createdBy', 'name email');
};

/**
 * Get single group details
 */
const getGroupById = async ({ groupId, userId }) => {
  const group = await Group.findById(groupId)
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .populate('balances.user', 'name email');

  if (!group) {
    throw new Error('Group not found');
  }

  const isMember = group.members.some(
    (member) => member._id.toString() === userId.toString()
  );

  if (!isMember) {
    throw new Error('Not authorized to view this group');
  }

  return group;
};

/**
 * Invite user by email
 */
const inviteUserByEmail = async ({ groupId, email, senderId }) => {
  if (!email) {
    throw new Error('Please provide an email to invite');
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const isSenderMember = group.members.some(
    (memberId) => memberId.toString() === senderId.toString()
  );
  if (!isSenderMember) {
    throw new Error('Not authorized to invite members to this group');
  }

  const userToInvite = await User.findOne({ email });
  if (!userToInvite) {
    throw new Error('User with this email does not exist');
  }

  const isAlreadyMember = group.members.some(
    (memberId) => memberId.toString() === userToInvite._id.toString()
  );
  if (isAlreadyMember) {
    throw new Error('User is already a member of this group');
  }

  group.members.push(userToInvite._id);
  group.balances.push({
    user: userToInvite._id,
    balance: 0,
  });

  await group.save();

  return await Group.findById(group._id)
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .populate('balances.user', 'name email');
};

/**
 * Join group via invite code
 */
const joinGroupByInviteCode = async ({ inviteCode, userId }) => {
  const group = await Group.findOne({ inviteCode });
  if (!group) {
    throw new Error('Invalid invite code or group not found');
  }

  if (group.inviteExpiresAt && new Date() > group.inviteExpiresAt) {
    throw new Error('This invite link has expired');
  }

  const isMember = group.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
  if (isMember) {
    throw new Error('You are already a member of this group');
  }

  group.members.push(userId);
  group.balances.push({
    user: userId,
    balance: 0,
  });

  await group.save();

  return await Group.findById(group._id)
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .populate('balances.user', 'name email');
};

/**
 * Reset group invite link
 */
const resetInviteLink = async ({ groupId, userId }) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (group.createdBy.toString() !== userId.toString()) {
    throw new Error('Only the group creator can reset the invite link');
  }

  group.inviteCode = crypto.randomBytes(4).toString('hex');
  group.inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await group.save();

  return {
    message: 'Invite link reset successfully',
    inviteCode: group.inviteCode,
    inviteExpiresAt: group.inviteExpiresAt,
  };
};

/**
 * Remove member or leave group
 */
const removeMember = async ({ groupId, targetUserId, requesterId }) => {
  if (!targetUserId) {
    throw new Error('Please provide a userId to remove');
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const isCreator = group.createdBy.toString() === requesterId.toString();
  const isSelf = targetUserId.toString() === requesterId.toString();

  if (!isCreator && !isSelf) {
    throw new Error('Only the group creator can remove members, or members can leave themselves');
  }

  const memberIndex = group.members.findIndex(m => m.toString() === targetUserId.toString());
  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }

  if (group.createdBy.toString() === targetUserId.toString() && group.members.length > 1) {
    throw new Error('Group creator cannot leave the group while other members are present.');
  }

  const userBalanceObj = group.balances.find(b => b.user.toString() === targetUserId.toString());
  const balance = userBalanceObj ? userBalanceObj.balance : 0;
  if (Math.abs(balance) > 0.01) {
    throw new Error(
      `Member cannot be removed or leave because they have an active non-zero balance (${balance > 0 ? 'owed' : 'owes'} ${Math.abs(balance)})`
    );
  }

  group.members.splice(memberIndex, 1);

  const balanceIndex = group.balances.findIndex(b => b.user.toString() === targetUserId.toString());
  if (balanceIndex > -1) {
    group.balances.splice(balanceIndex, 1);
  }

  await group.save();

  return await Group.findById(group._id)
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .populate('balances.user', 'name email');
};

/**
 * Calculate simplified minimum transactions to settle all group debts using greedy algorithm
 */
const getGroupSettlements = async ({ groupId, userId }) => {
  const group = await Group.findById(groupId).populate('balances.user', 'name email');
  if (!group) {
    throw new Error('Group not found');
  }

  const isMember = group.members.some(m => m.toString() === userId.toString());
  if (!isMember) {
    throw new Error('Not authorized to view settlements for this group');
  }

  const creditors = [];
  const debtors = [];

  // 1. Separate balances into creditors and debtors
  group.balances.forEach(b => {
    const amount = Math.round(b.balance * 100) / 100;
    if (amount > 0.01) {
      creditors.push({ user: b.user, amount });
    } else if (amount < -0.01) {
      debtors.push({ user: b.user, amount: -amount });
    }
  });

  // 2. Sort both arrays descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  // 3. Two-pointer greedy matching
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settledAmount = Math.min(creditor.amount, debtor.amount);
    const roundedSettled = Math.round(settledAmount * 100) / 100;

    if (roundedSettled > 0) {
      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: roundedSettled,
      });
    }

    creditor.amount = Math.round((creditor.amount - settledAmount) * 100) / 100;
    debtor.amount = Math.round((debtor.amount - settledAmount) * 100) / 100;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return {
    groupId: group._id,
    groupName: group.name,
    transactions,
  };
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  inviteUserByEmail,
  joinGroupByInviteCode,
  resetInviteLink,
  removeMember,
  getGroupSettlements,
};
