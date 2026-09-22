import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './views/LandingPage';
import DigitalPassView from './views/DigitalPassView';
import GatekeeperScanner from './views/GatekeeperScanner';
import AdminCommandConsole from './views/AdminCommandConsole';
import DiagnosticsConsole from './views/DiagnosticsConsole';
import PrivacyView from './views/PrivacyView';
import RegistryView from './views/RegistryView';
import ComplianceView from './views/ComplianceView';
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
    else if (route === 'privacy') path = '/privacy';
    else if (route === 'registry') path = '/registry';
    else if (route === 'compliance') path = '/compliance';

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
      else if (path === 'privacy') setCurrentRoute('privacy');
      else if (path === 'registry') setCurrentRoute('registry');
      else if (path === 'compliance') setCurrentRoute('compliance');

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

  const handleClaimPassClick = () => {
    if (currentUser) {
      navigateTo('pass');
    } else {
      setAuthModalOpen(true);
    }
  };

  const isAdmin = userRole === 'executive_admin';
  const isGatekeeper = userRole === 'gatekeeper' || userRole === 'gate_supervisor' || isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] relative overflow-hidden">
      {/* High-Fidelity Atmospheric Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute -inset-[20%] w-[140%] h-[140%] bg-cover bg-center animate-pan-zoom-blur opacity-30 grayscale-[20%] blur-[80px]"
          style={{ backgroundImage: `url('/festival-bg.jpg')` }}
        />
        {/* Subtle color wash to maintain legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-slate-50/40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          currentRoute={currentRoute}
          setCurrentRoute={navigateTo}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <main className="flex-1">
          {currentRoute === 'landing' && (
            <LandingPage onClaimPass={handleClaimPassClick} vipTier={vipTierHint} />
          )}

          {currentRoute === 'pass' && (
            <DigitalPassView onOpenAuth={() => setAuthModalOpen(true)} />
          )}

          {currentRoute === 'gatekeeper' && (
            <GatekeeperScanner />
          )}

          {currentRoute === 'admin' && (
            <AdminCommandConsole onNavigate={navigateTo} />
          )}

          {currentRoute === 'diagnostics' && (
            <DiagnosticsConsole />
          )}

          {currentRoute === 'privacy' && (
            <PrivacyView />
          )}

          {currentRoute === 'registry' && (
            <RegistryView />
          )}

          {currentRoute === 'compliance' && (
            <ComplianceView />
          )}
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[8px] font-black tracking-widest uppercase">NLF</div>
                  <span className="font-black text-slate-900 uppercase tracking-tighter text-[10px]">National Livestock Festival 2026</span>
                </div>
                <p className="text-[9px] text-slate-500 font-medium max-w-sm leading-tight uppercase tracking-wider">
                  Operating in association with the Federal Government of Nigeria and Golden Camel and Cow (GCC).
                </p>
              </div>
              <div className="flex flex-col md:items-end justify-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Primary Venue</p>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Old Parade Ground, Abuja, FCT</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                © 2026 NLF Steering Committee. v2.0
              </p>
              <div className="flex items-center gap-4">
                 {[
                   { id: 'privacy', label: 'Privacy' },
                   { id: 'registry', label: 'Registry' },
                   { id: 'compliance', label: 'Compliance' }
                 ].map(item => (
                   <button
                     key={item.id}
                     onClick={() => navigateTo(item.id)}
                     className={`text-[8px] font-black uppercase tracking-widest transition-colors ${
                       currentRoute === item.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'
                     }`}
                   >
                     {item.label}
                   </button>
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
        onSuccess={(user) => {
          // The user object is passed back from AuthModal after successful login/signup
          const email = user?.email || '';
          if (email === 'admin@gcc.com') {
            navigateTo('admin');
          } else if (email.startsWith('qrscanner')) {
            navigateTo('gatekeeper');
          } else {
            // Regular users go to their pass
            navigateTo('pass');
          }
          setAuthModalOpen(false);
        }}
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
