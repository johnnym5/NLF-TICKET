import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TIER_WRISTBANDS, TIER_LABELS, useAuth } from '../context/AuthContext';
import StaffLogin from '../components/StaffLogin';
import ScrollReveal from '../components/ScrollReveal';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Search, 
  Filter, 
  Lock, 
  KeyRound, 
  Link2, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Crown,
  Calendar as CalendarIcon,
  ChevronDown,
  BarChart3,
  MapPin,
  Clock3,
  Hash,
  Activity
} from 'lucide-react';

const GATE_LOCATIONS = [
  'Gate 1 - Main North Entrance',
  'Gate 2 - VIP West Dignitary Gate',
  'Gate 3 - East Grandstand Access',
  'Gate 4 - Livestock Exhibition Ring',
  'Admin Manual Override'
];

export default function AdminCommandConsole({ onNavigate }) {
  const { currentUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Live attendees state from Firestore
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CHECKED_IN' | 'PENDING' | 'VIP'
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  const [selectedWeek, setSelectedWeek] = useState(null); // 'YYYY-Wxx'
  const [selectedGate, setSelectedGate] = useState('ALL');

  // VIP Link Generator State
  const [selectedVipTier, setSelectedVipTier] = useState('gold');
  const [copiedLink, setCopiedLink] = useState(false);

  // Validate Admin Email
  useEffect(() => {
    if (currentUser && currentUser.email === 'admin@gcc.com') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [currentUser]);

  // Real-time Firestore onSnapshot subscription
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    const attendeesRef = collection(db, 'attendees');

    const unsubscribe = onSnapshot(attendeesRef, (snapshot) => {
      const records = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setAttendees(records);
      setLoading(false);
    }, (err) => {
      console.warn('Firestore snapshot error:', err);
      setAttendees([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // One-click Manual Check-In Override
  const handleManualCheckIn = async (attendee) => {
    if (!window.confirm(`Confirm manual entry override for ${attendee.fullName} (${attendee.ticketCode})?`)) {
      return;
    }

    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const checkInFullDate = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'attendees', attendee.id), {
        status: 'CHECKED_IN',
        checkedInAt: checkInTime,
        checkedInFullDate: checkInFullDate,
        checkedInBy: 'Admin Manual Override'
      });
    } catch (err) {
      console.warn('Manual check-in write fallback:', err);
      setAttendees(prev => prev.map(a => a.id === attendee.id ? {
        ...a,
        status: 'CHECKED_IN',
        checkedInAt: checkInTime,
        checkedInFullDate: checkInFullDate,
        checkedInBy: 'Admin Manual Override'
      } : a));
    }
  };

  // Helper: Get ISO Week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  };

  // Analytics Computation
  const analytics = useMemo(() => {
    const dailyRegistrations = {};
    const weeklyRegistrations = {};
    const dailyAttendance = {};
    const weeklyAttendance = {};
    const gateStats = {};

    attendees.forEach(a => {
      // Registration Analytics
      if (a.createdAt) {
        const regDate = a.createdAt.split('T')[0];
        dailyRegistrations[regDate] = (dailyRegistrations[regDate] || 0) + 1;

        const regWeek = getWeekNumber(new Date(a.createdAt));
        weeklyRegistrations[regWeek] = (weeklyRegistrations[regWeek] || 0) + 1;
      }

      // Attendance Analytics
      if (a.status === 'CHECKED_IN' && a.checkedInFullDate) {
        const attDate = a.checkedInFullDate.split('T')[0];
        dailyAttendance[attDate] = (dailyAttendance[attDate] || 0) + 1;

        const attWeek = getWeekNumber(new Date(a.checkedInFullDate));
        weeklyAttendance[attWeek] = (weeklyAttendance[attWeek] || 0) + 1;

        if (a.checkedInBy) {
          gateStats[a.checkedInBy] = (gateStats[a.checkedInBy] || 0) + 1;
        }
      }
    });

    return {
      dailyRegistrations,
      weeklyRegistrations,
      dailyAttendance,
      weeklyAttendance,
      gateStats
    };
  }, [attendees]);

  // Filter and search logic
  const baseFilteredAttendees = useMemo(() => {
    return attendees.filter(attendee => {
      // 1. Search filter
      const matchesSearch =
        (attendee.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attendee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attendee.ticketCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attendee.tier || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Date filter
      if (selectedDate) {
        const regDate = attendee.createdAt?.split('T')[0];
        const attDate = attendee.checkedInFullDate?.split('T')[0];
        if (regDate !== selectedDate && attDate !== selectedDate) return false;
      }

      // 3. Week filter
      if (selectedWeek) {
        const regWeek = attendee.createdAt ? getWeekNumber(new Date(attendee.createdAt)) : null;
        const attWeek = attendee.checkedInFullDate ? getWeekNumber(new Date(attendee.checkedInFullDate)) : null;
        if (regWeek !== selectedWeek && attWeek !== selectedWeek) return false;
      }

      // 4. Gate filter
      if (selectedGate !== 'ALL' && attendee.checkedInBy !== selectedGate) return false;

      return true;
    });
  }, [attendees, searchTerm, selectedDate, selectedWeek, selectedGate]);

  // Tab-specific Filtered Set (for the list)
  const filteredAttendees = useMemo(() => {
    return baseFilteredAttendees.filter(attendee => {
      if (activeFilter === 'CHECKED_IN') return attendee.status === 'CHECKED_IN';
      if (activeFilter === 'PENDING') return attendee.status === 'REGISTERED';
      if (activeFilter === 'VIP') return (attendee.tier || '').startsWith('VIP');
      return true;
    });
  }, [baseFilteredAttendees, activeFilter]);

  // Derived Metrics (derived from base scope)
  const stats = useMemo(() => {
    const total = baseFilteredAttendees.length;
    const present = baseFilteredAttendees.filter(a => a.status === 'CHECKED_IN').length;
    const pending = baseFilteredAttendees.filter(a => a.status !== 'CHECKED_IN').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, pending, rate };
  }, [baseFilteredAttendees]);

  // VIP Link Generator
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nlf2026.carnival.ng';
  const generatedVipUrl = `${baseUrl}/ticket?vip=${selectedVipTier}`;

  const handleCopyVipLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedVipUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = generatedVipUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn('Clipboard failed:', e);
    }
  };

  // Export CSV helper
  const handleExportCsv = () => {
    if (attendees.length === 0) return;
    const headers = ['Full Name', 'Email', 'Ticket Code', 'Tier', 'Assigned Wristband', 'Status', 'Checked In At', 'Checked In By', 'Referral Source', 'Created At'];
    const rows = attendees.map(a => [
      `"${a.fullName || ''}"`,
      `"${a.email || ''}"`,
      `"${a.ticketCode || ''}"`,
      `"${a.tier || 'REGULAR'}"`,
      `"${a.wristbandColor || ''}"`,
      `"${a.status || 'REGISTERED'}"`,
      `"${a.checkedInAt || ''}"`,
      `"${a.checkedInBy || ''}"`,
      `"${a.referralSource || ''}"`,
      `"${a.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NLF_2026_Attendees_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Authentication Barrier
  if (!isAuthenticated) {
    return (
      <StaffLogin
        title="Executive Command Hub"
        subtitle="Steering Committee, Federal Government & GCC Leadership Access."
        allowedEmails={['admin@gcc.com']}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  // 2. Executive Command Hub
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Top Banner with Real-time indicator & CSV download */}
      <ScrollReveal delay={100} duration={850}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
                Executive Attendance Command Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('diagnostics')}
              className="px-4 py-2 rounded-xl bg-white/90 hover:bg-slate-50 backdrop-blur-md border-2 border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:translate-y-0.5"
            >
              <Activity className="w-3.5 h-3.5 text-sage-deep" />
              <span>System Diagnostics</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white backdrop-blur-md border-2 border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* 4 Metric Cards - Staggered independent reveal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Metric 1: Total Registrations */}
        <ScrollReveal delay={150} direction="up" duration={850} className="h-full">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`w-full text-left h-full bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 shadow-[0_12px_28px_-6px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,1)] transition-all active:scale-[0.98] ${
              activeFilter === 'ALL' ? 'border-sage-deep ring-2 ring-sage-base/30' : 'border-slate-300/90 hover:border-sage-base hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Registrations</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-canvas-inset border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1.5">
              {stats.total}
            </p>
            <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate">
              {activeFilter === 'ALL' && !selectedDate && !selectedWeek ? '100% baseline' : 'Filtered Subset'}
            </div>
          </button>
        </ScrollReveal>

        {/* Metric 2: Present at Venue (Checked-In) */}
        <ScrollReveal delay={300} direction="up" duration={850} className="h-full">
          <button
            onClick={() => setActiveFilter('CHECKED_IN')}
            className={`w-full text-left h-full backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 shadow-[0_12px_28px_-6px_rgba(22,101,52,0.15),inset_0_1.5px_0_rgba(255,255,255,1)] transition-all active:scale-[0.98] ${
              activeFilter === 'CHECKED_IN'
                ? 'bg-emerald-100/90 border-emerald-600 ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/85 border-emerald-400/90 hover:border-emerald-600 hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-800">Present</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-status-successBg border border-emerald-300 text-status-successText flex items-center justify-center shadow-xs">
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-status-successText mt-1.5">
              {stats.present}
            </p>
            <div className="mt-1.5 text-[10px] sm:text-[11px] text-emerald-700 font-bold truncate">
              Wristbands issued
            </div>
          </button>
        </ScrollReveal>

        {/* Metric 3: Yet to Arrive */}
        <ScrollReveal delay={450} direction="up" duration={850} className="h-full">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`w-full text-left h-full backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 shadow-[0_12px_28px_-6px_rgba(180,83,9,0.12),inset_0_1.5px_0_rgba(255,255,255,1)] transition-all active:scale-[0.98] ${
              activeFilter === 'PENDING'
                ? 'bg-amber-100/90 border-amber-600 ring-2 ring-amber-400/30'
                : 'bg-amber-50/85 border-amber-300/90 hover:border-amber-600 hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-amber-800">Pending</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-status-pendingBg border border-amber-300 text-status-pendingText flex items-center justify-center shadow-xs">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-status-pendingText mt-1.5">
              {stats.pending}
            </p>
            <div className="mt-1.5 text-[10px] sm:text-[11px] text-amber-700 font-bold truncate">
              Unscanned passes
            </div>
          </button>
        </ScrollReveal>

        {/* Metric 4: Live Turnout Rate */}
        <ScrollReveal delay={600} direction="up" duration={850} className="h-full">
          <div className="h-full bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 border-slate-300/90 shadow-[0_12px_28px_-6px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,1)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">Turnout Rate</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sage-base border border-sage-border text-sage-deep flex items-center justify-center shadow-xs">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1.5">
              {stats.rate}%
            </p>
            {/* Sleek Progress Bar */}
            <div className="w-full h-1.5 sm:h-2 bg-canvas-inset border border-slate-200 rounded-full mt-2 sm:mt-3 overflow-hidden">
              <div 
                className="h-full bg-sage-deep rounded-full transition-all duration-700"
                style={{ width: `${Math.min(stats.rate, 100)}%` }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Advanced Telemetry & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Velocity (Daily/Weekly) */}
        <ScrollReveal delay={200} direction="up" className="lg:col-span-2">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl border-2 border-slate-300/90 p-5 sm:p-6 shadow-card h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sage-deep" />
                <h3 className="text-sm font-black text-slate-900">Registration & Attendance Velocity</h3>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-canvas-inset rounded-xl border border-slate-200">
                <button
                  onClick={() => { setSelectedWeek(null); setSelectedDate(null); }}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg hover:bg-white transition-all text-slate-600"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Stats */}
              <div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Daily Breakdown
                </h4>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(analytics.dailyRegistrations).sort().reverse().map(([date, count]) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 transition-all ${
                        selectedDate === date
                          ? 'bg-sage-base border-sage-deep text-sage-deep shadow-sm'
                          : 'bg-canvas-inset border-transparent hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[10px] opacity-70">Turnout: {analytics.dailyAttendance[date] || 0} attendees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black">{count}</span>
                        <ChevronRight className="w-3 h-3 opacity-40" />
                      </div>
                    </button>
                  ))}
                  {Object.keys(analytics.dailyRegistrations).length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs italic">No registration data available</div>
                  )}
                </div>
              </div>

              {/* Weekly Stats */}
              <div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Weekly Trends
                </h4>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(analytics.weeklyRegistrations).sort().reverse().map(([week, count]) => (
                    <button
                      key={week}
                      onClick={() => setSelectedWeek(selectedWeek === week ? null : week)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 transition-all ${
                        selectedWeek === week
                          ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm'
                          : 'bg-canvas-inset border-transparent hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold">Week {week.split('-W')[1]} ({week.split('-')[0]})</span>
                        <span className="text-[10px] opacity-70">Entries: {analytics.weeklyAttendance[week] || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black">{count}</span>
                        <ChevronRight className="w-3 h-3 opacity-40" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Gate Performance Telemetry */}
        <ScrollReveal delay={350} direction="up">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl border-2 border-slate-300/90 p-5 sm:p-6 shadow-card h-full">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-black text-slate-900">Gate Telemetry</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Check-ins</p>
                    <p className="text-lg font-black">{stats.present}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Live Rate</p>
                  <p className="text-lg font-black text-emerald-400">{stats.rate}%</p>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Gate Breakdown</h4>
                  <button
                    onClick={() => setSelectedGate('ALL')}
                    className="text-[10px] font-bold text-sage-deep hover:underline"
                  >
                    View All
                  </button>
                </div>
                {GATE_LOCATIONS.map((gate) => {
                  const count = analytics.gateStats[gate] || 0;
                  const percentage = stats.present > 0 ? Math.round((count / stats.present) * 100) : 0;

                  return (
                    <button
                      key={gate}
                      onClick={() => setSelectedGate(selectedGate === gate ? 'ALL' : gate)}
                      className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${
                        selectedGate === gate
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-800 truncate pr-2">{gate}</span>
                        <span className="text-[11px] font-black text-slate-900">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-700 ${gate === 'Admin Manual Override' ? 'bg-amber-400' : 'bg-rose-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">{percentage}% of total venue traffic</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* VIP Targeted Link Dispatcher - Independent reveal */}
      <ScrollReveal delay={350} direction="up" duration={900}>
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl border-2 border-champagne-border/90 p-5 sm:p-6 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,1)] bg-gradient-to-r from-white/90 via-champagne-light/40 to-white/90">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-champagne-text" />
                <h3 className="text-sm font-black text-slate-900">
                  VIP Invitation Link Generator
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Dispatch tier-specific invitation URLs to sovereign dignitaries, government partners, and royal sponsors.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl bg-white/90 p-1 border-2 border-slate-300 shadow-xs">
                <button
                  onClick={() => setSelectedVipTier('silver')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedVipTier === 'silver' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
                  }`}
                >
                  Silver VIP
                </button>
                <button
                  onClick={() => setSelectedVipTier('gold')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedVipTier === 'gold' ? 'bg-champagne-base shadow-xs text-champagne-text' : 'text-slate-500'
                  }`}
                >
                  Gold VIP
                </button>
                <button
                  onClick={() => setSelectedVipTier('platinum')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedVipTier === 'platinum' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Platinum VIP
                </button>
              </div>

              <button
                onClick={handleCopyVipLink}
                className="px-4 py-2 rounded-xl bg-sage-deep hover:bg-emerald-950 text-white font-black text-xs flex items-center gap-1.5 border-2 border-emerald-950/40 shadow-3d-btn transition-all active:translate-y-0.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'VIP Link Copied!' : 'Copy VIP Link'}</span>
              </button>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-white/70 backdrop-blur-md border-2 border-slate-300 text-xs font-mono text-slate-700 truncate shadow-inner">
            {generatedVipUrl}
          </div>
        </div>
      </ScrollReveal>

      {/* Searchable Directory Section - Independent reveal */}
      <ScrollReveal delay={500} direction="up" duration={950}>
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border-2 border-slate-300/90 shadow-[0_20px_45px_-8px_rgba(15,23,42,0.16),inset_0_2px_0_rgba(255,255,255,1)] overflow-hidden">
        {/* Controls Toolbar: Search + Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-canvas-inset focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-base"
              />
            </div>

            {/* Active Date/Week Badge */}
            {(selectedDate || selectedWeek || selectedGate !== 'ALL') && (
              <div className="flex items-center gap-2">
                {selectedDate && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-base text-sage-deep text-[10px] font-bold border border-sage-border shadow-xs">
                    <CalendarIcon className="w-3 h-3" />
                    {selectedDate}
                    <button onClick={() => setSelectedDate(null)} className="ml-1 hover:text-rose-600">×</button>
                  </span>
                )}
                {selectedWeek && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 shadow-xs">
                    <BarChart3 className="w-3 h-3" />
                    Week {selectedWeek.split('-W')[1]}
                    <button onClick={() => setSelectedWeek(null)} className="ml-1 hover:text-rose-600">×</button>
                  </span>
                )}
                {selectedGate !== 'ALL' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-900 text-[10px] font-bold border border-rose-300 shadow-xs">
                    <MapPin className="w-3 h-3" />
                    {selectedGate.split(' - ')[0]}
                    <button onClick={() => setSelectedGate('ALL')} className="ml-1 hover:text-rose-600">×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: `All (${stats.total})` },
              { id: 'CHECKED_IN', label: `Checked In (${stats.present})` },
              { id: 'PENDING', label: `Pending (${stats.pending})` },
              { id: 'VIP', label: 'VIPs Only' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? 'bg-sage-base text-sage-deep shadow-xs'
                    : 'bg-canvas-inset text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Stacked Cards — visible only on small screens */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredAttendees.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No attendees match the filter criteria.
            </div>
          ) : (
            filteredAttendees.map((attendee) => {
              const isChecked = attendee.status === 'CHECKED_IN';
              const wristband = attendee.wristbandColor || TIER_WRISTBANDS[attendee.tier] || 'Emerald Green';

              return (
                <div key={attendee.id} className="p-4 space-y-2.5">
                  {/* Row 1: Name + Status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{attendee.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{attendee.email}</p>
                    </div>
                    {isChecked ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-successBg text-status-successText font-bold text-[10px]">
                        <Check className="w-3 h-3" />
                        <span>Checked In</span>
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-pendingBg text-status-pendingText font-bold text-[10px]">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Row 2: Ticket code + Tier/Wristband */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-canvas-inset border border-slate-200 text-slate-800">
                      {attendee.ticketCode}
                    </span>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-slate-700">{attendee.tier}</p>
                      <p className="text-[10px] text-slate-500">{wristband}</p>
                    </div>
                  </div>

                  {/* Row 3: Check-in details or action button */}
                  {isChecked ? (
                    attendee.checkedInAt && (
                      <p className="text-[10px] text-slate-400">
                        {attendee.checkedInAt} — {attendee.checkedInBy || 'Gate'}
                      </p>
                    )
                  ) : (
                    <button
                      onClick={() => handleManualCheckIn(attendee)}
                      className="w-full min-h-[44px] py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors active:scale-[0.98]"
                    >
                      Manual Check-In
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Directory Table — hidden on small screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-inset/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Attendee & Email</th>
                <th className="py-3 px-4">Ticket Code</th>
                <th className="py-3 px-4">Tier & Wristband</th>
                <th className="py-3 px-4">Status & Time</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    No attendees match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAttendees.map((attendee) => {
                  const isChecked = attendee.status === 'CHECKED_IN';
                  const wristband = attendee.wristbandColor || TIER_WRISTBANDS[attendee.tier] || 'Emerald Green';

                  return (
                    <tr key={attendee.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <p className="font-bold text-slate-900">{attendee.fullName}</p>
                        <p className="text-[11px] text-slate-400">{attendee.email}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-canvas-inset border border-slate-200 text-slate-800">
                          {attendee.ticketCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {attendee.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {wristband}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {isChecked ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-successBg text-status-successText font-bold text-[10px]">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Checked In</span>
                            </span>
                            {attendee.checkedInAt && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {attendee.checkedInAt} ({attendee.checkedInBy || 'Gate'})
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-pendingBg text-status-pendingText font-bold text-[10px]">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        {!isChecked ? (
                          <button
                            onClick={() => handleManualCheckIn(attendee)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors"
                          >
                            Manual Check-In
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Checked In
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
