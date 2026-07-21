const expenseService = require('../services/expenseService');
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

module.exports = {
  createExpense,
  getGroupExpenses,
  deleteExpense
};
