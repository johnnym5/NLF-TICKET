import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useAuth, TIER_LABELS, TIER_WRISTBANDS, VIP_PLUS_ONES } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
  Printer,
  Users,
  ChevronLeft,
  ChevronRight,
  Crown,
  UserCheck,
  Save,
  Check
} from 'lucide-react';
import ViralReferralDrawer from '../components/ViralReferralDrawer';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

export default function DigitalPassView({ onOpenAuth }) {
  const { currentUser, userTicket, userProfile, attendeeRecord, isNewRegistration, setIsNewRegistration } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guestTickets, setGuestTickets] = useState([]);
  const [guestNamesMap, setGuestNamesMap] = useState({});
  const [selectedPassIndex, setSelectedPassIndex] = useState(0); // 0 = Primary Pass, 1..N = Guest Passes
  const [isSavingGuests, setIsSavingGuests] = useState(false);
  const [guestSavedNotice, setGuestSavedNotice] = useState(false);
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

  // Fetch linked guest passes if primary ticket is VIP
  useEffect(() => {
    if (!userTicket?.id) return;

    const fetchGuestPasses = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('parent_ticket_id', userTicket.id)
        .order('created_at', { ascending: true });

      if (data) {
        setGuestTickets(data);
        const map = {};
        data.forEach((g, idx) => {
          map[g.id] = g.guest_name || `Guest #${idx + 1}`;
        });
        setGuestNamesMap(map);
      }
    };

    fetchGuestPasses();
  }, [userTicket]);

  const handleSaveGuestNames = async (e) => {
    e.preventDefault();
    if (guestTickets.length === 0) return;
    setIsSavingGuests(true);

    try {
      const updatePromises = guestTickets.map(g => {
        const nameToSave = guestNamesMap[g.id] || g.guest_name || 'VIP Guest';
        return supabase
          .from('tickets')
          .update({ guest_name: nameToSave })
          .eq('id', g.id);
      });

      await Promise.all(updatePromises);

      setGuestTickets(prev => prev.map(g => ({
        ...g,
        guest_name: guestNamesMap[g.id] || g.guest_name
      })));

      setGuestSavedNotice(true);
      setTimeout(() => setGuestSavedNotice(false), 2500);
    } catch (err) {
      alert('Failed to save guest list: ' + err.message);
    } finally {
      setIsSavingGuests(false);
    }
  };

  if (!currentUser && !attendeeRecord && !userTicket) {
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

  // Combine primary ticket and guest tickets for VIP pass slider
  const isVipTier = (userTicket?.tier || attendeeRecord?.tier || '').toLowerCase().startsWith('vip');
  const allPasses = [
    {
      type: 'PRIMARY',
      fullName: userProfile?.full_name || currentUser?.displayName || 'Attendee',
      email: userProfile?.email || currentUser?.email || '',
      ticketCode: userTicket?.ticket_code || attendeeRecord?.ticketCode || 'GCC-2026-PENDING',
      tier: userTicket?.tier || attendeeRecord?.tier || 'general',
      status: userTicket?.status || (attendeeRecord?.status === 'CHECKED_IN' ? 'used' : 'valid')
    },
    ...guestTickets.map((g, idx) => ({
      type: 'GUEST',
      fullName: g.guest_name || `${userProfile?.full_name || 'VIP'} Guest #${idx + 1}`,
      email: `VIP Plus-One Guest #${idx + 1}`,
      ticketCode: g.ticket_code,
      tier: g.tier,
      status: g.status
    }))
  ];

  const activePass = allPasses[selectedPassIndex] || allPasses[0];
  const isCheckedIn = activePass.status === 'used' || activePass.status === 'CHECKED_IN';
  const tierName = TIER_LABELS[activePass.tier] || 'General Admission Pass';
  const wristband = TIER_WRISTBANDS[activePass.tier] || 'Emerald Green';

  const handlePrint = () => window.print();

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
      <ScrollReveal delay={100}>
        <div className="text-center">
          <span className="section-label">Attendee Credential</span>
        </div>
      </ScrollReveal>

      {/* VIP Guest Pass Selector Tabs */}
      {allPasses.length > 1 && (
        <div className="p-2 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-2 shadow-lg">
          <button
            onClick={() => setSelectedPassIndex(p => Math.max(0, p - 1))}
            disabled={selectedPassIndex === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-black uppercase text-amber-400">
              <Crown className="w-3.5 h-3.5" />
              <span>{activePass.type === 'PRIMARY' ? 'Primary VIP Pass' : `VIP Guest Pass #${selectedPassIndex}`}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Pass {selectedPassIndex + 1} of {allPasses.length}</p>
          </div>

          <button
            onClick={() => setSelectedPassIndex(p => Math.min(allPasses.length - 1, p + 1))}
            disabled={selectedPassIndex === allPasses.length - 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

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
                  <img src="/logo.jpeg" alt="Livestock Carnival Logo" className="w-5 h-5 rounded object-cover" />
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
              {activePass.fullName}
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-widest">{activePass.email}</p>

            <div className="inline-block px-4 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs font-black text-slate-800 shadow-sm">
              {activePass.ticketCode}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="px-8 py-10 flex flex-col items-center justify-center bg-white relative">
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-soft">
              <QRCodeSVG 
                value={activePass.ticketCode}
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
              <Badge variant="success" className="animate-pulse px-3 py-1">Checked In (Used)</Badge>
            ) : (
              <Badge variant="pending" className="px-3 py-1">Valid Pass</Badge>
            )}
          </div>

          {/* Wristband Instruction */}
          <div className="px-8 py-6 bg-sage-light/30 text-center border-t border-slate-100">
             <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-600/10"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wristband Allocation</span>
             </div>
             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{wristband}</p>
          </div>

          {/* Security Footer */}
          <div className="bg-slate-900 px-6 py-3 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Official Federal Government Credential • GCC-2026-SECURE
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* VIP PLUS-ONE GUEST ROSTER MANAGER */}
      {isVipTier && guestTickets.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                VIP Accompanying Guest List ({guestTickets.length} Guests)
              </h3>
            </div>
            <span className="text-[9px] font-bold uppercase text-slate-400">No Login Needed for Guests</span>
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            Type the names of your accompanying guests below. Gatekeepers will check them off at the gate terminal.
          </p>

          <form onSubmit={handleSaveGuestNames} className="space-y-3">
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {guestTickets.map((g, idx) => (
                <div key={g.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 w-12 shrink-0 uppercase">
                    Guest {idx + 1}:
                  </span>
                  <input
                    type="text"
                    placeholder={`e.g. Guest Name #${idx + 1}`}
                    value={guestNamesMap[g.id] || ''}
                    onChange={(e) => setGuestNamesMap({ ...guestNamesMap, [g.id]: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${g.status === 'used' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {g.status === 'used' ? 'Admitted' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSavingGuests}
              className="w-full py-2.5 bg-[#0F4A2F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {guestSavedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {guestSavedNotice ? 'Guest Names Saved!' : 'Save VIP Guest Roster'}
            </button>
          </form>
        </div>
      )}

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
        ticketCode={activePass.ticketCode}
      />
    </div>
  );
}
