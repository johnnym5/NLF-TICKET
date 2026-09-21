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
  const { currentUser } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [vipTier, setVipTier] = useState('REGULAR');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Unified routing handler that updates state and URL
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

  // Initialize Route & VIP Query Parameter Handling
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');

      if (path === 'ticket' || path === '') setCurrentRoute('landing');
      else if (path === 'VIP') setCurrentRoute('pass');
      else if (path === 'qrscanner') setCurrentRoute('gatekeeper');
      else if (path === 'admin') setCurrentRoute('admin');
      else if (path === 'diagnostics') setCurrentRoute('diagnostics');

      const params = new URLSearchParams(window.location.search);
      const vipParam = (params.get('vip') || '').toLowerCase();
      if (vipParam === 'silver') setVipTier('VIP_SILVER');
      else if (vipParam === 'gold') setVipTier('VIP_GOLD');
      else if (vipParam === 'platinum') setVipTier('VIP_PLATINUM');
      else setVipTier('REGULAR');
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleAuthSuccess = () => {
    navigateTo('pass');
  };

  const handleClaimPassClick = () => {
    if (currentUser) {
      navigateTo('pass');
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-900 font-sans selection:bg-sage-base selection:text-sage-deep relative">
      {/* Animated 3D Ken Burns Moving Parallax Background — 90% Dreamy Blur & Almost Imperceptible Drift */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute -inset-[20%] w-[140%] h-[140%] bg-cover bg-center animate-slow-3d-bg blur-[32px] scale-110 opacity-75"
          style={{ backgroundImage: `url('/festival-bg.jpg')` }}
        />
        {/* 90% Frosted glass veil overlay ensuring cards and text pop with deep contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBFBFA]/90 via-[#FBFBFA]/86 to-[#FBFBFA]/92 backdrop-blur-3xl" />
      </div>

      {/* Executive Navigation */}
      <div className="relative z-20">
        <Navbar
          currentRoute={currentRoute}
          setCurrentRoute={navigateTo}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      </div>

      {/* Main Routed View */}
      <main className="flex-1 relative z-10">
        {currentRoute === 'landing' && (
          <LandingPage
            onClaimPass={handleClaimPassClick}
            vipTier={vipTier}
            onSelectTier={(t) => setVipTier(t)}
          />
        )}

        {currentRoute === 'pass' && (
          <DigitalPassView
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentRoute === 'gatekeeper' && (
          <GatekeeperScanner />
        )}

        {currentRoute === 'admin' && (
          <AdminCommandConsole onNavigate={navigateTo} />
        )}

        {currentRoute === 'diagnostics' && (
          currentUser?.email === 'admin@gcc.com' ? <DiagnosticsConsole /> : <LandingPage onClaimPass={handleClaimPassClick} vipTier={vipTier} onSelectTier={(t) => setVipTier(t)} />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        vipTier={vipTier}
        onSuccess={handleAuthSuccess}
      />

      {/* Official Executive Footer */}
      <footer className="relative z-10 bg-white/85 backdrop-blur-xl border-t-2 border-slate-300/80 py-10 mt-auto shadow-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-base border border-sage-border flex items-center justify-center text-sage-deep font-extrabold text-xs tracking-wider font-sans shadow-xs">
                NLF
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  National Livestock Festival 2026
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  The Golden Camel and Cow Carnival • “Everything camel, everything healthy.”
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-xs font-semibold text-slate-700">
                Federal Government of Nigeria in collaboration with Golden Camel and Cow (GCC)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Operating in line with the Renewed Hope Agenda • Old Parade Ground, Abuja
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© 2026 National Livestock Festival Steering Committee. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigateTo('landing')} className="hover:underline">Home</button>
              <button onClick={() => navigateTo('pass')} className="hover:underline">Digital Pass</button>
              <button onClick={() => navigateTo('gatekeeper')} className="hover:underline">Gate Verification</button>
              <button onClick={() => navigateTo('admin')} className="hover:underline">Command Hub</button>
            </div>
          </div>
        </div>
      </footer>
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
