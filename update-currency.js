const mongoose = require('mongoose');

async function updateCurrency() {
  await mongoose.connect('mongodb://localhost:27017/splitease');
  const db = mongoose.connection.db;

  await db.collection('users').updateMany({}, { $set: { currency: 'INR' } });
  await db.collection('expenses').updateMany({}, { $set: { currency: 'INR' } });
  await db.collection('settlements').updateMany({}, { $set: { currency: 'INR' } });
  await db.collection('groups').updateMany({}, { $set: { defaultSplitType: 'equal' }});

  console.log('Updated all currencies to INR');
  process.exit(0);
}

updateCurrency();
