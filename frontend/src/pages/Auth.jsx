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
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
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
            onClick={() => navigate('/')}
            className="px-4 py-2.5 border border-border rounded-xl hover:bg-secondary font-bold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-card border border-border/45 p-8 rounded-3xl shadow-lg backdrop-blur-md relative overflow-hidden">
          {/* Subtle Accent Glow Inside Card */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary-foreground font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{isLogin ? 'Welcome Back' : 'Create Account'}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </h2>
            <p className="text-sm text-muted-foreground font-light">
              {isLogin ? 'Enter your details to access your dashboard' : 'Join Splitter today and split expenses smoothly'}
            </p>
          </div>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-start gap-3 text-destructive"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                {authError}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-12 pr-4 py-3 outline-none transition-all font-light"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-12 pr-4 py-3 outline-none transition-all font-light"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-12 pr-4 py-3 outline-none transition-all font-light"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="premium-btn-attention w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl mt-6 shadow-md transition-colors hover:bg-primary-hover flex items-center justify-center gap-2"
            >
              <span>{isLogin ? 'Sign In' : 'Get Started'}</span>
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm font-light text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setAuthError('');
                setIsLogin(!isLogin);
              }}
              className="text-primary font-bold hover:underline ml-1"
            >
              {isLogin ? 'Create one' : 'Sign In'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/10">
        <p>© 2026 Splitter. Secure authentication.</p>
      </footer>
    </div>
  );
}
