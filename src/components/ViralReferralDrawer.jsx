import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Twitter, Users } from 'lucide-react';

export default function ViralReferralDrawer({ isOpen, onClose, ticketCode }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Safe share URL resolution
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/ticket` : 'https://nlf2026.carnival.ng/ticket';
  const shareMessage = `Hey! I just got my Free Gate Pass for the National Livestock Festival 2026 in Abuja. Grab your free ticket here before it fills up: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Safe fallback for sandboxed environments or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const text = `I just registered for the National Livestock Festival 2026 — The Golden Camel & Cow Carnival in Abuja! Entry is 100% Free:`;
    const hashtags = 'NLF2026,GoldenCamelAndCow,AbujaEvents,RenewedHope';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Semi-transparent backdrop with click-outside to close */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
      />

      {/* Slide-in bottom drawer */}
      <div 
        className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-t-3xl border-t-2 border-x-2 border-slate-300/90 shadow-[0_-20px_50px_rgba(15,23,42,0.25),inset_0_2px_0_rgba(255,255,255,1)] p-6 pb-8 pointer-events-auto transform transition-all duration-500 ease-out translate-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Directive Title */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-sage-base text-sage-deep mx-auto flex items-center justify-center mb-2 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-sans tracking-tight">
            The More The Merrier!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
            Carnivals are best experienced together. Invite your family and friends before free entry allocation is filled!
          </p>
        </div>

        {/* Action Share Grid */}
        <div className="space-y-2.5 mt-5">
          {/* 1-Click WhatsApp Share */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs sm:text-sm shadow-card transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Share via WhatsApp</span>
            </div>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
              1-Click Send
            </span>
          </button>

          {/* Copy Link Button with Tooltip Feedback */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-canvas-inset hover:bg-slate-200/70 border border-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-500" />
              )}
              <span>{copied ? 'Invite Link Copied to Clipboard!' : 'Copy Direct Free Pass Link'}</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
              copied ? 'bg-status-successBg text-status-successText' : 'bg-white text-slate-600 border border-slate-200'
            }`}>
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>

          {/* X (Twitter) Share Button */}
          <button
            onClick={handleTwitterShare}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-black hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm shadow-card transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <Twitter className="w-4 h-4 fill-white" />
              <span>Broadcast on X (Twitter)</span>
            </div>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
              #NLF2026
            </span>
          </button>
        </div>

        {/* Subtle Footnote */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Continue to Digital Pass →
          </button>
        </div>
      </div>
    </div>
  );
}
