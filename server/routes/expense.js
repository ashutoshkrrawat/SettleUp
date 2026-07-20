const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createExpense, getGroupExpenses, deleteExpense } = require('../controllers/expenseController');

// @route   POST /api/expenses
// @desc    Add a new expense & update group balances
// @access  Private
router.post('/', protect, createExpense);

// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a specific group
// @access  Private
router.get('/group/:groupId', protect, getGroupExpenses);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense & revert group balances
// @access  Private
router.delete('/:id', protect, deleteExpense);

module.exports = router;
