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

  const isMember = group.members.includes(userId);
  const isPayerMember = group.members.includes(paidBy);
  if (!isMember || !isPayerMember) {
    throw new Error('Authorized group membership required');
  }

  const { calculatedSplits, finalAmount } = calculateSplits(amount, splitType, splits);

  // 1. Create expense in database
  const expense = await Expense.create({
    group: groupId,
    paidBy,
    description,
    amount: finalAmount,
    splitType,
    splits: calculatedSplits
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
 * Retrieves all group expenses sorted descending by date.
 */
const getGroupExpenses = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const isMember = group.members.includes(userId);
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
  return { message: 'Expense deleted and group balances updated' };
};

module.exports = {
  calculateSplits,
  createExpense,
  getGroupExpenses,
  deleteExpense
};
