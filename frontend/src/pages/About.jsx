import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, Database, Zap, Mail, Shield, GitBranch,
  ArrowLeft, ExternalLink, Layers, Globe, Clock
} from 'lucide-react';

const techStack = [
  {
    category: 'Frontend',
    icon: <Globe className="w-5 h-5" />,
    color: 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
    iconColor: 'text-sky-400',
    items: ['React 19', 'Vite', 'Tailwind CSS v4', 'Framer Motion', 'Recharts', 'Lucide Icons', 'React Router v6'],
  },
  {
    category: 'Backend',
    icon: <Server className="w-5 h-5" />,
    color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    items: ['Node.js', 'Express v5', 'JWT Authentication', 'Helmet', 'CORS', 'Rate Limiting', 'bcryptjs'],
  },
  {
    category: 'Database',
    icon: <Database className="w-5 h-5" />,
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
    iconColor: 'text-violet-400',
    items: ['MongoDB', 'Mongoose ODM', 'Compass (local dev)'],
  },
  {
    category: 'Real-time',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
    iconColor: 'text-yellow-400',
    items: ['Socket.io', 'Live expense sync', 'Instant settle-up broadcast'],
  },
  {
    category: 'Async Jobs',
    icon: <Clock className="w-5 h-5" />,
    color: 'from-rose-500/20 to-red-500/10 border-rose-500/30',
    iconColor: 'text-rose-400',
    items: ['Redis', 'BullMQ Queue', 'Nodemailer', 'Background email worker'],
  },
  {
    category: 'Architecture',
    icon: <Layers className="w-5 h-5" />,
    color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
    iconColor: 'text-orange-400',
    items: ['Route-Controller-Service pattern', 'Context API + custom hooks', 'Axios interceptors', 'JWT + localStorage'],
  },
];

const features = [
  { icon: <Shield className="w-4 h-4" />, text: 'JWT authentication with bcrypt password hashing' },
  { icon: <GitBranch className="w-4 h-4" />, text: 'Greedy transaction-minimizing settle-up algorithm' },
  { icon: <Zap className="w-4 h-4" />, text: 'Real-time updates via Socket.io across all group members' },
  { icon: <Mail className="w-4 h-4" />, text: 'Email invitations & debt reminder notifications via BullMQ + Nodemailer' },
  { icon: <Layers className="w-4 h-4" />, text: 'Equal, percentage, and exact expense splitting modes' },
  { icon: <Globe className="w-4 h-4" />, text: 'Invite links with unique codes for frictionless group joining' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-semibold mb-4">
          <Server className="w-4 h-4" />
          <span>Full-Stack Project</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          About{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">
            Splitter.
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          A production-grade, real-time expense splitting platform built from scratch.
          Demonstrates full-stack engineering — from async background jobs to live socket
          synchronization and a greedy debt-resolution algorithm.
        </p>
      </div>

      {/* Key Features */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-5">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/40"
            >
              <div className="text-primary mt-0.5 shrink-0">{f.icon}</div>
              <p className="text-sm text-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Grid */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-5">Tech Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techStack.map((t) => (
            <div
              key={t.category}
              className={`p-5 rounded-2xl bg-gradient-to-br border ${t.color}`}
            >
              <div className={`flex items-center gap-2 font-bold mb-3 ${t.iconColor}`}>
                {t.icon}
                <span>{t.category}</span>
              </div>
              <ul className="space-y-1.5">
                {t.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Algorithm callout */}
      <section className="mb-12 p-6 rounded-3xl bg-card border border-border/40">
        <h2 className="text-xl font-bold mb-3">⚡ The Settle-Up Algorithm</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Group expenses are processed into a net-balance map for each member. A greedy
          two-pointer approach then pairs the largest creditor with the largest debtor,
          settling each pair in a single transaction — guaranteeing the{' '}
          <span className="text-foreground font-semibold">minimum possible number of payments</span>{' '}
          to clear all debts. This is an O(n log n) solution that scales cleanly with group size.
        </p>
      </section>

      {/* Footer CTA */}
      <div className="text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-opacity"
        >
          Try Splitter <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}