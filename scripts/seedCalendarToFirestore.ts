import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import { CALENDAR_ESTABLISHMENTS, CALENDAR_INSPECTION_SCHEDULES, CALENDAR_RECEIPTS } from '../src/data/calendarImportedData.ts';

const PROJECT_ID = firebaseConfig.projectId;
const DATABASE_ID = firebaseConfig.firestoreDatabaseId;
const API_KEY = firebaseConfig.apiKey;

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function objectToFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return fields;
}

async function commitBatch(writes: any[]) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:commit?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore commit failed (${res.status}): ${errText}`);
  }
  return await res.json();
}

async function seedData() {
  console.log(`Starting Firestore sync to database: ${DATABASE_ID}...`);
  console.log(`Establishments to sync: ${CALENDAR_ESTABLISHMENTS.length}`);
  console.log(`Schedules to sync: ${CALENDAR_INSPECTION_SCHEDULES.length}`);
  console.log(`Receipts to sync: ${CALENDAR_RECEIPTS.length}`);

  const allWrites: any[] = [];

  for (const est of CALENDAR_ESTABLISHMENTS) {
    const docPath = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/establishments/${est.id}`;
    allWrites.push({
      update: {
        name: docPath,
        fields: objectToFirestoreFields(est)
      }
    });
  }

  for (const sch of CALENDAR_INSPECTION_SCHEDULES) {
    const docPath = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/schedules/${sch.id}`;
    allWrites.push({
      update: {
        name: docPath,
        fields: objectToFirestoreFields(sch)
      }
    });
  }

  for (const rec of CALENDAR_RECEIPTS) {
    const docPath = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/receipts/${rec.id}`;
    allWrites.push({
      update: {
        name: docPath,
        fields: objectToFirestoreFields(rec)
      }
    });
  }

  // Commit in chunks of 100
  const CHUNK_SIZE = 100;
  for (let i = 0; i < allWrites.length; i += CHUNK_SIZE) {
    const chunk = allWrites.slice(i, i + CHUNK_SIZE);
    console.log(`Sending batch ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} items)...`);
    await commitBatch(chunk);
  }

  console.log('✅ Synchronisation Firestore terminée avec succès !');
}

seedData().catch((err) => {
  console.error('❌ Erreur de synchronisation:', err);
  process.exit(1);
});
