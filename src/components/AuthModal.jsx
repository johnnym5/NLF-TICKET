import React, { useState } from 'react';
import { useAuth, TIER_LABELS, TIER_WRISTBANDS } from '../context/AuthContext';
import { X, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Crown } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, vipTier = 'REGULAR', onSuccess }) {
  const { signInWithGoogle, registerWithEmail, loginWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 500); // Matches slideDown animation duration
  };

  const isVip = vipTier && vipTier !== 'REGULAR';
  const assignedWristband = TIER_WRISTBANDS[vipTier] || TIER_WRISTBANDS.REGULAR;
  const tierName = TIER_LABELS[vipTier] || 'General Entry';

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle(vipTier, isVip ? 'vip_link' : 'direct');
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google authentication was interrupted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your email and a password.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Please enter your full name as you wish it to appear on your pass.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await registerWithEmail(
          email.trim(),
          password,
          fullName.trim(),
          vipTier,
          isVip ? 'vip_link' : 'direct'
        );
      } else {
        await loginWithEmail(email.trim(), password);
      }
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email already has an active pass. Switch below to sign in!');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please re-check your credentials.');
      } else {
        setError(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-500 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={handleClose}
    >
      <div 
        className={`relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-slate-300/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3),inset_0_2px_0_rgba(255,255,255,1)] p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom),1.5rem)] transition-all ${isClosing ? 'animate-slideDown' : 'animate-slideUp'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Background decorative pastel bloom */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sage-base/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-champagne-base/40 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VIP Recognition Banner if VIP query detected */}
        {isVip && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-champagne-base border-2 border-champagne-border text-champagne-text text-xs font-bold shadow-xs">
            <Crown className="w-3.5 h-3.5 text-champagne-text" />
            <span>Special Invitation: {tierName} Access</span>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
            {isSignUp ? 'Claim Your Official Free Pass' : 'Access Your Existing Pass'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {isSignUp 
              ? 'National Livestock Festival 2026 • Abuja'
              : 'Sign in to retrieve your scannable digital QR Gate Pass'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-status-duplicateBg border-2 border-status-duplicateBorder text-status-duplicateText text-xs flex items-start gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Google Authentication */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full min-h-[48px] flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-slate-300 bg-white/90 hover:bg-white text-slate-700 text-xs sm:text-sm font-bold shadow-sm hover:border-slate-400 hover:shadow-md transition-all active:translate-y-0.5 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-3 bg-white/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            or with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required={isSignUp}
                  placeholder="e.g. Dr. Aminu Bello"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-xs sm:text-sm bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-base focus:border-sage-deep transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-xs sm:text-sm bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-base focus:border-sage-deep transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-xs sm:text-sm bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-base focus:border-sage-deep transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sage-deep hover:bg-emerald-950 text-white text-xs sm:text-sm font-black border-2 border-emerald-950/40 shadow-3d-btn transition-all active:translate-y-0.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? 'Generate My Free Pass' : 'Sign In to My Pass'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {isSignUp ? (
            <p>
              Already have a ticket registered?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className="font-semibold text-sage-deep hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Need a new pass?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                className="font-semibold text-sage-deep hover:underline"
              >
                Claim Free Pass
              </button>
            </p>
          )}
        </div>

        {/* 100% Free Badge Footnote */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Entry is 100% Free • No Payment Required</span>
        </div>
      </div>
    </div>
  );
}
