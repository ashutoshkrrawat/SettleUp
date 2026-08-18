import api from '../src/utils/api';

const getGroupExpenses = async (groupId) => {
  const { data } = await api.get(`/expenses/group/${groupId}`);
  return data;
};

const createExpense = async ({ groupId, description, amount, splitType, paidBy, splits }) => {
  const { data } = await api.post('/expenses', {
    group: groupId,
    description,
    amount,
    splitType,
    paidBy,
    splits,
  });
  return data;
};

const deleteExpense = async (expenseId) => {
  const { data } = await api.delete(`/expenses/${expenseId}`);
  return data;
};

const markSplitPaid = async (expenseId) => {
  const { data } = await api.patch(`/expenses/${expenseId}/mark-paid`);
  return data;
};

const confirmSplitPayment = async (expenseId, participantUserId, accept) => {
  const { data } = await api.patch(`/expenses/${expenseId}/confirm-payment`, {
    participantUserId,
    accept,
  });
  return data;
};

const getPendingConfirmations = async () => {
  const { data } = await api.get('/expenses/pending-confirmations');
  return data;
};

//AI Voice Expense Intent Parser Call
const parseVoiceExpense = async (transcript) => {
  const { data } = await api.post('/expenses/ai-parse', { transcript });
  return data;
};

const parseAudioExpense = async (audioBase64, mimeType = 'audio/webm') => {
  const { data } = await api.post('/expenses/ai-parse-audio', { audio: audioBase64, mimeType });
  return data;
};

// AI Receipt Vision Parser Call
const analyzeReceipt = async (imageBase64, mimeType = 'image/jpeg') => {
  const { data } = await api.post('/expenses/analyze-receipt', { image: imageBase64, mimeType });
  return data;
};


export default {
  getGroupExpenses,
  createExpense,
  deleteExpense,
  markSplitPaid,
  confirmSplitPayment,
  getPendingConfirmations,
  parseVoiceExpense,
  parseAudioExpense,
  analyzeReceipt
};
