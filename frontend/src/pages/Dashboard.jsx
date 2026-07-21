import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Users,
  LogOut,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    groups,
    expenses,
    theme,
    toggleTheme,
    logoutMockUser,
    createGroup
  } = useMockData();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Authentication check
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

  // Recharts data for expenses per day/group
  const recentActivitiesData = groups.map((g, idx) => {
    const groupExpenses = expenses.filter(e => e.group === g._id);
    const totalAmount = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      name: g.name.substring(0, 8) + '..',
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

  const handleLogout = () => {
    logoutMockUser();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card border-r border-border/40 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-primary p-2.5 rounded-xl shadow-md flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-background" />
            </div>
            <span className="text-xl font-bold tracking-tight">Splitter.</span>
          </div>

          {/* User Profile Info */}
          <div className="bg-secondary/50 border border-border/20 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary-foreground">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm truncate">{currentUser.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-secondary text-primary font-bold rounded-xl transition-all"
            >
              <CreditCard className="w-5 h-5" />
              <span>Groups Dashboard</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-4 pt-6 border-t border-border/30">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-xl transition-all font-bold"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                <span>Light Mode</span>
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-destructive font-bold hover:bg-destructive/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-grow p-6 md:p-8 space-y-8 overflow-y-auto max-h-screen">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-muted-foreground font-light">
              Here is your overview of group balances and recent activities.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="premium-btn-attention px-5 py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Group</span>
          </button>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Net Balance Card */}
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Net Balance
            </span>
            <div className="my-4">
              <h2 className={`text-3xl font-black tracking-tight ${netBalance >= 0 ? 'text-primary' : 'text-orange-500'}`}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Optimized Settle Up active</span>
            </div>
          </div>

          {/* You Are Owed Card */}
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              You Are Owed
            </span>
            <div className="my-4 flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight text-primary">
                ${totalOwedToYou.toFixed(2)}
              </h2>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Collected from outstanding group debt</p>
          </div>

          {/* You Owe Card */}
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              You Owe
            </span>
            <div className="my-4 flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight text-orange-500">
                ${totalOwed.toFixed(2)}
              </h2>
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground">Pending settle-ups to group mates</p>
          </div>

          {/* Total Groups Card */}
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Groups
            </span>
            <div className="my-4 flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight">
                {groups.length}
              </h2>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Participating in split pools</p>
          </div>
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Groups List Pane (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Your Groups</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map(group => {
                const userBalance = group.balances?.find(b => b.user === currentUser._id)?.balance || 0;
                return (
                  <motion.div
                    whileHover={{ y: -4 }}
                    key={group._id}
                    onClick={() => navigate(`/group/${group._id}`)}
                    className="bg-card border border-border/40 hover:border-primary/40 p-5 rounded-2xl shadow-sm cursor-pointer transition-all flex flex-col justify-between h-44"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-base truncate pr-2">{group.name}</h4>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                          <Users className="w-3 h-3" />
                          {group.members.length}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 font-light">
                        {group.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/10 pt-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Your Balance
                        </span>
                        <span className={`text-sm font-bold ${userBalance > 0 ? 'text-primary' : userBalance < 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          {userBalance > 0 ? '+' : ''}${userBalance.toFixed(2)}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Expense Analytics Pane (1 Col wide) */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Expense Analytics</h3>
            <div className="bg-card border border-border/40 p-5 rounded-3xl shadow-sm h-80 flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground block mb-4 uppercase tracking-wider">
                Pool Totals by Group
              </span>
              <div className="flex-grow h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentActivitiesData}>
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(var(--primary), 0.05)' }} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem', fontFamily: 'Poppins' }} />
                    <Bar dataKey="Amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border/10">
                <Calendar className="w-3.5 h-3.5" />
                <span>Calculated in real-time</span>
              </div>
            </div>
          </div>

        </div>
      </main>

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/45 w-full max-w-md p-6 rounded-3xl shadow-xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">New Splitting Group</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-secondary rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Goa Trip 🌴"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all font-light"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Brief details about expenses..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full h-24 bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all font-light resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="premium-btn-attention w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md transition-colors hover:bg-primary-hover flex items-center justify-center gap-2 mt-4"
                >
                  <Plus className="w-5 h-5" />
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
