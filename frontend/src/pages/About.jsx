import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, Database, Zap, Mail, Shield, GitBranch,
  ExternalLink, Layers, Globe, Clock
} from 'lucide-react';
import NavBar from '../components/NavBar';
import DashboardCard from '../components/DashboardCard';

const techStack = [
  {
    category: 'Frontend',
    icon: <Globe className="w-4 h-4 text-primary" />,
    items: ['React 19', 'Vite', 'Tailwind CSS v4', 'Framer Motion', 'Recharts', 'Lucide Icons', 'React Router v7'],
  },
  {
    category: 'Backend',
    icon: <Server className="w-4 h-4 text-primary" />,
    items: ['Node.js', 'Express v5', 'JWT Authentication', 'Helmet', 'CORS', 'Rate Limiting', 'bcryptjs'],
  },
  {
    category: 'Database',
    icon: <Database className="w-4 h-4 text-primary" />,
    items: ['MongoDB', 'Mongoose ODM', 'Compass (local dev)'],
  },
  {
    category: 'Real-time',
    icon: <Zap className="w-4 h-4 text-primary" />,
    items: ['Socket.io', 'Live expense sync', 'Instant settle-up broadcast'],
  },
  {
    category: 'Async Jobs',
    icon: <Clock className="w-4 h-4 text-primary" />,
    items: ['Redis', 'BullMQ Queue', 'Nodemailer', 'Background email worker'],
  },
  {
    category: 'Architecture',
    icon: <Layers className="w-4 h-4 text-primary" />,
    items: ['Route-Controller-Service pattern', 'Context API + custom hooks', 'Axios interceptors', 'JWT + localStorage'],
  },
];

const features = [
  { icon: <Shield className="w-4 h-4 text-primary" />, text: 'JWT authentication with bcrypt password hashing' },
  { icon: <GitBranch className="w-4 h-4 text-primary" />, text: 'Greedy transaction-minimizing settle-up algorithm' },
  { icon: <Zap className="w-4 h-4 text-primary" />, text: 'Real-time updates via Socket.io across all group members' },
  { icon: <Mail className="w-4 h-4 text-primary" />, text: 'Email invitations & debt reminder notifications via BullMQ + Nodemailer' },
  { icon: <Layers className="w-4 h-4 text-primary" />, text: 'Equal, percentage, and exact expense splitting modes' },
  { icon: <Globe className="w-4 h-4 text-primary" />, text: 'Invite links with unique codes for frictionless group joining' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12">
      <NavBar
        title="About Splitter."
        subtitle="Full-stack engineering architecture and tech stack overview."
      />

      {/* Hero Intro */}
      <DashboardCard className="p-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-wider text-primary mx-auto">
          <Server className="w-4 h-4" />
          <span>Production-Grade Architecture</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Built for Speed & Real-time Precision
        </h2>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed font-light">
          A production-grade, real-time expense splitting platform built from scratch. Demonstrates modern full-stack engineering — from BullMQ async background jobs to live socket synchronization and a greedy debt-resolution algorithm.
        </p>
      </DashboardCard>

      {/* Key Features Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-foreground">Key Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <DashboardCard key={i} delay={0.05 * i} className="p-4 flex flex-row items-center gap-3">
              <div className="shrink-0">{f.icon}</div>
              <p className="text-xs text-foreground font-medium">{f.text}</p>
            </DashboardCard>
          ))}
        </div>
      </div>

      {/* Tech Stack Clean Minimal Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-foreground">Technical Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techStack.map((t, idx) => (
            <DashboardCard
              key={t.category}
              delay={0.05 * idx}
              className="p-6 border border-border/70 bg-card h-[240px] flex flex-col justify-start gap-4"
            >
              <div className="flex items-center gap-2.5">
                {t.icon}
                <span className="text-base font-extrabold tracking-tight text-foreground">
                  {t.category}
                </span>
              </div>
              <ul className="space-y-2">
                {t.items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground font-normal flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          ))}
        </div>
      </div>

      {/* Algorithm Callout */}
      <DashboardCard className="p-6">
        <div className="flex items-center gap-2 text-primary font-bold text-base mb-2">
          <Zap className="w-5 h-5" />
          <h3 className="text-foreground font-black">The Settle-Up Algorithm</h3>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed font-light">
          Group expenses are aggregated into a net-balance map per member. A greedy two-pointer approach pairs the largest creditor with the largest debtor, resolving each pair in a single transaction — guaranteeing the{' '}
          <span className="text-foreground font-semibold">minimum possible number of payments</span> to clear all debts.
        </p>
      </DashboardCard>

      {/* CTA */}
      <div className="text-center pt-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="premium-btn-attention inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-xs shadow-[0_8px_20px_-4px_rgba(243,200,76,0.4)] dark:shadow-[0_8px_20px_-4px_rgba(121,166,23,0.4)] transition-transform hover:scale-105 cursor-pointer"
        >
          <span>Explore Dashboard</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}