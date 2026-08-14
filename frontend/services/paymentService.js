import api from '../src/utils/api';

/**
 * Dynamically loads the Razorpay Checkout SDK script into the DOM.
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const createOrder = async (amount, expenseId) => {
  const { data } = await api.post('/payments/create-order', { amount, expenseId });
  return data;
};

const verifyPayment = async (paymentDetails) => {
  const { data } = await api.post('/payments/verify', paymentDetails);
  return data;
};

export default {
  loadRazorpayScript,
  createOrder,
  verifyPayment,
};
