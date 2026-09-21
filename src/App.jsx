import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './views/LandingPage';
import DigitalPassView from './views/DigitalPassView';
import GatekeeperScanner from './views/GatekeeperScanner';
import AdminCommandConsole from './views/AdminCommandConsole';
import DiagnosticsConsole from './views/DiagnosticsConsole';
import AuthModal from './components/AuthModal';

function AppContent() {
  const { currentUser, userRole } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [invitationId, setInvitationId] = useState(null);
  const [vipTierHint, setVipTierHint] = useState('REGULAR');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Unified routing handler
  const navigateTo = (route) => {
    let path = '/';
    if (route === 'landing') path = '/ticket';
    else if (route === 'pass') path = '/VIP';
    else if (route === 'gatekeeper') path = '/qrscanner';
    else if (route === 'admin') path = '/admin';
    else if (route === 'diagnostics') path = '/diagnostics';

    window.history.pushState({ route }, '', path);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path === 'ticket' || path === '') setCurrentRoute('landing');
      else if (path === 'VIP') setCurrentRoute('pass');
      else if (path === 'qrscanner') setCurrentRoute('gatekeeper');
      else if (path === 'admin') setCurrentRoute('admin');
      else if (path === 'diagnostics') setCurrentRoute('diagnostics');

      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite');
      if (invite) setInvitationId(invite);

      const vipParam = (params.get('vip') || '').toLowerCase();
      if (vipParam === 'silver') setVipTierHint('VIP_SILVER');
      else if (vipParam === 'gold') setVipTierHint('VIP_GOLD');
      else if (vipParam === 'platinum') setVipTierHint('VIP_PLATINUM');
      else setVipTierHint('REGULAR');
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const isAdmin = userRole === 'executive_admin';
  const isGatekeeper = userRole === 'gatekeeper' || userRole === 'gate_supervisor' || isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] relative overflow-hidden">
      {/* Refined subtle background movement */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center animate-slow-3d-bg opacity-[0.03] grayscale contrast-125"
          style={{ backgroundImage: `url('/festival-bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FBFBFA] to-slate-50" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          currentRoute={currentRoute}
          setCurrentRoute={navigateTo}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <main className="flex-1">
          {currentRoute === 'landing' && (
            <LandingPage onClaimPass={() => setAuthModalOpen(true)} vipTier={vipTierHint} />
          )}

          {currentRoute === 'pass' && (
            <DigitalPassView onOpenAuth={() => setAuthModalOpen(true)} />
          )}

          {currentRoute === 'gatekeeper' && (
            isGatekeeper ? <GatekeeperScanner /> : <LandingPage onClaimPass={() => setAuthModalOpen(true)} vipTier={vipTierHint} />
          )}

          {currentRoute === 'admin' && (
            isAdmin ? <AdminCommandConsole onNavigate={navigateTo} /> : <LandingPage onClaimPass={() => setAuthModalOpen(true)} vipTier={vipTierHint} />
          )}

          {currentRoute === 'diagnostics' && (
            isAdmin ? <DiagnosticsConsole /> : <LandingPage onClaimPass={() => setAuthModalOpen(true)} vipTier={vipTierHint} />
          )}
        </main>

        <footer className="bg-white border-t border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black tracking-widest uppercase">NLF</div>
                  <span className="font-black text-slate-900 uppercase tracking-tighter">National Livestock Festival 2026</span>
                </div>
                <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed uppercase tracking-widest">
                  Operating in association with the Federal Government of Nigeria and Golden Camel and Cow (GCC).
                </p>
              </div>
              <div className="flex flex-col md:items-end justify-center space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Venue</p>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Old Parade Ground, Abuja, FCT</p>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                © 2026 NLF Steering Committee. Final Release v2.0
              </p>
              <div className="flex items-center gap-6">
                 {['Privacy', 'Registry', 'Compliance'].map(item => (
                   <button key={item} className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">{item}</button>
                 ))}
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        vipTier={vipTierHint}
        invitationId={invitationId}
        onSuccess={() => navigateTo('pass')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
