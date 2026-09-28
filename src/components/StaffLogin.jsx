import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

export default function StaffLogin({ title, subtitle, allowedEmails = [], onSuccess }) {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      let user = null;

      // 1. Attempt login
      try {
        user = await loginWithEmail(cleanEmail, password);
      } catch (loginErr) {
        const errMsg = (loginErr.message || '').toLowerCase();

        // 2. If user is not found or invalid credentials on admin/staff emails, attempt initial account provisioning
        const isAllowedStaffEmail = allowedEmails.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(cleanEmail);
          }
          return cleanEmail === pattern;
        }) || cleanEmail === 'admin@gcc.com' || cleanEmail === 'admin@livestockcarnival.ng';

        if (isAllowedStaffEmail && (errMsg.includes('invalid') || errMsg.includes('credentials') || errMsg.includes('not found'))) {
          const derivedRole = (cleanEmail === 'admin@gcc.com' || cleanEmail === 'admin@livestockcarnival.ng') ? 'admin' : 'gatekeeper';

          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: cleanEmail === 'admin@livestockcarnival.ng' ? 'Executive Admin' : 'Staff Personnel'
              }
            }
          });

          if (signUpErr) {
            if (signUpErr.message?.includes('seconds')) {
              throw new Error('Please wait ' + (signUpErr.message.match(/\d+/) || ['30'])[0] + ' seconds before retrying.');
            }
            throw new Error('Invalid credentials or account unconfirmed. Please check your password.');
          }

          user = signUpData.user;

          if (user) {
            await supabase.from('profiles').upsert({
              id: user.id,
              email: cleanEmail,
              full_name: cleanEmail === 'admin@livestockcarnival.ng' ? 'Executive Admin' : 'Staff Personnel',
              role: derivedRole
            });
          }
        } else if (errMsg.includes('seconds')) {
          throw new Error('Security rate limit active. Please wait a few seconds before trying again.');
        } else {
          throw new Error('Invalid staff credentials or password. Please try again.');
        }
      }

      // Fetch profile role from Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role || 'user';
      const isStaffRole = ['admin', 'gatekeeper', 'security'].includes(role);

      const isAllowed = isStaffRole ||
        cleanEmail === 'admin@gcc.com' ||
        cleanEmail === 'admin@livestockcarnival.ng' ||
        allowedEmails.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(cleanEmail);
          }
          return cleanEmail === pattern;
        });

      if (isAllowed) {
        if (onSuccess) onSuccess(user);
      } else {
        setError('Unauthorized Access Denied. Personnel credentials required.');
      }
    } catch (err) {
      console.error('Staff login error:', err);
      setError(err.message || 'Invalid staff credentials or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-24 px-4">
      <div className="premium-card p-10 text-center relative overflow-hidden">
        <img
          src="/logo.jpeg"
          alt="Livestock Carnival Logo"
          className="w-12 h-12 rounded-2xl object-cover mx-auto shadow-md mb-6"
        />

        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">
          {title}
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
          {subtitle || 'Secure Personnel Verification'}
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Staff ID / Email"
            type="email"
            required
            placeholder="Personnel ID"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Security Passkey"
            type="password"
            required
            placeholder="••••••••"
            icon={KeyRound}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" className="w-full h-12" loading={loading} icon={ArrowRight}>
            Log In to Terminal
          </Button>
        </form>
      </div>
    </div>
  );
}
