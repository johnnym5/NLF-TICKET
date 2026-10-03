import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useAuth, TIER_LABELS, TIER_WRISTBANDS, VIP_PLUS_ONES, generateTicketCode } from '../context/AuthContext';
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

function resolveEffectiveTier(ticketTier, profileRole) {
  const roleLower = (profileRole || '').toLowerCase();
  if (roleLower.includes('vip tier 1') || roleLower === 'vip_1') return 'vip_1';
  if (roleLower.includes('vip tier 2') || roleLower === 'vip_2') return 'vip_2';
  if (roleLower.includes('vip tier 3') || roleLower === 'vip_3') return 'vip_3';
  return ticketTier || 'general';
}

const WRISTBAND_HEX = [
  { match: 'emerald', hex: '#0F4A2F' },
  { match: 'silver', hex: '#64748B' },
  { match: 'champagne', hex: '#D97706' },
  { match: 'gold', hex: '#D97706' },
  { match: 'obsidian', hex: '#0F172A' },
  { match: 'platinum', hex: '#0F172A' },
  { match: 'cobalt', hex: '#2563EB' },
  { match: 'blue', hex: '#2563EB' },
  { match: 'tangerine', hex: '#EA580C' },
  { match: 'orange', hex: '#EA580C' },
  { match: 'purple', hex: '#7E22CE' },
  { match: 'crimson', hex: '#DC2626' },
  { match: 'red', hex: '#DC2626' }
];

