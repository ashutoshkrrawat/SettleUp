const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance if keys exist
const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

/**
 * Creates a Razorpay Order for a debt settlement.
 */
const createOrder = async ({ amount, currency = 'INR', receipt }) => {
  const razorpay = getRazorpayInstance();
  const amountInPaisa = Math.round(amount * 100); // Razorpay requires amount in paisa (1 INR = 100 paisa)

  if (razorpay) {
    const options = {
      amount: amountInPaisa,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      isSimulated: false,
    };
  }

  // Smart Sandbox Fallback if RAZORPAY_KEY_ID is not configured in .env yet
  const mockOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    orderId: mockOrderId,
    amount: amountInPaisa,
    currency,
    keyId: 'rzp_test_simulated_key',
    isSimulated: true,
  };
};

/**
 * Verifies Razorpay HMAC-SHA256 Payment Signature
 */
const verifyPayment = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!razorpay_order_id || !razorpay_payment_id) {
    throw new Error('Missing payment order/payment IDs');
  }

  // If in sandbox mode
  if (razorpay_order_id.startsWith('order_sim_')) {
    return { verified: true, paymentId: razorpay_payment_id, isSimulated: true };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('Razorpay Key Secret is not configured on server.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    throw new Error('Invalid Razorpay payment signature. Verification failed.');
  }

  return { verified: true, paymentId: razorpay_payment_id, isSimulated: false };
};

module.exports = {
  createOrder,
  verifyPayment,
};
