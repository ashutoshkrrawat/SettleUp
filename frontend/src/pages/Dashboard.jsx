import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Calendar,
  X,
  CreditCard,
  Check,
  Zap,
  Layers,
  ArrowUpRight,
  BellRing,
  BarChart3,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import NavBar from '../components/NavBar';
import DashboardCard from '../components/DashboardCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    groups,
    expenses,
    createGroup,
    fetchGroups,
    pendingInvites = [],
    fetchPendingInvites,
    respondToInvite,
    pendingConfirmations = [],
    fetchPendingConfirmations,
    respondToSplitPayment,
    loading
  } = useData();

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
      if (fetchPendingInvites) fetchPendingInvites();
      if (fetchPendingConfirmations) fetchPendingConfirmations();
    }
  }, [currentUser]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Authentication check
  if (loading) {
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

  // Calculate Net balance across all groups
  let totalOwed = 0;
  let totalOwedToYou = 0;

  groups.forEach(group => {
    const userBalance = group.balances?.find(b => b.user === currentUser._id);
    if (userBalance) {
      if (userBalance.balance > 0) {
        totalOwedToYou += userBalance.balance;
      } else if (userBalance.balance < 0) {
        totalOwed += Math.abs(userBalance.balance);
      }
    }
  });

  const netBalance = totalOwedToYou - totalOwed;

  // Calculate total logged expenses
  const totalLoggedExpensesAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Recharts data for expenses per group
  const recentActivitiesData = groups.map((g) => {
    const groupExpenses = expenses.filter(e => e.group === g._id);
    const totalAmount = groupExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      name: g.name.length > 8 ? g.name.substring(0, 7) + '..' : g.name,
      Amount: totalAmount
    };
  });

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    const created = createGroup(newGroupName, newGroupDesc);
    toast.success(`Group "${created.name}" created!`);
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Floating Navbar */}
      <NavBar
        title={`Welcome back, ${currentUser.name?.split(' ')[0]}!`}
        subtitle="Here is your overview of group balances and recent activities."
        actionLabel="Create Group"
        actionIcon={Plus}
        onActionClick={() => setShowCreateModal(true)}
      />

      {/* Pending Group Invitations Banner */}
      {pendingInvites && pendingInvites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-primary/30 bg-primary/10 p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-primary">
            <BellRing className="w-5 h-5 animate-bounce" />
            <h3 className="font-extrabold text-base tracking-tight">
              Pending Group Invitations ({pendingInvites.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvites.map((inv) => (
              <div
                key={inv.groupId}
                className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground">{inv.groupName}</h4>
                  <p className="text-xs text-muted-foreground">
                    Invited by <span className="font-medium text-foreground">{inv.invitedBy}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => respondToInvite(inv.groupId, true)}
                    className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToInvite(inv.groupId, false)}
                    className="px-3.5 py-1.5 bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs rounded-full hover:scale-105 transition-transform cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending Payment Confirmations Banner */}
      {pendingConfirmations && pendingConfirmations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-amber-500/30 bg-amber-500/10 p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-extrabold text-base tracking-tight">
              Pending Payment Confirmations ({pendingConfirmations.length})
            </h3>
          </div>

          <div className="space-y-3">
            {pendingConfirmations.map((item, idx) => {
              const debtorName = item.debtor?.name || 'A user';
              const debtorId = item.debtor?._id || item.debtor;

              return (
                <div
                  key={idx}
                  className="bg-card border border-border/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {debtorName} claims they paid ${item.amount.toFixed(2)}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      For expense <span className="font-semibold text-foreground">"{item.expenseDescription}"</span> in <span className="font-semibold text-foreground">{item.groupName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => respondToSplitPayment(item.expenseId, debtorId, true)}
                      className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer"
                    >
                      Confirm ✓
                    </button>
                    <button
                      onClick={() => respondToSplitPayment(item.expenseId, debtorId, false)}
                      className="px-4 py-1.5 bg-destructive text-destructive-foreground font-bold text-xs rounded-full hover:scale-105 transition-transform cursor-pointer"
                    >
                      Reject ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 4 Minimal Stat Cards */}
      <div className="grid grid-cols-12 gap-4 md:gap-5">
        {/* Net Balance Card */}
        <DashboardCard
          delay={0.05}
          className="col-span-12 sm:col-span-6 lg:col-span-3 border border-border/70 bg-card p-6 flex flex-col justify-between h-[200px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border/60 text-muted-foreground">
              NET BALANCE
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-bold">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
            </h2>
            <p className="text-xs text-muted-foreground font-normal mt-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Optimized Settle Up engine</span>
            </p>
          </div>
        </DashboardCard>

        {/* You Are Owed Card */}
        <DashboardCard
          delay={0.1}
          className="col-span-12 sm:col-span-6 lg:col-span-3 border border-border/70 bg-card p-6 flex flex-col justify-between h-[200px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border/60 text-muted-foreground">
              YOU ARE OWED
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-emerald-500 font-bold">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-emerald-500">
              ${totalOwedToYou.toFixed(2)}
            </h2>
            <p className="text-xs text-muted-foreground font-normal mt-1">Outstanding group debts</p>
          </div>
        </DashboardCard>

        {/* You Owe Card */}
        <DashboardCard
          delay={0.15}
          className="col-span-12 sm:col-span-6 lg:col-span-3 border border-border/70 bg-card p-6 flex flex-col justify-between h-[200px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border/60 text-muted-foreground">
              YOU OWE
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-rose-500 font-bold">
              <TrendingDown className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-rose-500">
              ${totalOwed.toFixed(2)}
            </h2>
            <p className="text-xs text-muted-foreground font-normal mt-1">Pending settle-up obligations</p>
          </div>
        </DashboardCard>

        {/* Active Pools Card */}
        <DashboardCard
          delay={0.2}
          className="col-span-12 sm:col-span-6 lg:col-span-3 border border-border/70 bg-card p-6 flex flex-col justify-between h-[200px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border/60 text-muted-foreground">
              ACTIVE POOLS
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-bold">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              {groups.length}
            </h2>
            <p className="text-xs text-muted-foreground font-normal mt-1">Participating split groups</p>
          </div>
        </DashboardCard>
      </div>

      {/* Main Content Grid — Groups & Analytics */}
      <div className="grid grid-cols-12 gap-4 md:gap-5">
        {/* Groups List (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-foreground">
              Your Splitting Groups
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
              {groups.length} Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group, idx) => {
              const userBalance = group.balances?.find(b => b.user === currentUser._id)?.balance || 0;
              return (
                <DashboardCard
                  key={group._id}
                  delay={0.1 + idx * 0.05}
                  onClick={() => navigate(`/group/${group._id}`)}
                  className="cursor-pointer group h-[190px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                        {group.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-light">
                        {group.description || 'No description provided.'}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full shrink-0 border border-border/50">
                      <Users className="w-3.5 h-3.5" />
                      {group.members.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Your Balance
                      </span>
                      <span className={`text-base font-black ${userBalance > 0 ? 'text-emerald-500' : userBalance < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                        {userBalance > 0 ? '+' : ''}${userBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-muted-foreground flex items-center justify-center transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </DashboardCard>
              );
            })}
          </div>
        </div>

        {/* Analytics Widget (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <h2 className="text-lg font-black tracking-tight text-foreground">
            Expense Analytics
          </h2>
          <DashboardCard className="h-[415px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground block w-max mb-4">
                Pool Totals by Group
              </span>

              {totalLoggedExpensesAmount > 0 ? (
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentActivitiesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 'auto']}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(243, 200, 76, 0.08)' }}
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '1.25rem',
                          color: 'var(--foreground)',
                          fontFamily: 'Poppins',
                          fontSize: '12px'
                        }}
                      />
                      <Bar
                        dataKey="Amount"
                        fill="var(--primary)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[270px] w-full flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-secondary/30 border border-border/40">
                  <BarChart3 className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <h4 className="font-bold text-xs text-foreground">No Expenses Logged Yet</h4>
                  <p className="text-[11px] text-muted-foreground max-w-[200px] mt-1 font-light">
                    Add expenses to your group pools to visualize group totals.
                  </p>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between pt-3 border-t border-border/40">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Real-time Sync
              </span>
              <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                Socket.io Active
              </span>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
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
                    New Splitting Group
                  </h3>
                  <p className="text-xs text-muted-foreground font-normal">
                    Create a shared pool for trips or flatmates
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Goa Trip 🌴"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-sm text-foreground outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Brief details about expenses..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full h-24 bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-sm text-foreground outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="premium-btn-attention w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Group</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
