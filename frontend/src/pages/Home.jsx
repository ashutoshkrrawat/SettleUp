import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Sparkles, ArrowRight, DollarSign, Users, Activity, CheckCircle, Moon, Sun, Layers } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useData();

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Shell */}
      <header className="h-[74px] shrink-0 rounded-[28px] md:rounded-[36px] bg-card border border-border/70 shadow-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-primary text-primary-foreground p-2.5 rounded-2xl shadow-[0_8px_20px_-6px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-6px_rgba(121,166,23,0.4)] flex items-center justify-center">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">Splitter.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="premium-btn-attention h-11 px-5 rounded-full bg-primary text-primary-foreground font-bold text-xs md:text-sm shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-[1.02] cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center px-4 py-8 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Real-time Expense Splitting</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-foreground">
          Split bills, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
            settle debts effortlessly.
          </span>
        </h1>

        <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-light leading-relaxed">
          A developer-first platform utilizing greedy transaction-minimizing algorithms to make group finances transparent. Settle up in real-time with instant Socket.io sync.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => navigate('/auth')}
            className="premium-btn-attention h-12 px-8 bg-primary text-primary-foreground rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/about')}
            className="h-12 px-8 bg-card text-foreground rounded-full border border-border/70 hover:bg-secondary font-bold text-sm transition-transform hover:scale-[1.02] cursor-pointer"
          >
            See How It Works
          </button>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl pt-8">
          <DashboardCard delay={0.1} className="text-left h-[220px]">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4 font-bold">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">Multi-User Groups</h3>
              <p className="text-muted-foreground text-xs leading-relaxed font-light">
                Organize trips, flatmates, or dinner outings with instant invitations and shareable link access.
              </p>
            </div>
          </DashboardCard>

          <DashboardCard delay={0.15} className="text-left h-[220px]">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-4 font-bold">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">Greedy Settle-Up</h3>
              <p className="text-muted-foreground text-xs leading-relaxed font-light">
                Our algorithm processes all group balances and resolves them into the absolute minimum payments.
              </p>
            </div>
          </DashboardCard>

          <DashboardCard delay={0.2} className="text-left h-[220px]">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mb-4 font-bold">
              <CheckCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">Equal/Percent/Exact</h3>
              <p className="text-muted-foreground text-xs leading-relaxed font-light">
                Choose custom exact shares or percentage splits. Cent rounding discrepancies are auto-calculated.
              </p>
            </div>
          </DashboardCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/40">
        <p>© 2025 Splitter. Built with Node.js, React, MongoDB & Socket.io.</p>
      </footer>
    </div>
  );
}