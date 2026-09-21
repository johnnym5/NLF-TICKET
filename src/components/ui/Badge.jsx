import React from 'react';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  gold: 'bg-champagne-light text-champagne-text border-champagne-border',
  dark: 'bg-slate-900 text-slate-200 border-slate-700'
};

export default function Badge({ children, variant = 'pending', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
