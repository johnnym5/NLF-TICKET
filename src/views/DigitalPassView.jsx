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
  Info,
  Printer
} from 'lucide-react';
import ViralReferralDrawer from '../components/ViralReferralDrawer';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function DigitalPassView({ onOpenAuth }) {
  const { currentUser, attendeeRecord, isNewRegistration, setIsNewRegistration } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const passRef = useRef(null);

  useEffect(() => {
    if (isNewRegistration) {
      try {
        confetti({
          particleCount: 80, spread: 70, origin: { y: 0.6 },
          colors: ['#D8EADF', '#FEF3D6', '#1E4D38', '#FCE6A8']
        });
      } catch (e) {}
      const timer = setTimeout(() => {
        setDrawerOpen(true);
        setIsNewRegistration(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isNewRegistration, setIsNewRegistration]);

  if (!currentUser && !attendeeRecord) {
    return (
      <div className="max-w-md mx-auto my-16 p-12 bg-white rounded-2xl border border-slate-200 text-center shadow-soft">
        <div className="w-16 h-16 rounded-2xl bg-sage-light text-sage-deep mx-auto flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Authentication Required</h2>
        <p className="text-sm text-slate-500 mb-8 font-medium">
          Please sign in to view your official scannable digital credential for the festival.
        </p>
        <Button className="w-full" onClick={onOpenAuth}>
          Access My Event Pass
        </Button>
      </div>
    );
  }

  const record = attendeeRecord || {
    fullName: currentUser?.displayName || 'Guest Delegate',
    email: currentUser?.email || 'attendee@carnival.ng',
    ticketCode: 'GCC-2026-PENDING',
    tier: 'REGULAR',
    status: 'REGISTERED',
  };

  const isCheckedIn = record.status === 'CHECKED_IN';
  const tierName = TIER_LABELS[record.tier] || 'General Entry';
  const wristband = record.wristbandColor || TIER_WRISTBANDS[record.tier] || 'Emerald Green';

  const handlePrint = () => window.print();

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <ScrollReveal delay={100}>
        <div className="mb-6 text-center">
          <span className="section-label">Attendee Credential</span>
        </div>
      </ScrollReveal>

      {/* Main Official Pass Card */}
      <ScrollReveal delay={200}>
        <div 
          ref={passRef}
          className="premium-card relative bg-white border-slate-300 shadow-xl overflow-hidden print:shadow-none print:border-slate-800"
        >
          {/* Header Section */}
          <div className="bg-slate-900 px-6 py-6 text-white relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-sage-deep text-[10px] font-black tracking-widest border border-emerald-800">NLF</span>
                  <h3 className="text-[11px] font-black tracking-tighter uppercase text-slate-300">
                    National Livestock Festival 2026
                  </h3>
                </div>
                <p className="text-sm font-black text-white tracking-tight">
                  Abuja Carnival Access
                </p>
              </div>
              <Badge variant="gold" className="bg-amber-400 text-slate-900 border-none px-3 py-1">
                {tierName}
              </Badge>
            </div>

            <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Old Parade Ground</div>
              <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Nov 21 – 23</div>
            </div>
          </div>

          {/* Identity Section */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1">
              {record.fullName}
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-widest">{record.email}</p>

            <div className="inline-block px-4 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs font-black text-slate-800 shadow-sm">
              {record.ticketCode}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="px-8 py-10 flex flex-col items-center justify-center bg-white relative">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-soft">
              <QRCodeSVG 
                value={record.signedPayload || record.ticketCode}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
              Present for gate verification
            </p>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Status</span>
            {isCheckedIn ? (
              <Badge variant="success" className="animate-pulse px-3 py-1">Checked In</Badge>
            ) : (
              <Badge variant="pending" className="px-3 py-1">Registered</Badge>
            )}
          </div>

          {/* Wristband Instruction */}
          <div className="px-8 py-6 bg-sage-light/30 text-center border-t border-slate-100">
             <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-600/10"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wristband Allocation</span>
             </div>
             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{wristband}</p>
             {isCheckedIn && record.checkedInAt && (
                <p className="mt-3 text-[10px] font-bold text-emerald-700">
                  Verified at {record.checkedInAt} by {record.checkedInBy || 'Gate Steward'}
                </p>
             )}
          </div>

          {/* Security Footer */}
          <div className="bg-slate-900 px-6 py-3 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Official Federal Government Credential • GCC-2026-SECURE
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-4">
        <Button
          variant="secondary"
          className="flex-1"
          icon={Share2}
          onClick={() => setDrawerOpen(true)}
        >
          Invite Friends
        </Button>
        <Button
          variant="secondary"
          icon={Printer}
          onClick={handlePrint}
        >
          Print
        </Button>
      </div>

      <ViralReferralDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ticketCode={record.ticketCode}
      />
    </div>
  );
}
