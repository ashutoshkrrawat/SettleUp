const Expense = require('../model/Expense');
const Group = require('../model/Group');

/**
 * Calculates individual amounts for each split participant.
 * Handles cents rounding discrepancies.
 */
const calculateSplits = (amount, splitType, splits) => {
  let calculatedSplits = [];
  let finalAmount = amount;

  if (splitType === 'EXACT') {
    let totalCalculated = 0; //userd to sum individual amounts
    for (const s of splits) {
      const itemAmount = Number(s.amount);
      if (isNaN(itemAmount) || itemAmount < 0) {
        throw new Error('Each split participant must have a valid non-negative amount');
      }
      totalCalculated += itemAmount;
      calculatedSplits.push({ user: s.user, amount: Math.round(itemAmount * 100) / 100 });
    }

    finalAmount = Math.round(totalCalculated * 100) / 100;
    if (finalAmount <= 0) {
      throw new Error('Total calculated expense amount must be greater than 0');
    }

  } else if (splitType === 'EQUAL') {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0 for EQUAL split');
    }
    const baseShare = Math.floor((amount / splits.length) * 100) / 100;
    const extraCents = Math.round((amount - baseShare * splits.length) * 100);

    calculatedSplits = splits.map((s, index) => {
      const userId = s.user || s;
      let share = baseShare;
      if (index < extraCents) {
        share += 0.01;
      }
      return { user: userId, amount: Math.round(share * 100) / 100 };
    });

  } else if (splitType === 'PERCENT') {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0 for PERCENT split');
    }
    let totalPercent = 0;
    let totalCalculated = 0;

    for (const s of splits) {
      const pct = Number(s.percentage);
      if (isNaN(pct) || pct < 0) {
        throw new Error('Percentages must be valid non-negative numbers');
      }
      totalPercent += pct;
      const share = Math.round((pct / 100) * amount * 100) / 100;
      totalCalculated += share;
      calculatedSplits.push({ user: s.user, percentage: pct, amount: share });
    }

    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new Error('Percentages must sum to exactly 100%');
    }

    // Adjust float discrepancies
    const diff = Math.round((amount - totalCalculated) * 100) / 100;
    if (diff !== 0 && calculatedSplits.length > 0) {
      calculatedSplits[0].amount = Math.round((calculatedSplits[0].amount + diff) * 100) / 100;
    }
  } else {
    throw new Error('Invalid split type');
  }

  return { calculatedSplits, finalAmount };
};

/**
 * Creates an expense, verifies membership, computes splits, and updates group balances.
 */
const createExpense = async ({ groupId, description, amount, splitType, paidBy, splits, userId }) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const isMember = group.members.some(m => m.toString() === userId.toString());
  const isPayerMember = group.members.some(m => m.toString() === paidBy.toString());
  if (!isMember || !isPayerMember) {
    throw new Error('Authorized group membership required');
  }

  const { calculatedSplits, finalAmount } = calculateSplits(amount, splitType, splits);

  // Verify all split participants are members of the group
  const allParticipantsAreMembers = calculatedSplits.every(s =>
    group.members.some(m => m.toString() === s.user.toString())
  );
  if (!allParticipantsAreMembers) {
    throw new Error('All split participants must be members of the group');
  }

  // 1. Ensure splits have status set
  const splitsWithStatus = calculatedSplits.map(s => ({
    ...s,
    status: s.user.toString() === paidBy.toString() ? 'CONFIRMED' : 'UNPAID'
  }));

  // Create expense in database
  const expense = await Expense.create({
    group: groupId,
    paidBy,
    description,
    amount: finalAmount,
    splitType,
    splits: splitsWithStatus
  });

  // 2. Adjust Cached Balances
  // Credit the payer
  const payerIndex = group.balances.findIndex(b => b.user.toString() === paidBy.toString());
  if (payerIndex > -1) {
    group.balances[payerIndex].balance += finalAmount;
  } else {
    group.balances.push({ user: paidBy, balance: finalAmount });
  }

  // Debit the participants
  calculatedSplits.forEach(split => {
    const participantIndex = group.balances.findIndex(b => b.user.toString() === split.user.toString());
    if (participantIndex > -1) {
      group.balances[participantIndex].balance -= split.amount;
    } else {
      group.balances.push({ user: split.user, balance: -split.amount });
    }
  });

  await group.save();
  return expense;
};

/**
 * Mark a debtor's share in an expense as PENDING_CONFIRMATION
 */
const markSplitAsPaid = async ({ expenseId, userId }) => {
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    throw new Error('Expense not found');
  }

  const reqUserIdStr = userId.toString();
  const expPayerIdStr = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();
  if (reqUserIdStr === expPayerIdStr) {
    throw new Error('You are the payer for this expense, so your share is already paid.');
  }

  const splitIndex = expense.splits.findIndex(s => {
    if (!s || !s.user) return false;
    const uId = s.user._id ? s.user._id.toString() : s.user.toString();
    return uId === reqUserIdStr;
  });

  if (splitIndex === -1) {
    throw new Error('You are not a participant in this expense');
  }

  if (expense.splits[splitIndex].status === 'CONFIRMED') {
    throw new Error('This payment has already been confirmed');
  }

  expense.splits[splitIndex].status = 'PENDING_CONFIRMATION';
  await expense.save();

  return await Expense.findById(expense._id)
    .populate('paidBy', 'name email')
    .populate('splits.user', 'name email');
};

