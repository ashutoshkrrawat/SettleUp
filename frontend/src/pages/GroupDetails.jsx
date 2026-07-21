import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

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
    getSettlements
  } = useMockData();

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
  const [customSplits, setCustomSplits] = useState({}); // user_id -> amount or percentage input value

  const group = groups.find(g => g._id === id);

  if (!currentUser) {
    navigate('/auth');
    return null;
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-orange-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Group Not Found</h2>
        <p className="text-muted-foreground mb-6">This group does not exist or you do not have permission to view it.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const groupExpenses = expenses.filter(e => e.group === group._id);
  const settlements = getSettlements(group._id);

  // Helper to copy invite code
  const copyInviteCode = () => {
    navigator.clipboard.writeText(`http://splitter.app/invite/${group._id}`);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    inviteMemberByEmail(group._id, inviteEmail);
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const getUserName = (userId) => {
    return users.find(u => u._id === userId)?.name || 'Unknown';
  };

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(expAmount);
    if (!expDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    let calculatedSplits = [];
    const membersCount = group.members.length;

    if (splitType === 'EQUAL') {
      const splitAmt = Math.round((amountVal / membersCount) * 100) / 100;
      calculatedSplits = group.members.map((memberId, idx) => {
        // adjust round off difference on last user
        if (idx === membersCount - 1) {
          const sumPrevious = splitAmt * (membersCount - 1);
          return { user: memberId, amount: Math.round((amountVal - sumPrevious) * 100) / 100 };
        }
        return { user: memberId, amount: splitAmt };
      });
    } else if (splitType === 'EXACT') {
      let totalAssigned = 0;
      calculatedSplits = group.members.map(memberId => {
        const val = parseFloat(customSplits[memberId]) || 0;
        totalAssigned += val;
        return { user: memberId, amount: val };
      });

      if (Math.abs(totalAssigned - amountVal) > 0.02) {
        toast.error(`Total split amounts ($${totalAssigned.toFixed(2)}) must match total expense sum ($${amountVal.toFixed(2)})`);
        return;
      }
    } else if (splitType === 'PERCENT') {
      let totalPercent = 0;
      calculatedSplits = group.members.map(memberId => {
        const pct = parseFloat(customSplits[memberId]) || 0;
        totalPercent += pct;
        const splitAmt = Math.round((amountVal * (pct / 100)) * 100) / 100;
        return { user: memberId, amount: splitAmt, percentage: pct };
      });

      if (Math.abs(totalPercent - 100) > 0.1) {
        toast.error(`Total percentages must sum up to exactly 100% (currently ${totalPercent}%)`);
        return;
      }
    }

    addExpense({
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
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Top Header */}
      <header className="border-b border-border/10 py-5 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 hover:bg-secondary rounded-xl border border-border/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{group.name}</h1>
            <p className="text-xs text-muted-foreground font-light">{group.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyInviteCode}
            className="px-4 py-2.5 border border-border/50 rounded-xl hover:bg-secondary transition-all flex items-center gap-2 text-sm font-bold"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">Invite Link</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-bold"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Invite Email</span>
          </button>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Tabs Navigation & Tab Panels (2 Cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Tabs Headers */}
          <div className="flex bg-secondary p-1 rounded-2xl border border-border/30">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-grow py-3 text-center text-sm font-bold rounded-xl transition-all ${activeTab === 'expenses' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('settle')}
              className={`flex-grow py-3 text-center text-sm font-bold rounded-xl transition-all ${activeTab === 'settle' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Balances & Settle Up
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-grow py-3 text-center text-sm font-bold rounded-xl transition-all ${activeTab === 'members' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Members ({group.members.length})
            </button>
          </div>

          {/* Tab Panels */}
          <div>
            {activeTab === 'expenses' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Group Pool Log</h3>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="premium-btn-attention px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl flex items-center gap-2 shadow-sm text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>
                </div>

                {groupExpenses.length === 0 ? (
                  <div className="border border-dashed border-border/60 rounded-3xl p-12 text-center text-muted-foreground font-light">
                    No expenses logged in this group yet. Add one above!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupExpenses.map(exp => (
                      <div
                        key={exp._id}
                        className="bg-card border border-border/40 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-primary">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{exp.description}</h4>
                            <p className="text-xs text-muted-foreground font-light">
                              Paid by <span className="font-bold">{getUserName(exp.paidBy)}</span> • {new Date(exp.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-base font-black block">${exp.amount.toFixed(2)}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">
                              {exp.splitType} Split
                            </span>
                          </div>
                          {exp.paidBy === currentUser._id && (
                            <button
                              onClick={() => {
                                deleteExpense(exp._id);
                                toast.success('Expense deleted');
                              }}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settle' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Optimized Settle Up Flows</h3>
                <p className="text-sm text-muted-foreground font-light mb-4">
                  Using our greedy transaction-minimizing algorithm, we have simplified group debts to the absolute minimum payments possible.
                </p>

                {settlements.length === 0 ? (
                  <div className="bg-primary/5 border border-primary/25 rounded-3xl p-8 text-center text-primary-foreground font-bold">
                    🎉 Everyone is completely settled! No transactions pending.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((tx, idx) => (
                      <div
                        key={idx}
                        className="bg-card border border-border/40 p-5 rounded-2xl shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                            {getUserName(tx.from).charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm">
                            <span className="font-bold">{getUserName(tx.from)}</span> owes <span className="font-bold">{getUserName(tx.to)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-black text-primary">${tx.amount.toFixed(2)}</span>
                          {tx.from === currentUser._id && (
                            <button
                              onClick={() => {
                                // Add settling transaction as expense
                                addExpense({
                                  groupId: group._id,
                                  description: `Settle up: Paid ${getUserName(tx.to)}`,
                                  amount: tx.amount,
                                  splitType: 'EQUAL',
                                  paidBy: tx.from,
                                  splits: [
                                    { user: tx.from, amount: 0 },
                                    { user: tx.to, amount: tx.amount }
                                  ]
                                });
                                toast.success(`Settled up $${tx.amount} to ${getUserName(tx.to)}!`);
                              }}
                              className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs"
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Group Members</h3>
                </div>

                <div className="bg-card border border-border/40 rounded-3xl divide-y divide-border/10 overflow-hidden">
                  {group.members.map(memberId => {
                    const matchUser = users.find(u => u._id === memberId);
                    return (
                      <div key={memberId} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                            {matchUser?.name.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{matchUser?.name}</h4>
                            <p className="text-xs text-muted-foreground font-light">{matchUser?.email}</p>
                          </div>
                        </div>
                        {group.createdBy === memberId && (
                          <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                            Owner
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Group Balances Card Grid (1 Col wide) */}
        <div className="space-y-6">
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold mb-4 uppercase tracking-wider text-muted-foreground">Individual Balances</h3>
            <div className="space-y-4">
              {group.balances.map(b => {
                const balVal = b.balance;
                return (
                  <div key={b.user} className="flex items-center justify-between border-b border-border/10 pb-2">
                    <span className="text-sm font-light">{getUserName(b.user)}</span>
                    <span className={`text-sm font-bold ${balVal > 0 ? 'text-primary' : balVal < 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {balVal > 0 ? '+' : ''}${balVal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/45 w-full max-w-md p-6 rounded-3xl shadow-xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Invite by Email</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1.5 hover:bg-secondary rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all font-light"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="premium-btn-attention w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md transition-colors hover:bg-primary-hover flex items-center justify-center gap-2 mt-4"
                >
                  <Mail className="w-5 h-5" />
                  <span>Send Invite</span>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/45 w-full max-w-lg p-6 rounded-3xl shadow-xl relative z-10 my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Group Expense</h3>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="p-1.5 hover:bg-secondary rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Villa, Dinner, Fuel..."
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                      className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all font-light"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all font-light"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Paid By
                    </label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all font-light"
                    >
                      {group.members.map(memberId => (
                        <option key={memberId} value={memberId}>
                          {getUserName(memberId)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Split Scheme
                    </label>
                    <div className="flex bg-secondary p-1 rounded-xl border border-border/30">
                      <button
                        type="button"
                        onClick={() => { setSplitType('EQUAL'); setCustomSplits({}); }}
                        className={`flex-grow py-1.5 text-xs font-bold rounded-lg ${splitType === 'EQUAL' ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
                      >
                        Equally
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSplitType('EXACT'); setCustomSplits({}); }}
                        className={`flex-grow py-1.5 text-xs font-bold rounded-lg ${splitType === 'EXACT' ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
                      >
                        Exact
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSplitType('PERCENT'); setCustomSplits({}); }}
                        className={`flex-grow py-1.5 text-xs font-bold rounded-lg ${splitType === 'PERCENT' ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Split Inputs */}
                {splitType !== 'EQUAL' && (
                  <div className="space-y-3 pt-3 border-t border-border/10">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Specify splits ({splitType === 'EXACT' ? '$' : '%'})
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {group.members.map(memberId => (
                        <div key={memberId} className="flex items-center justify-between gap-4">
                          <span className="text-sm font-light">{getUserName(memberId)}</span>
                          <div className="relative w-32">
                            <input
                              type="number"
                              step="any"
                              placeholder={splitType === 'EXACT' ? '0.00' : '0'}
                              value={customSplits[memberId] || ''}
                              onChange={(e) => setCustomSplits({ ...customSplits, [memberId]: e.target.value })}
                              className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-1.5 text-sm outline-none text-right font-light"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="premium-btn-attention w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md transition-colors hover:bg-primary-hover flex items-center justify-center gap-2 mt-4"
                >
                  <PlusCircle className="w-5 h-5" />
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
