const expenseService = require('../services/expenseService');

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
