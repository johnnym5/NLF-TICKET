import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, TIER_WRISTBANDS, TIER_LABELS } from '../context/AuthContext';
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
  Check,
  MapPin,
  Shield,
  Plus,
  Trash2,
  ClipboardList
} from 'lucide-react';

const FESTIVAL_DAYS = [
  { id: 'day1', label: 'Day 1' },
  { id: 'day2', label: 'Day 2' },
  { id: 'day3', label: 'Day 3' }
];

export const ACCOUNT_TYPES = {
  general: { label: 'General Admission', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  vip_1: { label: 'VIP Tier 1 (+10)', badgeBg: 'bg-slate-100 text-slate-700 border-slate-300' },
  vip_2: { label: 'VIP Tier 2 (+15)', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  vip_3: { label: 'VIP Tier 3 (+20)', badgeBg: 'bg-slate-900 text-amber-300 border-slate-700' },
  REGULAR: { label: 'General Admission', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  VIP_SILVER: { label: 'VIP Silver Hospitality', badgeBg: 'bg-slate-100 text-slate-700 border-slate-300' },
  VIP_GOLD: { label: 'VIP Gold Delegate', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  VIP_PLATINUM: { label: 'Platinum Protocol', badgeBg: 'bg-slate-900 text-amber-300 border-slate-700' }
};

export default function AdminCommandConsole({ onNavigate }) {
  const { currentUser, userRole } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets', 'gates', 'staff', 'audit'

  // Live Data
  const [tickets, setTickets] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [showExecutiveDashboard, setShowExecutiveDashboard] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, CHECKED_IN, PENDING, REVOKED
  const [tierFilter, setTierFilter] = useState('ALL');
  const [staffRoleFilter, setStaffRoleFilter] = useState('ALL'); // ALL, STAFF, ATTENDEE, USER
  const [dayFilter, setDayFilter] = useState('ALL');

  // Advanced Registration Time Filtering
  const [regTimeScope, setRegTimeScope] = useState('ALL'); // ALL, TODAY, THIS_WEEK, THIS_MONTH
  const [selectedCustomDate, setSelectedCustomDate] = useState('');

  // Gate Form State
  const [showGateModal, setShowGateModal] = useState(false);
  const [newGateName, setNewGateName] = useState('');
  const [newGateDesc, setNewGateDesc] = useState('');

  // VIP Invitation Generator State
  const [selectedVipTier, setSelectedVipTier] = useState('vip_2');
  const [generatedVipUrl, setGeneratedVipUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setIsAuthenticated(
      userRole === 'admin' ||
      userRole === 'executive_admin' ||
      currentUser?.email === 'admin@livestockcarnival.ng' ||
      currentUser?.email === 'admin@gcc.com'
    );
  }, [userRole, currentUser]);

  // Real-time synchronization via Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [ticketsRes, profilesRes, gatesRes] = await Promise.all([
          supabase.from('tickets').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*, gates(*)').order('created_at', { ascending: false }),
          supabase.from('gates').select('*').order('name', { ascending: true })
        ]);

        if (ticketsRes.data) setTickets(ticketsRes.data);
        if (profilesRes.data) setProfiles(profilesRes.data);
        if (gatesRes.data) setGates(gatesRes.data);
      } catch (err) {
        console.error('Error fetching admin telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const ticketsChannel = supabase
      .channel('admin_tickets_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTickets(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(a => a.id === payload.old.id));
        }
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin_profiles_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [isAuthenticated]);

  const handleGenerateVipLink = async () => {
    setIsGenerating(true);
    const inviteId = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      const { error } = await supabase.from('vip_invitations').insert({
        id: inviteId,
        tier: selectedVipTier,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        isUsed: false,
        createdBy: currentUser?.id
      });

      if (error) throw error;

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pass.livestockcarnival.ng';
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

  const handleCreateGate = async (e) => {
    e.preventDefault();
    if (!newGateName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('gates')
        .insert({
          name: newGateName.trim(),
          description: newGateDesc.trim()
        })
        .select('*')
        .single();

      if (error) throw error;

      setGates(prev => [...prev, data]);
      setNewGateName('');
      setNewGateDesc('');
      setShowGateModal(false);
    } catch (err) {
      alert('Failed to create gate: ' + err.message);
    }
  };

  const handleDeleteGate = async (gateId) => {
    if (!window.confirm('Delete this gate?')) return;
    try {
      await supabase.from('gates').delete().eq('id', gateId);
      setGates(prev => prev.filter(g => g.id !== gateId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignRoleAndGate = async (profileId, role, gateId) => {
    try {
      const updatePayload = { role };
      if (gateId !== undefined) updatePayload.assigned_gate_id = gateId || null;

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, ...updatePayload } : p));
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleToggleRevocation = async (ticket) => {
    if (!window.confirm(`${ticket.status === 'revoked' ? 'Restore' : 'Revoke'} access for ticket ${ticket.ticket_code}?`)) return;
    try {
      const newStatus = ticket.status === 'revoked' ? 'valid' : 'revoked';
      const { error } = await supabase.from('tickets').update({
        status: newStatus
      }).eq('id', ticket.id);
      if (error) throw error;
    } catch (err) { alert(err.message); }
  };

  const isInTimeScope = (createdAt, scope) => {
    if (!createdAt || scope === 'ALL') return true;

    const date = new Date(createdAt);
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

  const stats = useMemo(() => {
    const scopeTickets = tickets.filter(t => isInTimeScope(t.created_at || t.createdAt, regTimeScope));

    const total = scopeTickets.length;
    const checkedIn = scopeTickets.filter(t => t.status === 'used' || t.status === 'CHECKED_IN').length;
    const pending = scopeTickets.filter(t => t.status === 'valid' || t.status === 'REGISTERED').length;
    const revoked = scopeTickets.filter(t => t.status === 'revoked').length;
    const manualCount = scopeTickets.filter(t => t.is_manual).length;

    const dayDistribution = { day1: 0, day2: 0, day3: 0 };
    scopeTickets.forEach(t => {
      if (t.status === 'used' || t.status === 'CHECKED_IN') {
        dayDistribution.day1++;
      }
    });

    const turnoutRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return { total, checkedIn, pending, revoked, manualCount, dayDistribution, turnoutRate };
  }, [tickets, regTimeScope, selectedCustomDate]);

  const gatekeeperAudit = useMemo(() => {
    const staffProfiles = profiles.filter(p => ['admin', 'gatekeeper', 'security'].includes(p.role));

    return staffProfiles.map(staff => {
      const scansCount = tickets.filter(t => t.scanned_by === staff.id).length;
      const manualCount = tickets.filter(t => t.created_by === staff.id && t.is_manual).length;
      return {
        ...staff,
        scansCount,
        manualCount
      };
    });
  }, [profiles, tickets]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const queryStr = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        (p.full_name || '').toLowerCase().includes(queryStr) ||
        (p.email || '').toLowerCase().includes(queryStr);

      if (!matchesSearch) return false;

      if (staffRoleFilter === 'STAFF') {
        return ['admin', 'gatekeeper', 'security'].includes(p.role);
      }
      if (staffRoleFilter === 'ATTENDEE') {
        return p.role === 'attendee';
      }
      if (staffRoleFilter === 'USER') {
        return p.role === 'user';
      }

      return true;
    });
  }, [profiles, searchTerm, staffRoleFilter]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const queryStr = searchTerm.toLowerCase();
      const code = (t.ticket_code || t.ticketCode || '').toLowerCase();
      const matchesSearch = !searchTerm || code.includes(queryStr);

      if (!matchesSearch) return false;

      if (activeFilter === 'CHECKED_IN' && t.status !== 'used' && t.status !== 'CHECKED_IN') return false;
      if (activeFilter === 'PENDING' && t.status !== 'valid' && t.status !== 'REGISTERED') return false;
      if (activeFilter === 'REVOKED' && t.status !== 'revoked') return false;
      if (tierFilter !== 'ALL' && t.tier !== tierFilter) return false;

      if (!isInTimeScope(t.created_at || t.createdAt, regTimeScope)) return false;

      return true;
    });
  }, [tickets, searchTerm, activeFilter, tierFilter, regTimeScope, selectedCustomDate]);

  const handleExportCsv = () => {
    if (tickets.length === 0) return;
    const headers = ['Ticket Code', 'Tier', 'Status', 'Manual', 'Scanned At', 'Created At'];
    const rows = tickets.map(t => [
      `"${t.ticket_code || t.ticketCode}"`, `"${t.tier}"`, `"${t.status}"`, `"${t.is_manual}"`, `"${t.scanned_at || ''}"`, `"${t.created_at || t.createdAt}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `NLF_Tickets_Master.csv`);
    link.click();
  };

  if (!isAuthenticated) return <StaffLogin title="Executive Command Console" subtitle="Admin Verification Required" allowedEmails={['admin@gcc.com', 'admin@livestockcarnival.ng']} onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Enterprise Box-Office Console</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Multi-Gate Telemetry & Staff Auditing</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {[
            { id: 'tickets', label: 'Tickets Registry', icon: BarChart3 },
            { id: 'gates', label: 'Venue Gates', icon: MapPin },
            { id: 'staff', label: 'Personnel & Roles', icon: Shield },
            { id: 'audit', label: 'Gatekeeper Audit', icon: ClipboardList }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-[#0F4A2F] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIP Link Dispatcher & Timeframe Filters */}
      <div className="space-y-6">
        {/* VIP Invitation Link Generator */}
        <div className="bg-white rounded-3xl border border-champagne-border p-6 shadow-sm bg-gradient-to-r from-white via-champagne-light/20 to-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-champagne-text" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">VIP Link Dispatcher</h3>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Generate a temporary (15 min) one-time invitation link for executive delegates (+10, +15, +20 guest passes).</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                {[
                  { id: 'vip_1', label: 'VIP 1 (+10)' },
                  { id: 'vip_2', label: 'VIP 2 (+15)' },
                  { id: 'vip_3', label: 'VIP 3 (+20)' }
                ].map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedVipTier(tier.id)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedVipTier === tier.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateVipLink}
                disabled={isGenerating}
                className="px-4 py-2 bg-[#0F4A2F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-emerald-950 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                Generate VIP Link
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
                <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">Self-destructs in 15 minutes. Includes allotted guest passes.</span>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Velocity & Timeframe Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5" />
                Calendar Filter:
            </span>
            {[
                { id: 'ALL', label: 'Lifetime' },
                { id: 'TODAY', label: 'Today' },
                { id: 'THIS_WEEK', label: 'Weekly' },
                { id: 'THIS_MONTH', label: 'Monthly' }
            ].map(btn => (
                <button
                    key={btn.id}
                    onClick={() => { setRegTimeScope(btn.id); setSelectedCustomDate(''); }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${regTimeScope === btn.id ? 'bg-[#0F4A2F] text-white border-[#0F4A2F] shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                >
                    {btn.label}
                </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <button
                  onClick={() => handleAdjustDate(-1)}
                  className="p-1 text-slate-400 hover:text-[#0F4A2F] transition-colors"
                  title="Previous Day"
              >
                  <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                  type="date"
                  value={selectedCustomDate}
                  onChange={(e) => { setSelectedCustomDate(e.target.value); setRegTimeScope('CUSTOM'); }}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-700 outline-none focus:ring-0 w-28"
              />
              <button
                  onClick={() => handleAdjustDate(1)}
                  className="p-1 text-slate-400 hover:text-[#0F4A2F] transition-colors"
                  title="Next Day"
              >
                  <ChevronRight className="w-3.5 h-3.5" />
              </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-6 flex flex-col justify-between h-32">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Issued Tickets</span>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          <span className="text-[10px] font-bold text-slate-400">Global Database Baseline</span>
        </div>
        <div className="premium-card p-6 flex flex-col justify-between h-32 bg-emerald-50 border-emerald-200">
          <span className="text-[10px] font-black uppercase text-emerald-700">Checked In (Used)</span>
          <p className="text-3xl font-black text-emerald-950">{stats.checkedIn}</p>
          <span className="text-[10px] font-bold text-emerald-700">Present At Venue</span>
        </div>
        <div className="premium-card p-6 flex flex-col justify-between h-32 bg-amber-50 border-amber-200">
          <span className="text-[10px] font-black uppercase text-amber-700">Pending Valid Passes</span>
          <p className="text-3xl font-black text-amber-950">{stats.pending}</p>
          <span className="text-[10px] font-bold text-amber-700">Unscanned Passes</span>
        </div>
        <div className="premium-card p-6 flex flex-col justify-between h-32 bg-slate-900 text-white">
          <span className="text-[10px] font-black uppercase text-slate-400">Box-Office Manual Tickets</span>
          <p className="text-3xl font-black text-amber-400">{stats.manualCount}</p>
          <span className="text-[10px] font-bold text-slate-400">Issued by Gatekeepers</span>
        </div>
      </div>

      {/* TAB 1: TICKETS REGISTRY */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search ticket code..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-medium"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'PENDING', 'CHECKED_IN', 'REVOKED'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${activeFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                  <th className="p-4">Ticket Code</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Scanned At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredTickets.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">No tickets found in database.</td></tr>
                ) : (
                  filteredTickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-slate-900">{t.ticket_code || t.ticketCode}</td>
                      <td className="p-4 uppercase font-black">{t.tier}</td>
                      <td className="p-4">
                        {t.is_manual ? <Badge variant="gold">MANUAL</Badge> : <Badge variant="pending">DIGITAL</Badge>}
                      </td>
                      <td className="p-4">
                        <Badge variant={t.status === 'used' || t.status === 'CHECKED_IN' ? 'success' : t.status === 'valid' || t.status === 'REGISTERED' ? 'pending' : 'error'}>
                          {t.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-500">
                        {t.scanned_at ? new Date(t.scanned_at).toLocaleTimeString() : 'Unscanned'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleRevocation(t)}
                          className={`p-2 rounded-xl text-xs font-bold ${t.status === 'revoked' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                        >
                          {t.status === 'revoked' ? 'Restore' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VENUE GATES */}
      {activeTab === 'gates' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900">Configured Venue Gates</h3>
              <p className="text-[10px] text-slate-500 font-medium">Manage access checkpoints and entry gates</p>
            </div>
            <Button icon={Plus} onClick={() => setShowGateModal(true)}>Add Venue Gate</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gates.map(gate => (
              <div key={gate.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase">{gate.name}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{gate.description || 'Access Point'}</p>
                </div>
                <button onClick={() => handleDeleteGate(gate.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & PERSONNEL ROLES */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 overflow-x-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900">Personnel & Role Assignments</h3>
              <p className="text-[10px] text-slate-500 font-medium">Promote users to Staff/Admin or downgrade Staff to Attendee/User</p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: 'ALL', label: 'All Accounts' },
                { id: 'STAFF', label: 'Staff Only' },
                { id: 'ATTENDEE', label: 'Attendees' },
                { id: 'USER', label: 'Unassigned Users' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStaffRoleFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${staffRoleFilter === f.id ? 'bg-[#0F4A2F] text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <th className="p-4">Personnel</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Assigned Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProfiles.length === 0 ? (
                <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic">No profiles found matching criteria.</td></tr>
              ) : (
                filteredProfiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.full_name || 'User'}</div>
                      <div className="text-[10px] text-slate-400">{p.email}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={p.role || 'user'}
                        onChange={(e) => handleAssignRoleAndGate(p.id, e.target.value, p.assigned_gate_id)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase cursor-pointer shadow-xs"
                      >
                        <option value="user">USER (Unassigned)</option>
                        <option value="attendee">ATTENDEE (Pass Holder)</option>
                        <option value="gatekeeper">GATEKEEPER (Staff)</option>
                        <option value="security">SECURITY (Steward)</option>
                        <option value="admin">ADMIN (Executive)</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={p.assigned_gate_id || ''}
                        onChange={(e) => handleAssignRoleAndGate(p.id, p.role, e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <option value="">Unassigned</option>
                        {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: GATEKEEPER AUDIT METRICS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-900">Gatekeeper Performance Audit</h3>
            <p className="text-[10px] text-slate-500 font-medium">Scans processed and manual tickets created by personnel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gatekeeperAudit.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4">No staff or gatekeepers registered yet.</p>
            ) : (
              gatekeeperAudit.map(gk => (
                <div key={gk.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{gk.full_name || gk.email}</span>
                    <Badge variant="gold" className="uppercase text-[9px]">{gk.role}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Assigned: {gk.gates?.name || 'Unassigned Gate'}</p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="bg-white p-3 rounded-xl text-center border">
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Scans Processed</span>
                      <span className="text-xl font-black text-emerald-600">{gk.scansCount}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl text-center border">
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Manual Tickets</span>
                      <span className="text-xl font-black text-amber-600">{gk.manualCount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Gate Creation Modal */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900">Add New Venue Gate</h3>
            <form onSubmit={handleCreateGate} className="space-y-4">
              <Input
                label="Gate Name"
                placeholder="e.g. Gate 5 - South Pavilion"
                required
                value={newGateName}
                onChange={e => setNewGateName(e.target.value)}
              />
              <Input
                label="Description"
                placeholder="e.g. VIP & Press Gate"
                value={newGateDesc}
                onChange={e => setNewGateDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowGateModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Create Gate</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
