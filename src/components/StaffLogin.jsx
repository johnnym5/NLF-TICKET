import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function StaffLogin({ title, subtitle, allowedEmails, onSuccess }) {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithEmail(email.trim(), password);

      const isAllowed = allowedEmails.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(user.email);
        }
        return user.email === pattern;
      });

      if (isAllowed) {
        if (onSuccess) onSuccess(user);
      } else {
        setError('Unauthorized Access: Your account does not have permission to access this console.');
        // We might want to sign them out here if they are not allowed
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid staff credentials. Please re-check your email and password.');
      } else {
        setError(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-14 px-4">
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border-2 border-slate-300/90 p-6 sm:p-8 shadow-[0_24px_50px_-10px_rgba(15,23,42,0.2),inset_0_2px_0_rgba(255,255,255,1)] text-center relative overflow-hidden">
        {/* Background decorative pastel bloom */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sage-base/30 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center mb-4 shadow-xs relative z-10">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className={`text-xl font-bold text-slate-900 font-sans tracking-tight relative z-10 ${!subtitle ? 'mb-6' : ''}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 mb-6 relative z-10">
            {subtitle}
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-status-duplicateBg border border-status-duplicateBorder text-status-duplicateText text-xs flex items-start gap-2 text-left relative z-10">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="steward@gcc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm bg-canvas-inset focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Secret Key / Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm bg-canvas-inset focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold shadow-card transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
