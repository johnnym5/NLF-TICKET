import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const TIER_WRISTBANDS = {
  REGULAR: 'Emerald Green',
  VIP_SILVER: 'Metallic Silver Foil',
  VIP_GOLD: 'Champagne Gold Foil',
  VIP_PLATINUM: 'Obsidian Platinum Badge',
  TEAM_MEMBER: 'Cobalt Blue Lanyard',
  VENDOR: 'Tangerine Orange Badge',
  ASSOCIATE: 'Royal Purple Band'
};

export const TIER_LABELS = {
  REGULAR: 'General Entry',
  VIP_SILVER: 'Silver Delegate VIP',
  VIP_GOLD: 'Gold Dignitary VIP',
  VIP_PLATINUM: 'Platinum Executive VIP',
  TEAM_MEMBER: 'Official Team Member',
  VENDOR: 'Certified Carnival Vendor',
  ASSOCIATE: 'Partner Associate'
};

// High-entropy, collision-resistant code generator
export function generateTicketCode(tier = 'REGULAR') {
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
  const [attendeeRecord, setAttendeeRecord] = useState(null);
  const [userRole, setUserRole] = useState('attendee');
  const [loading, setLoading] = useState(true);
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  useEffect(() => {
    let ticketChannel = null;

    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      if (user) {
        await fetchAndSubscribeAttendee(user);
      } else {
        setAttendeeRecord(null);
        setUserRole('attendee');
        setLoading(false);
      }
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);

      if (user) {
        await fetchAndSubscribeAttendee(user);
      } else {
        setAttendeeRecord(null);
        setUserRole('attendee');
        setLoading(false);
        if (ticketChannel) supabase.removeChannel(ticketChannel);
      }
    });

    const fetchAndSubscribeAttendee = async (user) => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('uid', user.id)
          .maybeSingle();

        if (data) {
          setAttendeeRecord(data);
          deriveAndSetRole(user, data);
          localStorage.setItem(`gcc_attendee_${user.id}`, JSON.stringify(data));
        } else {
          deriveAndSetRole(user, null);
          const cached = localStorage.getItem(`gcc_attendee_${user.id}`);
          if (cached) setAttendeeRecord(JSON.parse(cached));
        }

        // Subscribe to real-time changes on tickets table for current user
        if (ticketChannel) supabase.removeChannel(ticketChannel);
        ticketChannel = supabase
          .channel(`ticket_user_${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tickets', filter: `uid=eq.${user.id}` },
            (payload) => {
              if (payload.new) {
                setAttendeeRecord(payload.new);
                deriveAndSetRole(user, payload.new);
                localStorage.setItem(`gcc_attendee_${user.id}`, JSON.stringify(payload.new));
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.warn('Supabase ticket fetch warning:', err);
        const cached = localStorage.getItem(`gcc_attendee_${user.id}`);
        if (cached) setAttendeeRecord(JSON.parse(cached));
      } finally {
        setLoading(false);
      }
    };

    const deriveAndSetRole = (user, record) => {
      if (record?.role) {
        setUserRole(record.role);
      } else {
        let derivedRole = 'attendee';
        if (user.email === 'admin@gcc.com') derivedRole = 'executive_admin';
        else if (user.email?.startsWith('qrscanner')) derivedRole = 'gatekeeper';
        setUserRole(derivedRole);
      }
    };

    return () => {
      subscription.unsubscribe();
      if (ticketChannel) supabase.removeChannel(ticketChannel);
    };
  }, []);

  const ensureAttendeeDoc = async (user, fullName, invitationId = null) => {
    try {
      const { data: existingDoc } = await supabase
        .from('tickets')
        .select('*')
        .eq('uid', user.id)
        .maybeSingle();

      if (!existingDoc) {
        let tier = 'REGULAR';
        if (invitationId) {
          const { data: invData } = await supabase
            .from('vip_invitations')
            .select('*')
            .eq('id', invitationId)
            .maybeSingle();

          if (invData) {
            const now = new Date();
            const expiresAt = new Date(invData.expiresAt);
            if (expiresAt > now && !invData.isUsed) {
              tier = invData.tier || 'REGULAR';
              await supabase
                .from('vip_invitations')
                .update({ isUsed: true, usedBy: user.id })
                .eq('id', invitationId);
            }
          }
        }

        const ticketCode = generateTicketCode(tier);
        const wristbandColor = TIER_WRISTBANDS[tier] || TIER_WRISTBANDS.REGULAR;

        const newRecord = {
          uid: user.id,
          fullName: fullName || user.user_metadata?.full_name || user.displayName || 'Attendee',
          email: user.email,
          ticketCode,
          tier,
          wristbandColor,
          status: 'REGISTERED',
          accessRevoked: false,
          daysAttended: { day1: false, day2: false, day3: false },
          checkedInAt: null,
          checkedInFullDate: null,
          checkedInBy: null,
          referralSource: invitationId ? 'vip_invitation' : 'direct',
          role: 'attendee',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const { data: inserted, error: insertError } = await supabase
          .from('tickets')
          .insert(newRecord)
          .select('*')
          .single();

        if (insertError) {
          console.error('Error inserting ticket:', insertError);
          throw insertError;
        }

        const finalRecord = inserted || newRecord;
        setAttendeeRecord(finalRecord);
        localStorage.setItem(`gcc_attendee_${user.id}`, JSON.stringify(finalRecord));
        setIsNewRegistration(true);

        return finalRecord;
      } else {
        setAttendeeRecord(existingDoc);
        return existingDoc;
      }
    } catch (err) {
      console.error('Registration failed:', err);
      throw new Error('Verification service unavailable. Please check your connection.');
    }
  };

  const signInWithGoogle = async (invitationId = null) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}`
      }
    });

    if (error) throw error;
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
      await ensureAttendeeDoc(user, fullName, invitationId);
    }
    return user;
  };

  const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAttendeeRecord(null);
    setIsNewRegistration(false);
    setUserRole('attendee');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        attendeeRecord,
        userRole,
        loading,
        isNewRegistration,
        setIsNewRegistration,
        signInWithGoogle,
        registerWithEmail,
        loginWithEmail,
        logout,
        ensureAttendeeDoc,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
