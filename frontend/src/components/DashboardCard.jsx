import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DashboardCard({ children, className = '', delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -5 }}
      className={cn(
        "rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_12px_38px_rgba(0,0,0,0.065)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_24px_55px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.40)] flex flex-col justify-between",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
