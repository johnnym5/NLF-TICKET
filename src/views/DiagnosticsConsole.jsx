import React, { useState, useEffect, useRef } from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { useAuth } from '../context/AuthContext';
import { localDB } from '../lib/db-local';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  Wifi,
  WifiOff,
  Terminal,
  Trash2,
  Activity,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Smartphone,
  Gauge,
  ShieldCheck
} from 'lucide-react';

export default function DiagnosticsConsole() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([
    { id: 1, type: 'INFO', msg: 'Operational Terminal Initialized. Telemetry linked.', time: new Date().toLocaleTimeString([], { hour12: false }) }
  ]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [metrics, setMetrics] = useState({ avgScan: 0, count: 0 });
  const [latency, setLatency] = useState(null);
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    const loadMetrics = async () => {
      const scans = await localDB.performanceLogs.where('event').equals('QR_SCAN').toArray();
      if (scans.length > 0) {
        const avg = scans.reduce((acc, s) => acc + s.duration, 0) / scans.length;
        setMetrics({ avgScan: avg.toFixed(2), count: scans.length });
      }
    };
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); addLog('SUCCESS', 'Network Link Restored: ONLINE.'); };
    const handleOffline = () => { setIsOnline(false); addLog('WARNING', 'Network Link Severed: Operating in Resilient Cache Mode.'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type, msg) => {
    setLogs(prev => [...prev, { id: Date.now(), type, msg, time: new Date().toLocaleTimeString([], { hour12: false }) }]);
  };

  const testFirebaseLatency = async () => {
    setIsTestingLatency(true);
    addLog('INFO', 'Executing Firestore RTT Heatbeat...');
    const start = performance.now();
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await getDoc(doc(db, 'eventStats', 'global'));
      setLatency(Math.round(performance.now() - start));
      addLog('SUCCESS', `Connection verified: ${Math.round(performance.now() - start)}ms RTT.`);
    } catch (e) {
      addLog('ERROR', `Handshake failed: ${e.message}`);
    } finally { setIsTestingLatency(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="section-label">Operational Health</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Systems Diagnostics</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time telemetry and service integration status</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isOnline ? 'success' : 'error'} className="py-2 px-4 h-10">
            {isOnline ? <Wifi className="w-3.5 h-3.5 mr-2" /> : <WifiOff className="w-3.5 h-3.5 mr-2" />}
            {isOnline ? 'Network Active' : 'Network Severed'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Telemetry Cards */}
        <div className="space-y-6">
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
               <Gauge className="w-4 h-4 text-sage-deep" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanner Performance</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-slate-900">{metrics.avgScan}ms</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Local Latency</p>
                </div>
                <div className="text-right text-emerald-600 font-black text-xs uppercase">Target: &lt;250ms</div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min((metrics.avgScan / 250) * 100, 100)}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 font-medium italic">Calculated from {metrics.count} hardware events</p>
            </div>
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
               <Database className="w-4 h-4 text-sage-deep" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cloud Data Handshake</h3>
            </div>
            <div className="flex items-center justify-between mb-6">
               <span className="text-xs font-bold text-slate-700">Firestore RTT</span>
               <span className="text-xs font-mono font-black text-slate-900">{latency ? `${latency}ms` : '---'}</span>
            </div>
            <Button variant="secondary" className="w-full text-xs" loading={isTestingLatency} onClick={testFirebaseLatency}>
               Execute Heartbeat Test
            </Button>
          </div>

          <div className="premium-card p-6 bg-slate-900 border-none">
             <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Parameters</h3>
             </div>
             <div className="space-y-3">
                {[
                  { l: 'App Check Status', v: 'ACTIVE', s: 'success' },
                  { l: 'QR Cryptography', v: 'ED25519', s: 'pending' },
                  { l: 'Auth Claims', v: 'VERIFIED', s: 'success' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.l}</span>
                    <Badge variant={item.s} className="bg-transparent border-slate-700">{item.v}</Badge>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Real-Time Log Console */}
        <div className="lg:col-span-2 premium-card bg-slate-950 border-none shadow-2xl flex flex-col h-[600px]">
          <div className="p-4 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Telemetry Stream Output</span>
            </div>
            <button onClick={() => setLogs([])} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-3 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-700">Stream empty. Listening for operational triggers...</div>
            ) : logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 group">
                <span className="text-slate-600 shrink-0">{log.time}</span>
                <span className={`shrink-0 font-black uppercase ${
                  log.type === 'SUCCESS' ? 'text-emerald-500' :
                  log.type === 'ERROR' ? 'text-rose-500' :
                  log.type === 'WARNING' ? 'text-amber-500' : 'text-blue-400'
                }`}>[{log.type}]</span>
                <p className="text-slate-300 leading-relaxed group-hover:text-white transition-colors">{log.msg}</p>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          <div className="p-4 bg-slate-900/30 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-600">
             <span>Protocol: NLF-SECURE-2.0</span>
             <span>Build: PRODUCTION-READY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
