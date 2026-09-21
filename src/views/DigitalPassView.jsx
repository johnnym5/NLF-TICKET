import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useAuth, TIER_LABELS, TIER_WRISTBANDS } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Calendar, 
  Share2, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Info
} from 'lucide-react';
import ViralReferralDrawer from '../components/ViralReferralDrawer';
import ScrollReveal from '../components/ScrollReveal';

export default function DigitalPassView({ onOpenAuth }) {
  const { currentUser, attendeeRecord, isNewRegistration, setIsNewRegistration } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const passRef = useRef(null);

  // Trigger confetti and viral drawer 1.5s after pass creation if newly registered
  useEffect(() => {
    if (isNewRegistration) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D8EADF', '#FEF3D6', '#1E4D38', '#FCE6A8']
        });
      } catch (e) {
        // Ignore confetti error
      }

      const timer = setTimeout(() => {
        setDrawerOpen(true);
        setIsNewRegistration(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isNewRegistration, setIsNewRegistration]);

  if (!currentUser && !attendeeRecord) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white/85 backdrop-blur-xl rounded-3xl border-2 border-slate-300/90 text-center shadow-[0_20px_45px_-8px_rgba(15,23,42,0.18),inset_0_1.5px_0_rgba(255,255,255,1)]">
        <div className="w-16 h-16 rounded-2xl bg-sage-base/90 text-sage-deep mx-auto flex items-center justify-center mb-4 border-2 border-sage-border shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">No Active Pass Found</h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-6 font-medium">
          Please sign in or claim your free gate pass to view your scannable digital credential.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-3.5 rounded-xl bg-sage-deep text-white text-xs sm:text-sm font-black border-2 border-emerald-950/40 shadow-3d-btn hover:bg-emerald-950 transition-all active:translate-y-0.5"
        >
          Claim Free Pass / Sign In →
        </button>
      </div>
    );
  }

  const record = attendeeRecord || {
    fullName: currentUser?.displayName || 'Distinguished Delegate',
    email: currentUser?.email || 'attendee@carnival.ng',
    ticketCode: 'GCC-2026-PENDING',
    tier: 'REGULAR',
    wristbandColor: 'Emerald Green',
    status: 'REGISTERED',
    checkedInAt: null,
    checkedInBy: null
  };

  const isCheckedIn = record.status === 'CHECKED_IN';
  const tierName = TIER_LABELS[record.tier] || 'General Entry';
  const wristband = record.wristbandColor || TIER_WRISTBANDS[record.tier] || 'Emerald Green';

  // Wristband visual theme mapping
  const getWristbandStyle = (tier) => {
    switch (tier) {
      case 'VIP_PLATINUM':
        return {
          badgeBg: 'bg-slate-900 text-indigo-300 border-slate-700',
          indicator: 'bg-indigo-400',
          bandBorder: 'border-indigo-400'
        };
      case 'VIP_GOLD':
        return {
          badgeBg: 'bg-champagne-base text-champagne-text border-champagne-border',
          indicator: 'bg-amber-500',
          bandBorder: 'border-amber-400'
        };
      case 'VIP_SILVER':
        return {
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
          indicator: 'bg-slate-400',
          bandBorder: 'border-slate-400'
        };
      default:
        return {
          badgeBg: 'bg-sage-base text-sage-deep border-sage-border',
          indicator: 'bg-emerald-600',
          bandBorder: 'border-emerald-500'
        };
    }
  };

  const wristbandStyle = getWristbandStyle(record.tier);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-md mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Top Banner Notice */}
      <ScrollReveal delay={100} duration={850}>
        <div className="mb-3 text-center">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-600 bg-white/85 backdrop-blur-md px-3.5 py-1 rounded-full border-2 border-slate-300 shadow-sm">
            Official Digital Pass
          </span>
        </div>
      </ScrollReveal>

      {/* Screen Brightness Tip for Express Gate Recognition */}
      <ScrollReveal delay={220} duration={850}>
        <div className="mb-3 px-3 py-2 rounded-xl bg-champagne-light/90 backdrop-blur-md border-2 border-champagne-border text-champagne-text text-[11px] font-bold flex items-center justify-center gap-1.5 text-center shadow-sm">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Tip: Keep screen brightness high for instant gate camera scanning</span>
        </div>
      </ScrollReveal>

      {/* Main Executive Pastel Ticket Card */}
      <ScrollReveal delay={380} duration={950}>
        <div 
          ref={passRef}
          className="relative bg-white/85 backdrop-blur-2xl rounded-3xl border-2 border-slate-300/90 shadow-[0_24px_50px_-10px_rgba(15,23,42,0.2),0_10px_20px_-5px_rgba(30,77,56,0.1),inset_0_2px_0_rgba(255,255,255,1)] overflow-hidden transition-all print:shadow-none print:border-slate-800"
        >
          {/* Top Header Section with Soft Gradient */}
          <div className="bg-gradient-to-r from-sage-light via-white/80 to-champagne-light p-6 border-b-2 border-slate-200/80 relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-sage-base border border-sage-border text-sage-deep text-[10px] font-black tracking-wider shadow-xs">NLF</span>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                    National Livestock Festival 2026
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  The Golden Camel and Cow Carnival • Abuja
                </p>
              </div>

              {/* Tier Pill Badge */}
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 shadow-sm ${wristbandStyle.badgeBg}`}>
                {tierName}
              </div>
            </div>

            {/* Endorsement micro-line */}
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Old Parade Ground</span>
              <span>Nov 21 – 23, 2026</span>
            </div>
          </div>

          {/* Live Status Pill Bar */}
          <div className="px-6 pt-5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Verification Status
            </span>

            {isCheckedIn ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-status-successBg border-2 border-status-successBorder text-status-successText text-xs font-black shadow-sm animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>CHECKED IN</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-status-pendingBg border-2 border-status-pendingBorder text-status-pendingText text-xs font-black shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>REGISTERED (UNSCANNED)</span>
              </div>
            )}
          </div>

          {/* Attendee Name & Details */}
          <div className="px-6 py-4 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
              {record.fullName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{record.email}</p>

            {/* Ticket Code Tag */}
            <div className="mt-3 inline-block">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-canvas-inset border-2 border-slate-300 text-slate-800 select-all shadow-xs">
                {record.ticketCode}
              </span>
            </div>
          </div>

          {/* High-Contrast Scannable QR Code Canvas */}
          <div className="mx-6 p-6 rounded-2xl bg-white/95 border-2 border-slate-300 shadow-inner flex flex-col items-center justify-center">
            <div className="p-3 bg-white rounded-xl shadow-md border-2 border-slate-100">
              <QRCodeSVG 
                value={record.ticketCode}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-mono font-semibold mt-3 text-center">
              Scan at Gate Verification Desk
            </p>
          </div>

          {/* Physical Wristband Issuance Directive */}
          <div className="m-6 p-4 rounded-2xl bg-white/70 backdrop-blur-md border-2 border-slate-300/80 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${wristbandStyle.indicator} ring-2 ring-white`}></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Assigned Physical Wristband
              </span>
            </div>
            <p className="text-sm font-extrabold text-slate-900">
              {wristband}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Present this QR code to the gate steward to receive your wristband.
            </p>

            {isCheckedIn && record.checkedInAt && (
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-emerald-800 font-semibold">
                Verified at {record.checkedInAt} • {record.checkedInBy || 'Gate Scanner'}
              </div>
            )}
          </div>

          {/* Pass Footer Security Stamp */}
          <div className="bg-canvas-inset/80 px-6 py-3 border-t-2 border-slate-200/80 text-center">
            <p className="text-[10px] text-slate-500 font-medium">
              Official pass issued under the authority of the Federal Government of Nigeria in collaboration with Golden Camel and Cow (GCC).
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Action Controls: Share & Print / Save */}
      <ScrollReveal delay={550} duration={850}>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-sage-base hover:bg-sage-hover text-sage-deep font-black text-xs flex items-center justify-center gap-2 border-2 border-sage-border shadow-md hover:shadow-lg transition-all active:translate-y-0.5"
          >
            <Share2 className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-3 px-4 min-h-[48px] rounded-xl bg-white/90 hover:bg-white backdrop-blur-md border-2 border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Print / Save</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Viral Slide-In Drawer */}
      <ViralReferralDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ticketCode={record.ticketCode}
      />
    </div>
  );
}
