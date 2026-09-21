import { runTransaction, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TIER_WRISTBANDS } from '../context/AuthContext';

// Festival Standard Dates (Old Parade Ground, Abuja)
const FESTIVAL_DATES = {
  '2026-11-21': 'day1',
  '2026-11-22': 'day2',
  '2026-11-23': 'day3'
};

export async function executeAtomicCheckIn(ticketCode, gateName) {
  const cleanCode = (ticketCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { status: 'INVALID', message: 'No ticket code provided.' };
  }

  // 1. Initial point query to locate attendee document ID
  const attendeesRef = collection(db, 'attendees');
  const q = query(attendeesRef, where('ticketCode', '==', cleanCode));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    return {
      status: 'INVALID',
      code: cleanCode,
      message: 'INVALID TICKET CODE: No registration record found in festival registry.'
    };
  }

  const attendeeDocRef = doc(db, 'attendees', querySnap.docs[0].id);

  // 2. Atomic Transaction: Validates 24-hour expiration, revocation flag, and multi-day check-in
  return await runTransaction(db, async (transaction) => {
    const freshDoc = await transaction.get(attendeeDocRef);
    if (!freshDoc.exists()) {
      return { status: 'INVALID', code: cleanCode, message: 'Attendee record no longer exists.' };
    }

    const data = freshDoc.data();
    const wristbandColor = data.wristbandColor || TIER_WRISTBANDS[data.tier] || 'Emerald Green';

    // Guard 1: Immediate Access Revocation Check
    if (data.accessRevoked === true) {
      return {
        status: 'REVOKED',
        data,
        wristbandColor,
        message: `FLAGGED: ACCESS REVOKED. Entry privileges for ${data.fullName} have been administratively suspended. Do NOT admit.`
      };
    }

    const now = new Date();
    const todayDateString = now.toISOString().split('T')[0];
    const currentDayKey = FESTIVAL_DATES[todayDateString] || 'day1';
    const daysAttended = data.daysAttended || { day1: false, day2: false, day3: false };

    // Guard 2: Same-day Duplicate Admittance Check
    if (data.checkedInFullDate) {
      const lastCheckIn = new Date(data.checkedInFullDate);
      const hoursSinceLastScan = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);

      if (daysAttended[currentDayKey] === true && hoursSinceLastScan < 24) {
        return {
          status: 'DUPLICATE',
          data,
          wristbandColor,
          message: `FLAGGED: PASS ALREADY SCANNED TODAY. Admitted at ${data.checkedInAt || 'earlier today'} by ${data.checkedInBy || 'Gate'}. Hand wristband only once per day.`
        };
      }
    }

    // Guard 3: Subsequent Day Check-In (After 24 Hours or on Next Festival Day)
    const scanTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const scanFullDate = now.toISOString();

    const updatedDaysAttended = {
      ...daysAttended,
      [currentDayKey]: true
    };

    const daysScannedCount = Object.values(updatedDaysAttended).filter(Boolean).length;

    // Commit atomic transition
    transaction.update(attendeeDocRef, {
      status: 'CHECKED_IN',
      checkedInAt: scanTime,
      checkedInFullDate: scanFullDate,
      checkedInBy: gateName,
      daysAttended: updatedDaysAttended
    });

    return {
      status: 'VALID',
      data: {
        ...data,
        status: 'CHECKED_IN',
        checkedInAt: scanTime,
        checkedInFullDate: scanFullDate,
        checkedInBy: gateName,
        daysAttended: updatedDaysAttended
      },
      wristbandColor,
      message: `VALID ENTRY (Day ${currentDayKey.replace('day', '')}): Issue ${wristbandColor.toUpperCase()} Wristband to ${data.fullName} [Attendance: ${daysScannedCount} of 3 Days]`
    };
  });
}