function getReadableTextColor(hex) {
  const channels = hex.replace('#', '').match(/.{2}/g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.42 ? '#0F172A' : '#FFFFFF';
}

export default function DigitalPassView({ onOpenAuth }) {
  const { currentUser, userTicket, userProfile, attendeeRecord, isNewRegistration, setIsNewRegistration } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // VIP Guest Management State
  const [guestSlots, setGuestSlots] = useState({}); // slotIndex -> guest_name
  const [guestTicketsMap, setGuestTicketsMap] = useState({}); // slotIndex -> ticketObj
  const [selectedPassIndex, setSelectedPassIndex] = useState(0); // 0 = Primary Pass, 1..N = Guest Passes
  const [isSavingGuests, setIsSavingGuests] = useState(false);
  const [guestSavedNotice, setGuestSavedNotice] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const passRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    const loadNotifications = async () => {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(25);
      if (!error && active) setNotifications(data || []);
    };
    loadNotifications();
    const channel = supabase.channel(`user-notifications-${currentUser.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, payload => setNotifications(prev => [payload.new, ...prev].slice(0, 25))).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const markNotificationRead = async (notification) => {
    if (notification.read_at) return;
    const readAt = new Date().toISOString();
    setNotifications(prev => prev.map(item => item.id === notification.id ? { ...item, read_at: readAt } : item));
    const { error } = await supabase.from('notifications').update({ read_at: readAt }).eq('id', notification.id);
    if (error) setNotifications(prev => prev.map(item => item.id === notification.id ? { ...item, read_at: null } : item));
  };

  const primaryTier = resolveEffectiveTier(userTicket?.tier || attendeeRecord?.tier, userProfile?.role);
  const isVipTier = primaryTier.startsWith('vip');
  const totalPlusOnes = VIP_PLUS_ONES[primaryTier] || (isVipTier ? 10 : 0);

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

  // Load existing guest tickets or initialize empty slots up to totalPlusOnes
  useEffect(() => {
    if (!isVipTier || !userTicket?.id) return;

    const loadGuestSlots = async () => {
      try {
        const { data: existingGuests } = await supabase
          .from('tickets')
          .select('*')
          .eq('parent_ticket_id', userTicket.id)
          .order('created_at', { ascending: true });

        const slotsMap = {};
        const ticketsMap = {};

        if (existingGuests && existingGuests.length > 0) {
          existingGuests.forEach((g, idx) => {
            slotsMap[idx] = g.guest_name || `Guest #${idx + 1}`;
            ticketsMap[idx] = g;
          });
        }

        // Restore local cache backup if present
        try {
          const cached = localStorage.getItem(`gcc_vip_guests_${userTicket.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            Object.keys(parsed).forEach((key) => {
              if (parsed[key]) {
                slotsMap[key] = parsed[key];
              }
            });
          }
        } catch (err) {}

        // Initialize default slot names up to totalPlusOnes
        for (let i = 0; i < totalPlusOnes; i++) {
          if (slotsMap[i] === undefined || slotsMap[i] === '') {
            slotsMap[i] = `Guest #${i + 1}`;
          }
        }

        setGuestSlots(slotsMap);
        setGuestTicketsMap(ticketsMap);
      } catch (e) {
        console.warn('Failed to load VIP guest slots:', e);
      }
    };

    loadGuestSlots();
  }, [userTicket?.id, primaryTier, isVipTier, totalPlusOnes]);

  const handleSaveGuestNames = async (e) => {
    e.preventDefault();
    if (!userTicket?.id) return;
    setIsSavingGuests(true);

    try {
      // 1. Save locally to guarantee immediate persistence across page refreshes
      localStorage.setItem(`gcc_vip_guests_${userTicket.id}`, JSON.stringify(guestSlots));

      let hasError = false;
      let errDetails = [];

      for (let i = 0; i < totalPlusOnes; i++) {
        const typedName = guestSlots[i]?.trim();
        const nameToSave = typedName || `Guest #${i + 1}`;
        const existingTicket = guestTicketsMap[i];

        if (existingTicket?.id) {
          let { error: updateErr } = await supabase
            .from('tickets')
            .update({ guest_name: nameToSave })
            .eq('id', existingTicket.id);

          if (updateErr) {
            console.error('Update error on VIP guest slot:', updateErr);
            errDetails.push(updateErr.message);
            hasError = true;
          }
        } else {
          const ticketCode = `${userTicket.ticket_code || generateTicketCode(primaryTier)}-G${i + 1}`;
          let { data: newG, error: insertErr } = await supabase
            .from('tickets')
            .insert({
              ticket_code: ticketCode,
              owner_id: userTicket.owner_id,
              tier: primaryTier,
              parent_ticket_id: userTicket.id,
              guest_name: nameToSave,
              is_manual: false,
              status: 'valid'
            })
            .select('*')
            .single();

          if (insertErr) {
            console.error('Insert error on VIP guest slot:', insertErr);
            errDetails.push(insertErr.message);
            hasError = true;
          } else if (newG) {
            setGuestTicketsMap(prev => ({ ...prev, [i]: newG }));
          }
        }
      }

      if (hasError) {
        console.warn('VIP guest name save warning:', errDetails);
      }

      setGuestSavedNotice(true);
      setTimeout(() => setGuestSavedNotice(false), 2500);
    } catch (err) {
      console.warn('Save guest list notice:', err);
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

  // Build pass slider array
  const allPasses = [
    {
      type: 'PRIMARY',
      fullName: userProfile?.full_name || currentUser?.displayName || 'Attendee',
      email: userProfile?.email || currentUser?.email || '',
      ticketCode: userTicket?.ticket_code || attendeeRecord?.ticketCode || 'GCC-2026-PENDING',
      tier: primaryTier,
      status: userTicket?.status || (attendeeRecord?.status === 'CHECKED_IN' ? 'used' : 'valid')
    },
    ...Array.from({ length: totalPlusOnes }).map((_, idx) => {
      const g = guestTicketsMap[idx];
      return {
        type: 'GUEST',
        fullName: guestSlots[idx] || g?.guest_name || `VIP Guest #${idx + 1}`,
        email: `VIP Plus-One Guest #${idx + 1}`,
        ticketCode: g?.ticket_code || `${userTicket?.ticket_code || 'GCC-2026'}-G${idx + 1}`,
        tier: g?.tier || primaryTier,
        status: g?.status || 'valid'
      };
    })
  ];

  const activePass = allPasses[selectedPassIndex] || allPasses[0];
  const isCheckedIn = activePass.status === 'used' || activePass.status === 'CHECKED_IN';
  const tierName = TIER_LABELS[activePass.tier] || 'General Admission Pass';
  const wristband = TIER_WRISTBANDS[activePass.tier] || 'Emerald Green';
  const wristbandHex = WRISTBAND_HEX.find(color => wristband.toLowerCase().includes(color.match))?.hex || '#0F4A2F';
  const wristbandTextColor = getReadableTextColor(wristbandHex);
  const wristbandTint = `${wristbandHex}18`;

  const handlePrint = () => window.print();

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
      <ScrollReveal delay={100}>
        <div className="text-center">
          <span className="section-label">Attendee Credential</span>
        </div>
      </ScrollReveal>

      {notifications.length > 0 && <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-black uppercase text-slate-800">Event notifications</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">{notifications.filter(item => !item.read_at).length} unread</span></div><div className="max-h-56 space-y-2 overflow-y-auto">{notifications.map(item => <button type="button" key={item.id} onClick={() => markNotificationRead(item)} className={`block w-full rounded-xl border p-3 text-left ${item.read_at ? 'border-slate-100 bg-slate-50' : 'border-emerald-100 bg-emerald-50/60'}`}><span className="flex justify-between gap-3"><strong className="text-xs text-slate-800">{item.title}</strong><time className="text-[9px] text-slate-400">{new Date(item.created_at).toLocaleString()}</time></span><span className="mt-1 block whitespace-pre-wrap text-xs text-slate-600">{item.message}</span></button>)}</div></section>}

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
          className="premium-card relative bg-white shadow-xl overflow-hidden print:shadow-none"
          style={{ borderColor: wristbandHex, borderWidth: 2 }}
        >
          {/* Header Section */}
          <div className="px-6 py-6 relative" style={{ backgroundColor: wristbandHex, color: wristbandTextColor }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <img src="/logo.jpeg" alt="Livestock Carnival Logo" className="w-5 h-5 rounded object-cover" />
                  <h3 className="text-[11px] font-black tracking-tighter uppercase opacity-80">
                    National Livestock Festival 2026
                  </h3>
                </div>
                <p className="text-sm font-black tracking-tight">
                  Abuja Carnival Access
                </p>
              </div>
              <Badge variant="gold" className="border-none px-3 py-1 font-black" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: wristbandHex }}>
                {tierName}
              </Badge>
            </div>

            <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-75">
              <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Old Parade Ground</div>
              <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Nov 21 – 23</div>
            </div>
          </div>

          {/* Identity Section */}
          <div className="px-8 pt-8 pb-6 text-center border-b bg-slate-50/50" style={{ borderColor: `${wristbandHex}55` }}>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1">
              {activePass.fullName}
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-widest">{activePass.email}</p>

            <div className="inline-block px-4 py-1.5 rounded-lg bg-white border font-mono text-xs font-black text-slate-800 shadow-sm" style={{ borderColor: wristbandHex }}>
              {activePass.ticketCode}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="px-8 py-10 flex flex-col items-center justify-center bg-white relative">
            <div className="p-4 bg-white rounded-2xl border-2 shadow-soft" style={{ borderColor: `${wristbandHex}55` }}>
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
          <div className="px-6 py-4 flex items-center justify-between border-t" style={{ backgroundColor: wristbandTint, borderColor: `${wristbandHex}55` }}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Status</span>
            {isCheckedIn ? (
              <Badge variant="success" className="px-3 py-1" style={{ backgroundColor: wristbandTint, color: wristbandHex, borderColor: `${wristbandHex}66` }}>Checked In (Used)</Badge>
            ) : (
              <Badge variant="pending" className="px-3 py-1" style={{ backgroundColor: wristbandTint, color: wristbandHex, borderColor: `${wristbandHex}66` }}>Valid Pass</Badge>
            )}
          </div>

          {/* Wristband Instruction */}
          <div className="px-8 py-6 text-center border-t" style={{ backgroundColor: wristbandTint, borderColor: `${wristbandHex}55` }}>
             <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wristbandHex, boxShadow: `0 0 0 4px ${wristbandHex}22` }}></div>
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
      {isVipTier && totalPlusOnes > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                VIP Accompanying Guest List ({totalPlusOnes} Guests)
              </h3>
            </div>
            <span className="text-[9px] font-bold uppercase text-slate-400">No Login Needed for Guests</span>
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            Type the full names of your accompanying guests below. Gatekeepers will check them off at the gate terminal.
          </p>

          <form onSubmit={handleSaveGuestNames} className="space-y-3">
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {Array.from({ length: totalPlusOnes }).map((_, idx) => {
                const g = guestTicketsMap[idx];
                return (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 w-16 shrink-0 uppercase">
                      Guest #{idx + 1}:
                    </span>
                    <input
                      type="text"
                      placeholder={`e.g. Guest Name #${idx + 1}`}
                      value={guestSlots[idx] || ''}
                      onChange={(e) => setGuestSlots({ ...guestSlots, [idx]: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-slate-400"
                    />
                    <Badge variant={g?.status === 'used' ? 'success' : 'pending'} className="text-[8px] shrink-0">
                      {g?.status === 'used' ? 'ADMITTED' : 'VALID'}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={isSavingGuests}
              className="w-full py-3 bg-[#0F4A2F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
