import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const TIER_WRISTBANDS = {
  general: 'Emerald Green',
  vip_1: 'Metallic Silver Foil',
  vip_2: 'Champagne Gold Foil',
  vip_3: 'Obsidian Platinum Badge',
  // Backward compatibility keys
  REGULAR: 'Emerald Green',
  VIP_SILVER: 'Metallic Silver Foil',
  VIP_GOLD: 'Champagne Gold Foil',
  VIP_PLATINUM: 'Obsidian Platinum Badge',
  TEAM_MEMBER: 'Cobalt Blue Lanyard',
  VENDOR: 'Tangerine Orange Badge',
  ASSOCIATE: 'Royal Purple Band'
};

export const TIER_LABELS = {
  general: 'General Admission Pass',
  vip_1: 'VIP Tier 1 (+10 Guests)',
  vip_2: 'VIP Tier 2 (+15 Guests)',
  vip_3: 'VIP Tier 3 (+20 Guests)',
  // Backward compatibility keys
  REGULAR: 'General Entry',
  VIP_SILVER: 'Silver Delegate VIP',
  VIP_GOLD: 'Gold Dignitary VIP',
  VIP_PLATINUM: 'Platinum Executive VIP',
  TEAM_MEMBER: 'Official Team Member',
  VENDOR: 'Certified Carnival Vendor',
  ASSOCIATE: 'Partner Associate'
};

export const VIP_PLUS_ONES = {
  vip_1: 10,
  vip_2: 15,
  vip_3: 20,
  general: 0
};

