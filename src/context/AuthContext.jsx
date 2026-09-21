import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AuthContext = createContext();

export const TIER_WRISTBANDS = {
  REGULAR: 'Emerald Green',
  VIP_SILVER: 'Metallic Silver Foil',
  VIP_GOLD: 'Champagne Gold Foil',
  VIP_PLATINUM: 'Obsidian Platinum Badge',
};

export const TIER_LABELS = {
  REGULAR: 'General Entry',
  VIP_SILVER: 'Silver Delegate VIP',
  VIP_GOLD: 'Gold Dignitary VIP',
  VIP_PLATINUM: 'Platinum Executive VIP',
};

// High-entropy, collision-resistant code generator
export function generateTicketCode(tier = 'REGULAR') {
  // Generate 8 alphanumeric entropy characters using crypto API if available
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

  if (tier === 'VIP_SILVER') return `GCC-VIP-SLVR-${entropy}`;
  if (tier === 'VIP_GOLD') return `GCC-VIP-GOLD-${entropy}`;
  if (tier === 'VIP_PLATINUM') return `GCC-VIP-PLAT-${entropy}`;
  return `GCC-2026-${entropy}`;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendeeRecord, setAttendeeRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  // Synchronize Firestore attendee record whenever auth user changes
  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const docRef = doc(db, 'attendees', user.uid);

          // Real-time listener for live gate verification updates
          unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setAttendeeRecord(data);
              localStorage.setItem(`gcc_attendee_${user.uid}`, JSON.stringify(data));
            } else {
              // Check local cache if network/permission delay
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
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  // Helper to ensure attendee document exists in Firestore
  const ensureAttendeeDoc = async (user, fullName, tier = 'REGULAR', referralSource = 'direct') => {
    try {
      const docRef = doc(db, 'attendees', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const ticketCode = generateTicketCode(tier);
        const wristbandColor = TIER_WRISTBANDS[tier] || TIER_WRISTBANDS.REGULAR;

        const newRecord = {
          uid: user.uid,
          fullName: fullName || user.displayName || 'Distinguished Guest',
          email: user.email || 'attendee@carnival.ng',
          ticketCode,
          tier,
          wristbandColor,
          status: 'REGISTERED',
          checkedInAt: null,
          checkedInFullDate: null,
          checkedInBy: null,
          referralSource,
          createdAt: new Date().toISOString()
        };

        await setDoc(docRef, newRecord);
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

  // 1-Click Google Sign-In
  const signInWithGoogle = async (tier = 'REGULAR', referralSource = 'direct') => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await ensureAttendeeDoc(user, user.displayName, tier, referralSource);
    return user;
  };

  // Email + Password + Full Name Sign-Up
  const registerWithEmail = async (email, password, fullName, tier = 'REGULAR', referralSource = 'direct') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    if (fullName) {
      await updateProfile(user, { displayName: fullName });
    }
    await ensureAttendeeDoc(user, fullName, tier, referralSource);
    return user;
  };

  // Email Sign-In
  const loginWithEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  // Sign-Out
  const logout = async () => {
    await signOut(auth);
    setAttendeeRecord(null);
    setIsNewRegistration(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        attendeeRecord,
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
