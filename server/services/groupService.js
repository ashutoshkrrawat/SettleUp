const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Group = require('../model/Group');
const User = require('../model/User');

const sendInviteEmailHelper = async ({ toEmail, groupName, inviteCode, senderName }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${inviteCode}`;

  const mailOptions = {
    from: `"${senderName} via Expense Splitter" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Group Invitation: Join "${groupName}" on Expense Splitter`,
    text: `Hello,\n\n${senderName} has invited you to join the group "${groupName}" on Expense Splitter.\n\nClick the link below to accept and join the group:\n${inviteLink}\n\nOr log in to your Expense Splitter account to view and accept pending invitations.\n\nBest regards,\nExpense Splitter Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Expense Splitter Group Invitation</h2>
        <p>Hello,</p>
        <p><strong>${senderName}</strong> has invited you to join the group <strong>"${groupName}"</strong>.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accept & Join Group
          </a>
        </div>
        
        <p style="font-size: 13px; color: #6b7280;">You can also accept this invitation from your Expense Splitter dashboard notifications.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Best regards,<br>The Expense Splitter Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

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
  let group = await Group.findById(groupId)
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .populate('balances.user', 'name email')
    .populate('pendingInvites.user', 'name email')
    .populate('pendingInvites.invitedBy', 'name email');

  if (!group) {
    throw new Error('Group not found');
  }

  // Deduplicate members array if duplicates ever occurred
  const uniqueMemberIds = new Set();
  const cleanMembers = [];
  for (const member of group.members) {
    if (!member) continue;
    const idStr = member._id ? member._id.toString() : member.toString();
    if (!uniqueMemberIds.has(idStr)) {
      uniqueMemberIds.add(idStr);
      cleanMembers.push(member);
    }
  }
  if (cleanMembers.length !== group.members.length) {
    group.members = cleanMembers.map(m => m._id || m);
    
    // Also deduplicate balances
    const uniqueBalanceUserIds = new Set();
    const cleanBalances = [];
    for (const b of group.balances) {
      if (!b || !b.user) continue;
      const uStr = b.user._id ? b.user._id.toString() : b.user.toString();
      if (!uniqueBalanceUserIds.has(uStr)) {
        uniqueBalanceUserIds.add(uStr);
        cleanBalances.push(b);
      }
    }
    group.balances = cleanBalances;
    await group.save();

    group = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('balances.user', 'name email')
      .populate('pendingInvites.user', 'name email')
      .populate('pendingInvites.invitedBy', 'name email');
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
 * Invite user by email (Sends Email + Adds Pending Invite)
 */
const inviteUserByEmail = async ({ groupId, email, senderId }) => {
  if (!email) {
    throw new Error('Please provide an email to invite');
  }

  const group = await Group.findById(groupId).populate('members', 'name email');
  if (!group) {
    throw new Error('Group not found');
  }

  const sender = group.members.find(
    (m) => m._id.toString() === senderId.toString()
  );
  if (!sender) {
    throw new Error('Not authorized to invite members to this group');
  }

  const userToInvite = await User.findOne({ email: email.toLowerCase().trim() });
  if (!userToInvite) {
    throw new Error('User with this email does not exist on Expense Splitter');
  }

  // Check if already a member
  const isAlreadyMember = group.members.some(
    (m) => m._id.toString() === userToInvite._id.toString()
  );
  if (isAlreadyMember) {
    throw new Error('User is already a member of this group');
  }

  // Check if already in pendingInvites
  if (!group.pendingInvites) group.pendingInvites = [];
  const isAlreadyPending = group.pendingInvites.some(
    (pi) => pi.email?.toLowerCase() === email.toLowerCase().trim() || pi.user?.toString() === userToInvite._id.toString()
  );
  if (isAlreadyPending) {
    throw new Error('An invitation has already been sent to this user');
  }

  // Add to pendingInvites array (DO NOT add to group.members yet!)
  group.pendingInvites.push({
    user: userToInvite._id,
    email: userToInvite.email,
    invitedBy: senderId,
    invitedAt: new Date(),
  });

  await group.save();

  // Send invitation email in background
  try {
    await sendInviteEmailHelper({
      toEmail: userToInvite.email,
      groupName: group.name,
      inviteCode: group.inviteCode,
      senderName: sender.name,
    });
  } catch (err) {
    console.error('[InviteMail] Failed to send email, but invite saved to DB:', err.message);
  }

  return await Group.findById(group._id)
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .populate('balances.user', 'name email')
    .populate('pendingInvites.user', 'name email')
    .populate('pendingInvites.invitedBy', 'name email');
};

/**
 * Join group via invite code (Cleans up pending invite & deduplicates)
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
  if (!isMember) {
    group.members.push(userId);
    const hasBalance = group.balances.some(b => b.user.toString() === userId.toString());
    if (!hasBalance) {
      group.balances.push({
        user: userId,
        balance: 0,
      });
    }
  }

  // Clean up pending invite if exists
  const user = await User.findById(userId);
  if (group.pendingInvites) {
    group.pendingInvites = group.pendingInvites.filter(
      (p) => p.user?.toString() !== userId.toString() && (user ? p.email?.toLowerCase() !== user.email.toLowerCase() : true)
    );
  }

  await group.save();

  return await Group.findById(group._id)
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .populate('balances.user', 'name email');
};

/**
 * Fetch pending group invites for a user
 */
const getUserPendingInvites = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const groups = await Group.find({
    $or: [
      { 'pendingInvites.user': userId },
      { 'pendingInvites.email': user.email.toLowerCase() }
    ]
  })
    .populate('createdBy', 'name email')
    .populate('pendingInvites.invitedBy', 'name email');

  const invites = [];
  groups.forEach((g) => {
    const invite = g.pendingInvites.find(
      (p) => p.user?.toString() === userId.toString() || p.email?.toLowerCase() === user.email.toLowerCase()
    );
    if (invite) {
      invites.push({
        groupId: g._id,
        groupName: g.name,
        description: g.description,
        invitedBy: invite.invitedBy?.name || g.createdBy?.name || 'A group member',
        inviteCode: g.inviteCode,
        invitedAt: invite.invitedAt,
      });
    }
  });

  return invites;
};

/**
 * Accept or decline a pending group invite
 */
const respondToInvite = async ({ groupId, userId, accept }) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Remove from pendingInvites
  if (group.pendingInvites) {
    group.pendingInvites = group.pendingInvites.filter(
      (p) => p.user?.toString() !== userId.toString() && p.email?.toLowerCase() !== user.email.toLowerCase()
    );
  }

  if (accept) {
    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (!isMember) {
      group.members.push(userId);
      const hasBalance = group.balances.some((b) => b.user.toString() === userId.toString());
      if (!hasBalance) {
        group.balances.push({ user: userId, balance: 0 });
      }
    }
  }

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
/**
 * Identify debtors in the group and queue reminder emails
 */
const sendGroupReminders = async ({ groupId, requestorId }) => {
  // 1. Fetch group details and populate user data
  const group = await Group.findById(groupId)
    .populate('balances.user', 'name email')
    .populate('members', 'name email');

  if (!group) {
    throw new Error('Group not found');
  }

  // 2. Validate requestor is a member of the group
  const requestor = group.members.find(m => m._id.toString() === requestorId.toString());
  if (!requestor) {
    throw new Error('Not authorized to send reminders in this group');
  }

  const { addReminderJob } = require('../config/reminderQueue');
  let queuedCount = 0;

  // 3. Find anyone with a negative balance (debtor) and add to queue
  for (const record of group.balances) {
    const balanceAmount = Math.round(record.balance * 100) / 100;
    if (balanceAmount < -0.01) {
      const debtor = record.user;
      const amountOwed = -balanceAmount;

      // Add to BullMQ queue
      await addReminderJob(debtor.email, group.name, amountOwed, requestor.name);
      queuedCount++;
    }
  }

  return { success: true, queuedJobs: queuedCount };
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
  sendGroupReminders,
  getUserPendingInvites,
  respondToInvite,
};
