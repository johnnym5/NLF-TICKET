import { localDB } from '../lib/db-local';
import { verifySignedTicket } from './qr-verify';

const FESTIVAL_DATES = {
  '2026-11-21': 'day1',
  '2026-11-22': 'day2',
  '2026-11-23': 'day3'
};

/**
 * getCurrentFestivalDay
 * Calculates the current festival day key based on Nigeria Time (WAT).
 */
export function getCurrentFestivalDay() {
  // Use Intl to get the current date in Nigeria
  const options = { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const dateStr = `${year}-${month}-${day}`;

  return FESTIVAL_DATES[dateStr] || null;
}

/**
 * validateTicketOffline
 * Performs full cryptographic and local data check.
 */
export async function validateTicketOffline(rawPayload) {
  const startTime = performance.now();

  // 1. Cryptographic Check (Local)
  const cryptoResult = verifySignedTicket(rawPayload);
  const cryptoTime = performance.now();

  if (!cryptoResult.valid) {
    return {
      status: 'INVALID',
      message: `CRYPTO ERROR: ${cryptoResult.error}`,
      metrics: { crypto: cryptoTime - startTime }
    };
  }

  const { tid, uid } = cryptoResult.data;
  const currentDay = getCurrentFestivalDay();

  if (!currentDay) {
    return {
      status: 'INVALID',
      message: 'FESTIVAL NOT ACTIVE: Scans only allowed during event dates.',
      metrics: { crypto: cryptoTime - startTime }
    };
  }

  // 2. Local Database Lookup
  const attendee = await localDB.validationCache.get(tid);
  const dbTime = performance.now();

  if (!attendee) {
    // We might have a valid signed QR that isn't in our cache yet (if scanner hasn't synced recently)
    // For extreme resiliency, we could allow it if we trust the signature,
    // but the instruction says "check local revocation information" and "check local duplicate state".
    return {
      status: 'INVALID',
      message: 'OFFLINE ALERT: Ticket valid but not found in local registry. Sync required.',
      metrics: { crypto: cryptoTime - startTime, db: dbTime - cryptoTime }
    };
  }

  if (attendee.uid !== uid) {
      return { status: 'INVALID', message: 'IDENTITY MISMATCH: QR payload does not match registry.' };
  }

  // 3. Status Checks
  if (attendee.accessRevoked) {
    return { status: 'REVOKED', message: 'FLAGGED: ACCESS REVOKED.' };
  }

  // 4. Duplicate Check (including local queue)
  const daysAttended = attendee.da || {};

  // Also check local scan queue for recent scans not yet updated in validationCache
  const localScans = await localDB.scanQueue
    .where('tid').equals(tid)
    .and(item => item.eventDay === currentDay)
    .toArray();

  if (daysAttended[currentDay] || localScans.length > 0) {
    return {
      status: 'DUPLICATE',
      message: 'FLAGGED: PASS ALREADY SCANNED TODAY.',
      attendee,
      metrics: { crypto: cryptoTime - startTime, db: dbTime - cryptoTime }
    };
  }

  return {
    status: 'VALID',
    message: 'ENTRY APPROVED.',
    attendee,
    metrics: {
      crypto: cryptoTime - startTime,
      db: dbTime - cryptoTime,
      total: performance.now() - startTime
    }
  };
}
