const expenseService = require('../services/expenseService');
const groupService = require('../services/groupService');
const aiService = require('../services/aiService');
const { getIO } = require('../config/socket');

const createExpense = async (req, res) => {
  try {
    const { group, description, amount, splitType, paidBy, splits } = req.body;

    const expense = await expenseService.createExpense({
      groupId: group,
      description,
      amount,
      splitType,
      paidBy,
      splits,
      userId: req.user._id
    });

    // 🔌 Real-time: Broadcast to group room that a new expense has been created
    try {
      const io = getIO();
      io.to(group).emit('expense_created', expense);
    } catch (socketError) {
      console.warn('Real-time socket emit failed:', socketError.message);
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense controller error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const getGroupExpenses = async (req, res) => {
  try {
    const expenses = await expenseService.getGroupExpenses(req.params.groupId, req.user._id);
    res.json(expenses);
  } catch (error) {
    console.error('Get group expenses controller error:', error);
    const statusCode = error.message.includes('Not authorized') ? 401 : 404;
    res.status(statusCode).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req.user._id);

    // 🔌 Real-time: Broadcast to group room that this expense has been deleted
    try {
      const io = getIO();
      io.to(result.groupId.toString()).emit('expense_deleted', {
        expenseId: req.params.id,
        groupId: result.groupId
      });
    } catch (socketError) {
      console.warn('Real-time socket emit failed:', socketError.message);
    }

    res.json(result);
  } catch (error) {
    console.error('Delete expense controller error:', error);
    const statusCode = error.message.includes('Not authorized') ? 401 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const markSplitPaid = async (req, res) => {
  try {
    const updatedExpense = await expenseService.markSplitAsPaid({
      expenseId: req.params.id,
      userId: req.user._id
    });

    try {
      const io = getIO();
      io.to(updatedExpense.group.toString()).emit('expense_updated', updatedExpense);
    } catch (e) {}

    res.json(updatedExpense);
  } catch (error) {
    console.error('Mark split paid error:', error);
    res.status(400).json({ message: error.message });
  }
};

const confirmSplitPayment = async (req, res) => {
  try {
    const { participantUserId, accept } = req.body;
    const updatedExpense = await expenseService.respondToSplitPayment({
      expenseId: req.params.id,
      participantUserId,
      payerId: req.user._id,
      accept: Boolean(accept)
    });

    try {
      const io = getIO();
      io.to(updatedExpense.group.toString()).emit('expense_updated', updatedExpense);
    } catch (e) {}

    res.json(updatedExpense);
  } catch (error) {
    console.error('Confirm split payment error:', error);
    res.status(400).json({ message: error.message });
  }
};

const getPendingConfirmations = async (req, res) => {
  try {
    const pending = await expenseService.getUserPendingConfirmations(req.user._id);
    res.json(pending);
  } catch (error) {
    console.error('Get pending confirmations error:', error);
    res.status(500).json({ message: 'Server error while fetching pending confirmations' });
  }
};

// 🤖 AI Voice Expense Intent Parser Handler
const parseAIExpense = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: 'Transcript string is required' });
    }

    // Fetch user's active groups for group matching
    const userGroups = await groupService.getUserGroups(req.user._id);

    const parsed = await aiService.parseVoiceExpenseIntent(transcript, userGroups);
    res.json(parsed);
  } catch (error) {
    console.error('Parse AI expense controller error:', error);
    res.status(500).json({ message: 'Failed to parse voice transcript' });
  }
};

module.exports = {
  createExpense,
  getGroupExpenses,
  deleteExpense,
  markSplitPaid,
  confirmSplitPayment,
  getPendingConfirmations,
  parseAIExpense
};
