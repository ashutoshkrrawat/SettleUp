const paymentService = require('../services/paymentService');
const expenseService = require('../services/expenseService');
const { getIO } = require('../config/socket');

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a new Razorpay order for an expense settlement
 * @access  Private
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, expenseId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const orderData = await paymentService.createOrder({
      amount,
      currency: 'INR',
      receipt: expenseId ? `expense_${expenseId}` : `settle_${Date.now()}`
    });

    res.json(orderData);
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay HMAC signature & auto-settle debt
 * @access  Private
 */
const verifyAndSettlePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, expenseId } = req.body;

    // 1. Cryptographically verify signature
    const verification = paymentService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verification.verified) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // 2. Mark the expense split as paid / settled in database
    let updatedExpense = null;
    if (expenseId) {
      updatedExpense = await expenseService.settleSplitDirectly({
        expenseId,
        userId: req.user._id
      });

      // 🔌 Real-time: Broadcast updated expense via Socket.io
      try {
        const io = getIO();
        if (updatedExpense && updatedExpense.group) {
          io.to(updatedExpense.group.toString()).emit('expense_updated', updatedExpense);
        }
      } catch (socketErr) {
        console.warn('Socket emit error:', socketErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and debt settled successfully!',
      paymentId: razorpay_payment_id,
      expense: updatedExpense
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(400).json({ message: error.message || 'Payment verification failed' });
  }
};

module.exports = {
  createPaymentOrder,
  verifyAndSettlePayment
};
