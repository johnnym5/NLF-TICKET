import React from 'react';

export default function Input({ label, error, icon: Icon, className = '', ...props }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sage-deep transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:border-sage-deep focus:ring-4 focus:ring-sage-deep/5 transition-all placeholder:text-slate-400 ${error ? 'border-rose-500 focus:ring-rose-500/5' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-rose-600 ml-1">{error}</p>}
    </div>
  );
}
