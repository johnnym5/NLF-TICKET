import React from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, ShieldCheck, BarChart3, LogOut, Info, User, Menu, X } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';

export default function Navbar({ currentRoute, setCurrentRoute, onOpenAuth }) {
  const { currentUser, userRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isAdmin = userRole === 'executive_admin';
  const isGatekeeper = userRole === 'gatekeeper' || userRole === 'gate_supervisor' || isAdmin;

  const navItems = [
    { id: 'landing', label: 'Festival Info', icon: Info, public: true },
    { id: 'pass', label: 'My Gate Pass', icon: QrCode, auth: true },
    { id: 'gatekeeper', label: 'Gate Terminal', icon: ShieldCheck, role: isGatekeeper, badge: 'Staff' },
    { id: 'admin', label: 'Command Hub', icon: BarChart3, role: isAdmin, badge: 'Executive' },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.public) return true;
    if (item.auth && currentUser) return true;
    if (item.role) return true;
    return false;
  });

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            onClick={() => setCurrentRoute('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-sage-deep flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="text-[10px] font-black tracking-widest uppercase">NLF</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-sm text-slate-900 uppercase tracking-tighter">Festival 2026</span>
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] -mt-0.5">Abuja Carnival</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentRoute(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                    isActive ? 'text-sage-deep bg-sage-light/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && <Badge variant={item.id === 'admin' ? 'dark' : 'pending'} className="ml-1 scale-75 origin-left">{item.badge}</Badge>}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setCurrentRoute('pass')}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                   <div className="w-5 h-5 rounded-full bg-sage-deep text-white flex items-center justify-center text-[10px] font-bold">
                      {currentUser.displayName?.charAt(0) || 'U'}
                   </div>
                   <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{currentUser.displayName?.split(' ')[0] || 'User'}</span>
                </div>
                <Button variant="ghost" size="sm" icon={LogOut} onClick={logout} />
              </div>
            ) : (
              <Button size="sm" onClick={onOpenAuth}>Claim Free Pass</Button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-500 hover:text-slate-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-2 animate-fadeIn shadow-xl">
           {visibleItems.map((item) => (
             <button
                key={item.id}
                onClick={() => { setCurrentRoute(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${
                  currentRoute === item.id ? 'bg-sage-light/30 text-sage-deep' : 'text-slate-500'
                }`}
             >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
             </button>
           ))}
        </div>
      )}
    </header>
  );
}
