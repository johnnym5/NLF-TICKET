import { runTransaction, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TIER_WRISTBANDS } from '../context/AuthContext';

export async function executeAtomicCheckIn(ticketCode, gateName) {
  const cleanCode = (ticketCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { status: 'INVALID', message: 'No ticket code provided.' };
  }

  // 1. Initial query to resolve document ID
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

  // 2. Atomic Transaction (Locks document during read-modify-write)
  return await runTransaction(db, async (transaction) => {
    const freshDoc = await transaction.get(attendeeDocRef);
    if (!freshDoc.exists()) {
      return { status: 'INVALID', code: cleanCode, message: 'Attendee document no longer exists.' };
    }

    const data = freshDoc.data();
    const wristbandColor = data.wristbandColor || TIER_WRISTBANDS[data.tier] || 'Emerald Green';

    // Duplicate Check inside transaction
    if (data.status === 'CHECKED_IN') {
      return {
        status: 'DUPLICATE',
        data,
        wristbandColor,
        message: `FLAGGED: DUPLICATE ENTRY. Pass already scanned at ${data.checkedInAt || 'earlier time'} by ${data.checkedInBy || 'another gate'}. Do NOT issue wristband.`
      };
    }

    const now = new Date();
    const scanTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const scanFullDate = now.toISOString();

    // Commit atomic write
    transaction.update(attendeeDocRef, {
      status: 'CHECKED_IN',
      checkedInAt: scanTime,
      checkedInFullDate: scanFullDate,
      checkedInBy: gateName
    });

    return {
      status: 'VALID',
      data: {
        ...data,
        status: 'CHECKED_IN',
        checkedInAt: scanTime,
        checkedInFullDate: scanFullDate,
        checkedInBy: gateName
      },
      wristbandColor,
      message: `VALID ENTRY: Issue ${wristbandColor.toUpperCase()} Wristband to ${data.fullName}`
    };
  });
}
