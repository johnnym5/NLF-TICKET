import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import StaffLogin from '../components/StaffLogin';
import ScrollReveal from '../components/ScrollReveal';
import {
  Users,
  UserCheck,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Activity,
  Download,
  Calendar as CalendarIcon,
  RotateCcw,
  RefreshCw,
  UserX,
  UserCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

const FESTIVAL_DAYS = [
  { id: 'day1', label: 'Day 1', dateString: '2026-11-21', title: 'Grand Opening & Equestrian Durbar' },
  { id: 'day2', label: 'Day 2', dateString: '2026-11-22', title: 'Livestock Showcase & Suya Fest' },
  { id: 'day3', label: 'Day 3', dateString: '2026-11-23', title: 'Carnival Gala & Awards Finale' }
];

export const ACCOUNT_TYPES = {
  REGULAR: { label: 'General Admission', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300', wristband: 'Emerald Green' },
  VIP_SILVER: { label: 'VIP Silver Hospitality', badgeBg: 'bg-slate-100 text-slate-700 border-slate-300', wristband: 'Metallic Silver Foil' },
  VIP_GOLD: { label: 'VIP Gold Delegate', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300', wristband: 'Champagne Gold Foil' },
  VIP_PLATINUM: { label: 'Platinum Protocol', badgeBg: 'bg-slate-900 text-amber-300 border-slate-700', wristband: 'Obsidian Platinum Badge' },
  TEAM_MEMBER: { label: 'Official Team Member', badgeBg: 'bg-blue-100 text-blue-900 border-blue-300', wristband: 'Cobalt Blue Lanyard' },
  VENDOR: { label: 'Certified Carnival Vendor', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300', wristband: 'Tangerine Orange Badge' },
  ASSOCIATE: { label: 'Partner Associate', badgeBg: 'bg-purple-100 text-purple-900 border-purple-300', wristband: 'Royal Purple Band' }
};

export default function AdminCommandConsole({ onNavigate }) {
  const { currentUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Firestore raw state
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Collapsible cards state (closed by default on mobile for sleek compression)
  const [collapseVelocity, setCollapseVelocity] = useState(true);
  const [collapseDirectory, setCollapseDirectory] = useState(false);

  // Interactive Monthly Calendar Navigation
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(10); // 10 = November
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null); // 'YYYY-MM-DD'

  // Filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dayCheckFilter, setDayCheckFilter] = useState('ALL');

  useEffect(() => {
    if (currentUser && currentUser.email === 'admin@gcc.com') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    const attendeesRef = collection(db, 'attendees');
    const unsubscribe = onSnapshot(attendeesRef, (snapshot) => {
      const records = [];
      snapshot.forEach((docSnap) => {
        records.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAttendees(records);
      setLoading(false);
    }, (err) => {
      console.error('Admin snapshot error:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // Calendar metrics aggregation
  const calendarMetrics = useMemo(() => {
    const dailyRegistrations = {};
    const dailyScans = { day1: 0, day2: 0, day3: 0 };
    const dateSpecificScans = {};

    attendees.forEach((a) => {
      if (a.createdAt) {
        const dateStr = a.createdAt.split('T')[0];
        dailyRegistrations[dateStr] = (dailyRegistrations[dateStr] || 0) + 1;
      }

      const days = a.daysAttended || {};
      if (days.day1 || a.status === 'CHECKED_IN') dailyScans.day1 += 1;
      if (days.day2) dailyScans.day2 += 1;
      if (days.day3) dailyScans.day3 += 1;

      if (a.checkedInFullDate) {
        const checkDate = a.checkedInFullDate.split('T')[0];
        dateSpecificScans[checkDate] = (dateSpecificScans[checkDate] || 0) + 1;
      }
    });

    return { dailyRegistrations, dailyScans, dateSpecificScans };
  }, [attendees]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const total = attendees.length;
    const present = attendees.filter(a => a.status === 'CHECKED_IN' || (a.daysAttended && Object.values(a.daysAttended).some(Boolean))).length;
    const revokedCount = attendees.filter(a => a.accessRevoked === true).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, revokedCount, rate };
  }, [attendees]);

  // Filtered Attendees list
  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (a.fullName || '').toLowerCase().includes(query) ||
        (a.email || '').toLowerCase().includes(query) ||
        (a.ticketCode || '').toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (roleFilter !== 'ALL' && a.tier !== roleFilter) return false;

      if (selectedCalendarDate) {
        const regDate = a.createdAt ? a.createdAt.split('T')[0] : '';
        const checkDate = a.checkedInFullDate ? a.checkedInFullDate.split('T')[0] : '';
        if (regDate !== selectedCalendarDate && checkDate !== selectedCalendarDate) return false;
      }

      if (dayCheckFilter !== 'ALL') {
        const hasDay = a.daysAttended?.[dayCheckFilter] || (dayCheckFilter === 'day1' && a.status === 'CHECKED_IN');
        if (!hasDay) return false;
      }

      return true;
    });
  }, [attendees, searchTerm, roleFilter, selectedCalendarDate, dayCheckFilter]);

  // 1. Upgrade Account Tier via Dropdown
  const handleUpgradeAccountType = async (attendee, newTier) => {
    try {
      const attendeeRef = doc(db, 'attendees', attendee.id);
      const tierConfig = ACCOUNT_TYPES[newTier] || ACCOUNT_TYPES.REGULAR;
      await updateDoc(attendeeRef, {
        tier: newTier,
        wristbandColor: tierConfig.wristband
      });
    } catch (err) {
      console.error('Failed to change user tier:', err);
    }
  };

  // 2. Revoke / Restore 24hr Access
  const handleToggleAccessRevocation = async (attendee) => {
    const willRevoke = !attendee.accessRevoked;
    try {
      const attendeeRef = doc(db, 'attendees', attendee.id);
      await updateDoc(attendeeRef, {
        accessRevoked: willRevoke,
        revokedAt: willRevoke ? new Date().toISOString() : null,
        status: willRevoke ? 'REVOKED' : 'REGISTERED'
      });
    } catch (err) {
      console.error('Revocation update failed:', err);
    }
  };

  // 3. Reset QR Code / Ticket Code
  const handleResetQrCode = async (attendee) => {
    const entropy = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `GCC-2026-${entropy}`;
    try {
      const attendeeRef = doc(db, 'attendees', attendee.id);
      await updateDoc(attendeeRef, {
        ticketCode: newCode,
        qrResetAt: new Date().toISOString(),
        status: 'REGISTERED'
      });
    } catch (err) {
      console.error('QR reset failed:', err);
    }
  };

  // 4. Clear Multi-Day Attendance Marks
  const handleClearMarkedDays = async (attendee) => {
    try {
      const attendeeRef = doc(db, 'attendees', attendee.id);
      await updateDoc(attendeeRef, {
        daysAttended: { day1: false, day2: false, day3: false },
        status: 'REGISTERED',
        checkedInAt: null,
        checkedInFullDate: null,
        checkedInBy: null
      });
    } catch (err) {
      console.error('Clear attendance days failed:', err);
    }
  };

  // 5. Toggle Specific Day Attendance Mark Manually
  const handleToggleDayMark = async (attendee, dayKey) => {
    const currentStatus = !!attendee.daysAttended?.[dayKey];
    const newStatus = !currentStatus;

    try {
      const attendeeRef = doc(db, 'attendees', attendee.id);
      const updatedDays = {
        ...(attendee.daysAttended || { day1: false, day2: false, day3: false }),
        [dayKey]: newStatus
      };

      await updateDoc(attendeeRef, {
        daysAttended: updatedDays,
        status: Object.values(updatedDays).some(Boolean) ? 'CHECKED_IN' : 'REGISTERED',
        checkedInAt: newStatus ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : attendee.checkedInAt,
        checkedInFullDate: newStatus ? new Date().toISOString() : attendee.checkedInFullDate
      });
    } catch (err) {
      console.error('Toggle day mark failed:', err);
    }
  };

  // Calendar Days Matrix
  const daysInMonth = useMemo(() => {
    const date = new Date(calendarYear, calendarMonth, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateString: null });
    }

    for (let d = 1; d <= totalDays; d++) {
      const monthPadded = String(calendarMonth + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateString = `${calendarYear}-${monthPadded}-${dayPadded}`;
      days.push({ dayNumber: d, dateString });
    }

    return days;
  }, [calendarYear, calendarMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const handleExportCsv = () => {
    if (attendees.length === 0) return;
    const headers = ['Full Name', 'Email', 'Ticket Code', 'Account Type', 'Wristband', 'Status', 'Access Revoked', 'Day 1', 'Day 2', 'Day 3', 'Created At'];
    const rows = attendees.map(a => [
      `"${a.fullName || ''}"`,
      `"${a.email || ''}"`,
      `"${a.ticketCode || ''}"`,
      `"${a.tier || 'REGULAR'}"`,
      `"${a.wristbandColor || ''}"`,
      `"${a.status || 'REGISTERED'}"`,
      `"${a.accessRevoked ? 'REVOKED' : 'ACTIVE'}"`,
      `"${a.daysAttended?.day1 || a.status === 'CHECKED_IN' ? 'YES' : 'NO'}"`,
      `"${a.daysAttended?.day2 ? 'YES' : 'NO'}"`,
      `"${a.daysAttended?.day3 ? 'YES' : 'NO'}"`,
      `"${a.createdAt || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Carnival_Attendance_Master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <StaffLogin
        title="Executive Attendance Command Hub"
        subtitle="Restricted Steering Committee Access"
        allowedEmails={['admin@gcc.com']}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border-2 border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Executive Attendance Command Hub
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Abuja 2026 Carnival Access Control, Multi-Day Ticketing & Role Administration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate?.('diagnostics')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:translate-y-0.5"
          >
            <Activity className="w-3.5 h-3.5 text-sage-deep" />
            <span className="hidden sm:inline">System Diagnostics</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-sage-deep hover:bg-emerald-950 text-white text-xs font-black flex items-center gap-1.5 border-2 border-emerald-950/40 shadow-sm transition-all active:translate-y-0.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white/85 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Registrations</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{kpis.total}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">100% database baseline</p>
        </div>

        <div className="bg-emerald-50/80 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border-2 border-emerald-300 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Present at Venue</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">{kpis.present}</p>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Checked in at least 1 day</p>
        </div>

        <div className="bg-rose-50/80 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border-2 border-rose-300 shadow-sm">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Access Revoked</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">{kpis.revokedCount}</p>
          <p className="text-[10px] text-rose-600 font-semibold mt-1">Blocked from gate re-entry</p>
        </div>

        <div className="bg-white/85 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Live Turnout</span>
            <TrendingUp className="w-4 h-4 text-sage-deep" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{kpis.rate}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-sage-deep h-1.5 rounded-full transition-all duration-500" style={{ width: `${kpis.rate}%` }} />
          </div>
        </div>
      </div>

      {/* 3-Day Turnout Bar Tracker */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-sage-deep" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
              3-Day Festival Turnout Tracker (Old Parade Ground)
            </h3>
          </div>
          {dayCheckFilter !== 'ALL' && (
            <button
              onClick={() => setDayCheckFilter('ALL')}
              className="text-[10px] text-rose-600 font-bold hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FESTIVAL_DAYS.map((fest) => {
            const count = calendarMetrics.dailyScans[fest.id] || 0;
            const percentage = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
            const isSelected = dayCheckFilter === fest.id;

            return (
              <button
                key={fest.id}
                onClick={() => setDayCheckFilter(isSelected ? 'ALL' : fest.id)}
                className={`text-left p-3.5 rounded-2xl border-2 transition-all ${
                  isSelected ? 'border-sage-deep bg-sage-light/80 shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{fest.label} ({fest.dateString})</span>
                  <span className="text-xs font-mono font-black text-sage-deep">{count} Scans</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{fest.title}</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-sage-deep h-1.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-1">{percentage}% of total registered</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Monthly Calendar (Collapsible Accordion) */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div
          onClick={() => setCollapseVelocity(!collapseVelocity)}
          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-4 h-4 text-sage-deep" />
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900">
                Monthly Registration & Gate Scan Calendar
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Click any calendar day to audit daily intake registrations and physical scans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCalendarDate && (
              <span className="px-2 py-0.5 rounded-full bg-sage-base text-sage-deep font-bold text-[10px] border border-sage-border">
                Filter: {selectedCalendarDate}
              </span>
            )}
            {collapseVelocity ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {!collapseVelocity && (
          <div className="p-4 sm:p-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  {monthNames[calendarMonth]} {calendarYear}
                </h4>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {selectedCalendarDate && (
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Clear Selected Date
                </button>
              )}
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysInMonth.map((item, index) => {
                if (!item.dayNumber) {
                  return <div key={`pad-${index}`} className="h-14 sm:h-20 bg-slate-50/40 rounded-xl" />;
                }

                const regCount = calendarMetrics.dailyRegistrations[item.dateString] || 0;
                const scanCount = calendarMetrics.dateSpecificScans[item.dateString] || 0;
                const isFestivalDay = FESTIVAL_DAYS.some(f => f.dateString === item.dateString);
                const isSelected = selectedCalendarDate === item.dateString;

                return (
                  <button
                    key={item.dateString}
                    onClick={() => setSelectedCalendarDate(isSelected ? null : item.dateString)}
                    className={`h-14 sm:h-20 p-1 sm:p-2 rounded-xl border-2 flex flex-col justify-between text-left transition-all relative ${
                      isSelected
                        ? 'border-sage-deep bg-sage-light/90 shadow-md ring-2 ring-sage-base/40'
                        : isFestivalDay
                        ? 'border-amber-400 bg-amber-50/60 hover:border-amber-500'
                        : 'border-slate-100 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] sm:text-xs font-black ${isFestivalDay ? 'text-amber-800' : 'text-slate-800'}`}>
                        {item.dayNumber}
                      </span>
                      {isFestivalDay && (
                        <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold">
                          Carnival
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {regCount > 0 && (
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-600 truncate">
                          <span className="font-extrabold text-slate-900">+{regCount}</span> reg
                        </div>
                      )}
                      {scanCount > 0 && (
                        <div className="text-[9px] sm:text-[10px] font-bold text-emerald-700 truncate">
                          <span className="font-extrabold">{scanCount}</span> scans
                        </div>
                      )}
                      {regCount === 0 && scanCount === 0 && (
                        <span className="text-[9px] text-slate-300">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Attendee Directory (Compressed with Role Dropdown, Tick Marks & Security Actions) */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div
          onClick={() => setCollapseDirectory(!collapseDirectory)}
          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-sage-deep" />
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900">
                User Management Directory ({filteredAttendees.length} Shown)
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Search, upgrade role tiers, view multi-day scan status, and manage gate access
              </p>
            </div>
          </div>
          {collapseDirectory ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>

        {!collapseDirectory && (
          <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search attendee by full name, email, or ticket code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-base"
                />
              </div>

              <div className="w-full sm:w-64">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sage-base cursor-pointer"
                >
                  <option value="ALL">All Account Roles</option>
                  <option value="REGULAR">General Admission (Regular)</option>
                  <option value="VIP_SILVER">VIP Silver Hospitality</option>
                  <option value="VIP_GOLD">VIP Gold Delegate</option>
                  <option value="VIP_PLATINUM">Platinum Protocol</option>
                  <option value="TEAM_MEMBER">Official Team Member</option>
                  <option value="VENDOR">Certified Vendor</option>
                  <option value="ASSOCIATE">Partner Associate</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredAttendees.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  No attendees found matching search or filter criteria.
                </div>
              ) : (
                filteredAttendees.map((attendee) => {
                  const days = attendee.daysAttended || {};
                  const isDay1 = days.day1 || attendee.status === 'CHECKED_IN';
                  const isDay2 = days.day2;
                  const isDay3 = days.day3;
                  const isRevoked = attendee.accessRevoked === true;
                  const roleConfig = ACCOUNT_TYPES[attendee.tier] || ACCOUNT_TYPES.REGULAR;

                  return (
                    <div
                      key={attendee.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all ${
                        isRevoked
                          ? 'border-rose-300 bg-rose-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                              {attendee.fullName || 'Anonymous Attendee'}
                            </h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleConfig.badgeBg}`}>
                              {roleConfig.label}
                            </span>
                            {isRevoked && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-rose-200 text-rose-900 border border-rose-400">
                                ACCESS REVOKED
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="truncate">{attendee.email}</span>
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {attendee.ticketCode}
                            </span>
                            <span>Wristband: <strong className="text-slate-700">{attendee.wristbandColor || roleConfig.wristband}</strong></span>
                          </div>
                        </div>

                        {/* Multi-Day Tick Marks */}
                        <div className="flex items-center gap-2 shrink-0 py-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
                            Days:
                          </span>
                          <button
                            onClick={() => handleToggleDayMark(attendee, 'day1')}
                            title="Click to toggle Day 1 attendance mark"
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                              isDay1
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className={`w-3 h-3 ${isDay1 ? 'text-emerald-700' : 'text-slate-300'}`} />
                            <span>Day 1</span>
                          </button>

                          <button
                            onClick={() => handleToggleDayMark(attendee, 'day2')}
                            title="Click to toggle Day 2 attendance mark"
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                              isDay2
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className={`w-3 h-3 ${isDay2 ? 'text-emerald-700' : 'text-slate-300'}`} />
                            <span>Day 2</span>
                          </button>

                          <button
                            onClick={() => handleToggleDayMark(attendee, 'day3')}
                            title="Click to toggle Day 3 attendance mark"
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                              isDay3
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className={`w-3 h-3 ${isDay3 ? 'text-emerald-700' : 'text-slate-300'}`} />
                            <span>Day 3</span>
                          </button>
                        </div>

                        {/* Role Upgrade & Security Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <select
                            value={attendee.tier || 'REGULAR'}
                            onChange={(e) => handleUpgradeAccountType(attendee, e.target.value)}
                            className="py-1.5 px-2.5 rounded-xl border border-slate-300 text-[11px] font-bold bg-white text-slate-800 focus:ring-2 focus:ring-sage-base focus:outline-none cursor-pointer shadow-xs"
                          >
                            <option value="REGULAR">General Admission</option>
                            <option value="VIP_SILVER">VIP Silver</option>
                            <option value="VIP_GOLD">VIP Gold</option>
                            <option value="VIP_PLATINUM">Platinum Protocol</option>
                            <option value="TEAM_MEMBER">Team Member</option>
                            <option value="VENDOR">Certified Vendor</option>
                            <option value="ASSOCIATE">Partner Associate</option>
                          </select>

                          <button
                            onClick={() => handleToggleAccessRevocation(attendee)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 border shadow-xs transition-all ${
                              isRevoked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isRevoked ? <UserCheck2 className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            <span>{isRevoked ? 'Restore Access' : 'Revoke'}</span>
                          </button>

                          <button
                            onClick={() => handleResetQrCode(attendee)}
                            title="Regenerate fresh ticket code & QR"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleClearMarkedDays(attendee)}
                            title="Reset 3-day attendance check-ins"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
