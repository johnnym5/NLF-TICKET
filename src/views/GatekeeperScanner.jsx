import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { soundFX } from '../utils/audio';
import { TIER_WRISTBANDS, useAuth } from '../context/AuthContext';
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
  WifiOff
} from 'lucide-react';

import { executeAtomicCheckIn } from '../utils/atomic-checkin';

const GATE_LOCATIONS = [
  'Gate 1 - Main North Entrance',
  'Gate 2 - VIP West Dignitary Gate',
  'Gate 3 - East Grandstand Access',
  'Gate 4 - Livestock Exhibition Ring',
];

export default function GatekeeperScanner() {
  const { currentUser, userRole } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState(!!localStorage.getItem('gcc_gate_pin_hash'));
  const [selectedGate, setSelectedGate] = useState(GATE_LOCATIONS[0]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    // Derive role from email or claims for Spark compatibility
    const isAdmin = userRole === 'executive_admin' || currentUser?.email === 'admin@gcc.com';
    const isGate = userRole === 'gatekeeper' || currentUser?.email?.startsWith('qrscanner');
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

  const handleSetPin = (hash) => {
    localStorage.setItem('gcc_gate_pin_hash', hash);
    setHasPin(true);
    setIsLocked(false);
  };

  const processTicketCode = async (rawCode) => {
    const cleanCode = (rawCode || '').trim().toUpperCase();
    if (!cleanCode || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const result = await executeAtomicCheckIn(cleanCode, selectedGate);

      if (result.status === 'VALID') {
        soundFX.playSuccessChime();
        soundFX.triggerSuccessHaptic();

        // Manual stats increment for Spark
        const statsRef = doc(db, 'eventStats', 'global');
        await updateDoc(statsRef, { totalCheckedIn: increment(1) });
      } else {
        soundFX.playWarningBuzzer();
        soundFX.triggerDuplicateHaptic();
      }

      setScannedResult(result);
    } catch (err) {
      console.error('Scanner error:', err);
      setScannedResult({ status: 'INVALID', message: 'SYSTEM ERROR' });
    } finally {
      setIsProcessing(false);
      setTimeout(() => { processingRef.current = false; }, 1500);
    }
  };

  const startScanner = async () => {
    setCameraError('');
    setScannedResult(null);
    try {
      // 1. Clean up any existing instance first
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

      // 2. Create new instance
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
            <h2 className="text-sm font-black text-white uppercase tracking-tight">Gate Terminal 2026</h2>
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
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="flex-1 sm:w-48 bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
          >
            {GATE_LOCATIONS.map(g => <option key={g} value={g}>{g}</option>)}
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

      <div className="flex justify-center">
        {cameraActive && (
          <Button variant="secondary" className="w-full border-slate-200 text-slate-500" icon={CameraOff} onClick={stopScanner}>
            Pause Terminal
          </Button>
        )}
      </div>

      {/* Result Display - Overlays or fixed area */}
      {scannedResult && (
        <div className="animate-fadeIn">
          <div className={`p-6 rounded-xl border-2 ${
            scannedResult.status === 'VALID' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
            'bg-rose-50 border-rose-400 text-rose-900 animate-shake'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                scannedResult.status === 'VALID' ? 'bg-emerald-100' : 'bg-rose-100'
              }`}>
                {scannedResult.status === 'VALID' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black tracking-tight leading-tight mb-2 uppercase">{scannedResult.message}</h3>
                {scannedResult.data && (
                  <div className="space-y-1">
                    <p className="text-sm font-bold opacity-80">{scannedResult.data.fullName}</p>
                    <p className="text-xs font-black uppercase tracking-widest">{scannedResult.data.tier}</p>
                    {scannedResult.status === 'VALID' && (
                      <div className="mt-4 p-3 bg-white/50 border border-emerald-200 rounded-lg text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Wristband Allocation</p>
                        <p className="text-sm font-black uppercase">{TIER_WRISTBANDS[scannedResult.data.tier] || 'GREEN'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Override */}
      <div className="premium-card p-6 bg-slate-50">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-slate-400" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Override</h3>
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

      <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">
         <ShieldCheck className="w-3.5 h-3.5" />
         Secure Operational Terminal v1.4
      </div>
    </div>
  );
}
