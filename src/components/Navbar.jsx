import React from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, ShieldCheck, BarChart3, LogOut, Info, Cpu } from 'lucide-react';

export default function Navbar({ currentRoute, setCurrentRoute, onOpenAuth }) {
  const { currentUser, attendeeRecord, logout } = useAuth();

  const navItems = [
    { id: 'landing', label: 'Festival Info', icon: Info },
    { id: 'pass', label: 'My Gate Pass', icon: QrCode },
    { id: 'gatekeeper', label: 'Gate Scanner', icon: ShieldCheck, badge: 'Gate Staff' },
    { id: 'admin', label: 'Admin Hub', icon: BarChart3, badge: 'Executive' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b-2 border-slate-300/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Brand Logo & Sub-brand */}
          <div 
            onClick={() => setCurrentRoute('landing')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-sage-base to-champagne-base flex items-center justify-center border border-sage-border shadow-xs group-hover:scale-105 transition-transform">
              <span className="text-[10px] md:text-xs font-black text-sage-deep tracking-wider select-none font-sans">NLF</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-sage-deep tracking-tight font-sans">
                  NLF 2026
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-champagne-base text-champagne-text border border-champagne-border hidden sm:inline-block">
                  Abuja
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block -mt-0.5">
                The Golden Camel & Cow Carnival
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 mx-4">
            {navItems.map((item) => {
              // Permission check for staff items
              const isAdmin = currentUser?.email === 'admin@gcc.com';
              const isGatekeeper = isAdmin || (currentUser?.email && /^qrscanner.*@gcc.com$/.test(currentUser.email));

              if (item.id === 'admin' && !isAdmin) return null;
              if (item.id === 'gatekeeper' && !isGatekeeper) return null;
              if (item.id === 'pass' && !currentUser) return null;

              const Icon = item.icon;
              const isActive = currentRoute === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentRoute(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-sage-base text-sage-deep border-sage-border shadow-md -translate-y-0.5'
                      : 'bg-white/60 hover:bg-white/90 text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 ml-0.5 shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right-side user controls — visible on ALL screen sizes */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* User avatar chip — tapping goes to pass */}
                <div 
                  onClick={() => setCurrentRoute('pass')}
                  className="cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border-2 border-slate-300 shadow-sm hover:border-sage-border hover:shadow-md transition-all active:translate-y-0.5"
                >
                  <div className="w-6 h-6 rounded-full bg-sage-base border border-sage-border flex items-center justify-center text-sage-deep text-xs font-bold shadow-xs">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </p>
                    {attendeeRecord?.ticketCode && (
                      <p className="text-[10px] font-mono text-sage-deep font-bold">
                        {attendeeRecord.ticketCode}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-slate-300 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-xs transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:translate-y-0.5"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 sm:px-5 py-2 rounded-xl bg-sage-deep text-white text-xs font-extrabold border-2 border-emerald-950/40 shadow-3d-btn hover:bg-emerald-950 transition-all hover:-translate-y-0.5 active:translate-y-0.5 min-h-[44px]"
              >
                <span className="sm:hidden">Free Pass</span>
                <span className="hidden sm:inline">Claim Free Pass →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