// High-entropy, collision-resistant code generator
export function generateTicketCode(tier = 'general') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let entropy = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const values = new Uint8Array(6);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < values.length; i++) {
      entropy += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      entropy += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  const prefixMap = {
    'vip_1': 'GCC-VIP1-',
    'vip_2': 'GCC-VIP2-',
    'vip_3': 'GCC-VIP3-',
    'VIP_SILVER': 'GCC-VIP-SLVR-',
    'VIP_GOLD': 'GCC-VIP-GOLD-',
    'VIP_PLATINUM': 'GCC-VIP-PLAT-',
    'TEAM_MEMBER': 'GCC-TEAM-',
    'VENDOR': 'GCC-VNDR-',
    'ASSOCIATE': 'GCC-ASSC-'
  };

  return (prefixMap[tier] || 'GCC-2026-') + entropy;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('user'); // admin, gatekeeper, security, team_member, attendee, user
  const [userTicket, setUserTicket] = useState(null);
  const [assignedGate, setAssignedGate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  // Periodic Heartbeat to maintain last_seen_at telemetry
  useEffect(() => {
    if (!currentUser?.id) return;

    const pingHeartbeat = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', currentUser.id);
      } catch (e) {
        // Ignore silent heartbeat errors
      }
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 60000); // Heartbeat every 60s
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    let profileChannel = null;
    let ticketChannel = null;

    const setupAuth = async () => {
      if (window.opener && window.name === 'GoogleSignInPopup') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.close();
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      if (user) {
        await loadUserData(user);
      } else {
        clearUserState();
        setLoading(false);
      }
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;

      if (user && window.opener && window.name === 'GoogleSignInPopup') {
        window.close();
        return;
      }

      setCurrentUser(user);

      if (user) {
        await loadUserData(user);
      } else {
        clearUserState();
        setLoading(false);
        if (profileChannel) supabase.removeChannel(profileChannel);
        if (ticketChannel) supabase.removeChannel(ticketChannel);
      }
    });

    const loadUserData = async (user) => {
      try {
        // 1. Fetch Profile
        let { data: profile } = await supabase
          .from('profiles')
          .select('*, gates(*)')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          const derivedRole = (user.email === 'admin@livestockcarnival.ng' || user.email === 'admin@gcc.com') ? 'admin' :
                            user.email?.startsWith('qrscanner') ? 'gatekeeper' : 'user';

          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: derivedRole
            })
            .select('*, gates(*)')
            .single();

          profile = newProfile;
        }

        setUserProfile(profile);
        setUserRole(profile?.role || 'user');
        setAssignedGate(profile?.gates || null);

        // 2. Fetch User Ticket (Safe array check)
        const { data: userTickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('owner_id', user.id)
          .is('parent_ticket_id', null)
          .order('created_at', { ascending: false });

        const ticket = (userTickets && userTickets.length > 0) ? userTickets[0] : null;

        if (ticket) {
          setUserTicket(ticket);
          // Auto-sync role to attendee if ticket exists and current role is 'user'
          if (profile && profile.role === 'user') {
            await supabase.from('profiles').update({ role: 'attendee' }).eq('id', user.id);
            profile.role = 'attendee';
            setUserRole('attendee');
          }
        } else {
          // Auto-provision ticket ONLY if user is a regular attendee/user, NOT staff or admin
          const roleLower = (profile?.role || 'user').toLowerCase();
          const isStaffOrAdmin = ['admin', 'executive_admin', 'gatekeeper', 'security', 'team_member', 'director', 'tech support', 'creatives'].includes(roleLower);

          if (!isStaffOrAdmin) {
            try {
              await ensureUserTicket(user, profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0], 'general');
            } catch (e) {
              console.warn('Auto-provisioning ticket warning:', e);
            }
          }
        }

        // Check if there is an active VIP invitation parameter in URL
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const inviteId = urlParams.get('invite');
          if (inviteId) {
            try {
              await ensureUserTicket(user, profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0], 'general', inviteId);
            } catch (e) {
              console.warn('VIP invite processing warning:', e);
            }
          }
        }

        // Realtime channels
        if (profileChannel) supabase.removeChannel(profileChannel);
        profileChannel = supabase
          .channel(`profile_${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
            async () => {
              const { data: updated } = await supabase
                .from('profiles')
                .select('*, gates(*)')
                .eq('id', user.id)
                .single();
              if (updated) {
                setUserProfile(updated);
                setUserRole(updated.role);
                setAssignedGate(updated.gates || null);
              }
            }
          )
          .subscribe();

        if (ticketChannel) supabase.removeChannel(ticketChannel);
        ticketChannel = supabase
          .channel(`ticket_owner_${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tickets', filter: `owner_id=eq.${user.id}` },
            (payload) => {
              if (payload.new) setUserTicket(payload.new);
            }
          )
          .subscribe();

      } catch (err) {
        console.warn('Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    };

    const clearUserState = () => {
      setUserProfile(null);
      setUserRole('user');
      setUserTicket(null);
      setAssignedGate(null);
    };

    return () => {
      subscription.unsubscribe();
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (ticketChannel) supabase.removeChannel(ticketChannel);
    };
  }, []);

  const ensureUserTicket = async (user, fullName, tier = 'general', invitationId = null) => {
    try {
      const dbUser = user || currentUser;
      if (!dbUser) throw new Error('No active user session');

      // Check if invitationId exists in URL parameters if not passed explicitly
      let targetInviteId = invitationId;
      if (!targetInviteId && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        targetInviteId = urlParams.get('invite');
      }

      let activeTier = tier || 'general';

      if (targetInviteId) {
        const { data: invite } = await supabase
          .from('vip_invitations')
          .select('*')
          .eq('id', targetInviteId)
          .maybeSingle();

        if (invite && (!invite.isUsed || invite.usedBy === dbUser.id)) {
          activeTier = invite.tier || 'vip_2';
          await supabase
            .from('vip_invitations')
            .update({ isUsed: true, usedBy: dbUser.id })
            .eq('id', targetInviteId);
        }
      }

      const normalizedTier = activeTier.toLowerCase().includes('vip') ?
        (activeTier === 'VIP_SILVER' ? 'vip_1' : activeTier === 'VIP_GOLD' ? 'vip_2' : activeTier === 'VIP_PLATINUM' ? 'vip_3' : activeTier.toLowerCase()) : 'general';

      // Safe check using array query
      const { data: existingTickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('owner_id', dbUser.id)
        .is('parent_ticket_id', null)
        .order('created_at', { ascending: false });

      let currentTicket = (existingTickets && existingTickets.length > 0) ? existingTickets[0] : null;

      if (currentTicket) {
        // Upgrade general ticket to VIP if VIP invitation link processed
        if (normalizedTier.startsWith('vip') && currentTicket.tier !== normalizedTier) {
          const { data: upgraded } = await supabase
            .from('tickets')
            .update({ tier: normalizedTier })
            .eq('id', currentTicket.id)
            .select('*')
            .single();

          if (upgraded) currentTicket = upgraded;
          await supabase.from('profiles').update({ role: normalizedTier }).eq('id', dbUser.id);
          setUserRole(normalizedTier);
        }

        setUserTicket(currentTicket);

        // Generate VIP guest tickets if VIP tier and guest tickets not generated yet
        const plusOnes = VIP_PLUS_ONES[normalizedTier] || 0;
        if (plusOnes > 0 && currentTicket) {
          const { data: existingGuests } = await supabase
            .from('tickets')
            .select('*')
            .eq('parent_ticket_id', currentTicket.id);

          if (!existingGuests || existingGuests.length < plusOnes) {
            const guestTickets = [];
            const startNum = existingGuests ? existingGuests.length + 1 : 1;
            for (let i = startNum; i <= plusOnes; i++) {
              guestTickets.push({
                ticket_code: generateTicketCode(normalizedTier) + `-G${i}`,
                owner_id: dbUser.id,
                tier: normalizedTier,
                parent_ticket_id: currentTicket.id,
                guest_name: `Guest #${i}`,
                is_manual: false,
                created_by: dbUser.id,
                status: 'valid'
              });
            }
            await supabase.from('tickets').insert(guestTickets);
          }
        }

        return currentTicket;
      }

      // Create new ticket if no ticket exists
      const ticketCode = generateTicketCode(normalizedTier);

      const newTicket = {
        ticket_code: ticketCode,
        owner_id: dbUser.id,
        tier: normalizedTier,
        is_manual: false,
        created_by: dbUser.id,
        status: 'valid'
      };

      const { data: insertedTicket, error: insertErr } = await supabase
        .from('tickets')
        .insert(newTicket)
        .select('*')
        .single();

      if (insertErr) throw insertErr;

      const roleToSet = normalizedTier.startsWith('vip') ? normalizedTier : 'attendee';
      await supabase.from('profiles').update({ role: roleToSet }).eq('id', dbUser.id);
      setUserRole(roleToSet);

      setUserTicket(insertedTicket);
      setIsNewRegistration(true);

      // Generate VIP guest tickets
      const plusOnes = VIP_PLUS_ONES[normalizedTier] || 0;
      if (plusOnes > 0 && insertedTicket) {
        const guestTickets = [];
        for (let i = 1; i <= plusOnes; i++) {
          guestTickets.push({
            ticket_code: generateTicketCode(normalizedTier) + `-G${i}`,
            owner_id: dbUser.id,
            tier: normalizedTier,
            parent_ticket_id: insertedTicket.id,
            guest_name: `Guest #${i}`,
            is_manual: false,
            created_by: dbUser.id,
            status: 'valid'
          });
        }
        await supabase.from('tickets').insert(guestTickets);
      }

      return insertedTicket;
    } catch (err) {
      console.error('ensureUserTicket failed:', err);
      throw err;
    }
  };

  const signInWithGoogle = async (invitationId = null) => {
    const callbackUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo: callbackUrl
      }
    });

    if (error) throw error;

    if (data?.url) {
      const width = 500;
      const height = 600;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

      const popup = window.open(
        data.url,
        'GoogleSignInPopup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!popup) {
        window.location.href = data.url;
        return data;
      }

      return new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(timer);
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                await ensureUserTicket(session.user, session.user.user_metadata?.full_name, 'general', invitationId);
                resolve(session.user);
              } else {
                reject(new Error('Google sign in window was closed before completion.'));
              }
            }
          } catch (e) {
            // Ignore cross-origin popup errors
          }
        }, 500);
      });
    }

    return data;
  };

  const registerWithEmail = async (email, password, fullName, invitationId = null) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;
    const user = data.user;
    if (user) {
      await ensureUserTicket(user, fullName, 'general', invitationId);
    }
    return user;
  };

  const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    const user = data.user;
    if (user) {
      try {
        const roleLower = user.email === 'admin@livestockcarnival.ng' || user.email === 'admin@gcc.com' ? 'admin' : 'user';
        if (roleLower === 'user') {
          await ensureUserTicket(user, user.user_metadata?.full_name || user.email?.split('@')[0], 'general');
        }
      } catch (e) {
        console.warn('Login ticket ensure warning:', e);
      }
    }
    return user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setUserRole('user');
    setUserTicket(null);
    setAssignedGate(null);
    setIsNewRegistration(false);
  };

  const attendeeRecord = userTicket ? {
    id: userTicket.id,
    uid: userTicket.owner_id,
    fullName: userProfile?.full_name || currentUser?.email || 'Attendee',
    email: userProfile?.email || currentUser?.email,
    ticketCode: userTicket.ticket_code,
    tier: userTicket.tier,
    wristbandColor: TIER_WRISTBANDS[userTicket.tier] || 'Emerald Green',
    status: userTicket.status === 'valid' ? 'REGISTERED' : userTicket.status === 'used' ? 'CHECKED_IN' : 'REVOKED',
    accessRevoked: userTicket.status === 'revoked',
    createdAt: userTicket.created_at,
    role: userRole
  } : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userRole,
        userTicket,
        assignedGate,
        attendeeRecord,
        loading,
        isNewRegistration,
        setIsNewRegistration,
        signInWithGoogle,
        registerWithEmail,
        loginWithEmail,
        logout,
        ensureUserTicket,
        ensureAttendeeDoc: ensureUserTicket
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
