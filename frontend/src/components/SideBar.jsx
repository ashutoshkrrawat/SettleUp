import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  DollarSign,
  Info,
  LogOut,
  Moon,
  Sun,
  User,
  Users
} from 'lucide-react';

export default function SideBar() {
  const navigate = useNavigate();
  const { currentUser, theme, toggleTheme, logoutUser } = useData();

  const handleLogout = () => {
    logoutUser();
    navigate('/auth');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'How It Works', path: '/about', icon: Info },
  ];

  return (
    <aside className="w-full md:w-[280px] h-[80px] md:h-full shrink-0 rounded-[28px] md:rounded-[36px] bg-card border border-border/70 p-4 md:p-6 flex md:flex-col justify-between items-center z-20 shadow-[0_12px_38px_rgba(0,0,0,0.065)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      {/* Brand Header */}
      <div className="w-full flex items-center justify-between md:justify-start gap-3">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="bg-primary text-primary-foreground p-2.5 rounded-2xl shadow-[0_8px_20px_-6px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-6px_rgba(121,166,23,0.4)] flex items-center justify-center transition-transform group-hover:scale-105">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-black tracking-tight text-foreground block">
              Splitter.
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block -mt-1">
              Expense Engine
            </span>
          </div>
        </div>

        {/* Mobile theme toggle */}
        <button
          onClick={toggleTheme}
          className="md:hidden p-2 rounded-xl bg-secondary border border-border/50 text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="w-full hidden md:flex flex-col gap-2 my-6 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-6px_rgba(121,166,23,0.4)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Profile block */}
      <div className="w-full hidden md:flex flex-col gap-3 pt-4 border-t border-border/40">
        {currentUser ? (
          <div className="bg-secondary/70 border border-border/50 rounded-[28px] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 text-primary font-black text-sm flex items-center justify-center shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate text-foreground">
                  {currentUser.name || 'User'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-[1.02]"
          >
            Sign In
          </button>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Theme
          </span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
