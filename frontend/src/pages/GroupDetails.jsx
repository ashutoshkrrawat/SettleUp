import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
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
import paymentService from '../../services/paymentService';

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

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      await sendGroupReminders(id);
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
  }, [currentUser, id]);

  const group = groups.find(g => g._id === id);

  if (loading || pageLoading) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">Group Not Found</h2>
        <p className="text-muted-foreground text-sm">The group you're looking for doesn't exist or you don't have access.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-full text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const groupExpenses = expenses.filter(e => e.group === id);
  const settlements = getSettlements(id);

  const getUserName = (userId) => {
    if (!userId) return 'Unknown';
    if (typeof userId === 'object' && userId.name) return userId.name;
    const u = users.find(user => user._id === userId);
    return u ? u.name : (userId === currentUser?._id ? currentUser.name : 'Member');
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteEmail = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    try {
      await inviteMemberByEmail(id, inviteEmail.trim());
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingInvite(false);
    }
  };

  // Razorpay Checkout Handler
  const handleRazorpayPayment = async (expenseId, amount) => {
    const toastId = toast.loading('Initiating Razorpay payment gateway...');
    try {
      const isLoaded = await paymentService.loadRazorpayScript();
      if (!isLoaded) {
        toast.dismiss(toastId);
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        return;
      }

      const order = await paymentService.createOrder(amount, expenseId);
      toast.dismiss(toastId);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'SettleUp',
        description: 'Debt Settlement Payment',
        order_id: order.orderId,
        handler: async function (response) {
          const verifyToastId = toast.loading('Verifying HMAC payment signature...');
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || order.orderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'simulated_signature',
              expenseId
            });
            toast.dismiss(verifyToastId);
            toast.success('🎉 Payment verified & debt auto-settled in DB!');
            fetchGroupDetails(id);
            fetchExpensesForGroup(id);
          } catch (err) {
            toast.dismiss(verifyToastId);
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: currentUser?.name || 'User',
          email: currentUser?.email || 'user@example.com',
        },
        theme: {
          color: '#F3C84C',
        },
      };

      if (order.isSimulated || order.keyId === 'rzp_test_simulated_key') {
        const confirmPayment = window.confirm(
          `💳 [Razorpay Sandbox Mode Active]\n\nDo you want to simulate instant settlement of ₹${amount.toFixed(2)} / $${amount.toFixed(2)} via UPI?`
        );
        if (confirmPayment) {
          options.handler({
            razorpay_order_id: order.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: 'simulated_sig'
          });
        }
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Razorpay payment error:', err);
      toast.error(err.response?.data?.message || 'Could not initiate payment order');
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(expAmount);
    if (!expDescription.trim() || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid description and amount');
      return;
    }

    let splits = [];
    const members = group.members;

    if (splitType === 'EQUAL') {
      const perPerson = Math.round((numAmount / members.length) * 100) / 100;
      splits = members.map((m, idx) => {
        const mId = m._id || m;
        if (idx === members.length - 1) {
          const prevSum = perPerson * (members.length - 1);
          return { user: mId, amount: Math.round((numAmount - prevSum) * 100) / 100 };
        }
        return { user: mId, amount: perPerson };
      });
    } else if (splitType === 'EXACT') {
      let sum = 0;
      splits = members.map(m => {
        const mId = m._id || m;
        const val = parseFloat(customSplits[mId] || 0);
        sum += val;
        return { user: mId, amount: val };
      });
      if (Math.abs(sum - numAmount) > 0.05) {
        toast.error(`Exact amounts sum ($${sum.toFixed(2)}) must equal total ($${numAmount.toFixed(2)})`);
        return;
      }
    } else if (splitType === 'PERCENT') {
      let percentSum = 0;
      splits = members.map(m => {
        const mId = m._id || m;
        const pct = parseFloat(customSplits[mId] || 0);
        percentSum += pct;
        const val = Math.round((numAmount * (pct / 100)) * 100) / 100;
        return { user: mId, amount: val };
      });
      if (Math.abs(percentSum - 100) > 0.1) {
        toast.error(`Percentages sum (${percentSum}%) must equal 100%`);
        return;
      }
    }

    addExpense({
      groupId: id,
      description: expDescription.trim(),
      amount: numAmount,
      splitType,
      paidBy,
      splits
    });

    toast.success('Expense added successfully!');
    setExpDescription('');
    setExpAmount('');
    setCustomSplits({});
    setShowAddExpenseModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Floating Navbar */}
      <NavBar
        title={group.name}
        subtitle={group.description || 'Group Expense Pool'}
        actionLabel="Add Expense"
        actionIcon={Plus}
        onActionClick={() => setShowAddExpenseModal(true)}
      />

      {/* Header Info Banner */}
      <DashboardCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black text-xl">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">{group.name}</h2>
              <p className="text-xs text-muted-foreground font-light">{group.description || 'No description provided.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="px-4 py-2 bg-secondary border border-border/70 rounded-full text-xs font-bold text-foreground hover:bg-secondary/80 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-primary" />
              <span>{sendingReminders ? 'Sending Email...' : 'Send Reminders'}</span>
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-full hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Invite via Email</span>
            </button>

            <button
              onClick={handleCopyInviteCode}
              className="px-4 py-2 bg-secondary border border-border text-muted-foreground hover:text-foreground font-bold text-xs rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Code: {group.inviteCode}</span>
            </button>
          </div>
        </div>
      </DashboardCard>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Expenses ({groupExpenses.length})
        </button>

        <button
          onClick={() => setActiveTab('settle')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'settle'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Settle Up ({settlements.length})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Members ({group.members.length})
        </button>
      </div>

      {/* TAB 1: Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {groupExpenses.length === 0 ? (
            <DashboardCard className="p-8 text-center space-y-3">
              <DollarSign className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-bold text-base text-foreground">No Expenses Logged Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto font-light">
                Add an expense to start splitting bills automatically among members.
              </p>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-full hover:scale-105 transition-transform cursor-pointer"
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

                                <div className="flex items-center gap-2">
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
                                      Pending
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase rounded-full flex items-center gap-1">
                                      <XCircle className="w-3.5 h-3.5" />
                                      Unpaid
                                    </span>
                                  )}

                                  {/* Pay via Razorpay / UPI Button */}
                                  {isMe && !isSplitPayer && status === 'UNPAID' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRazorpayPayment(exp._id, splitItem.amount);
                                      }}
                                      className="px-3.5 py-1 bg-primary text-primary-foreground font-bold rounded-full text-xs hover:scale-105 transition-transform flex items-center gap-1 shadow-sm cursor-pointer"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Pay Now</span>
                                    </button>
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
                                        className="px-2.5 py-1 bg-destructive text-destructive-foreground font-bold rounded-full text-xs hover:bg-destructive/90 cursor-pointer"
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

      {/* TAB 2: Optimized Settle-Up Calculations */}
      {activeTab === 'settle' && (
        <div className="space-y-4">
          <DashboardCard className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-base font-black tracking-tight text-foreground">
                Greedy Debt Minimization Engine
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-light">
              This list uses an optimized $O(N \log N)$ two-pointer algorithm to resolve all internal group debts with the fewest possible transactions.
            </p>

            {settlements.length === 0 ? (
              <div className="p-6 text-center bg-secondary/30 rounded-2xl border border-border/40">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-foreground">All Settled Up!</p>
                <p className="text-xs text-muted-foreground font-light">No outstanding debts exist in this group.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {settlements.map((settle, idx) => {
                  const isUserFrom = settle.from === currentUser._id;
                  return (
                    <div
                      key={idx}
                      className="bg-card border border-border/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-black text-sm">
                          {getUserName(settle.from).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            <span className="text-rose-500">{getUserName(settle.from)}</span> owes <span className="text-emerald-500">{getUserName(settle.to)}</span>
                          </p>
                          <span className="text-xs text-muted-foreground font-mono font-bold">
                            ${settle.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {isUserFrom && (
                        <button
                          onClick={() => handleRazorpayPayment(null, settle.amount)}
                          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-full text-xs hover:scale-105 transition-transform flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay ${settle.amount.toFixed(2)} Now</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {/* TAB 3: Members List */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {group.members.map((member) => {
              const mId = member._id || member;
              const isMe = mId === currentUser._id;
              const memberBalance = group.balances?.find(b => b.user === mId)?.balance || 0;

              return (
                <DashboardCard key={mId} className="p-5 flex flex-col justify-between h-[150px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                        {getUserName(mId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {getUserName(mId)} {isMe && '(You)'}
                        </h4>
                        <p className="text-xs text-muted-foreground font-light">{member.email || 'Group Member'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Balance</span>
                    <span className={`text-sm font-black ${memberBalance > 0 ? 'text-emerald-500' : memberBalance < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                      {memberBalance > 0 ? '+' : ''}${memberBalance.toFixed(2)}
                    </span>
                  </div>
                </DashboardCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
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
              className="bg-card border border-border/70 w-full max-w-lg p-7 rounded-[32px] shadow-2xl relative z-10 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black tracking-tight text-foreground">Add Expense in {group.name}</h3>
                <button onClick={() => setShowAddExpenseModal(false)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner, Taxi, Villa Booking"
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-2xl px-4 py-3 text-sm text-foreground outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-2xl px-4 py-3 text-sm text-foreground outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Paid By</label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full bg-secondary border border-border/60 rounded-2xl px-4 py-3 text-sm text-foreground outline-none"
                    >
                      {group.members.map(m => {
                        const mId = m._id || m;
                        return (
                          <option key={mId} value={mId}>
                            {getUserName(mId)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Split Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Split Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['EQUAL', 'EXACT', 'PERCENT'].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setSplitType(type)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          splitType === type
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {type === 'EQUAL' && 'Equal (=)'}
                        {type === 'EXACT' && 'Exact ($)'}
                        {type === 'PERCENT' && 'Percent (%)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Splits Inputs */}
                {splitType !== 'EQUAL' && (
                  <div className="p-4 bg-secondary/40 rounded-2xl border border-border/50 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Custom Member Splits ({splitType})
                    </span>
                    {group.members.map(m => {
                      const mId = m._id || m;
                      return (
                        <div key={mId} className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-bold text-foreground">{getUserName(mId)}</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={splitType === 'EXACT' ? '$0.00' : '0%'}
                            value={customSplits[mId] || ''}
                            onChange={(e) => setCustomSplits({ ...customSplits, [mId]: e.target.value })}
                            className="w-28 bg-card border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground outline-none font-mono text-right"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="submit"
                  className="premium-btn-attention w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Expense</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
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
              className="bg-card border border-border/70 w-full max-w-md p-7 rounded-[32px] shadow-2xl relative z-10 space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black tracking-tight text-foreground">Invite Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInviteEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Email Address</label>
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-secondary border border-border/60 rounded-2xl px-4 py-3.5 text-sm text-foreground outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="premium-btn-attention w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>{sendingInvite ? 'Sending Invite...' : 'Send Invitation Email'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
