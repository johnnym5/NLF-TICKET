const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const { setDoc, getDoc, updateDoc, doc } = require('firebase/firestore');
const fs = require('fs');

let testEnv;

describe('Firestore Security Rules', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gcc-national-livestock-festival-2026',
      firestore: {
        rules: fs.readFileSync('../firestore.rules', 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('Unauthenticated user cannot create attendee', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(unauthedDb, 'attendees', 'user1'), { fullName: 'Test' }));
  });

  it('Authenticated attendee can read only their own pass', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();

    // Alice's doc
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'attendees', 'alice'), { fullName: 'Alice' });
    });

    await assertSucceeds(getDoc(doc(aliceDb, 'attendees', 'alice')));
    await assertFails(getDoc(doc(bobDb, 'attendees', 'alice')));
  });

  it('Attendee cannot assign VIP tier directly', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    // Rules say 'allow create: if false' for direct client creation
    await assertFails(setDoc(doc(aliceDb, 'attendees', 'alice'), { fullName: 'Alice', tier: 'VIP_PLATINUM' }));
  });

  it('Attendee cannot assign themselves executive_admin', async () => {
    // This is handled by Auth custom claims, but Rules should prevent write to operators
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(aliceDb, 'operators', 'alice'), { role: 'executive_admin' }));
  });

  it('Attendee cannot modify tier or ticketCode', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'attendees', 'alice'), {
            uid: 'alice',
            fullName: 'Alice',
            tier: 'REGULAR',
            ticketCode: 'OLD-CODE',
            accessRevoked: false
        });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(updateDoc(doc(aliceDb, 'attendees', 'alice'), { tier: 'VIP_GOLD' }));
    await assertFails(updateDoc(doc(aliceDb, 'attendees', 'alice'), { ticketCode: 'NEW-CODE' }));
  });

  it('Gatekeeper can perform only permitted scan operations', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'attendees', 'alice'), {
            uid: 'alice',
            fullName: 'Alice',
            tier: 'REGULAR',
            status: 'REGISTERED',
            accessRevoked: false
        });
    });

    const gatekeeperDb = testEnv.authenticatedContext('gatekeeper1', { role: 'gatekeeper' }).firestore();

    // Succeeds: Updating check-in info
    await assertSucceeds(updateDoc(doc(gatekeeperDb, 'attendees', 'alice'), {
        status: 'CHECKED_IN',
        checkedInAt: '12:00',
        checkedInBy: 'Gate 1'
    }));

    // Fails: Changing tier or full name
    await assertFails(updateDoc(doc(gatekeeperDb, 'attendees', 'alice'), {
        fullName: 'Alice Hacker'
    }));

    // Fails: Revoking access (only supervisor/admin)
    await assertFails(updateDoc(doc(gatekeeperDb, 'attendees', 'alice'), {
        accessRevoked: true
    }));
  });

  it('Supervisor can revoke access', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'attendees', 'alice'), {
            uid: 'alice',
            fullName: 'Alice',
            tier: 'REGULAR',
            accessRevoked: false
        });
    });

    const supervisorDb = testEnv.authenticatedContext('super1', { role: 'gate_supervisor' }).firestore();
    await assertSucceeds(updateDoc(doc(supervisorDb, 'attendees', 'alice'), {
        accessRevoked: true
    }));
  });

  it('Executive admin has full read/write on operators', async () => {
    const adminDb = testEnv.authenticatedContext('admin1', { role: 'executive_admin' }).firestore();
    await assertSucceeds(setDoc(doc(adminDb, 'operators', 'new_gatekeeper'), { role: 'gatekeeper' }));
  });

  it('Unauthorized users cannot access admin stats or events', async () => {
    const attendeeDb = testEnv.authenticatedContext('alice', { role: 'attendee' }).firestore();
    await assertFails(getDoc(doc(attendeeDb, 'eventStats', 'global')));
    await assertFails(getDoc(doc(attendeeDb, 'scanEvents', 'any_event')));
  });

  it('Gatekeeper can read scan events but not stats', async () => {
    const gatekeeperDb = testEnv.authenticatedContext('gk1', { role: 'gatekeeper' }).firestore();
    await assertSucceeds(getDoc(doc(gatekeeperDb, 'scanEvents', 'any_event')));
    await assertFails(getDoc(doc(gatekeeperDb, 'eventStats', 'global')));
  });

  it('Supervisor can read stats', async () => {
    const supervisorDb = testEnv.authenticatedContext('super1', { role: 'gate_supervisor' }).firestore();
    await assertSucceeds(getDoc(doc(supervisorDb, 'eventStats', 'global')));
  });
});
