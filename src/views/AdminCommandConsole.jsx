import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, TIER_WRISTBANDS, TIER_LABELS, generateTicketCode } from '../context/AuthContext';
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
  ClipboardList,
  Wifi,
  WifiOff,
  UserPlus,
  Palette,
  Sparkles,
  FolderPlus,
  Tag,
  UserPlus2,
  SlidersHorizontal
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

const COLOR_PRESETS = [
  { name: 'Emerald Green', hex: '#0F4A2F' },
  { name: 'Metallic Silver Foil', hex: '#64748B' },
  { name: 'Champagne Gold Foil', hex: '#D97706' },
  { name: 'Obsidian Platinum', hex: '#0F172A' },
  { name: 'Cobalt Blue Lanyard', hex: '#2563EB' },
  { name: 'Tangerine Orange', hex: '#EA580C' },
  { name: 'Royal Purple Band', hex: '#7E22CE' },
  { name: 'Crimson Red Band', hex: '#DC2626' }
];

function formatLastSeen(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isUserOnline(lastSeenStr) {
  if (!lastSeenStr) return false;
  const diffMs = new Date() - new Date(lastSeenStr);
  return diffMs < 120000;
}

export default function AdminCommandConsole({ onNavigate }) {
  const { currentUser, userRole } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('tickets');

  // Live Data
  const [tickets, setTickets] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [gates, setGates] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [staffRoleFilter, setStaffRoleFilter] = useState('STAFF');

  // Pagination States (max 100, switchable between 10, 25, 50, 100)
  const [ticketPageSize, setTicketPageSize] = useState(100);
  const [ticketCurrentPage, setTicketCurrentPage] = useState(1);
  const [profilePageSize, setProfilePageSize] = useState(100);
  const [profileCurrentPage, setProfileCurrentPage] = useState(1);

  // Collapsible Panel State (Always Starts Closed)
  const [isRolesPanelOpen, setIsRolesPanelOpen] = useState(false);

  // Advanced Registration Time Filtering
  const [regTimeScope, setRegTimeScope] = useState('ALL');
  const [selectedCustomDate, setSelectedCustomDate] = useState('');

  // Gate Form State
  const [showGateModal, setShowGateModal] = useState(false);
  const [newGateName, setNewGateName] = useState('');
  const [newGateDesc, setNewGateDesc] = useState('');

  // Unified ADD USER Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserModalTab, setAddUserModalTab] = useState('DETAILS');

  // Manual User Entry Form State (Email optional)
  const [manualUserFullName, setManualUserFullName] = useState('');
  const [manualUserEmail, setManualUserEmail] = useState('');
  const [manualUserRole, setManualUserRole] = useState('attendee');
  const [manualUserGate, setManualUserGate] = useState('');

  // Custom Group/Role Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCategory, setNewRoleCategory] = useState('staff');
  const [newRoleColorName, setNewRoleColorName] = useState('Cobalt Blue');
  const [newRoleColorHex, setNewRoleColorHex] = useState('#2563EB');

  // VIP Invitation Generator State
  const [selectedVipTier, setSelectedVipTier] = useState('vip_2');
  const [generatedVipUrl, setGeneratedVipUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Wristband Color Allocator State
  const [selectedRoleForColor, setSelectedRoleForColor] = useState('general');
  const [customColorName, setCustomColorName] = useState('Emerald Green');
  const [customColorHex, setCustomColorHex] = useState('#0F4A2F');
  const [savedColorNotice, setSavedColorNotice] = useState(false);

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
        const [ticketsRes, profilesRes, gatesRes, rolesRes] = await Promise.all([
          supabase.from('tickets').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*, gates(*)').order('created_at', { ascending: false }),
          supabase.from('gates').select('*').order('name', { ascending: true }),
          supabase.from('custom_roles').select('*').order('name', { ascending: true })
        ]);

        if (ticketsRes.data) setTickets(ticketsRes.data);
        if (profilesRes.data) setProfiles(profilesRes.data);
        if (gatesRes.data) setGates(gatesRes.data);
        if (rolesRes.data && rolesRes.data.length > 0) {
          setCustomRoles(rolesRes.data);
        } else {
          setCustomRoles([
            { id: '1', name: 'Admin', category: 'staff', wristband_color: 'Obsidian Platinum', wristband_hex: '#0F172A' },
            { id: '2', name: 'Director', category: 'staff', wristband_color: 'Champagne Gold', wristband_hex: '#D97706' },
            { id: '3', name: 'Tech Support', category: 'staff', wristband_color: 'Cobalt Blue', wristband_hex: '#2563EB' },
            { id: '4', name: 'Creatives', category: 'staff', wristband_color: 'Royal Purple', wristband_hex: '#7E22CE' },
            { id: '5', name: 'Security', category: 'staff', wristband_color: 'Crimson Red', wristband_hex: '#DC2626' },
            { id: '6', name: 'Gatekeeper', category: 'staff', wristband_color: 'Emerald Green', wristband_hex: '#0F4A2F' },
            { id: '7', name: 'Team Member', category: 'staff', wristband_color: 'Cobalt Blue', wristband_hex: '#2563EB' },
            { id: '8', name: 'Attendee', category: 'attendee', wristband_color: 'Emerald Green', wristband_hex: '#0F4A2F' },
            { id: '9', name: 'Vendors', category: 'attendee', wristband_color: 'Tangerine Orange', wristband_hex: '#EA580C' },
            { id: '10', name: 'Exhibitors', category: 'attendee', wristband_color: 'Royal Purple', wristband_hex: '#7E22CE' },
            { id: '11', name: 'VIP Tier 1', category: 'attendee', wristband_color: 'Metallic Silver', wristband_hex: '#64748B' },
            { id: '12', name: 'VIP Tier 2', category: 'attendee', wristband_color: 'Champagne Gold', wristband_hex: '#D97706' },
            { id: '13', name: 'VIP Tier 3', category: 'attendee', wristband_color: 'Obsidian Platinum', wristband_hex: '#0F172A' }
          ]);
        }
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

    const rolesChannel = supabase
      .channel('admin_roles_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_roles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [isAuthenticated]);

  const handleCreateManualUser = async (e) => {
    e.preventDefault();

    try {
      const email = manualUserEmail.trim() ? manualUserEmail.trim().toLowerCase() : `manual-${Date.now()}-${Math.random().toString(36).substring(2,6)}@livestockcarnival.ng`;
      const fullName = manualUserFullName.trim() || 'Manual Attendee';
      const role = manualUserRole.toLowerCase();

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      let profileId = existingProfile?.id;

      if (!existingProfile) {
        profileId = crypto.randomUUID ? crypto.randomUUID() : 'manual-' + Math.random().toString(36).substring(2);
        const { data: newProfile, error: profileErr } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            email: email,
            full_name: fullName,
            role: role,
            assigned_gate_id: manualUserGate || null
          })
          .select('*')
          .single();

        if (profileErr) throw profileErr;
        setProfiles(prev => [newProfile, ...prev]);
      } else {
        await supabase
          .from('profiles')
          .update({ role: role, assigned_gate_id: manualUserGate || null })
          .eq('id', profileId);

        setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role, assigned_gate_id: manualUserGate || null } : p));
      }

      const roleObj = customRoles.find(r => r.name.toLowerCase() === role.toLowerCase());
      if (roleObj?.category === 'attendee' || role === 'attendee' || role === 'vendors' || role === 'exhibitors') {
        const ticketCode = generateTicketCode('general');
        await supabase.from('tickets').insert({
          ticket_code: ticketCode,
          owner_id: profileId,
          tier: 'general',
          is_manual: true,
          created_by: currentUser?.id,
          status: 'valid'
        });
      }

      setManualUserFullName('');
      setManualUserEmail('');
      setShowAddUserModal(false);
      alert(`User ${fullName} added as ${role.toUpperCase()}!`);
    } catch (err) {
      alert('Failed to add user: ' + err.message);
    }
  };

  const handleCreateCustomRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const trimmedName = newRoleName.trim();

    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .insert({
          name: trimmedName,
          category: newRoleCategory,
          wristband_color: newRoleColorName,
          wristband_hex: newRoleColorHex
        })
        .select('*')
        .single();

      if (error && error.code !== '23505') throw error;

      if (data) {
        setCustomRoles(prev => [...prev.filter(r => r.name.toLowerCase() !== trimmedName.toLowerCase()), data]);
      } else {
        setCustomRoles(prev => [...prev, {
          id: Math.random().toString(),
          name: trimmedName,
          category: newRoleCategory,
          wristband_color: newRoleColorName,
          wristband_hex: newRoleColorHex
        }]);
      }

      setNewRoleName('');
      setShowAddUserModal(false);
      alert(`Role group "${trimmedName}" created and added to dropdowns!`);
    } catch (err) {
      alert('Failed to create role: ' + err.message);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    const target = profiles.find(p => p.id === profileId);
    const name = target?.full_name || 'User';
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}" and ALL their associated tickets and details from the database?`)) return;

    try {
      await supabase.from('tickets').delete().eq('owner_id', profileId);
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setTickets(prev => prev.filter(t => t.owner_id !== profileId));
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleDeleteTicket = async (ticket) => {
    const code = ticket.ticket_code || ticket.ticketCode;
    if (!window.confirm(`Are you sure you want to permanently delete ticket ${code}? This will clear all ticket details from the database.`)) return;

    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticket.id);
      if (error) throw error;

      setTickets(prev => prev.filter(t => t.id !== ticket.id));
    } catch (err) {
      alert('Failed to delete ticket: ' + err.message);
    }
  };

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

  const handleSaveWristbandColor = async () => {
    try {
      await supabase
        .from('custom_roles')
        .update({
          wristband_color: customColorName,
          wristband_hex: customColorHex
        })
        .ilike('name', selectedRoleForColor);

      setCustomRoles(prev => prev.map(r => r.name.toLowerCase() === selectedRoleForColor.toLowerCase() ? {
        ...r, wristband_color: customColorName, wristband_hex: customColorHex
      } : r));

      setSavedColorNotice(true);
      setTimeout(() => setSavedColorNotice(false), 2500);
    } catch (e) {
      setSavedColorNotice(true);
      setTimeout(() => setSavedColorNotice(false), 2500);
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
      const updatePayload = { role: role.toLowerCase() };
      if (gateId !== undefined) updatePayload.assigned_gate_id = gateId || null;

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profileId);

      if (error) throw error;

      // Auto-issue ticket if role assigned belongs to attendee category
      const targetRoleObj = customRoles.find(r => r.name.toLowerCase() === role.toLowerCase());
      if (targetRoleObj?.category === 'attendee' || role.toLowerCase() === 'attendee' || role.toLowerCase() === 'vendors' || role.toLowerCase() === 'exhibitors') {
        const { data: existingTicket } = await supabase
          .from('tickets')
          .select('*')
          .eq('owner_id', profileId)
          .is('parent_ticket_id', null)
          .maybeSingle();

        if (!existingTicket) {
          const ticketCode = generateTicketCode('general');
          await supabase
            .from('tickets')
            .insert({
              ticket_code: ticketCode,
              owner_id: profileId,
              tier: 'general',
              is_manual: false,
              created_by: currentUser?.id,
              status: 'valid'
            });
        }
      }

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

  // Primary Tickets Stats (Filters parent/primary user passes to avoid double counting child guest passes)
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    const primaryTickets = tickets.filter(t => !t.parent_ticket_id);

    const total = primaryTickets.length;
    const ticketsToday = primaryTickets.filter(t => new Date(t.created_at || t.createdAt).toDateString() === now.toDateString()).length;
    const ticketsThisWeek = primaryTickets.filter(t => new Date(t.created_at || t.createdAt) >= startOfWeek).length;
    const ticketsThisMonth = primaryTickets.filter(t => new Date(t.created_at || t.createdAt).getMonth() === now.getMonth()).length;

    const checkedIn = primaryTickets.filter(t => t.status === 'used' || t.status === 'CHECKED_IN').length;
    const pending = primaryTickets.filter(t => t.status === 'valid' || t.status === 'REGISTERED').length;
    const revoked = primaryTickets.filter(t => t.status === 'revoked').length;
    const manualCount = primaryTickets.filter(t => t.is_manual).length;

    const turnoutRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return { total, ticketsToday, ticketsThisWeek, ticketsThisMonth, checkedIn, pending, revoked, manualCount, turnoutRate };
  }, [tickets]);

  const staffRoleNames = useMemo(() => {
    const list = customRoles.filter(r => r.category === 'staff').map(r => r.name.toLowerCase());
    return ['admin', 'gatekeeper', 'security', 'team_member', 'director', 'tech support', 'creatives', ...list];
  }, [customRoles]);

  const isStaffRole = (roleName) => {
    if (!roleName) return false;
    return staffRoleNames.includes(roleName.toLowerCase());
  };

  const getRoleWristbandObj = (roleName) => {
    if (!roleName) return { name: 'Emerald Green', hex: '#0F4A2F' };
    const found = customRoles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (found) return { name: found.wristband_color || 'Emerald Green', hex: found.wristband_hex || '#0F4A2F' };
    return { name: 'Emerald Green', hex: '#0F4A2F' };
  };

  const gatekeeperAudit = useMemo(() => {
    const staffProfiles = profiles.filter(p => staffRoleNames.includes((p.role || '').toLowerCase()));

    return staffProfiles.map(staff => {
      const scansCount = tickets.filter(t => t.scanned_by === staff.id).length;
      const manualCount = tickets.filter(t => t.created_by === staff.id && t.is_manual).length;
      return {
        ...staff,
        scansCount,
        manualCount
      };
    });
  }, [profiles, tickets, staffRoleNames]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const queryStr = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        (p.full_name || '').toLowerCase().includes(queryStr) ||
        (p.email || '').toLowerCase().includes(queryStr);

      if (!matchesSearch) return false;

      const userRoleLower = (p.role || 'user').toLowerCase();

      if (staffRoleFilter === 'STAFF') {
        return staffRoleNames.includes(userRoleLower);
      }
      if (staffRoleFilter === 'ATTENDEE') {
        return !staffRoleNames.includes(userRoleLower) && userRoleLower !== 'user';
      }
      if (staffRoleFilter === 'USER') {
        return userRoleLower === 'user';
      }

      return true;
    });
  }, [profiles, searchTerm, staffRoleFilter, staffRoleNames]);

  const profileMap = useMemo(() => {
    return new Map(profiles.map(p => [p.id, p]));
  }, [profiles]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const queryStr = searchTerm.toLowerCase();
      const code = (t.ticket_code || t.ticketCode || '').toLowerCase();
      const owner = profileMap.get(t.owner_id);
      const ownerName = (owner?.full_name || t.fullName || '').toLowerCase();
      const ownerEmail = (owner?.email || t.email || '').toLowerCase();

      const matchesSearch = !searchTerm ||
        code.includes(queryStr) ||
        ownerName.includes(queryStr) ||
        ownerEmail.includes(queryStr);

      if (!matchesSearch) return false;

      if (activeFilter === 'CHECKED_IN' && t.status !== 'used' && t.status !== 'CHECKED_IN') return false;
      if (activeFilter === 'PENDING' && t.status !== 'valid' && t.status !== 'REGISTERED') return false;
      if (activeFilter === 'REVOKED' && t.status !== 'revoked') return false;
      if (activeFilter === 'MANUAL' && !t.is_manual) return false;
      if (tierFilter !== 'ALL' && t.tier !== tierFilter) return false;

      if (!isInTimeScope(t.created_at || t.createdAt, regTimeScope)) return false;

      return true;
    });
  }, [tickets, profileMap, searchTerm, activeFilter, tierFilter, regTimeScope, selectedCustomDate]);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setTicketCurrentPage(1);
  }, [searchTerm, activeFilter, tierFilter, regTimeScope, selectedCustomDate, ticketPageSize]);

  useEffect(() => {
    setProfileCurrentPage(1);
  }, [searchTerm, staffRoleFilter, profilePageSize]);

  // Computed Paginated Subsets
  const ticketTotalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize));
  const ticketStartIndex = (ticketCurrentPage - 1) * ticketPageSize;
  const ticketEndIndex = Math.min(filteredTickets.length, ticketStartIndex + ticketPageSize);
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(ticketStartIndex, ticketEndIndex);
  }, [filteredTickets, ticketStartIndex, ticketEndIndex]);

  const profileTotalPages = Math.max(1, Math.ceil(filteredProfiles.length / profilePageSize));
  const profileStartIndex = (profileCurrentPage - 1) * profilePageSize;
  const profileEndIndex = Math.min(filteredProfiles.length, profileStartIndex + profilePageSize);
  const paginatedProfiles = useMemo(() => {
    return filteredProfiles.slice(profileStartIndex, profileEndIndex);
  }, [filteredProfiles, profileStartIndex, profileEndIndex]);

  if (!isAuthenticated) return <StaffLogin title="Admin Dashboard Console" subtitle="Admin Verification Required" allowedEmails={['admin@gcc.com', 'admin@livestockcarnival.ng']} onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar & Dashboard Navigation Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            Admin Dashboard Console
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
            Real-Time Event Operations & Gate Control
          </p>
        </div>

        {/* 4 Feature Tabs (1 line on desktop, 2x2 grid on mobile with toggle open/close) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-100 p-2 rounded-2xl">
          {[
            { id: 'tickets', label: 'Tickets Registry', icon: BarChart3 },
            { id: 'gates', label: 'Venue Gates', icon: MapPin },
            { id: 'staff', label: 'Personnel & Roles', icon: Shield },
            { id: 'audit', label: 'Gatekeeper Audit', icon: ClipboardList }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(prev => prev === tab.id ? null : tab.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0F4A2F] text-white shadow-md scale-[1.02]'
                    : 'bg-white/70 sm:bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
                title={isActive ? 'Click to close section' : `Click to open ${tab.label}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC ROLE & GROUP MANAGER + WRISTBAND CONFIGURATOR (Collapsible - Always Starts Closed) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsRolesPanelOpen(!isRolesPanelOpen)}
          className="w-full p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0F4A2F] flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                Custom Roles, Groups & Wristband Manager
                <Badge variant="pending" className="text-[9px] uppercase">Configurator</Badge>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Click to expand custom role creator, group category management, and physical wristband color allocators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              icon={UserPlus2}
              onClick={(e) => {
                e.stopPropagation();
                setShowAddUserModal(true);
                setAddUserModalTab('DETAILS');
              }}
            >
              ADD USER
            </Button>

            <div className="p-2 bg-slate-100 rounded-xl text-slate-500 transition-transform duration-200">
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isRolesPanelOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {isRolesPanelOpen && (
          <div className="p-6 pt-0 border-t border-slate-100 space-y-6 animate-fadeIn">
            {/* Live Wristband Color Customizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Select Role to Color-Code
                  </h4>

                  <select
                    value={selectedRoleForColor}
                    onChange={(e) => {
                      setSelectedRoleForColor(e.target.value);
                      const roleObj = customRoles.find(r => r.name.toLowerCase() === e.target.value.toLowerCase());
                      if (roleObj) {
                        setCustomColorName(roleObj.wristband_color || 'Emerald Green');
                        setCustomColorHex(roleObj.wristband_hex || '#0F4A2F');
                      }
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black uppercase cursor-pointer"
                  >
                    {customRoles.map(r => (
                      <option key={r.id} value={r.name.toLowerCase()}>{r.name.toUpperCase()} ({r.category.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Preset Wristband Colors</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => { setCustomColorName(preset.name); setCustomColorHex(preset.hex); }}
                        className="p-2 bg-white rounded-xl border border-slate-200 hover:border-slate-400 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full border shadow-xs" style={{ backgroundColor: preset.hex }} />
                        <span className="text-[9px] font-bold text-slate-700 leading-tight">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Input
                    label="Wristband Color Name"
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                  />
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Color Code (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border p-0.5"
                      />
                      <input
                        type="text"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveWristbandColor}
                  className="w-full py-2.5 bg-[#0F4A2F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-emerald-950 transition-all flex items-center justify-center gap-2"
                >
                  {savedColorNotice ? <Check className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
                  {savedColorNotice ? 'Color Saved to Role!' : 'Save Wristband Color for Role'}
                </button>
              </div>

              {/* Live Physical Wristband Strip Rendering */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Physical Wristband Band Preview</span>

                <div
                  className="p-6 rounded-2xl text-white shadow-lg space-y-4 relative overflow-hidden transition-all flex flex-col justify-between h-48"
                  style={{ backgroundColor: customColorHex }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src="/logo.jpeg" alt="NLF Logo" className="w-8 h-8 rounded-lg border border-white/30" />
                      <div>
                        <span className="font-black text-xs uppercase tracking-tight block">NLF 2026 CARNIVAL</span>
                        <span className="text-[8px] font-black uppercase opacity-80 block tracking-widest">OFFICIAL GATE WRISTBAND</span>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/30">
                      {selectedRoleForColor.toUpperCase()}
                    </span>
                  </div>

                  <div className="border-t border-white/20 pt-3 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase opacity-75 block">Band Color Designation</span>
                      <p className="text-base font-black uppercase tracking-wide">{customColorName}</p>
                    </div>
                    <div className="font-mono text-xs font-black tracking-widest bg-black/30 px-3 py-1 rounded-lg">
                      GCC-2026-BAND
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

        {/* Daily / Weekly / Monthly Intake Counters & Calendar Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5" />
                Ticket Ingestion Velocity:
            </span>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase">
              <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200">
                Today: <strong className="text-slate-900">{stats.ticketsToday}</strong>
              </span>
              <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-xl border border-blue-200">
                This Week: <strong className="text-slate-900">{stats.ticketsThisWeek}</strong>
              </span>
              <span className="bg-purple-50 text-purple-800 px-3 py-1 rounded-xl border border-purple-200">
                This Month: <strong className="text-slate-900">{stats.ticketsThisMonth}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
      </div>

      {/* KPI Cards (Click to Filter / Toggle Tickets Section) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            if (activeTab === 'tickets' && activeFilter === 'ALL') {
              setActiveTab(null);
            } else {
              setActiveTab('tickets');
              setActiveFilter('ALL');
            }
          }}
          className={`premium-card p-6 flex flex-col justify-between h-32 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === 'tickets' && activeFilter === 'ALL' ? 'ring-2 ring-slate-900 shadow-md' : ''
          }`}
          title={activeTab === 'tickets' && activeFilter === 'ALL' ? 'Click to close section' : 'Click to view all tickets'}
        >
          <span className="text-[10px] font-black uppercase text-slate-400">Total Issued Tickets</span>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          <span className="text-[10px] font-bold text-slate-400">Global Database Baseline</span>
        </div>

        <div
          onClick={() => {
            if (activeTab === 'tickets' && activeFilter === 'CHECKED_IN') {
              setActiveTab(null);
            } else {
              setActiveTab('tickets');
              setActiveFilter('CHECKED_IN');
            }
          }}
          className={`premium-card p-6 flex flex-col justify-between h-32 bg-emerald-50 border-emerald-200 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === 'tickets' && activeFilter === 'CHECKED_IN' ? 'ring-2 ring-emerald-600 shadow-md' : ''
          }`}
          title={activeTab === 'tickets' && activeFilter === 'CHECKED_IN' ? 'Click to close section' : 'Click to view Checked In passes'}
        >
          <span className="text-[10px] font-black uppercase text-emerald-700">Checked In (Used)</span>
          <p className="text-3xl font-black text-emerald-950">{stats.checkedIn}</p>
          <span className="text-[10px] font-bold text-emerald-700">Present At Venue</span>
        </div>

        <div
          onClick={() => {
            if (activeTab === 'tickets' && activeFilter === 'PENDING') {
              setActiveTab(null);
            } else {
              setActiveTab('tickets');
              setActiveFilter('PENDING');
            }
          }}
          className={`premium-card p-6 flex flex-col justify-between h-32 bg-amber-50 border-amber-200 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === 'tickets' && activeFilter === 'PENDING' ? 'ring-2 ring-amber-500 shadow-md' : ''
          }`}
          title={activeTab === 'tickets' && activeFilter === 'PENDING' ? 'Click to close section' : 'Click to view Pending Valid passes'}
        >
          <span className="text-[10px] font-black uppercase text-amber-700">Pending Valid Passes</span>
          <p className="text-3xl font-black text-amber-950">{stats.pending}</p>
          <span className="text-[10px] font-bold text-amber-700">Unscanned Passes</span>
        </div>

        <div
          onClick={() => {
            if (activeTab === 'tickets' && activeFilter === 'MANUAL') {
              setActiveTab(null);
            } else {
              setActiveTab('tickets');
              setActiveFilter('MANUAL');
            }
          }}
          className={`premium-card p-6 flex flex-col justify-between h-32 bg-slate-900 text-white cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
            activeTab === 'tickets' && activeFilter === 'MANUAL' ? 'ring-2 ring-amber-400 shadow-md' : ''
          }`}
          title={activeTab === 'tickets' && activeFilter === 'MANUAL' ? 'Click to close section' : 'Click to view Manual Gate tickets'}
        >
          <span className="text-[10px] font-black uppercase text-slate-400">Manual Gate Tickets</span>
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
                type="text" placeholder="Search attendee name, email, or ticket code..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-medium"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'PENDING', 'CHECKED_IN', 'REVOKED', 'MANUAL'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilter === f ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
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
                  <th className="p-4">Attendee & Ticket Code</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">3-Day Attendance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Scanned At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredTickets.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No tickets found in database matching criteria.</td></tr>
                ) : (
                  paginatedTickets.map(t => {
                    const owner = profileMap.get(t.owner_id);
                    const displayName = owner?.full_name || t.fullName || 'Attendee';
                    const displayEmail = owner?.email || t.email || '';

                    // 3-Day Attendance Telemetry
                    const days = t.days_attended || t.daysAttended || {};
                    let d1 = Boolean(days.day1);
                    let d2 = Boolean(days.day2);
                    let d3 = Boolean(days.day3);

                    if (t.scanned_at) {
                      const dateStr = new Date(t.scanned_at).toISOString().split('T')[0];
                      if (dateStr === '2026-11-21') d1 = true;
                      else if (dateStr === '2026-11-22') d2 = true;
                      else if (dateStr === '2026-11-23') d3 = true;
                      else if (t.status === 'used' || t.status === 'CHECKED_IN') d1 = true;
                    } else if (t.status === 'used' || t.status === 'CHECKED_IN') {
                      d1 = true;
                    }

                    const attendedCount = (d1 ? 1 : 0) + (d2 ? 1 : 0) + (d3 ? 1 : 0);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-sm">{displayName}</div>
                          <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{t.ticket_code || t.ticketCode}</span>
                            {displayEmail && <span className="text-slate-400 font-sans font-medium">({displayEmail})</span>}
                          </div>
                        </td>
                        <td className="p-4 uppercase font-black">{t.tier}</td>
                        <td className="p-4">
                          {t.is_manual ? <Badge variant="gold">MANUAL</Badge> : <Badge variant="pending">DIGITAL</Badge>}
                        </td>

                        {/* 3-Line Dash Attendance Telemetry */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <div
                                className={`h-1.5 w-5 rounded-full transition-all ${d1 ? 'bg-emerald-500 shadow-xs' : 'bg-slate-200'}`}
                                title={`Day 1 (21 Nov): ${d1 ? 'Present' : 'Absent'}`}
                              />
                              <div
                                className={`h-1.5 w-5 rounded-full transition-all ${d2 ? 'bg-emerald-500 shadow-xs' : 'bg-slate-200'}`}
                                title={`Day 2 (22 Nov): ${d2 ? 'Present' : 'Absent'}`}
                              />
                              <div
                                className={`h-1.5 w-5 rounded-full transition-all ${d3 ? 'bg-emerald-500 shadow-xs' : 'bg-slate-200'}`}
                                title={`Day 3 (23 Nov): ${d3 ? 'Present' : 'Absent'}`}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {attendedCount} / 3 Days
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge variant={t.status === 'used' || t.status === 'CHECKED_IN' ? 'success' : t.status === 'valid' || t.status === 'REGISTERED' ? 'pending' : 'error'}>
                            {t.status?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {t.scanned_at ? new Date(t.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unscanned'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleRevocation(t)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                t.status === 'revoked' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              {t.status === 'revoked' ? 'Restore' : 'Revoke'}
                            </button>

                            <button
                              onClick={() => handleDeleteTicket(t)}
                              className="p-1.5 rounded-xl bg-slate-100 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                              title="Delete Ticket from Database"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Ticket Pagination Bar */}
          {filteredTickets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Show:</span>
                {[10, 25, 50, 100].map(size => (
                  <button
                    key={size}
                    onClick={() => { setTicketPageSize(size); setTicketCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      ticketPageSize === size
                        ? 'bg-[#0F4A2F] text-white shadow-xs scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
                <span>per page</span>
              </div>

              <span className="text-xs font-bold text-slate-500">
                Showing {filteredTickets.length > 0 ? ticketStartIndex + 1 : 0}–{ticketEndIndex} of {filteredTickets.length} tickets
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTicketCurrentPage(p => Math.max(1, p - 1))}
                  disabled={ticketCurrentPage === 1}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-black text-slate-800 px-3">
                  Page {ticketCurrentPage} of {ticketTotalPages}
                </span>

                <button
                  onClick={() => setTicketCurrentPage(p => Math.min(ticketTotalPages, p + 1))}
                  disabled={ticketCurrentPage >= ticketTotalPages}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
              <p className="text-[10px] text-slate-500 font-medium">Promote users to Staff/Admin/Team or downgrade Staff to Attendee/User</p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" icon={UserPlus2} onClick={() => { setShowAddUserModal(true); setAddUserModalTab('DETAILS'); }}>
                ADD USER
              </Button>

              {[
                { id: 'STAFF', label: 'Staff & Operations' },
                { id: 'ATTENDEE', label: 'Attendees & Guests' },
                { id: 'USER', label: 'Unassigned Users' },
                { id: 'ALL', label: 'All Accounts' }
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
                <th className="p-4">Status & Telemetry</th>
                <th className="p-4">Assigned Role / Group</th>
                <th className="p-4">Gate / Access Tier</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProfiles.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">No profiles found matching criteria.</td></tr>
              ) : (
                paginatedProfiles.map(p => {
                  const online = isUserOnline(p.last_seen_at);
                  const isGatekeeper = (p.role || '').toLowerCase() === 'gatekeeper';
                  const isStaff = isStaffRole(p.role);
                  const wristband = getRoleWristbandObj(p.role);
                  const isManualUser = p.email && p.email.startsWith('manual-');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{p.full_name || 'User'}</div>
                        {isManualUser ? (
                          <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider mt-0.5">
                            MANUAL ENTRY
                          </span>
                        ) : (
                          <div className="text-[10px] text-slate-400">{p.email}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <span className="text-[10px] font-extrabold uppercase text-slate-600">
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Seen: {formatLastSeen(p.last_seen_at)}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={(p.role || 'user').toLowerCase()}
                          onChange={(e) => handleAssignRoleAndGate(p.id, e.target.value, p.assigned_gate_id)}
                          className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase cursor-pointer shadow-xs max-w-xs"
                        >
                          <optgroup label="STAFF & OPERATIONS GROUPS">
                            {customRoles.filter(r => r.category === 'staff').map(r => (
                              <option key={r.id} value={r.name.toLowerCase()}>{r.name.toUpperCase()} (STAFF)</option>
                            ))}
                          </optgroup>
                          <optgroup label="ATTENDEE & GUEST GROUPS">
                            {customRoles.filter(r => r.category === 'attendee').map(r => (
                              <option key={r.id} value={r.name.toLowerCase()}>{r.name.toUpperCase()} (PASS)</option>
                            ))}
                          </optgroup>
                          <optgroup label="UNASSIGNED">
                            <option value="user">USER (Unassigned)</option>
                          </optgroup>
                        </select>
                      </td>
                      <td className="p-4">
                        {isGatekeeper ? (
                          <select
                            value={p.assigned_gate_id || ''}
                            onChange={(e) => handleAssignRoleAndGate(p.id, p.role, e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold cursor-pointer shadow-xs"
                          >
                            <option value="">Unassigned Gate</option>
                            {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        ) : !isStaff ? (
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-fit">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: wristband.hex }} />
                            <span className="font-extrabold uppercase text-slate-700 text-[10px]">
                              {wristband.name}
                            </span>
                          </div>
                        ) : null}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteProfile(p.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete User Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Personnel Pagination Bar */}
          {filteredProfiles.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Show:</span>
                {[10, 25, 50, 100].map(size => (
                  <button
                    key={size}
                    onClick={() => { setProfilePageSize(size); setProfileCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      profilePageSize === size
                        ? 'bg-[#0F4A2F] text-white shadow-xs scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
                <span>per page</span>
              </div>

              <span className="text-xs font-bold text-slate-500">
                Showing {filteredProfiles.length > 0 ? profileStartIndex + 1 : 0}–{profileEndIndex} of {filteredProfiles.length} accounts
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileCurrentPage(p => Math.max(1, p - 1))}
                  disabled={profileCurrentPage === 1}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-black text-slate-800 px-3">
                  Page {profileCurrentPage} of {profileTotalPages}
                </span>

                <button
                  onClick={() => setProfileCurrentPage(p => Math.min(profileTotalPages, p + 1))}
                  disabled={profileCurrentPage >= profileTotalPages}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GATEKEEPER AUDIT METRICS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-900">Gatekeeper Performance Audit</h3>
            <p className="text-[10px] text-slate-500 font-medium">Scans processed, active telemetry, and manual tickets created by personnel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gatekeeperAudit.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4">No staff or gatekeepers registered yet.</p>
            ) : (
              gatekeeperAudit.map(gk => {
                const online = isUserOnline(gk.last_seen_at);
                return (
                  <div key={gk.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900 text-sm">{gk.full_name || gk.email}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {online ? 'Online' : 'Offline'} • Last seen {formatLastSeen(gk.last_seen_at)}
                          </span>
                        </div>
                      </div>
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
                );
              })
            )}
          </div>
        </div>
      )}

      {/* UNIFIED "ADD USER" MODAL (Manual Details OR New Group Type) */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                <UserPlus2 className="w-4 h-4 text-[#0F4A2F]" />
                User & Group Provisioning
              </h3>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAddUserModalTab('DETAILS')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${addUserModalTab === 'DETAILS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  New User Details
                </button>
                <button
                  type="button"
                  onClick={() => setAddUserModalTab('TYPE')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${addUserModalTab === 'TYPE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  New Group / Type
                </button>
              </div>
            </div>

            {/* TAB A: MANUAL NEW USER ENTRY (Email is optional) */}
            {addUserModalTab === 'DETAILS' && (
              <form onSubmit={handleCreateManualUser} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. John Mary"
                  value={manualUserFullName}
                  onChange={e => setManualUserFullName(e.target.value)}
                />
                <Input
                  label="Email Address (Optional for Manual Entry)"
                  type="email"
                  placeholder="e.g. john@livestockcarnival.ng (Optional)"
                  value={manualUserEmail}
                  onChange={e => setManualUserEmail(e.target.value)}
                />

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Assigned Role / Group</label>
                  <select
                    value={manualUserRole}
                    onChange={(e) => setManualUserRole(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase cursor-pointer"
                  >
                    <optgroup label="STAFF & OPERATIONS GROUPS">
                      {customRoles.filter(r => r.category === 'staff').map(r => (
                        <option key={r.id} value={r.name.toLowerCase()}>{r.name.toUpperCase()} (STAFF)</option>
                      ))}
                    </optgroup>
                    <optgroup label="ATTENDEE & GUEST GROUPS">
                      {customRoles.filter(r => r.category === 'attendee').map(r => (
                        <option key={r.id} value={r.name.toLowerCase()}>{r.name.toUpperCase()} (PASS)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Gate Selection if Staff Role Chosen */}
                {isStaffRole(manualUserRole) && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Assign Gate Checkpoint (Optional)</label>
                    <select
                      value={manualUserGate}
                      onChange={(e) => setManualUserGate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold cursor-pointer"
                    >
                      <option value="">Unassigned Gate</option>
                      {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Add User & Issue Credentials</Button>
                </div>
              </form>
            )}

            {/* TAB B: CREATE NEW GROUP / ROLE TYPE */}
            {addUserModalTab === 'TYPE' && (
              <form onSubmit={handleCreateCustomRole} className="space-y-4">
                <Input
                  label="New Group / Role Name"
                  placeholder="e.g. Director, Tech Support, Creatives, Vendors, Exhibitors"
                  required
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                />

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Group Category</label>
                  <select
                    value={newRoleCategory}
                    onChange={(e) => setNewRoleCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase cursor-pointer"
                  >
                    <option value="staff">Staff & Operations (Director, Tech Support, Creatives, Security)</option>
                    <option value="attendee">Attendees & Guests (Vendors, Exhibitors, Sponsors, Press)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Wristband Color Name"
                    placeholder="e.g. Cobalt Blue"
                    value={newRoleColorName}
                    onChange={e => setNewRoleColorName(e.target.value)}
                  />
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Color Code (Hex)</label>
                    <input
                      type="color"
                      value={newRoleColorHex}
                      onChange={e => setNewRoleColorHex(e.target.value)}
                      className="w-full h-10 rounded-xl cursor-pointer border p-0.5"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Create Group & Add to Dropdowns</Button>
                </div>
              </form>
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
