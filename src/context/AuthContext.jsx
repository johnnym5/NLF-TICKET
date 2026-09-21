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
  onSnapshot
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, googleProvider, functions } from '../lib/firebase';

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
          // Get custom claims
          const idTokenResult = await user.getIdTokenResult();
          setUserRole(idTokenResult.claims.role || 'attendee');

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
        const registerAttendee = httpsCallable(functions, 'registerAttendee');
        const result = await registerAttendee({ fullName, invitationId });
        const newRecord = result.data;

        setAttendeeRecord(newRecord);
        localStorage.setItem(`gcc_attendee_${user.uid}`, JSON.stringify(newRecord));
        setIsNewRegistration(true);

        // Refresh token to get new claims
        await user.getIdToken(true);

        return newRecord;
      } else {
        const data = docSnap.data();
        setAttendeeRecord(data);
        return data;
      }
    } catch (err) {
      console.error('Registration failed:', err);
      throw new Error(err.message || 'Verification service unavailable. Please check your connection.');
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
