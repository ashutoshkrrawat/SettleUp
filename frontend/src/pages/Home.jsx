import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import { Sparkles, ArrowRight, DollarSign, Users, Activity, CheckCircle, Moon, Sun } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useMockData();

  return (
    <div className="relative min-height-screen flex flex-col justify-between overflow-x-hidden">
      {/* Top Navigation */}
      <header className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-primary p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-background" />
          </div>
          <span className="text-xl font-bold tracking-tight">Splitter.</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-secondary border border-border/40 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2.5 bg-foreground text-background rounded-xl hover:opacity-90 font-bold transition-opacity"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary-foreground font-bold mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Real-time Expense Splitting</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          Split bills, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
            settle debts easily.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 font-light">
          A gorgeous, developer-first platform utilizing greedy transaction-minimizing algorithms to make group finances effortless. Settle up in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={() => navigate('/auth')}
            className="premium-btn-attention px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-card text-foreground rounded-2xl border border-border hover:bg-secondary font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Demo Sandbox
          </button>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
          <div className="bg-card border border-border/40 p-8 rounded-3xl text-left shadow-sm flex flex-col justify-between">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Multi-User Groups</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Organize trips, dinner outings, or shared flat apartments with instant invitations and link sharing.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border/40 p-8 rounded-3xl text-left shadow-sm flex flex-col justify-between">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Greedy Settle-Up</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our algorithm processes all group debts and resolves them with the absolute minimum number of payments.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border/40 p-8 rounded-3xl text-left shadow-sm flex flex-col justify-between">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Equal/Percent/Exact</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Choose custom exact shares or percentage distributions. Cents rounding discrepancies are resolved automatically.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/10">
        <p>© 2026 Splitter. Designed with premium aesthetics.</p>
      </footer>
    </div>
  );
}