import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Sparkles, Moon, Sun, ArrowLeft, Plus, Users, ShieldCheck } from 'lucide-react';

export default function NavBar({ title, subtitle, onActionClick, actionLabel, actionIcon: ActionIcon }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, theme, toggleTheme } = useData();

  const isHome = location.pathname === '/';
  const showBack = location.pathname.startsWith('/group/') || location.pathname === '/about';

  return (
    <header className="h-[74px] shrink-0 rounded-[28px] md:rounded-[36px] bg-card border border-border/70 shadow-[0_15px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] px-6 flex items-center justify-between z-10 transition-all duration-300">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            title="Go to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] md:text-[21px] font-black tracking-tight text-foreground">
              {title || (currentUser ? `Welcome back, ${currentUser.name?.split(' ')[0]}!` : 'Splitter.')}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground hidden sm:block font-normal -mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onActionClick && actionLabel && (
          <button
            onClick={onActionClick}
            className="premium-btn-attention h-11 px-5 rounded-full bg-primary text-primary-foreground font-bold text-xs md:text-sm shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            <span>{actionLabel}</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="w-11 h-11 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
