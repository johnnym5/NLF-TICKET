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

    try {
      const user = await loginWithEmail(email.trim(), password);

      // Fetch user role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role || 'user';
      const isStaffRole = ['admin', 'gatekeeper', 'security'].includes(role);

      const isAllowedEmail = allowedEmails.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(user.email);
        }
        return user.email === pattern;
      });

      if (isStaffRole || isAllowedEmail || user.email === 'admin@gcc.com') {
        if (onSuccess) onSuccess(user);
      } else {
        setError('Unauthorized Access Denied. Staff credentials required.');
      }
    } catch (err) {
      console.error('Staff login error:', err);
      setError('Invalid staff credentials or password.');
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
