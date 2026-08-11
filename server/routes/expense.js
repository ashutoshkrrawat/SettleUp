const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createExpense,
  getGroupExpenses,
  deleteExpense,
  markSplitPaid,
  confirmSplitPayment,
  getPendingConfirmations
} = require('../controllers/expenseController');

// @route   GET /api/expenses/pending-confirmations
// @desc    Get all pending payment confirmations where current user is the payer
// @access  Private
router.get('/pending-confirmations', protect, getPendingConfirmations);

// @route   POST /api/expenses
// @desc    Add a new expense & update group balances
// @access  Private
router.post('/', protect, createExpense);

// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a specific group
// @access  Private
router.get('/group/:groupId', protect, getGroupExpenses);

// @route   PATCH /api/expenses/:id/mark-paid
// @desc    Mark current user's split as paid (PENDING_CONFIRMATION)
// @access  Private
router.patch('/:id/mark-paid', protect, markSplitPaid);

// @route   PATCH /api/expenses/:id/confirm-payment
// @desc    Confirm or reject a debtor's payment claim
// @access  Private
router.patch('/:id/confirm-payment', protect, confirmSplitPayment);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense & revert group balances
// @access  Private
router.delete('/:id', protect, deleteExpense);

module.exports = router;
