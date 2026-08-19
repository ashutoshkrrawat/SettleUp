import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import paymentService from '../../services/paymentService';
import {
  ArrowLeft,
  DollarSign,
  Plus,
  Users,
  Copy,
  Check,
  Trash2,
  Share2,
  Mail,
  X,
  PlusCircle,
  Percent,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  Send,
  UserCheck,
  UserX,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import NavBar from '../components/NavBar';
import DashboardCard from '../components/DashboardCard';

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentUser,
    users,
    groups,
    expenses,
    inviteMemberByEmail,
    addExpense,
    deleteExpense,
    getSettlements,
    fetchGroupDetails,
    fetchExpensesForGroup,
    joinGroupRoom,
    leaveGroupRoom,
    loading,
    sendGroupReminders,
    markSplitPaid,
    respondToSplitPayment,
    removeMember
  } = useData();

  const [pageLoading, setPageLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses', 'settle', 'members'
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Expense Modal States
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, EXACT, PERCENT
  const [paidBy, setPaidBy] = useState(currentUser?._id || '');
  const [customSplits, setCustomSplits] = useState({});

  const handlePayWithRazorpay = async (splitAmount, expenseId = null, settleToUser = null) => {
    try {
      const res = await paymentService.loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      toast.info('Initializing Razorpay Checkout...');
      const orderData = await paymentService.createOrder(splitAmount, expenseId);

      if (!orderData || !orderData.orderId) {
        toast.error('Could not initiate payment order.');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'SettleUp Payment',
        description: `Settling split payment of ₹${splitAmount}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          toast.info('Verifying payment signature...');
          try {
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              expenseId
            });

            if (verifyRes.success) {
              toast.success('🎉 Payment successful! Debt settled.');
              if (settleToUser) {
                const targetUserId = settleToUser._id || settleToUser;
                await addExpense({
                  groupId: group._id,
                  description: `Settle up: Paid ${getUserName(targetUserId)} via Razorpay`,
                  amount: splitAmount,
                  splitType: 'EQUAL',
                  paidBy: currentUser._id,
                  splits: [
                    { user: currentUser._id, amount: 0 },
                    { user: targetUserId, amount: splitAmount }
                  ]
                });
              }
              await fetchExpensesForGroup(id);
              await fetchGroupDetails(id);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || ''
        },
        theme: {
          color: '#10B981'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      toast.error('Failed to initiate payment.');
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      await sendGroupReminders(group._id);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReminders(false);
    }
  };

  useEffect(() => {
    if (currentUser && id) {
      setPaidBy(currentUser._id);
      setPageLoading(true);
      Promise.all([
        fetchGroupDetails(id),
        fetchExpensesForGroup(id)
      ])
        .catch(err => console.error(err))
        .finally(() => {
          setPageLoading(false);
        });
      joinGroupRoom(id);

      return () => {
        leaveGroupRoom(id);
      };
    }
  }, [id, currentUser]);

  const group = groups.find(g => g._id === id);

  if (loading || (currentUser && pageLoading)) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    navigate('/auth');
    return null;
  }

  if (!group) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-2xl font-black text-foreground tracking-tight">Group Not Found</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          This group does not exist or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-full shadow-sm cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const groupExpenses = expenses.filter(e => e.group === group._id);
  const settlements = getSettlements(group._id);

  // Helper to copy invite code
  const copyInviteCode = () => {
    const inviteLink = `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomSplitChange = (memberId, value) => {
    setCustomSplits(prev => {
      const updated = { ...prev, [memberId]: value };
      if (splitType === 'EXACT') {
        const sum = Object.values(updated).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
        setExpAmount(sum > 0 ? sum.toFixed(2) : '');
      }
      return updated;
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    setSendingInvite(true);
    try {
      await inviteMemberByEmail(group._id, inviteEmail.trim());
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveOrLeaveMember = async (targetUserId) => {
    const isSelf = targetUserId === currentUser._id;
    if (!window.confirm(isSelf ? 'Are you sure you want to leave this group?' : 'Are you sure you want to remove this member?')) {
      return;
    }
    try {
      await removeMember(group._id, targetUserId);
      if (isSelf) {
        toast.success('You have left the group.');
        navigate('/dashboard');
      } else {
        toast.success('Member removed successfully.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove/leave group');
    }
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unknown';

    // 1. Direct object name
    if (typeof userId === 'object' && userId?.name) {
      return userId.name;
    }

    const idStr = (userId?._id || userId).toString();

    // 2. Check current group members (populated with user objects)
    if (group?.members) {
      const groupMember = group.members.find(m => (m?._id || m).toString() === idStr);
      if (groupMember && typeof groupMember === 'object' && groupMember.name) {
        return groupMember.name;
      }
    }

    // 3. Check users state from Context
    if (users && users.length > 0) {
      const userMatch = users.find(u => (u?._id || u).toString() === idStr);
      if (userMatch && userMatch.name) {
        return userMatch.name;
      }
    }

    // 4. Check currentUser
    if (currentUser && currentUser._id?.toString() === idStr) {
      return currentUser.name;
    }

    return 'Member';
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();

    if (!expDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!paidBy) {
      toast.error('Payer is required');
      return;
    }

    let amountVal = parseFloat(expAmount);
    let calculatedSplits = [];
    const membersCount = group.members.length;

    if (splitType === 'EXACT') {
      let totalAssigned = 0;
      calculatedSplits = group.members.map(member => {
        const memberId = member?._id || member;
        const val = parseFloat(customSplits[memberId]) || 0;
        totalAssigned += val;
        return { user: memberId, amount: Math.round(val * 100) / 100 };
      });

      amountVal = Math.round(totalAssigned * 100) / 100;

      if (amountVal <= 0) {
        toast.error('Total exact split amounts must be greater than $0.00');
        return;
      }
    } else if (splitType === 'PERCENT') {
      if (isNaN(amountVal) || amountVal <= 0) {
        toast.error('Please enter a valid total expense amount');
        return;
      }

      let totalPercent = 0;
      calculatedSplits = group.members.map(member => {
        const memberId = member?._id || member;
        const pct = parseFloat(customSplits[memberId]) || 0;
        totalPercent += pct;
        const splitAmt = Math.round((amountVal * (pct / 100)) * 100) / 100;
        return { user: memberId, amount: splitAmt, percentage: pct };
      });

      if (Math.abs(totalPercent - 100) > 0.01) {
        toast.error(`Total percentages must sum up to exactly 100% (currently ${totalPercent}%)`);
        return;
      }
    } else { // EQUAL
      if (isNaN(amountVal) || amountVal <= 0) {
        toast.error('Please enter a valid total expense amount');
        return;
      }

      const splitAmt = Math.round((amountVal / membersCount) * 100) / 100;
      calculatedSplits = group.members.map((member, idx) => {
        const memberId = member?._id || member;
        if (idx === membersCount - 1) {
          const sumPrevious = splitAmt * (membersCount - 1);
          return { user: memberId, amount: Math.round((amountVal - sumPrevious) * 100) / 100 };
        }
        return { user: memberId, amount: splitAmt };
      });
    }

    try {
      await addExpense({
        groupId: group._id,
        description: expDescription,
        amount: amountVal,
        splitType,
        paidBy,
        splits: calculatedSplits
      });

      toast.success('Expense added successfully!');
      setExpDescription('');
      setExpAmount('');
      setCustomSplits({});
      setShowAddExpenseModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add expense');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Floating Navbar */}
      <NavBar
        title={group.name}
        subtitle={group.description || 'Active splitting group pool'}
        actionLabel="Add Expense"
        actionIcon={Plus}
        onActionClick={() => setShowAddExpenseModal(true)}
      />

      {/* Group Action Sub-bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/70 p-4 rounded-[28px] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            {group.members.length} Members
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            {groupExpenses.length} Expenses
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyInviteCode}
            className="px-4 py-2 border border-border/70 rounded-full hover:bg-secondary transition-all flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            <span>Invite Link</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-secondary border border-border/70 rounded-full hover:bg-secondary/80 transition-all flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>Invite Email</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-4 md:gap-5">
        {/* Left Side: Tabs Navigation & Panels (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Custom Tabs Navigation */}
          <div className="flex bg-card p-1.5 rounded-[28px] border border-border/70 shadow-sm">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-3 text-center text-xs font-bold rounded-2xl transition-all cursor-pointer ${activeTab === 'expenses'
                  ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-6px_rgba(121,166,23,0.4)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
            >
              Expenses Log ({groupExpenses.length})
            </button>
            <button
              onClick={() => setActiveTab('settle')}
              className={`flex-1 py-3 text-center text-xs font-bold rounded-2xl transition-all cursor-pointer ${activeTab === 'settle'
                  ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-6px_rgba(121,166,23,0.4)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
            >
              Settle Up ({settlements.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-3 text-center text-xs font-bold rounded-2xl transition-all cursor-pointer ${activeTab === 'members'
                  ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-6px_rgba(121,166,23,0.4)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
            >
              Members ({group.members.length})
            </button>
          </div>

          {/* Tab Panels */}
          {activeTab === 'expenses' && (
            <div className="space-y-3">
              {groupExpenses.length === 0 ? (
                <DashboardCard className="py-12 text-center text-muted-foreground font-light flex flex-col items-center justify-center gap-3">
                  <DollarSign className="w-10 h-10 text-muted-foreground/40" />
                  <p>No expenses logged in this group yet. Log your first expense!</p>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-full shadow-sm cursor-pointer"
                  >
                    Add Expense Now
                  </button>
                </DashboardCard>
              ) : (
                groupExpenses.map(exp => {
                  const isExpanded = expandedExpenseId === exp._id;
                  const paidByIdStr = exp.paidBy?._id ? exp.paidBy._id.toString() : exp.paidBy?.toString();
                  const isPayer = paidByIdStr === currentUser._id;

                  return (
                    <DashboardCard
                      key={exp._id}
                      className="p-0 overflow-hidden"
                      delay={0.05}
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => setExpandedExpenseId(isExpanded ? null : exp._id)}
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black">
                            <DollarSign className="w-5 h-5 stroke-[2.5]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{exp.description}</h4>
                            <p className="text-xs text-muted-foreground font-light">
                              Paid by <span className="font-semibold text-foreground">{getUserName(exp.paidBy)}</span> • {new Date(exp.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-base font-black text-foreground block">${exp.amount.toFixed(2)}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">
                              {exp.splitType} Split
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Collapsible Dropdown Details Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border/40 bg-secondary/30 p-5 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Split Breakdown & Payment Status
                              </h5>
                              {isPayer && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteExpense(exp._id);
                                    toast.success('Expense deleted');
                                  }}
                                  className="text-xs text-rose-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Expense
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              {exp.splits?.map((splitItem, idx) => {
                                const splitUserId = splitItem.user?._id || splitItem.user;
                                const isMe = splitUserId === currentUser._id;
                                const status = splitItem.status || 'UNPAID';
                                const isSplitPayer = splitUserId === paidByIdStr;

                                return (
                                  <div
                                    key={idx}
                                    className="bg-card border border-border/50 p-3 rounded-2xl flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                                        {getUserName(splitUserId).charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <span className="font-bold text-foreground block">{getUserName(splitUserId)}</span>
                                        <span className="text-muted-foreground font-mono text-[11px]">
                                          ${splitItem.amount.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {isSplitPayer ? (
                                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase rounded-full flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Payer
                                        </span>
                                      ) : status === 'CONFIRMED' ? (
                                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase rounded-full flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Confirmed
                                        </span>
                                      ) : status === 'PENDING_CONFIRMATION' ? (
                                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase rounded-full flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5" />
                                          Pending Confirmation
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase rounded-full flex items-center gap-1">
                                          <XCircle className="w-3.5 h-3.5" />
                                          Unpaid
                                        </span>
                                      )}

                                      {isMe && !isSplitPayer && status === 'UNPAID' && (
                                         <div className="flex items-center gap-2">
                                           <button
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               handlePayWithRazorpay(splitItem.amount, exp._id);
                                             }}
                                             className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                           >
                                             <CreditCard className="w-3.5 h-3.5" />
                                             <span>Pay Now (Razorpay/UPI)</span>
                                           </button>
                                           <button
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               markSplitPaid(exp._id);
                                             }}
                                             className="px-3 py-1 bg-secondary border border-border/80 text-foreground font-bold rounded-full text-xs hover:bg-secondary/80 transition-opacity cursor-pointer"
                                           >
                                             Mark Paid
                                           </button>
                                         </div>
                                       )}

                                      {isPayer && !isSplitPayer && status === 'PENDING_CONFIRMATION' && (
                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            onClick={() => respondToSplitPayment(exp._id, splitUserId, true)}
                                            className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-full text-xs shadow-sm hover:bg-emerald-700 cursor-pointer"
                                          >
                                            Confirm ✓
                                          </button>
                                          <button
                                            onClick={() => respondToSplitPayment(exp._id, splitUserId, false)}
                                            className="px-2.5 py-1 bg-rose-500 text-white font-bold rounded-full text-xs shadow-sm hover:bg-rose-600 cursor-pointer"
                                          >
                                            Reject ✕
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </DashboardCard>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'settle' && (
            <div className="space-y-4">
              <DashboardCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black tracking-tight text-foreground">
                      Optimized Settle Up Flows
                    </h3>
                    <p className="text-xs text-muted-foreground font-light mt-0.5">
                      Resolved to minimum transactions via greedy algorithm
                    </p>
                  </div>
                  {settlements.length > 0 && (
                    <button
                      onClick={handleSendReminders}
                      disabled={sendingReminders}
                      className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-full text-xs flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{sendingReminders ? 'Sending...' : 'Send Reminders'}</span>
                    </button>
                  )}
                </div>

                {settlements.length === 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    🎉 Everyone is completely settled! No transactions pending.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((tx, idx) => {
                      const fromId = (tx.from?._id || tx.from)?.toString();
                      const toId = (tx.to?._id || tx.to)?.toString();
                      const isDebtor = currentUser && currentUser._id?.toString() === fromId;

                      return (
                        <div
                          key={idx}
                          className="bg-secondary/50 border border-border/50 p-4 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                              {getUserName(tx.from).charAt(0).toUpperCase()}
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-foreground">{getUserName(tx.from)}</span> owes <span className="font-bold text-foreground">{getUserName(tx.to)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-base font-black text-primary">${tx.amount.toFixed(2)}</span>
                            {isDebtor && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePayWithRazorpay(tx.amount, null, tx.to)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pay Now (Razorpay/UPI)</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await addExpense({
                                        groupId: group._id,
                                        description: `Settle up: Paid ${getUserName(tx.to)}`,
                                        amount: tx.amount,
                                        splitType: 'EQUAL',
                                        paidBy: fromId,
                                        splits: [
                                          { user: fromId, amount: 0 },
                                          { user: toId, amount: tx.amount }
                                        ]
                                      });
                                      toast.success(`Settled up $${tx.amount} to ${getUserName(tx.to)}!`);
                                    } catch (err) {
                                      toast.error(err.message || 'Failed to settle up');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-secondary border border-border/80 text-foreground font-bold rounded-full text-xs hover:bg-secondary/80 transition-opacity cursor-pointer"
                                >
                                  Offline Settle
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DashboardCard>
            </div>
          )}

          {activeTab === 'members' && (
            <DashboardCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black tracking-tight text-foreground">Group Members</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                  {group.members.length} Active
                </span>
              </div>

              <div className="divide-y divide-border/30">
                {group.members.map(member => {
                  const mId = member?._id || member;
                  const matchUser = users.find(u => u._id === mId) || (typeof member === 'object' ? member : null);
                  const createdById = group.createdBy?._id || group.createdBy;

                  return (
                    <div key={mId} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground">
                          {matchUser?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{matchUser?.name || 'Group Member'}</h4>
                          <p className="text-xs text-muted-foreground">{matchUser?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {createdById === mId && (
                          <span className="text-[9px] uppercase font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                            Owner
                          </span>
                        )}

                        {mId === currentUser._id && (
                          <button
                            onClick={() => handleRemoveOrLeaveMember(currentUser._id)}
                            className="px-3 py-1 bg-rose-500/10 text-rose-500 font-bold hover:bg-rose-500 hover:text-white rounded-full text-xs transition-colors cursor-pointer"
                          >
                            Leave Group
                          </button>
                        )}

                        {createdById === currentUser._id && mId !== currentUser._id && (
                          <button
                            onClick={() => handleRemoveOrLeaveMember(mId)}
                            className="px-3 py-1 bg-secondary text-muted-foreground font-bold hover:text-rose-500 hover:bg-rose-500/10 rounded-full text-xs transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          )}
        </div>

        {/* Right Side: Individual Balances Card Widget (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <h2 className="text-lg font-black tracking-tight text-foreground">
            Individual Balances
          </h2>
          <DashboardCard className="p-6">
            <div className="space-y-3 divide-y divide-border/30">
              {group.balances.map(b => {
                const balVal = b.balance;
                const balanceUserId = b.user?._id || b.user;
                return (
                  <div key={balanceUserId} className="pt-3 first:pt-0 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{getUserName(b.user)}</span>
                    <span className={`text-sm font-black ${balVal > 0 ? 'text-emerald-500' : balVal < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                      {balVal > 0 ? '+' : ''}${balVal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Invite Email Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-border/70 w-full max-w-md p-7 rounded-[32px] shadow-[0_24px_55px_rgba(0,0,0,0.18)] relative z-10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-foreground">
                    Invite Member by Email
                  </h3>
                  <p className="text-xs text-muted-foreground">Send an in-app & email invitation</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-sm text-foreground outline-none transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="premium-btn-attention w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  <span>{sendingInvite ? 'Sending Invite...' : 'Send Invite'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddExpenseModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-border/70 w-full max-w-lg p-7 rounded-[32px] shadow-[0_24px_55px_rgba(0,0,0,0.18)] relative z-10 my-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-foreground">
                    Add Group Expense
                  </h3>
                  <p className="text-xs text-muted-foreground">Log shared expense and split dynamically</p>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Villa, Dinner, Fuel..."
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                      className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-sm text-foreground outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={splitType === 'EXACT' ? "Auto-calculated" : "0.00"}
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      disabled={splitType === 'EXACT'}
                      className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-sm text-foreground outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Paid By
                    </label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-sm text-foreground outline-none transition-all"
                    >
                      {group.members.map(member => {
                        const mId = member?._id || member;
                        return (
                          <option key={mId} value={mId}>
                            {getUserName(member)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Split Scheme
                    </label>
                    <div className="flex bg-secondary p-1 rounded-2xl border border-border/50">
                      <button
                        type="button"
                        onClick={() => { setSplitType('EQUAL'); setCustomSplits({}); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${splitType === 'EQUAL' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        Equally
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSplitType('EXACT'); setCustomSplits({}); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${splitType === 'EXACT' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        Exact
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSplitType('PERCENT'); setCustomSplits({}); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${splitType === 'PERCENT' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Split Inputs */}
                {splitType !== 'EQUAL' && (
                  <div className="space-y-3 pt-3 border-t border-border/40">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Specify splits ({splitType === 'EXACT' ? '$' : '%'})
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {group.members.map(member => {
                        const memberId = member?._id || member;
                        return (
                          <div key={memberId} className="flex items-center justify-between gap-4">
                            <span className="text-xs font-medium text-foreground">{getUserName(member)}</span>
                            <div className="relative w-32">
                              <input
                                type="number"
                                step="any"
                                placeholder={splitType === 'EXACT' ? '0.00' : '0'}
                                value={customSplits[memberId] || ''}
                                onChange={(e) => handleCustomSplitChange(memberId, e.target.value)}
                                className="w-full bg-secondary border border-border/60 focus:border-primary rounded-xl px-3 py-1.5 text-xs text-foreground outline-none text-right font-mono"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="premium-btn-attention w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Log Expense</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
