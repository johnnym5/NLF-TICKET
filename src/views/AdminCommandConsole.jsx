import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, TIER_WRISTBANDS, TIER_LABELS } from '../context/AuthContext';
import StaffLogin from '../components/StaffLogin';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  Users,
  UserCheck,
  TrendingUp,
  Search,
  ChevronDown,
  Activity,
  Download,
  RotateCcw,
  RefreshCw,
  UserX,
  UserCheck2,
  CheckCircle2,
  Layers,
  BarChart3,
  Clock,
  Filter,
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Crown,
  Link2,
  Copy,
  Check
} from 'lucide-react';

const FESTIVAL_DAYS = [
  { id: 'day1', label: 'Day 1' },
  { id: 'day2', label: 'Day 2' },
  { id: 'day3', label: 'Day 3' }
];

export const ACCOUNT_TYPES = {
  REGULAR: { label: 'General Admission', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  VIP_SILVER: { label: 'VIP Silver Hospitality', badgeBg: 'bg-slate-100 text-slate-700 border-slate-300' },
  VIP_GOLD: { label: 'VIP Gold Delegate', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  VIP_PLATINUM: { label: 'Platinum Protocol', badgeBg: 'bg-slate-900 text-amber-300 border-slate-700' },
  TEAM_MEMBER: { label: 'Official Team Member', badgeBg: 'bg-blue-100 text-blue-900 border-blue-300' },
  VENDOR: { label: 'Certified Vendor', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300' },
  ASSOCIATE: { label: 'Partner Associate', badgeBg: 'bg-purple-100 text-purple-900 border-purple-300' }
};

export default function AdminCommandConsole({ onNavigate }) {
  const { currentUser, userRole } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Live attendees list from Firestore
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [showExecutiveDashboard, setShowExecutiveDashboard] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, CHECKED_IN, PENDING, REVOKED
  const [tierFilter, setTierFilter] = useState('ALL'); // ALL, VIP, NORMAL
  const [specificTierFilter, setSpecificTierFilter] = useState('ALL');
  const [dayFilter, setDayFilter] = useState('ALL');

  // Advanced Registration Time Filtering
  const [regTimeScope, setRegTimeScope] = useState('ALL'); // ALL, TODAY, THIS_WEEK, THIS_MONTH
  const [selectedCustomDate, setSelectedCustomDate] = useState('');

  // VIP Invitation Generator State
  const [selectedVipTier, setSelectedVipTier] = useState('VIP_GOLD');
  const [generatedVipUrl, setGeneratedVipUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleGenerateVipLink = async () => {
    setIsGenerating(true);
    const inviteId = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    try {
      await setDoc(doc(db, 'vipInvitations', inviteId), {
        tier: selectedVipTier,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt.toISOString(),
        isUsed: false,
        createdBy: currentUser.uid
      });

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nlf2026.carnival.ng';
      setGeneratedVipUrl(`${baseUrl}/?invite=${inviteId}`);
    } catch (err) {
      console.error('Failed to generate invite:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyVipLink = async () => {
    if (!generatedVipUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedVipUrl);
      } else {
        // Fallback for insecure contexts (HTTP / IP Access)
        const textArea = document.createElement("textarea");
        textArea.value = generatedVipUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn('Clipboard failed:', e);
      alert('Manual Copy Required: ' + generatedVipUrl);
    }
  };

  const handleAdjustDate = (offset) => {
    let baseDate = selectedCustomDate ? new Date(selectedCustomDate) : new Date();
    if (isNaN(baseDate.getTime())) baseDate = new Date();

    baseDate.setDate(baseDate.getDate() + offset);
    const newDateStr = baseDate.toISOString().split('T')[0];
    setSelectedCustomDate(newDateStr);
    setRegTimeScope('CUSTOM');
  };

  useEffect(() => {
    setIsAuthenticated(userRole === 'executive_admin' || currentUser?.email === 'admin@gcc.com');
  }, [userRole, currentUser]);

  // Real-time synchronization
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    const attendeesRef = collection(db, 'attendees');
    const q = query(attendeesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAttendees(records);
      setLoading(false);
    }, (err) => {
      console.error('Admin real-time error:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // Helper: Date Logic for filtering
  const isInTimeScope = (createdAt, scope) => {
    if (!createdAt || scope === 'ALL') return true;

    // Support both serverTimestamp (obj with seconds) and ISO strings
    const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    const now = new Date();

    if (scope === 'TODAY') {
      return date.toDateString() === now.toDateString();
    }

    if (scope === 'THIS_WEEK') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      return date >= startOfWeek;
    }

    if (scope === 'THIS_MONTH') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }

    if (selectedCustomDate) {
      return date.toISOString().split('T')[0] === selectedCustomDate;
    }

    return true;
  };

  // Derive Statistics directly from the live attendees list
  const stats = useMemo(() => {
    // We apply time scope only to the "Registrations" count to show velocity
    const scopeAttendees = attendees.filter(a => isInTimeScope(a.createdAt, regTimeScope));

    const total = scopeAttendees.length;
    const checkedIn = scopeAttendees.filter(a => a.status === 'CHECKED_IN').length;
    const pending = scopeAttendees.filter(a => a.status === 'REGISTERED').length;
    const revoked = scopeAttendees.filter(a => a.accessRevoked === true).length;

    const dayDistribution = { day1: 0, day2: 0, day3: 0 };
    scopeAttendees.forEach(a => {
      if (a.daysAttended) {
        if (a.daysAttended.day1) dayDistribution.day1++;
        if (a.daysAttended.day2) dayDistribution.day2++;
        if (a.daysAttended.day3) dayDistribution.day3++;
      } else if (a.status === 'CHECKED_IN') {
        dayDistribution.day1++;
      }
    });

    const turnoutRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return { total, checkedIn, pending, revoked, dayDistribution, turnoutRate };
  }, [attendees, regTimeScope, selectedCustomDate]);

  // Filtered list for display in the table
  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      const queryStr = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (a.fullName || '').toLowerCase().includes(queryStr) ||
        (a.email || '').toLowerCase().includes(queryStr) ||
        (a.ticketCode || '').toLowerCase().includes(queryStr);

      if (!matchesSearch) return false;

      // Card-based status filtering
      if (activeFilter === 'CHECKED_IN' && a.status !== 'CHECKED_IN') return false;
      if (activeFilter === 'PENDING' && a.status !== 'REGISTERED') return false;
      if (activeFilter === 'REVOKED' && !a.accessRevoked) return false;

      // VIP vs Normal Logic
      if (tierFilter === 'VIP' && !(a.tier || '').startsWith('VIP')) return false;
      if (tierFilter === 'NORMAL' && (a.tier || '').startsWith('VIP')) return false;

      // Specific Tier
      if (specificTierFilter !== 'ALL' && a.tier !== specificTierFilter) return false;

      // Distribution-based Day filtering
      if (dayFilter !== 'ALL') {
        const hasAttended = a.daysAttended?.[dayFilter] || (dayFilter === 'day1' && a.status === 'CHECKED_IN');
        if (!hasAttended) return false;
      }

      // Registration Time Filter
      if (!isInTimeScope(a.createdAt, regTimeScope)) return false;

      return true;
    });
  }, [attendees, searchTerm, activeFilter, tierFilter, specificTierFilter, dayFilter, regTimeScope, selectedCustomDate]);

  const handleUpgradeAccount = async (attendee, newTier) => {
    if (!window.confirm(`Upgrade ${attendee.fullName} to ${newTier}?`)) return;
    try {
      await updateDoc(doc(db, 'attendees', attendee.id), {
        tier: newTier,
        wristbandColor: TIER_WRISTBANDS[newTier] || 'Emerald Green'
      });
    } catch (err) { alert(err.message); }
  };

  const handleUpdateRole = async (attendee, newRole) => {
    if (!window.confirm(`Change ${attendee.fullName} role to ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, 'attendees', attendee.id), {
        role: newRole
      });
    } catch (err) { alert(err.message); }
  };

  const handleToggleRevocation = async (attendee) => {
    if (!window.confirm(`${attendee.accessRevoked ? 'Restore' : 'Revoke'} access for ${attendee.fullName}?`)) return;
    try {
      const isNowRevoked = !attendee.accessRevoked;
      await updateDoc(doc(db, 'attendees', attendee.id), {
        accessRevoked: isNowRevoked,
        status: isNowRevoked ? 'REVOKED' : (attendee.status === 'REVOKED' ? 'REGISTERED' : attendee.status)
      });
    } catch (err) { alert(err.message); }
  };

  const handleResetQR = async (attendee) => {
    if (!window.confirm(`Regenerate QR code for ${attendee.fullName}?`)) return;
    const entropy = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await updateDoc(doc(db, 'attendees', attendee.id), {
        ticketCode: `GCC-2026-${entropy}`,
        status: 'REGISTERED',
        daysAttended: { day1: false, day2: false, day3: false }
      });
    } catch (err) { alert(err.message); }
  };

  const handleManualCheckIn = async (attendee) => {
    if (!window.confirm(`Manually check in ${attendee.fullName}?`)) return;
    try {
      await updateDoc(doc(db, 'attendees', attendee.id), {
        status: 'CHECKED_IN',
        checkedInAt: new Date().toLocaleTimeString(),
        checkedInFullDate: new Date().toISOString(),
        checkedInBy: 'ADMIN_MANUAL',
        daysAttended: { ...(attendee.daysAttended || {}), day1: true }
      });
    } catch (err) { alert(err.message); }
  };

  const handleExportCsv = () => {
    if (attendees.length === 0) return;
    const headers = ['Full Name', 'Email', 'Ticket Code', 'Tier', 'Status', 'Revoked', 'Registration Date'];
    const rows = attendees.map(a => {
        const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
        return [
            `"${a.fullName}"`, `"${a.email}"`, `"${a.ticketCode}"`, `"${a.tier}"`, `"${a.status}"`, `"${a.accessRevoked}"`, `"${date.toLocaleDateString()}"`
        ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `GCC_Attendees_Master.csv`);
    link.click();
  };

  if (!isAuthenticated) return <StaffLogin title="Executive Hub" subtitle="Authorized Access Only" allowedEmails={['admin@gcc.com']} onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowExecutiveDashboard(!showExecutiveDashboard)}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${showExecutiveDashboard ? 'bg-[#0F4A2F] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">Executive Command Hub</h1>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showExecutiveDashboard ? 'rotate-180' : ''}`} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Venue Accreditation Telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="secondary" size="sm" icon={Activity} onClick={() => onNavigate?.('diagnostics')}>Diagnostics</Button>
           <Button size="sm" icon={Download} onClick={handleExportCsv}>Export Master Data</Button>
        </div>
      </div>

      {/* Main Stats (Collapsible) */}
      {showExecutiveDashboard && (
        <div className="space-y-6 animate-fadeIn">
          {/* VIP Invitation Link Generator */}
          <div className="bg-white rounded-3xl border border-champagne-border p-6 shadow-sm bg-gradient-to-r from-white via-champagne-light/20 to-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-champagne-text" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">VIP Link Dispatcher</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Generate a temporary (15 min) one-time invitation link for executive delegates and royalty.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                  {['VIP_SILVER', 'VIP_GOLD', 'VIP_PLATINUM'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => setSelectedVipTier(tier)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedVipTier === tier ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {tier.split('_')[1]}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateVipLink}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-[#0F4A2F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-emerald-950 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                  Generate Link
                </button>
              </div>
            </div>

            {generatedVipUrl && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-fadeIn space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 font-mono text-[10px] text-slate-500 truncate px-2">{generatedVipUrl}</div>
                  <button
                    onClick={handleCopyVipLink}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${copiedLink ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                  >
                    {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-2 px-2 border-t border-slate-200/50 pt-2">
                  <Clock className="w-3 h-3 text-rose-500" />
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">This link will self-destruct in 15 minutes. One use only.</span>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Registration Velocity Filter */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5" />
                Reg Timeframe:
            </span>
            {[
                { id: 'ALL', label: 'Lifetime', icon: Layers },
                { id: 'TODAY', label: 'Today', icon: Clock },
                { id: 'THIS_WEEK', label: 'Weekly', icon: CalendarDays },
                { id: 'THIS_MONTH', label: 'Monthly', icon: Calendar }
            ].map(btn => (
                <button
                    key={btn.id}
                    onClick={() => { setRegTimeScope(btn.id); setSelectedCustomDate(''); }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${regTimeScope === btn.id ? 'bg-[#0F4A2F] text-white border-[#0F4A2F] shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                >
                    {btn.label}
                </button>
            ))}
            <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden sm:block" />

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1">
                <button
                    onClick={() => handleAdjustDate(-1)}
                    className="p-1.5 text-slate-400 hover:text-[#0F4A2F] transition-colors"
                    title="Previous Day"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <input
                    type="date"
                    value={selectedCustomDate}
                    onChange={(e) => { setSelectedCustomDate(e.target.value); setRegTimeScope('CUSTOM'); }}
                    className="bg-transparent border-none py-1.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-0 w-28"
                />
                <button
                    onClick={() => handleAdjustDate(1)}
                    className="p-1.5 text-slate-400 hover:text-[#0F4A2F] transition-colors"
                    title="Next Day"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* All Registrations Card */}
            <button
              onClick={() => { setActiveFilter('ALL'); setDayFilter('ALL'); }}
              className={`premium-card p-6 flex flex-col justify-between h-36 text-left transition-all ${activeFilter === 'ALL' && dayFilter === 'ALL' ? 'border-[#0F4A2F] ring-2 ring-[#0F4A2F]/10 bg-slate-50 shadow-lg' : 'hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Registrations</span>
                <Users className={`w-4 h-4 ${activeFilter === 'ALL' ? 'text-[#0F4A2F]' : 'text-slate-300'}`} />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
              <p className="text-[10px] font-bold text-slate-400 italic">
                  {regTimeScope === 'ALL' ? 'Global Database Baseline' : `Filtered Registration Intake`}
              </p>
            </button>

            {/* Checked In Card */}
            <button
              onClick={() => { setActiveFilter('CHECKED_IN'); setDayFilter('ALL'); }}
              className={`premium-card p-6 flex flex-col justify-between h-36 text-left transition-all ${activeFilter === 'CHECKED_IN' ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50 shadow-lg' : 'hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Present At Venue</span>
                <UserCheck className={`w-4 h-4 ${activeFilter === 'CHECKED_IN' ? 'text-emerald-500' : 'text-slate-300'}`} />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.checkedIn}</p>
              <p className="text-[10px] font-bold text-emerald-600/60 uppercase">Wristbands Distributed</p>
            </button>

            {/* Pending Card */}
            <button
              onClick={() => { setActiveFilter('PENDING'); setDayFilter('ALL'); }}
              className={`premium-card p-6 flex flex-col justify-between h-36 text-left transition-all ${activeFilter === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-500/10 bg-amber-50 shadow-lg' : 'hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Arrivals</span>
                <Clock className={`w-4 h-4 ${activeFilter === 'PENDING' ? 'text-amber-500' : 'text-slate-300'}`} />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.pending}</p>
              <p className="text-[10px] font-bold text-amber-600/60 uppercase">Registered but unscanned</p>
            </button>

            {/* Turnout Rate (Static) */}
            <div className="premium-card p-6 flex flex-col justify-between h-36 bg-slate-900 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Turnout</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-4xl font-black tracking-tighter">{stats.turnoutRate}%</p>
              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mt-1">
                <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${stats.turnoutRate}%` }} />
              </div>
            </div>
          </div>

          {/* 3-Day Distribution & Attendance Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 premium-card p-8 border-slate-200 shadow-lg bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">3-Day Attendance Distribution</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {FESTIVAL_DAYS.map((fest) => {
                  const count = stats.dayDistribution[fest.id] || 0;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const isActive = dayFilter === fest.id;
                  return (
                    <button
                      key={fest.id}
                      onClick={() => { setDayFilter(isActive ? 'ALL' : fest.id); setActiveFilter('ALL'); }}
                      className={`text-left space-y-3 p-4 rounded-3xl border-2 transition-all group ${isActive ? 'border-[#0F4A2F] bg-[#EBF3EE] shadow-md' : 'border-transparent hover:bg-slate-50'}`}
                    >
                      <div className="flex items-end justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-[#0F4A2F] transition-colors">{fest.label}</span>
                        <span className="text-sm font-mono font-black text-slate-900">{count}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${isActive ? 'bg-[#0F4A2F]' : 'bg-[#E4B03A]'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">{pct}% Daily Capacity</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="premium-card p-8 bg-[#FAF6EC] border-[#FEF3D6] shadow-md">
               <h3 className="text-xs font-black text-[#E4B03A] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Filter className="w-4 h-4" />
                 Active View Scope
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Filtered Result:</span>
                    <span className="font-black text-[#0F4A2F] text-lg">{filteredAttendees.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="pending" className="bg-white border-slate-200">{activeFilter}</Badge>
                    {tierFilter !== 'ALL' && <Badge variant="gold">{tierFilter}</Badge>}
                    {specificTierFilter !== 'ALL' && <Badge variant="pending">{specificTierFilter}</Badge>}
                    {dayFilter !== 'ALL' && <Badge variant="success">{dayFilter.toUpperCase()}</Badge>}
                    {regTimeScope !== 'ALL' && <Badge variant="pending" className="border-blue-200 text-blue-700">{regTimeScope}</Badge>}
                  </div>
                  <button
                    onClick={() => {
                        setActiveFilter('ALL');
                        setTierFilter('ALL');
                        setSpecificTierFilter('ALL');
                        setDayFilter('ALL');
                        setRegTimeScope('ALL');
                        setSearchTerm('');
                        setSelectedCustomDate('');
                    }}
                    className="w-full py-3 bg-white hover:bg-white/50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-4 text-slate-500 hover:text-rose-600"
                  >
                    Reset All Dashboard Filters
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search attendee registry..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#0F4A2F]/10 transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest py-4 px-6 focus:ring-2 focus:ring-[#0F4A2F]/10 cursor-pointer"
              >
                <option value="ALL">Classification</option>
                <option value="VIP">VIPs Only</option>
                <option value="NORMAL">Standard Only</option>
              </select>

              <select
                value={specificTierFilter}
                onChange={e => setSpecificTierFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest py-4 px-6 focus:ring-2 focus:ring-[#0F4A2F]/10 cursor-pointer"
              >
                <option value="ALL">Exact Tier</option>
                {Object.keys(ACCOUNT_TYPES).map(k => <option key={k} value={k}>{ACCOUNT_TYPES[k].label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-8 py-5">Attendee Detail</th>
                <th className="px-8 py-5">Ticket Code</th>
                <th className="px-8 py-5">Status & Attendance</th>
                <th className="px-8 py-5 text-right">Gate Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendees.length === 0 ? (
                <tr><td colSpan="4" className="px-8 py-24 text-center text-slate-400 italic font-medium">No results found matching your criteria.</td></tr>
              ) : (
                filteredAttendees.map(attendee => {
                  const roleConfig = ACCOUNT_TYPES[attendee.tier] || ACCOUNT_TYPES.REGULAR;
                  const isRevoked = attendee.accessRevoked === true;

                  return (
                    <tr key={attendee.id} className={`hover:bg-slate-50/50 transition-colors group ${isRevoked ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{attendee.fullName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{attendee.email}</span>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase mt-1.5 w-fit ${roleConfig.badgeBg}`}>
                            {roleConfig.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="pending" className="font-mono bg-white border-slate-200 px-3">{attendee.ticketCode}</Badge>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <Badge variant={isRevoked ? 'error' : (attendee.status === 'CHECKED_IN' ? 'success' : 'pending')} className="w-fit">
                            {isRevoked ? 'Access Revoked' : attendee.status.replace('_', ' ')}
                          </Badge>
                          <div className="flex gap-1.5">
                             {['day1', 'day2', 'day3'].map(d => (
                               <div key={d} className={`w-6 h-1.5 rounded-full transition-all ${attendee.daysAttended?.[d] ? 'bg-emerald-500 shadow-sm' : 'bg-slate-200'}`} title={`${d} attendance`} />
                             ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          {/* Role Upgrade Dropdown */}
                          <div className="flex flex-col gap-1 items-end">
                            <select
                              value={attendee.role || 'attendee'}
                              onChange={(e) => handleUpdateRole(attendee, e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase py-1 px-2 focus:ring-2 focus:ring-[#0F4A2F]/10 cursor-pointer shadow-xs"
                            >
                              <option value="attendee">Attendee</option>
                              <option value="gatekeeper">Staff</option>
                              <option value="executive_admin">Admin</option>
                            </select>
                            <select
                              value={attendee.tier || 'REGULAR'}
                              onChange={(e) => handleUpgradeAccount(attendee, e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase py-1 px-2 focus:ring-2 focus:ring-[#0F4A2F]/10 cursor-pointer shadow-xs"
                            >
                              {Object.keys(ACCOUNT_TYPES).map(k => <option key={k} value={k}>{ACCOUNT_TYPES[k].label}</option>)}
                            </select>
                          </div>

                          <div className="h-8 w-[1px] bg-slate-100 mx-1" />

                          {attendee.status !== 'CHECKED_IN' && !isRevoked && (
                            <button onClick={() => handleManualCheckIn(attendee)} className="p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors shadow-sm border border-emerald-200" title="Manual Check-in">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleResetQR(attendee)} className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200" title="Reset Ticket">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleRevocation(attendee)} className={`p-2.5 rounded-xl transition-all border ${isRevoked ? 'bg-[#0F4A2F] text-white border-[#0F4A2F] shadow-md' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`} title={isRevoked ? 'Restore Access' : 'Revoke Access'}>
                            {isRevoked ? <UserCheck2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
