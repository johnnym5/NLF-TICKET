import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

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
    let unsubscribeDoc = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Derive role from email for Spark plan compatibility
          let role = 'attendee';
          if (user.email === 'admin@gcc.com') role = 'executive_admin';
          else if (user.email?.startsWith('qrscanner')) role = 'gatekeeper';
          setUserRole(role);

          const docRef = doc(db, 'attendees', user.uid);
          unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setAttendeeRecord(data);
              localStorage.setItem(`gcc_attendee_${user.uid}`, JSON.stringify(data));
            } else {
              const cached = localStorage.getItem(`gcc_attendee_${user.uid}`);
              if (cached) {
                setAttendeeRecord(JSON.parse(cached));
              }
            }
            setLoading(false);
          }, (err) => {
            console.warn('Firestore snapshot subscription warning:', err);
            const cached = localStorage.getItem(`gcc_attendee_${user.uid}`);
            if (cached) setAttendeeRecord(JSON.parse(cached));
            setLoading(false);
          });
        } catch (err) {
          console.error('Error attaching doc listener:', err);
          setLoading(false);
        }
      } else {
        setAttendeeRecord(null);
        setUserRole('attendee');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const ensureAttendeeDoc = async (user, fullName, invitationId = null) => {
    try {
      const docRef = doc(db, 'attendees', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Since Cloud Functions are unavailable on Spark plan, we handle registration client-side.
        // In a real production app on Spark, we'd use security rules to validate invitationId if possible,
        // but for now, we'll implement a robust client-side creation.

        let tier = 'REGULAR';
        if (invitationId) {
            // Note: On Spark plan without functions, we can't securely verify invitation usage counts server-side
            // without exposing the invitations collection. For now, we assume valid if present.
            const invRef = doc(db, 'vipInvitations', invitationId);
            const invSnap = await getDoc(invRef);
            if (invSnap.exists()) {
                tier = invSnap.data().tier || 'REGULAR';
            }
        }

        const ticketCode = generateTicketCode(tier);
        const wristbandColor = TIER_WRISTBANDS[tier] || TIER_WRISTBANDS.REGULAR;

        const newRecord = {
          uid: user.uid,
          fullName: fullName || user.displayName || 'Distinguished Guest',
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
          createdAt: serverTimestamp()
        };

        await setDoc(docRef, newRecord);

        // Client-side counter increment for Spark plan
        try {
          const statsRef = doc(db, 'eventStats', 'global');
          await setDoc(statsRef, {
            totalRegistrations: increment(1)
          }, { merge: true });
        } catch (e) {
          console.warn('Stats update failed (might be permissions):', e);
        }

        setAttendeeRecord(newRecord);
        localStorage.setItem(`gcc_attendee_${user.uid}`, JSON.stringify(newRecord));
        setIsNewRegistration(true);

        return newRecord;
      } else {
        const data = docSnap.data();
        setAttendeeRecord(data);
        return data;
      }
    } catch (err) {
      console.error('Registration failed:', err);
      throw new Error('Verification service unavailable. Please check your connection.');
    }
  };

  const signInWithGoogle = async (invitationId = null) => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await ensureAttendeeDoc(user, user.displayName, invitationId);
    return user;
  };

  const registerWithEmail = async (email, password, fullName, invitationId = null) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    if (fullName) {
      await updateProfile(user, { displayName: fullName });
    }

    // Send verification email
    await sendEmailVerification(user);

    await ensureAttendeeDoc(user, fullName, invitationId);
    return user;
  };

  const loginWithEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
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
