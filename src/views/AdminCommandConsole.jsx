import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import StaffLogin from '../components/StaffLogin';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import {
  Users,
  UserCheck,
  TrendingUp,
  Search,
  Activity,
  Download,
  RotateCcw,
  RefreshCw,
  UserX,
  UserCheck2,
  CheckCircle2,
  Layers,
  Sparkles,
  BarChart3,
  Filter,
  MoreHorizontal
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
  const { userRole } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({ totalRegistrations: 0, totalCheckedIn: 0, dayCheckins: {} });
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [lastId, setLastId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [overrideModal, setOverrideModal] = useState({ open: false, attendee: null, action: '', reason: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    setIsAuthenticated(userRole === 'executive_admin');
  }, [userRole]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchStats = async () => {
      try {
        const result = await httpsCallable(functions, 'getDashboardStats')();
        setStats(result.data);
      } catch (err) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadAttendees = async (reset = false) => {
    if (!isAuthenticated) return;
    setSearching(true);
    try {
      const result = await httpsCallable(functions, 'searchAttendees')({
        searchTerm, roleFilter, statusFilter, lastDocId: reset ? null : lastId, pageSize: 20
      });
      setAttendees(reset ? result.data.results : [...attendees, ...result.data.results]);
      setLastId(result.data.lastId);
      setHasMore(result.data.results.length === 20);
    } catch (err) {} finally {
      setSearching(false);
      setLoading(false);
    }
  };

  useEffect(() => { if (isAuthenticated) loadAttendees(true); }, [isAuthenticated, roleFilter, statusFilter]);

  const performOverride = async () => {
    if (!overrideModal.reason || overrideModal.reason.length < 5) return;
    try {
      await httpsCallable(functions, 'adminOverride')({
        targetUid: overrideModal.attendee.id, action: overrideModal.action, newValue: overrideModal.newValue, reason: overrideModal.reason
      });
      setOverrideModal({ open: false, attendee: null, action: '', reason: '' });
      loadAttendees(true);
    } catch (err) { alert(`Override failed: ${err.message}`); }
  };

  const handleResetQrCode = async (attendee) => {
    try { await httpsCallable(functions, 'replaceTicket')({ attendeeUid: attendee.id }); } catch (err) {}
  };

  const handleExportCsv = async () => {
    try {
      const result = await httpsCallable(functions, 'exportAttendees')();
      const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', result.data.filename);
      link.click();
    } catch (err) { alert(`Export failed: ${err.message}`); }
  };

  if (!isAuthenticated) return <StaffLogin title="Command Center" subtitle="Executive Access Restricted" allowedEmails={['admin@gcc.com']} onSuccess={() => {}} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Override Modal */}
      {overrideModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slideUp">
            <h2 className="text-xl font-black text-slate-900 mb-2">Administrative Override</h2>
            <p className="text-xs text-slate-500 mb-8 uppercase tracking-widest font-bold">
              Target: <span className="text-slate-800">{overrideModal.attendee.fullName}</span>
            </p>
            <Input
              label="Override Justification"
              placeholder="Provide reason for manual modification..."
              className="mb-8"
              value={overrideModal.reason}
              onChange={(e) => setOverrideModal({...overrideModal, reason: e.target.value})}
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setOverrideModal({ open: false, attendee: null, action: '', reason: '' })}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={performOverride} disabled={overrideModal.reason.length < 5}>Apply Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="section-label">Management Portal</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Command Hub</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time attendance telemetry and credential management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={Activity} onClick={() => onNavigate?.('diagnostics')}>Diagnostics</Button>
          <Button icon={Download} onClick={handleExportCsv}>Export Data</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registrations', val: stats.totalRegistrations, icon: Users, variant: 'dark' },
          { label: 'Checked In', val: stats.totalCheckedIn, icon: UserCheck, variant: 'success' },
          { label: 'Venue Turnout', val: `${stats.totalRegistrations > 0 ? Math.round((stats.totalCheckedIn / stats.totalRegistrations) * 100) : 0}%`, icon: TrendingUp, variant: 'pending' },
          { label: 'VIP Arrivals', val: Object.entries(stats.gateCheckins || {}).find(([k]) => k.includes('VIP'))?.[1] || 0, icon: Sparkles, variant: 'gold' }
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
               <stat.icon className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Turnout Bar */}
      <div className="premium-card p-8">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="w-5 h-5 text-sage-deep" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">3-Day Attendance Distribution</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {FESTIVAL_DAYS.map((fest) => {
            const count = stats.dayCheckins?.[fest.id] || 0;
            const pct = stats.totalRegistrations > 0 ? Math.round((count / stats.totalRegistrations) * 100) : 0;
            return (
              <div key={fest.id} className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase">{fest.label}</span>
                  <span className="text-xs font-mono font-black text-sage-deep">{count}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sage-deep transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] font-bold text-slate-400">{pct}% Capacity</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Directory Section */}
      <div className="premium-card">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
           <form onSubmit={(e) => { e.preventDefault(); loadAttendees(true); }} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search by name, email, or ticket code..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-sage-deep/10"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
           </form>
           <div className="flex items-center gap-3">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest py-3 px-4 focus:ring-2 focus:ring-sage-deep/10">
                <option value="ALL">All Roles</option>
                {Object.keys(ACCOUNT_TYPES).map(k => <option key={k} value={k}>{ACCOUNT_TYPES[k].label}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest py-3 px-4 focus:ring-2 focus:ring-sage-deep/10">
                <option value="ALL">All Status</option>
                <option value="REGISTERED">Registered</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="REVOKED">Revoked</option>
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-6 py-4">Attendee</th>
                <th className="px-6 py-4">Credentials</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendees.map(attendee => (
                <tr key={attendee.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-900">{attendee.fullName}</p>
                    <p className="text-xs text-slate-500 font-medium">{attendee.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="pending" className="font-mono bg-white">{attendee.ticketCode}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={attendee.tier.includes('VIP') ? 'gold' : 'pending'}>{attendee.tier}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={attendee.accessRevoked ? 'error' : attendee.status === 'CHECKED_IN' ? 'success' : 'pending'}>
                      {attendee.accessRevoked ? 'Revoked' : attendee.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm" onClick={() => setOverrideModal({ open: true, attendee, action: 'MANUAL_CHECKIN', newValue: { eventDay: 'day1' }, reason: '' })}>Check-in</Button>
                      <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => handleResetQrCode(attendee)} title="Reset QR" />
                      <Button variant={attendee.accessRevoked ? 'primary' : 'danger'} size="sm" onClick={() => setOverrideModal({ open: true, attendee, action: attendee.accessRevoked ? 'RESTORE_ACCESS' : 'REVOKE_ACCESS', reason: '' })}>
                        {attendee.accessRevoked ? 'Restore' : 'Revoke'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-6 text-center bg-slate-50/30">
            <Button variant="ghost" className="text-[11px] uppercase tracking-[0.2em]" onClick={() => loadAttendees()}>Load More Data ↓</Button>
          </div>
        )}
      </div>
    </div>
  );
}
