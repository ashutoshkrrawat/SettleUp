import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Moon, Sun, ArrowLeft, Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { theme, toggleTheme, loginUser, registerUser } = useData();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password || (!isLogin && !name)) {
      const msg = 'Please fill in all required fields';
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      let user;
      if (isLogin) {
        user = await loginUser(email, password);
      } else {
        user = await registerUser(name, email, password);
      }
      toast.success(`Welcome back, ${user.name}!`);

      const searchParams = new URLSearchParams(window.location.search);
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const serverMsg = error.response?.data?.message || error.message || 'Authentication failed. Invalid email or password.';
      setAuthError(serverMsg);
      toast.error(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden p-3 md:p-6">
      {/* Top Header */}
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
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-secondary border border-border rounded-full hover:bg-secondary/80 text-xs font-bold text-foreground transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-card border border-border/70 p-8 rounded-[32px] shadow-[0_12px_38px_rgba(0,0,0,0.065)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] relative overflow-hidden space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLogin ? 'Welcome Back' : 'Create Account'}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </h2>
            <p className="text-xs text-muted-foreground font-light mt-1">
              {isLogin ? 'Enter your details to access your dashboard' : 'Join Splitter today and split expenses smoothly'}
            </p>
          </div>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-500 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{authError}</div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary border border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="premium-btn-attention w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Get Started'}</span>
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground font-light">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setAuthError('');
                setIsLogin(!isLogin);
              }}
              className="text-primary font-bold hover:underline ml-1 cursor-pointer"
            >
              {isLogin ? 'Create one' : 'Sign In'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        <p>© 2025 Splitter. Secure JWT Authentication.</p>
      </footer>
    </div>
  );
}
