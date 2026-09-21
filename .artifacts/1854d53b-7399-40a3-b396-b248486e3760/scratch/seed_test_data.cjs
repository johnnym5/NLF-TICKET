const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // User would need this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData(count = 10000) {
  const batchSize = 500;
  let batch = db.batch();

  for (let i = 0; i < count; i++) {
    const uid = `test_user_${i}`;
    const tier = i % 10 === 0 ? 'VIP_GOLD' : 'REGULAR';
    const ref = db.collection('attendees').doc(uid);

    batch.set(ref, {
      uid,
      fullName: `Test Attendee ${i}`,
      email: `test_${i}@gcc.com`,
      ticketCode: `GCC-2026-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      tier,
      wristbandColor: tier === 'REGULAR' ? 'Emerald Green' : 'Champagne Gold Foil',
      status: 'REGISTERED',
      accessRevoked: false,
      daysAttended: { day1: false, day2: false, day3: false },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if ((i + 1) % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`Seeded ${i + 1} records...`);
    }
  }

  if (batch.length > 0) await batch.commit();

  // Update stats
  await db.collection('eventStats').doc('global').set({
      totalRegistrations: count
  }, { merge: true });

  console.log('Seeding complete.');
}

seedData(10000).catch(console.error);
