import React, { useState } from 'react';
import { useAuth, TIER_LABELS } from '../context/AuthContext';
import { X, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';

export default function AuthModal({ isOpen, onClose, vipTier = 'REGULAR', invitationId = null, onSuccess }) {
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
    }, 500);
  };

  const isVip = vipTier && vipTier !== 'REGULAR';
  const tierName = TIER_LABELS[vipTier] || 'General Entry';

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      const user = await signInWithGoogle(invitationId);
      if (onSuccess) onSuccess(user);
      handleClose();
    } catch (err) {
      setError(err.message || 'Authentication interrupted.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) return setError('Email and password required.');
    if (isSignUp && !fullName.trim()) return setError('Please enter your full name.');
    if (password.length < 6) return setError('Minimum 6 characters required.');

    try {
      setLoading(true);
      let user;
      if (isSignUp) {
        user = await registerWithEmail(email.trim(), password, fullName.trim(), invitationId);
      } else {
        user = await loginWithEmail(email.trim(), password);
      }
      if (onSuccess) onSuccess(user);
      handleClose();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Please sign in.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
    >
      <div 
        className={`relative w-full max-w-[420px] bg-white rounded-2xl shadow-premium overflow-hidden transition-all duration-500 ${isClosing ? 'translate-y-8 opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-10 h-10 rounded-xl bg-sage-light flex items-center justify-center text-sage-deep">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {isVip && (
            <Badge variant="gold" className="mb-4">👑 {tierName} Invitation Active</Badge>
          )}

          <h2 className="text-2xl font-black text-slate-900 mb-1">
            {isSignUp ? 'Create your event pass' : 'Access your existing pass'}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            National Livestock Festival 2026 • Official Registry
          </p>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="secondary"
            className="w-full justify-center"
            onClick={handleGoogleAuth}
            loading={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400 bg-white px-4">Secure email access</span>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                label="Full Name"
                placeholder="Attendee Name"
                icon={User}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Secret Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" className="w-full" loading={loading}>
              {isSignUp ? 'Generate My Pass' : 'Unlock My Pass'}
            </Button>
          </form>

          <p className="text-center text-xs font-bold text-slate-500 pt-2">
            {isSignUp ? 'Already registered?' : 'Need a new pass?'}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-sage-deep hover:underline ml-1"
            >
              {isSignUp ? 'Sign in here' : 'Register for free'}
            </button>
          </p>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">100% Secure Official Admission</span>
        </div>
      </div>
    </div>
  );
}
