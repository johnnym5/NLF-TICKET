import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { soundFX } from '../utils/audio';
import { executeAtomicCheckIn } from '../utils/atomic-checkin';
import { TIER_WRISTBANDS, useAuth } from '../context/AuthContext';
import StaffLogin from '../components/StaffLogin';
import ScrollReveal from '../components/ScrollReveal';
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
  KeyRound, 
  Volume2, 
  Smartphone,
  ChevronDown
} from 'lucide-react';

const GATE_LOCATIONS = [
  'Gate 1 - Main North Entrance',
  'Gate 2 - VIP West Dignitary Gate',
  'Gate 3 - East Grandstand Access',
  'Gate 4 - Livestock Exhibition Ring',
];

export default function GatekeeperScanner() {
  const { currentUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedGate, setSelectedGate] = useState(GATE_LOCATIONS[0]);

  // Scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState(null); // { status: 'VALID' | 'DUPLICATE' | 'INVALID', data, message }
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  // Validate Gatekeeper Email
  useEffect(() => {
    const allowedPatterns = ['admin@gcc.com', 'qrscanner*@gcc.com'];
    if (currentUser) {
      const isAllowed = allowedPatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(currentUser.email);
        }
        return currentUser.email === pattern;
      });
      setIsAuthenticated(isAllowed);
    } else {
      setIsAuthenticated(false);
    }
  }, [currentUser]);

  // Process and verify scanned code against Firestore
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
      } else if (result.status === 'REVOKED') {
        soundFX.playWarningBuzzer();
        soundFX.triggerDuplicateHaptic();
      } else if (result.status === 'DUPLICATE') {
        soundFX.playWarningBuzzer();
        soundFX.triggerDuplicateHaptic();
      } else {
        soundFX.playWarningBuzzer();
        soundFX.triggerDuplicateHaptic();
      }

      setScannedResult(result);
    } catch (err) {
      console.error('Ticket verification error:', err);
      setScannedResult({
        status: 'INVALID',
        code: cleanCode,
        message: 'SYSTEM ERROR: Verification failed. Please check network connection.'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        processingRef.current = false;
      }, 1500);
    }
  };

  // Start Camera Scanner
  const startScanner = async () => {
    setCameraError('');
    setScannedResult(null);

    try {
      // First, ensure any existing instance is fully stopped and cleaned up
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          console.warn('Stop error:', e);
        }
        scannerRef.current = null;
      }

      // Check if browser supports mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Modern browsers require a Secure Context (HTTPS or localhost) for camera access.
        // Mobile browsers are particularly strict about this.
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

        if (!isSecure) {
          setCameraError('Camera access requires HTTPS. You are currently on an insecure connection (HTTP). Please use a secure URL or access via localhost for testing.');
        } else {
          setCameraError('Camera access not supported by this browser. Please use Chrome or Safari.');
        }
        return;
      }

      const html5Qr = new Html5Qrcode('gatekeeper-reader');
      scannerRef.current = html5Qr;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Scalable QR box: 70% of the smallest dimension
          const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      // Start scanning with the back camera (environment)
      await html5Qr.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          processTicketCode(decodedText);
        },
        (errorMessage) => {
          // Frame misses are normal, no action needed
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.error('Camera initiation failed:', err);
      const errorMsg = err?.toString() || '';

      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission denied')) {
        setCameraError('Camera permission denied. Please enable camera access in your browser settings and refresh.');
      } else if (errorMsg.includes('NotFoundError')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not access camera. Ensure you are on HTTPS and not using the camera in another tab.');
      }
      setCameraActive(false);
    }
  };

  // Stop Camera Scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setCameraActive(false);
  };

  // Auto-start scanner when authenticated and clean up on unmount
  useEffect(() => {
    if (isAuthenticated) {
      // Give the DOM a moment to render the viewfinder container
      const timer = setTimeout(() => {
        startScanner();
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {});
        }
      };
    }
  }, [isAuthenticated]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processTicketCode(manualCode);
      setManualCode('');
    }
  };

  // 1. Authentication Barrier
  if (!isAuthenticated) {
    return (
      <StaffLogin
        title="Staff Log In"
        subtitle=""
        allowedEmails={['admin@gcc.com', 'qrscanner*@gcc.com']}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  // 2. Active Gatekeeper Verification Console
  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header & Gate Selector */}
      <ScrollReveal delay={100} direction="up" duration={850}>
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border-2 border-slate-300/90 p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sage-base text-sage-deep border border-sage-border flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              Live Gate Verification
            </h2>
          </div>
        </div>

        {/* Gate Selection Dropdown */}
        <div className="relative">
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="text-xs font-semibold bg-white/90 border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sage-base pr-8 appearance-none cursor-pointer shadow-xs"
          >
            {GATE_LOCATIONS.map((gate) => (
              <option key={gate} value={gate}>{gate}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      </ScrollReveal>

      {/* Verification Feedback Result Card (High Priority Modal/Banner) */}
      {scannedResult && (
        <div className="animate-fadeIn">
          {scannedResult.status === 'VALID' && (
            <div className="p-5 rounded-2xl bg-status-successBg border-2 border-status-successBorder text-status-successText shadow-card">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
                      Entry Approved
                    </span>
                    <span className="text-xs font-mono text-emerald-800">
                      {scannedResult.data?.checkedInAt}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold mt-1 leading-tight">
                    {scannedResult.message}
                  </h3>
                  <div className="mt-2 text-xs text-emerald-800/90 font-medium">
                    <p>Attendee: <strong>{scannedResult.data?.fullName}</strong> ({scannedResult.data?.ticketCode})</p>
                    <p>Tier: {scannedResult.data?.tier} • Hand physical band immediately.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {scannedResult.status === 'DUPLICATE' && (
            <div className="p-5 rounded-2xl bg-status-duplicateBg border-2 border-status-duplicateBorder text-status-duplicateText shadow-card animate-shake">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-7 h-7 text-rose-700 shrink-0 animate-bounce" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      Security Alert
                    </span>
                    <span className="text-xs font-mono text-rose-800 font-bold">
                      DO NOT ADMIT
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold mt-1 leading-tight text-rose-950">
                    {scannedResult.message}
                  </h3>
                  <div className="mt-2 text-xs text-rose-900 font-medium">
                    <p>Holder: <strong>{scannedResult.data?.fullName}</strong> ({scannedResult.data?.ticketCode})</p>
                    <p className="font-bold underline mt-0.5">Physical wristband already distributed for this credential.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {scannedResult.status === 'INVALID' && (
            <div className="p-5 rounded-2xl bg-status-duplicateBg border-2 border-status-duplicateBorder text-status-duplicateText shadow-card">
              <div className="flex items-start gap-3">
                <XCircle className="w-7 h-7 text-rose-700 shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-rose-950">
                    {scannedResult.message}
                  </h3>
                  <p className="text-xs text-rose-800 mt-1">
                    Scanned code: <span className="font-mono font-bold">{scannedResult.code}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Camera Viewfinder Card */}
      <ScrollReveal delay={250} direction="up" duration={900}>
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border-2 border-slate-300/90 p-5 sm:p-6 shadow-[0_20px_45px_-8px_rgba(15,23,42,0.18),inset_0_2px_0_rgba(255,255,255,1)] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
            <Camera className="w-4 h-4 text-sage-deep" />
            <span>Camera Viewfinder</span>
          </div>

          <div className="flex items-center gap-2">
            {cameraActive ? (
              <button
                onClick={stopScanner}
                className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-1.5 border-2 border-slate-300 shadow-sm transition-all active:translate-y-0.5"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={startScanner}
                className="px-3.5 py-1.5 rounded-xl bg-sage-deep hover:bg-emerald-950 text-white text-xs font-black flex items-center gap-1.5 border-2 border-emerald-950/40 shadow-3d-btn active:translate-y-0.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Viewfinder Container */}
        <div className="relative w-full aspect-square max-w-[340px] mx-auto bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-2xl">
          <div id="gatekeeper-reader" className="w-full h-full object-cover"></div>

          {/* Animated Laser Scanline when Camera is active */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] absolute animate-scanline" />
              {/* Corner Viewfinder Brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
            </div>
          )}

          {/* Placeholder when Camera is stopped or Error */}
          {!cameraActive && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-slate-400 z-10">
              {cameraError ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-rose-500 mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-white mb-2">Camera Access Required</p>
                  <p className="text-[11px] text-slate-400 mb-4 max-w-[240px]">
                    {cameraError}
                  </p>
                  <button
                    onClick={startScanner}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold border-2 border-rose-800 shadow-md hover:bg-rose-700 transition-all flex items-center gap-2 active:translate-y-0.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Permission
                  </button>
                </>
              ) : (
                <>
                  <Smartphone className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-xs font-bold text-slate-300">
                    Camera is Currently Inactive
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                    Tap below to activate live video stream for instant QR scanning.
                  </p>
                  <button
                    onClick={startScanner}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-sage-deep text-white text-xs font-black border-2 border-emerald-950/40 shadow-3d-btn hover:bg-emerald-950 transition-all active:translate-y-0.5"
                  >
                    Activate Scanner
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {cameraError && !cameraActive && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50/90 border-2 border-rose-200 flex flex-col gap-2 shadow-sm">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                <strong>Steward Note:</strong> If prompts don't appear, check your address bar for a
                <span className="inline-block mx-1 px-1.5 py-0.5 bg-rose-200 rounded font-bold text-rose-900">Camera Icon</span>
                to reset site permissions manually.
              </p>
            </div>

            {window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
              <div className="pt-2 border-t border-rose-200/50 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  <strong>Testing Tip:</strong> Mobile browsers block camera access on <span className="font-bold underline">HTTP</span>. Use an HTTPS tunnel (like ngrok) or access via <span className="font-bold underline">https://</span> to scan on your phone.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-sage-deep" />
            Audible & Haptic feedback active
          </span>
          <span>Response latency &lt;250ms</span>
        </div>
      </div>
      </ScrollReveal>

      {/* Manual Code Fallback Input (for cracked or dead screens) */}
      <ScrollReveal delay={400} direction="up" duration={900}>
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border-2 border-slate-300/90 p-5 shadow-md">
        <h3 className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-slate-500" />
          <span>Manual Ticket Code Fallback</span>
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">
          For attendees with cracked glass, flat phone batteries, or paper printouts.
        </p>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. GCC-2026-4821 or GCC-VIP-GOLD-019"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-xs font-mono bg-canvas-inset focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-base uppercase shadow-inner"
          />
          <button
            type="submit"
            disabled={isProcessing || !manualCode.trim()}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-sage-deep hover:bg-emerald-950 text-white font-black text-xs border-2 border-emerald-950/40 shadow-3d-btn disabled:opacity-50 transition-all shrink-0 active:translate-y-0.5"
          >
            {isProcessing ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
      </ScrollReveal>
    </div>
  );
}