/**
 * Respond (Accept/Reject) to a debtor's payment claim
 */
const respondToSplitPayment = async ({ expenseId, participantUserId, payerId, accept }) => {
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    throw new Error('Expense not found');
  }

  const expPayerIdStr = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();
  if (expPayerIdStr !== payerId.toString()) {
    throw new Error('Only the person who paid for this expense can confirm payments');
  }

  const targetUserIdStr = participantUserId.toString();
  const splitIndex = expense.splits.findIndex(s => {
    if (!s || !s.user) return false;
    const uId = s.user._id ? s.user._id.toString() : s.user.toString();
    return uId === targetUserIdStr;
  });

  if (splitIndex === -1) {
    throw new Error('Target user is not a participant in this expense');
  }

  const splitItem = expense.splits[splitIndex];

  if (accept) {
    splitItem.status = 'CONFIRMED';
    // When confirmed, update group balances (debtor paid back the payer)
    const group = await Group.findById(expense.group);
    if (group) {
      // Credit debtor (increase balance towards 0)
      const debtorIdx = group.balances.findIndex(b => {
        const uId = b.user._id ? b.user._id.toString() : b.user.toString();
        return uId === targetUserIdStr;
      });
      if (debtorIdx > -1) {
        group.balances[debtorIdx].balance += splitItem.amount;
      }
      // Debit payer (reduce balance corresponding to received cash)
      const payerIdx = group.balances.findIndex(b => {
        const uId = b.user._id ? b.user._id.toString() : b.user.toString();
        return uId === expPayerIdStr;
      });
      if (payerIdx > -1) {
        group.balances[payerIdx].balance -= splitItem.amount;
      }
      await group.save();
    }
  } else {
    splitItem.status = 'UNPAID';
  }

  await expense.save();

  return await Expense.findById(expense._id)
    .populate('paidBy', 'name email')
    .populate('splits.user', 'name email');
};

/**
 * Get all pending split payment confirmations across groups where currentUser is the payer
 */
const getUserPendingConfirmations = async (userId) => {
  const expenses = await Expense.find({
    paidBy: userId,
    'splits.status': 'PENDING_CONFIRMATION'
  })
    .populate('group', 'name')
    .populate('paidBy', 'name email')
    .populate('splits.user', 'name email');

  const pendingList = [];
  expenses.forEach(exp => {
    exp.splits.forEach(s => {
      if (s.status === 'PENDING_CONFIRMATION' && s.user) {
        pendingList.push({
          expenseId: exp._id,
          expenseDescription: exp.description,
          groupId: exp.group._id,
          groupName: exp.group.name,
          debtor: s.user,
          amount: s.amount,
          date: exp.date
        });
      }
    });
  });

  return pendingList;
};

/**
 * Retrieves all group expenses sorted descending by date.
 */
const getGroupExpenses = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const isMember = group.members.some(m => m.toString() === userId.toString());
  if (!isMember) {
    throw new Error('Not authorized to view group expenses');
  }

  return await Expense.find({ group: groupId })
    .populate('paidBy', 'name email')
    .populate('splits.user', 'name email')
    .sort({ date: -1 });
};

/**
 * Reverts group balances and removes the expense.
 */
const deleteExpense = async (expenseId, userId) => {
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    throw new Error('Expense not found');
  }

  const group = await Group.findById(expense.group);
  if (!group) {
    throw new Error('Associated group not found');
  }

  const isPayer = expense.paidBy.toString() === userId.toString();
  const isCreator = group.createdBy.toString() === userId.toString();

  if (!isPayer && !isCreator) {
    throw new Error('Not authorized to delete this expense');
  }

  // Revert balances
  // Debit the payer
  const payerIndex = group.balances.findIndex(b => b.user.toString() === expense.paidBy.toString());
  if (payerIndex > -1) {
    group.balances[payerIndex].balance -= expense.amount;
  }

  // Credit the participants
  expense.splits.forEach(split => {
    const participantIndex = group.balances.findIndex(b => b.user.toString() === split.user.toString());
    if (participantIndex > -1) {
      group.balances[participantIndex].balance += split.amount;
    }
  });

  await group.save();
  await expense.deleteOne();
  return { 
      message: 'Expense deleted and group balances updated',
      groupId: group._id 
    };
};

module.exports = {
  calculateSplits,
  createExpense,
  getGroupExpenses,
  deleteExpense,
  markSplitAsPaid,
  respondToSplitPayment,
  getUserPendingConfirmations
};
