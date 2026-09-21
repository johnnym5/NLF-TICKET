import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Twitter, Users } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';

export default function ViralReferralDrawer({ isOpen, onClose, ticketCode }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/ticket` : 'https://nlf2026.carnival.ng/ticket';
  const shareMessage = `Hey! I just got my Free Gate Pass for the National Livestock Festival 2026 in Abuja. Grab your free ticket here: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-8 pt-4 pb-12 animate-slideUp">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-sage-light text-sage-deep mx-auto flex items-center justify-center mb-4">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Invite your network</h3>
          <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
            Festivals are best shared. Send an official invitation to friends and family.
          </p>
        </div>

        <div className="space-y-3">
          <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank')}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#25D366] text-white font-bold text-sm shadow-md active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5 fill-current" /> Share via WhatsApp</div>
            <Badge variant="success" className="bg-white/20 border-none text-white">Direct</Badge>
          </button>

          <button onClick={handleCopyLink}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-slate-400" />}
              {copied ? 'Link Copied' : 'Copy Invitation Link'}
            </div>
            {copied && <Badge variant="success">Copied</Badge>}
          </button>

          <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank')}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3"><Twitter className="w-5 h-5 fill-current" /> Broadcast on X</div>
            <Badge variant="dark" className="border-slate-700 text-slate-400">#NLF2026</Badge>
          </button>
        </div>
      </div>
    </div>
  );
}
