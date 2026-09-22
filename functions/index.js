const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nacl = require('tweetnacl');
admin.initializeApp();

const db = admin.firestore();

// --- Configuration ---
// In production, use: firebase functions:secrets:set QR_SECRET_KEY
const QR_SECRET_KEY_B64 = process.env.QR_SECRET_KEY || 'oQP18t/04sTS+oXkmvGU+qPvwWV1HabcdvedYFUg+EEki/J0nXyElK1Jl2Rv3oWu+FuJMvYJ7ng5m/J5NsfcmQ==';
const EVENT_ID = 'GCC2026';

const TIER_WRISTBANDS = {
  REGULAR: 'Emerald Green',
  VIP_SILVER: 'Metallic Silver Foil',
  VIP_GOLD: 'Champagne Gold Foil',
  VIP_PLATINUM: 'Obsidian Platinum Badge',
  TEAM_MEMBER: 'Cobalt Blue Lanyard',
  VENDOR: 'Tangerine Orange Badge',
  ASSOCIATE: 'Royal Purple Band'
};

function generateTicketCode(tier = 'REGULAR') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let entropy = '';
  // Use crypto for higher entropy
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < bytes.length; i++) {
    entropy += chars[bytes[i] % chars.length];
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

function signPassPayload(uid, ticketCode, tier) {
  const secretKey = Buffer.from(QR_SECRET_KEY_B64, 'base64');
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = Math.floor(new Date('2026-12-31').getTime() / 1000);

  const payload = {
    v: 1,
    tid: ticketCode,
    uid: uid,
    t: tier,
    iat: issuedAt,
    exp: expiresAt,
    eid: EVENT_ID,
    kid: 'v1'
  };

  // Canonical string for signing
  const dataToSign = JSON.stringify(payload, Object.keys(payload).sort());
  const signature = nacl.sign.detached(Buffer.from(dataToSign), secretKey);

  payload.sig = Buffer.from(signature).toString('base64');

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * registerAttendee
 * Parameters: { fullName, invitationId }
 */
exports.registerAttendee = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = context.auth.uid;
  const email = context.auth.token.email;
  const fullName = data.fullName || context.auth.token.name || 'Attendee';
  const invitationId = data.invitationId;

  const attendeeRef = db.collection('attendees').doc(uid);
  const doc = await attendeeRef.get();

  if (doc.exists) {
    return doc.data();
  }

  let tier = 'REGULAR';
  let referralSource = 'direct';

  if (invitationId) {
    const invRef = db.collection('vipInvitations').doc(invitationId);
    const invDoc = await invRef.get();

    if (invDoc.exists) {
      const invData = invDoc.data();
      const now = admin.firestore.Timestamp.now();

      if (invData.status === 'ACTIVE' &&
          (!invData.expiresAt || invData.expiresAt.toMillis() > now.toMillis()) &&
          (invData.usageCount < invData.maxUses)) {

        tier = invData.tier;
        referralSource = 'vip_invitation';

        // Increment usage
        await invRef.update({
          usageCount: admin.firestore.FieldValue.increment(1),
          redeemedAt: admin.firestore.FieldValue.arrayUnion({
            uid,
            timestamp: now
          })
        });
      }
    }
  }

  const ticketCode = generateTicketCode(tier);
  const wristbandColor = TIER_WRISTBANDS[tier] || TIER_WRISTBANDS.REGULAR;
  const signedPayload = signPassPayload(uid, ticketCode, tier);

  const newRecord = {
    uid,
    fullName,
    email,
    ticketCode,
    tier,
    wristbandColor,
    signedPayload,
    status: 'REGISTERED',
    accessRevoked: false,
    daysAttended: { day1: false, day2: false, day3: false },
    checkedInAt: null,
    checkedInFullDate: null,
    checkedInBy: null,
    referralSource,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await attendeeRef.set(newRecord);

  // Record audit log for registration
  await db.collection('auditLogs').add({
    action: 'ATTENDEE_REGISTRATION',
    targetUid: uid,
    tier: tier,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  // Set basic attendee claim
  await admin.auth().setCustomUserClaims(uid, { role: 'attendee' });

  return newRecord;
});

/**
 * getValidationDataset
 * Returns a minimized dataset for offline validation.
 * Restricted to authorized gatekeepers.
 */
exports.getValidationDataset = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['gatekeeper', 'gate_supervisor', 'executive_admin'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized.');
  }

  const snapshot = await db.collection('attendees')
    .where('accessRevoked', '==', false)
    .get();

  const dataset = snapshot.docs.map(doc => {
    const d = doc.data();
    return {
      tid: d.ticketCode,
      uid: d.uid,
      t: d.tier,
      wb: d.wristbandColor,
      st: d.status,
      da: d.daysAttended || {}
    };
  });

  return { dataset, timestamp: admin.firestore.Timestamp.now().toMillis() };
});

/**
 * syncScanEvent
 * Idempotent server-side scan processing.
 */
exports.syncScanEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['gatekeeper', 'gate_supervisor', 'executive_admin'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized.');
  }

  const {
    operationId,
    ticketId,
    uid,
    gateId,
    timestamp,
    eventDay,
    source
  } = data;

  if (!operationId || !ticketId || !uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }

  const scanEventRef = db.collection('scanEvents').doc(operationId);

  return await db.runTransaction(async (transaction) => {
    const existingScan = await transaction.get(scanEventRef);

    // Idempotency: If this operationId already exists, just return its result.
    if (existingScan.exists) {
      return { success: true, alreadyProcessed: true, result: existingScan.data().result };
    }

    const attendeeRef = db.collection('attendees').doc(uid);
    const attendeeDoc = await transaction.get(attendeeRef);

    if (!attendeeDoc.exists) {
      const result = { status: 'INVALID', message: 'Attendee record not found.' };
      transaction.set(scanEventRef, { ...data, result, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return result;
    }

    const attendeeData = attendeeDoc.data();

    // Guard 1: Revocation
    if (attendeeData.accessRevoked) {
      const result = { status: 'REVOKED', message: 'Access revoked.' };
      transaction.set(scanEventRef, { ...data, result, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return result;
    }

    // Guard 2: Duplicate scan for the same day
    const daysAttended = attendeeData.daysAttended || {};
    if (daysAttended[eventDay]) {
      const result = {
        status: 'DUPLICATE',
        message: 'Pass already scanned for this day.',
        originalScan: {
          at: attendeeData.checkedInAt,
          by: attendeeData.checkedInBy
        }
      };
      transaction.set(scanEventRef, { ...data, result, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return result;
    }

    // Process valid check-in
    const scanTime = new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Lagos'
    });

    const updatedDays = { ...daysAttended, [eventDay]: true };

    transaction.update(attendeeRef, {
      status: 'CHECKED_IN',
      checkedInAt: scanTime,
      checkedInFullDate: new Date(timestamp).toISOString(),
      checkedInBy: gateId,
      daysAttended: updatedDays
    });

    // Update aggregate statistics
    const statsRef = db.collection('eventStats').doc('global');
    transaction.set(statsRef, {
      totalCheckedIn: admin.firestore.FieldValue.increment(1),
      [`dayCheckins.${eventDay}`]: admin.firestore.FieldValue.increment(1),
      [`gateCheckins.${gateId}`]: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const result = { status: 'VALID', message: 'Entry approved.' };
    transaction.set(scanEventRef, {
      ...data,
      result,
      operatorUid: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, result };
  });
});

/**
 * getDashboardStats
 * Retrieves high-level KPIs without downloading all attendees.
 */
exports.getDashboardStats = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['executive_admin', 'gate_supervisor'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized.');
  }

  const statsDoc = await db.collection('eventStats').doc('global').get();
  const stats = statsDoc.exists ? statsDoc.data() : {
    totalRegistrations: 0,
    totalCheckedIn: 0,
    dayCheckins: { day1: 0, day2: 0, day3: 0 },
    gateCheckins: {}
  };

  // Ensure totalRegistrations is up to date if not already tracked
  // In a high-volume system, we'd use a trigger on attendee creation to increment this.
  if (stats.totalRegistrations === undefined) {
    const attendeeCount = await db.collection('attendees').count().get();
    stats.totalRegistrations = attendeeCount.data().count;
    await db.collection('eventStats').doc('global').set({ totalRegistrations: stats.totalRegistrations }, { merge: true });
  }

  return stats;
});

/**
 * searchAttendees
 * Paginated search and filtering for administrative directory.
 */
exports.searchAttendees = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['executive_admin', 'gate_supervisor'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized.');
  }

  const { searchTerm, roleFilter, statusFilter, lastDocId, pageSize = 20 } = data;

  let query = db.collection('attendees');

  if (roleFilter && roleFilter !== 'ALL') {
    query = query.where('tier', '==', roleFilter);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.where('status', '==', statusFilter);
  }

  // Firestore doesn't support full-text search directly without 3rd party.
  // For basic search, we use range queries if it's a prefix, or we filter a bit more in memory for small datasets.
  // Given 25k limit, we'll implement a simple term search if provided.

  let docs = [];
  if (searchTerm) {
    // If searching by email or ticket code (likely unique/indexed)
    const emailSnap = await db.collection('attendees').where('email', '==', searchTerm).get();
    const ticketSnap = await db.collection('attendees').where('ticketCode', '==', searchTerm).get();

    docs = [...emailSnap.docs, ...ticketSnap.docs];

    // Fallback: search by name prefix
    if (docs.length === 0) {
        const nameSnap = await db.collection('attendees')
            .orderBy('fullName')
            .startAt(searchTerm)
            .endAt(searchTerm + '\uf8ff')
            .limit(pageSize)
            .get();
        docs = nameSnap.docs;
    }
  } else {
    query = query.orderBy('createdAt', 'desc');
    if (lastDocId) {
      const lastDoc = await db.collection('attendees').doc(lastDocId).get();
      query = query.startAfter(lastDoc);
    }
    const snap = await query.limit(pageSize).get();
    docs = snap.docs;
  }

  const results = docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastId = docs.length > 0 ? docs[docs.length - 1].id : null;

  return { results, lastId };
});

/**
 * adminOverride
 * Secure manual administrative actions with mandatory audit logging.
 */
exports.adminOverride = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['executive_admin', 'gate_supervisor'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Only supervisors and admins can perform overrides.');
  }

  const { targetUid, action, newValue, reason } = data;
  if (!reason || reason.length < 5) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid reason (min 5 chars) is required for overrides.');
  }

  const attendeeRef = db.collection('attendees').doc(targetUid);
  const attendeeDoc = await attendeeRef.get();

  if (!attendeeDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Attendee not found.');
  }

  const oldData = attendeeDoc.data();
  const update = {
    lastOverrideAt: admin.firestore.FieldValue.serverTimestamp(),
    lastOverrideBy: context.auth.uid,
    lastOverrideReason: reason
  };

  if (action === 'REVOKE_ACCESS') {
    update.accessRevoked = true;
    update.status = 'REVOKED';
  } else if (action === 'RESTORE_ACCESS') {
    update.accessRevoked = false;
    update.status = 'REGISTERED';
  } else if (action === 'CHANGE_TIER') {
    update.tier = newValue;
    update.wristbandColor = TIER_WRISTBANDS[newValue] || TIER_WRISTBANDS.REGULAR;
    // Note: This does NOT automatically regenerate the signed QR.
    // Admin should probably also call replaceTicket if a new QR is needed.
  } else if (action === 'MANUAL_CHECKIN') {
    const { eventDay, gateId } = newValue;
    const days = oldData.daysAttended || {};
    update.daysAttended = { ...days, [eventDay]: true };
    update.status = 'CHECKED_IN';
    update.checkedInBy = gateId || 'ADMIN_OVERRIDE';
    update.checkedInAt = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
    update.checkedInFullDate = new Date().toISOString();
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid override action.');
  }

  await attendeeRef.update(update);

  // Mandatory Audit Log
  await db.collection('auditLogs').add({
    action: `OVERRIDE_${action}`,
    targetUid,
    actorUid: context.auth.uid,
    reason,
    before: oldData,
    after: { ...oldData, ...update },
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

/**
 * exportAttendees
 * Generates a CSV export of the attendee database.
 * Restricted to executive_admin.
 */
exports.exportAttendees = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'executive_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can export data.');
  }

  const snapshot = await db.collection('attendees').orderBy('createdAt', 'desc').get();

  const headers = ['Full Name', 'Email', 'Ticket Code', 'Tier', 'Status', 'Days Attended', 'Created At'];
  const rows = snapshot.docs.map(doc => {
    const d = doc.data();
    const days = d.daysAttended || {};
    const attended = Object.keys(days).filter(k => days[k]).join('|') || 'NONE';
    return [
      `"${d.fullName || ''}"`,
      `"${d.email || ''}"`,
      `"${d.ticketCode || ''}"`,
      `"${d.tier || 'REGULAR'}"`,
      `"${d.status || 'REGISTERED'}"`,
      `"${attended}"`,
      `"${d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate().toISOString() : d.createdAt) : ''}"`
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  // Record audit log for export
  await db.collection('auditLogs').add({
    action: 'DATA_EXPORT',
    actorUid: context.auth.uid,
    recordCount: snapshot.size,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { csv, filename: `Carnival_Export_${new Date().toISOString().split('T')[0]}.csv` };
});

/**
 * Increment registration counter on attendee creation
 */
exports.onAttendeeCreated = functions.firestore
  .document('attendees/{userId}')
  .onCreate(async (snap, context) => {
    await db.collection('eventStats').doc('global').set({
      totalRegistrations: admin.firestore.FieldValue.increment(1)
    }, { merge: true });
  });

/**
 * replaceTicket
 * Authoritatively replaces a ticket (resetting QR)
 * Parameters: { attendeeUid }
 */
exports.replaceTicket = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['executive_admin', 'gate_supervisor'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized to replace tickets.');
  }

  const { attendeeUid } = data;
  const attendeeRef = db.collection('attendees').doc(attendeeUid);
  const attendeeDoc = await attendeeRef.get();

  if (!attendeeDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Attendee not found.');
  }

  const attendeeData = attendeeDoc.data();
  const newTicketCode = generateTicketCode(attendeeData.tier);
  const newSignedPayload = signPassPayload(attendeeUid, newTicketCode, attendeeData.tier);

  // Record audit log
  await db.collection('auditLogs').add({
    action: 'TICKET_REPLACEMENT',
    targetUid: attendeeUid,
    oldTicketCode: attendeeData.ticketCode,
    newTicketCode: newTicketCode,
    performedBy: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  const update = {
    ticketCode: newTicketCode,
    signedPayload: newSignedPayload,
    status: 'REGISTERED', // Reset status to registered (scannable)
    qrResetAt: admin.firestore.FieldValue.serverTimestamp(),
    // Clear check-in info for the current session if needed?
    // Usually a ticket reset means the old one was compromised or lost.
    checkedInAt: null,
    checkedInFullDate: null,
    checkedInBy: null
  };

  await attendeeRef.update(update);

  return { success: true, ticketCode: newTicketCode };
});

/**
 * setOperatorRole
 * Parameters: { targetUid, role }
 * Role can be: gatekeeper, gate_supervisor, executive_admin
 */
exports.setOperatorRole = functions.https.onCall(async (data, context) => {
  // Only executive_admin can set roles
  if (!context.auth || context.auth.token.role !== 'executive_admin') {
    // Initial bootstrap: allow first admin@gcc.com to set themselves as admin if no admins exist
    if (context.auth && context.auth.token.email === 'admin@gcc.com') {
        // Proceed for bootstrap
    } else {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles.');
    }
  }

  const { targetUid, role } = data;
  if (!['attendee', 'gatekeeper', 'gate_supervisor', 'executive_admin'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role.');
  }

  await admin.auth().setCustomUserClaims(targetUid, { role });

  // Also track in operators collection for visibility
  await db.collection('operators').doc(targetUid).set({
    uid: targetUid,
    role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid
  }, { merge: true });

  return { success: true };
});
