const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentOrder,
  verifyAndSettlePayment
} = require('../controllers/paymentController');

// @route   POST /api/payments/create-order
// @desc    Create Razorpay Order ID for debt settlement
// @access  Private
router.post('/create-order', protect, createPaymentOrder);

// @route   POST /api/payments/verify
// @desc    Verify Razorpay HMAC signature and auto-settle debt
// @access  Private
router.post('/verify', protect, verifyAndSettlePayment);

module.exports = router;
