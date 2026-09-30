import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { soundFX } from '../utils/audio';
import { TIER_WRISTBANDS, TIER_LABELS, generateTicketCode, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { sanitizeText } from '../utils/sanitizer';
import { checkRateLimit } from '../utils/rate-limiter';
import StaffLogin from '../components/StaffLogin';
import PinLock from '../components/PinLock';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import {
  Camera, 
  CameraOff, 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  Volume2,
  Smartphone,
  ChevronDown,
  Terminal,
  Wifi,
  WifiOff,
  UserPlus,
  History,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ClipboardList,
  Crown,
  UserCheck,
  Plus,
  Check,
  User
} from 'lucide-react';

import { executeAtomicCheckIn } from '../utils/atomic-checkin';

function resolveEffectiveTier(ticketTier, profileRole) {
  const roleLower = (profileRole || '').toLowerCase();
  if (roleLower.includes('vip tier 1') || roleLower === 'vip_1') return 'vip_1';
  if (roleLower.includes('vip tier 2') || roleLower === 'vip_2') return 'vip_2';
  if (roleLower.includes('vip tier 3') || roleLower === 'vip_3') return 'vip_3';
  return ticketTier || 'general';
}

export default function GatekeeperScanner() {
  const { currentUser, userProfile, userRole, assignedGate } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState(!!localStorage.getItem('gcc.gate_pin_hash'));

  // Gate State
  const [gates, setGates] = useState([]);
  const [selectedGateId, setSelectedGateId] = useState('11111111-1111-1111-1111-111111111111');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // VIP Manifest Modal State
  const [vipManifestData, setVipManifestData] = useState(null);
  const [extraGuestName, setExtraGuestName] = useState('');
  const [isAdmittingGuest, setIsAdmittingGuest] = useState(false);

  // Box-Office Manual Creation Flow
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualTier, setManualTier] = useState('general');
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // Recent Scans State with Pagination
  const [recentScans, setRecentScans] = useState([]);
  const [scanPage, setScanPage] = useState(1);
  const [totalScans, setTotalScans] = useState(0);
  const scansPerPage = 5;

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const isAdmin = userRole === 'admin' || userRole === 'executive_admin' || currentUser?.email === 'admin@livestockcarnival.ng' || currentUser?.email === 'admin@gcc.com';
    const isGate = userRole === 'gatekeeper' || userRole === 'security' || currentUser?.email?.startsWith('qrscanner');
    setIsAuthenticated(isAdmin || isGate);
  }, [userRole, currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Gates on Mount
  useEffect(() => {
    const fetchGates = async () => {
      const { data } = await supabase.from('gates').select('*').order('name');
      if (data && data.length > 0) {
        setGates(data);
        if (assignedGate?.id) {
          setSelectedGateId(assignedGate.id);
        } else if (userProfile?.assigned_gate_id) {
          setSelectedGateId(userProfile.assigned_gate_id);
        } else {
          setSelectedGateId(data[0].id);
        }
      }
    };
    fetchGates();
  }, [assignedGate, userProfile]);

  // Fetch Recent Scans for current gatekeeper
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchScans = async () => {
      const from = (scanPage - 1) * scansPerPage;
      const to = from + scansPerPage - 1;

      const { data, count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact' })
        .eq('scanned_by', currentUser.id)
        .order('scanned_at', { ascending: false })
        .range(from, to);

      if (!error && data) {
        setRecentScans(data);
        if (count !== null) setTotalScans(count);
      }
    };

    fetchScans();

    const channel = supabase
      .channel(`scans_by_${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `scanned_by=eq.${currentUser.id}` },
        () => fetchScans()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, scanPage]);

  const fetchVipManifest = async (ticket, ownerProfile) => {
    try {
      const parentId = ticket.parent_ticket_id || ticket.id;

      // Fetch primary host ticket and owner profile
      const { data: primaryTicket } = await supabase
        .from('tickets')
        .select('*, profiles(*)')
        .eq('id', parentId)
        .single();

      // Fetch all child guest tickets
      const { data: guestTickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('parent_ticket_id', parentId)
        .order('created_at', { ascending: true });

      if (primaryTicket) {
        const hostName = ownerProfile?.full_name || primaryTicket.profiles?.full_name || primaryTicket.profiles?.email || 'VIP Delegate';
        setVipManifestData({
          primaryTicket,
          hostName,
          guestTickets: guestTickets || []
        });
      }
    } catch (e) {
      console.warn('VIP Manifest fetch error:', e);
    }
  };

  const handleAdmitVipGuest = async (guestTicket) => {
    setIsAdmittingGuest(true);
    try {
      const result = await executeAtomicCheckIn(guestTicket.ticket_code, selectedGateId);

      if (result?.success || result?.status === 'VALID') {
        soundFX.playSuccessChime();
        soundFX.triggerSuccessHaptic();
      }

      // Re-fetch manifest
      await fetchVipManifest(vipManifestData.primaryTicket);
    } catch (err) {
      alert('Failed to admit guest: ' + err.message);
    } finally {
      setIsAdmittingGuest(false);
    }
  };

  const handleAddExtraVipGuestOnSpot = async (e) => {
    e.preventDefault();
    if (!extraGuestName.trim() || !vipManifestData?.primaryTicket) return;
    setIsAdmittingGuest(true);

    try {
      const tier = vipManifestData.primaryTicket.tier;
      const code = generateTicketCode(tier) + `-GEX`;

      const { data: newGuestTicket, error } = await supabase
        .from('tickets')
        .insert({
          ticket_code: code,
          owner_id: vipManifestData.primaryTicket.owner_id,
          parent_ticket_id: vipManifestData.primaryTicket.id,
          tier: tier,
          guest_name: extraGuestName.trim(),
          is_manual: true,
          created_by: currentUser.id,
          status: 'valid'
        })
        .select('*')
        .single();

      if (error) throw error;

      await executeAtomicCheckIn(code, selectedGateId);
      soundFX.playSuccessChime();

      setExtraGuestName('');
      await fetchVipManifest(vipManifestData.primaryTicket);
    } catch (err) {
      alert('Failed to add extra guest: ' + err.message);
    } finally {
      setIsAdmittingGuest(false);
    }
  };

  const handleSetPin = (hash) => {
    localStorage.setItem('gcc_gate_pin_hash', hash);
    setHasPin(true);
    setIsLocked(false);
  };

  const processTicketCode = async (rawCode) => {
    checkRateLimit('scan:checkin', 10, 5000);
    const cleanCode = sanitizeText(rawCode || '').trim().toUpperCase();
    if (!cleanCode || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const result = await executeAtomicCheckIn(cleanCode, selectedGateId);

      // Fetch attendee's full name from profiles
      let attendeeName = 'Attendee';
      let ownerProfile = null;

      if (result?.data?.owner_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', result.data.owner_id)
          .maybeSingle();

        if (prof) {
          ownerProfile = prof;
          attendeeName = prof.full_name || prof.email || 'Attendee';
        }
      } else if (result?.data?.guest_name) {
        attendeeName = result.data.guest_name;
      }

      const effectiveTier = resolveEffectiveTier(result?.data?.tier, ownerProfile?.role);

      if (result?.success || result?.status === 'VALID') {
        soundFX.playSuccessChime();
        soundFX.triggerSuccessHaptic();
      } else {
        soundFX.playWarningBuzzer();
        soundFX.triggerDuplicateHaptic();
      }

      setScannedResult({
        ...result,
        attendeeName,
        effectiveTier
      });

      // If scanned ticket is a VIP pass, trigger VIP Manifest popup
      if (effectiveTier.startsWith('vip')) {
        await fetchVipManifest(result.data, ownerProfile);
      }
    } catch (err) {
      console.error('Scanner error:', err);
      setScannedResult({ status: 'INVALID', message: 'SYSTEM ERROR' });
    } finally {
      setIsProcessing(false);
      setTimeout(() => { processingRef.current = false; }, 1500);
    }
  };

  const handleManualTicketCreation = async (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    setIsCreatingManual(true);

    try {
      const code = generateTicketCode(manualTier);

      const { data: newTicket, error } = await supabase
        .from('tickets')
        .insert({
          ticket_code: code,
          tier: manualTier,
          is_manual: true,
          created_by: currentUser.id,
          status: 'valid'
        })
        .select('*')
        .single();

      if (error) throw error;

      const checkinRes = await executeAtomicCheckIn(code, selectedGateId);

      if (checkinRes?.success || checkinRes?.status === 'VALID') {
        soundFX.playSuccessChime();
        soundFX.triggerSuccessHaptic();
      }

      setScannedResult({
        ...checkinRes,
        attendeeName: manualName.trim(),
        effectiveTier: manualTier,
        message: `MANUAL TICKET CREATED: ${checkinRes.message || 'Checked in successfully.'}`
      });

      setShowManualModal(false);
      setManualName('');
    } catch (err) {
      console.error('Manual ticket creation failed:', err);
      alert('Failed to issue manual ticket: ' + err.message);
    } finally {
      setIsCreatingManual(false);
    }
  };

  const startScanner = async () => {
    setCameraError('');
    setScannedResult(null);
    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          console.warn('Scanner stop warning during re-init:', e);
        }
        scannerRef.current = null;
      }

      const html5Qr = new Html5Qrcode('gatekeeper-reader');
      scannerRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 25,
          qrbox: (w, h) => { const s = Math.min(w, h) * 0.7; return { width: s, height: s }; }
        },
        (text) => processTicketCode(text)
      );
      setCameraActive(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      setCameraError('Camera unavailable or permission denied.');
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isAuthenticated && !isLocked) {
      const timer = setTimeout(() => startScanner(), 500);
      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(e => console.warn('Cleanup stop failed:', e));
          }
        }
      };
    }
  }, [isAuthenticated, isLocked]);

  const activeGateName = gates.find(g => g.id === selectedGateId)?.name || 'Gate Terminal';
  const totalPages = Math.ceil(totalScans / scansPerPage) || 1;

  if (!isAuthenticated) return <StaffLogin title="Operational Terminal" subtitle="Gate Verification Required" allowedEmails={['admin@gcc.com', 'qrscanner*@gcc.com']} onSuccess={() => setIsAuthenticated(true)} />;
  if (!hasPin) return <PinLock isSetting={true} onSetPin={handleSetPin} />;
  if (isLocked) return <PinLock onUnlock={() => setIsLocked(false)} />;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Tactical Header */}
      <div className="bg-slate-900 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tight">{activeGateName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {isOnline ? (
                <Badge variant="success" className="bg-emerald-950/40 text-emerald-400 border-emerald-900/50">ONLINE</Badge>
              ) : (
                <Badge variant="error" className="bg-rose-950/40 text-rose-400 border-rose-900/50">OFFLINE MODE</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedGateId}
            onChange={(e) => setSelectedGateId(e.target.value)}
            className="flex-1 sm:w-48 bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
          >
            {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Button variant="secondary" className="bg-slate-800 border-none text-slate-400 hover:bg-slate-700 p-2.5 rounded-lg" onClick={() => setIsLocked(true)}>
            <Lock className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Viewfinder Container */}
      <div className="premium-card bg-black border-slate-800 p-1 relative shadow-2xl">
        <div id="gatekeeper-reader" className="w-full aspect-square max-w-[380px] mx-auto bg-slate-950 rounded-lg overflow-hidden" />

        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400/50 rounded-tl-lg" />
              <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400/50 rounded-tr-lg" />
            </div>
            <div className="flex justify-between">
              <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400/50 rounded-bl-lg" />
              <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400/50 rounded-br-lg" />
            </div>
          </div>
        )}

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-8">
             <Camera className="w-12 h-12 text-slate-700 mb-4" />
             <h3 className="text-white font-black text-sm mb-2 uppercase tracking-widest">Scanner Standby</h3>
             <p className="text-slate-500 text-xs mb-8 max-w-[200px]">Activate camera for immediate pass verification</p>
             <Button className="w-full max-w-[200px]" onClick={startScanner}>Activate Camera</Button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-3">
        {cameraActive && (
          <Button variant="secondary" className="flex-1 border-slate-200 text-slate-500" icon={CameraOff} onClick={stopScanner}>
            Pause Terminal
          </Button>
        )}
        <Button
          onClick={() => setShowManualModal(true)}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          icon={UserPlus}
        >
          Issue Manual Ticket
        </Button>
      </div>

      {/* RESULT DISPLAY (Name First, Ticket ID Code Below) */}
      {scannedResult && (
        <div className="animate-fadeIn">
          <div className={`p-6 rounded-2xl border-2 shadow-lg ${
            scannedResult.success || scannedResult.status === 'VALID' ? 'bg-emerald-50 border-emerald-400 text-emerald-950' :
            'bg-rose-50 border-rose-400 text-rose-950 animate-shake'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                scannedResult.success || scannedResult.status === 'VALID' ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'
              }`}>
                {scannedResult.success || scannedResult.status === 'VALID' ? <CheckCircle2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
              </div>

              <div className="flex-1 space-y-2">
                {/* 1. ATTENDEE FULL NAME FIRST */}
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Attendee Full Name</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {scannedResult.attendeeName || 'Attendee'}
                  </h2>
                </div>

                {/* 2. TICKET CODE / ID NUMBER BELOW */}
                {scannedResult.data && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">ID / Ticket Code:</span>
                    <span className="bg-white/80 border border-slate-200 font-mono text-xs font-black px-2.5 py-1 rounded-lg text-slate-900 shadow-xs">
                      {scannedResult.data.ticket_code}
                    </span>
                  </div>
                )}

                {/* 3. ADMITTANCE MESSAGE & WRISTBAND */}
                <p className="text-xs font-black uppercase tracking-wide text-slate-700 pt-1">
                  {scannedResult.message}
                </p>

                {scannedResult.data && (scannedResult.success || scannedResult.status === 'VALID') && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 block mb-0.5">Physical Wristband Designation</span>
                    <p className="text-sm font-black uppercase text-slate-900">
                      {TIER_WRISTBANDS[scannedResult.effectiveTier || scannedResult.data.tier] || 'EMERALD GREEN'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIP GUEST MANIFEST GATE ADMITTANCE POPUP WINDOW */}
      {vipManifestData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 border border-slate-800 shadow-2xl max-w-lg w-full animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Crown className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">VIP Delegate Manifest</span>
                  <h3 className="text-base font-black uppercase text-white">
                    Host: {vipManifestData.hostName}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {TIER_LABELS[vipManifestData.primaryTicket.tier] || 'VIP Pass'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setVipManifestData(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Select / Mark Guest Entering Under VIP Host ({vipManifestData.guestTickets.length} Guests)
              </span>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {vipManifestData.guestTickets.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3">No plus-one guests enrolled yet.</p>
                ) : (
                  vipManifestData.guestTickets.map((g, idx) => {
                    const isAdmitted = g.status === 'used';
                    return (
                      <div key={g.id} className="p-3 bg-slate-800/90 rounded-2xl flex items-center justify-between gap-3 border border-slate-700/60">
                        <div>
                          <span className="font-extrabold text-sm text-white block">
                            {g.guest_name || `VIP Guest #${idx + 1}`}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400 block">
                            Code: {g.ticket_code}
                          </span>
                        </div>

                        {isAdmitted ? (
                          <div className="flex items-center gap-1 bg-emerald-950 text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-emerald-800 shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            Admitted
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAdmitVipGuest(g)}
                            disabled={isAdmittingGuest}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            Mark Admitted
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* On-the-spot Extra Guest Admittance */}
            <form onSubmit={handleAddExtraVipGuestOnSpot} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type unlisted guest name..."
                value={extraGuestName}
                onChange={(e) => setExtraGuestName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
              />
              <button
                type="submit"
                disabled={isAdmittingGuest || !extraGuestName.trim()}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Admit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Override Form */}
      <div className="premium-card p-6 bg-slate-50">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-slate-400" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Override Search</h3>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); processTicketCode(manualCode); setManualCode(''); }} className="flex gap-2">
          <Input
            placeholder="TICKET PAYLOAD..."
            className="flex-1"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button type="submit" className="shrink-0" loading={isProcessing}>Verify</Button>
        </form>
      </div>

      {/* Recent Scans Table with Pagination */}
      <div className="premium-card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">My Gate Activity History</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{totalScans} total scans</span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentScans.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">No recent scans logged for your account.</p>
          ) : (
            recentScans.map(scan => (
              <div key={scan.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{scan.ticket_code}</span>
                    {scan.is_manual && <Badge variant="gold" className="text-[8px] py-0 px-1.5">MANUAL</Badge>}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {scan.scanned_at ? new Date(scan.scanned_at).toLocaleTimeString() : 'Checked in'}
                  </span>
                </div>
                <Badge variant={scan.status === 'used' ? 'success' : 'pending'}>
                  {scan.status?.toUpperCase()}
                </Badge>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setScanPage(p => Math.max(1, p - 1))}
              disabled={scanPage === 1}
              className="p-1.5 rounded-lg border text-slate-500 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Page {scanPage} of {totalPages}</span>
            <button
              onClick={() => setScanPage(p => Math.min(totalPages, p + 1))}
              disabled={scanPage === totalPages}
              className="p-1.5 rounded-lg border text-slate-500 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Ticket Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900">Box-Office Manual Ticket</h3>
                <p className="text-[10px] text-slate-500 font-medium">Issue manual ticket for user unable to log in</p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleManualTicketCreation} className="space-y-4">
              <Input
                label="Attendee Name / Identifier"
                placeholder="e.g. John Doe / Walk-in"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Ticket Tier Allocation</label>
                <select
                  value={manualTier}
                  onChange={(e) => setManualTier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
                >
                  <option value="general">General Admission</option>
                  <option value="vip_1">VIP Tier 1 (+10 Guests)</option>
                  <option value="vip_2">VIP Tier 2 (+15 Guests)</option>
                  <option value="vip_3">VIP Tier 3 (+20 Guests)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-medium leading-relaxed">
                ⚠️ This ticket will be strictly flagged as <strong>is_manual=true</strong> and audited under your Gatekeeper ID.
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowManualModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" loading={isCreatingManual}>
                  Issue & Check In
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">
         <ShieldCheck className="w-3.5 h-3.5" />
         Enterprise Box-Office Gate Terminal v2.0
      </div>
    </div>
  );
}
