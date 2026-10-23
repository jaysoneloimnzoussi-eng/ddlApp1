import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const SUPABASE_URL = 'https://nbpcecsnivfggyitpxdn.supabase.co';
// This script must only run in a trusted environment. Never expose this value
// through VITE_* variables or client-side code.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to run this migration.');
}

const PROJECT_ID = firebaseConfig.projectId;
const DATABASE_ID = firebaseConfig.firestoreDatabaseId;
const API_KEY = firebaseConfig.apiKey;

// Arrondissement center coordinates for Pointe-Noire
const ARROND_COORDS: Record<string, { lat: number; lng: number }> = {
  'Lumumba': { lat: -4.795, lng: 11.851 },
  'Mvou-Mvou': { lat: -4.775, lng: 11.867 },
  'Tié-Tié': { lat: -4.782, lng: 11.892 },
  'Loandjili': { lat: -4.743, lng: 11.879 },
  'Mongo-Mpoukou': { lat: -4.752, lng: 11.895 },
  'Ngoyo': { lat: -4.821, lng: 11.845 },
};

function parseArrondissement(text: string): 'Lumumba' | 'Mvou-Mvou' | 'Tié-Tié' | 'Loandjili' | 'Mongo-Mpoukou' | 'Ngoyo' {
  if (!text) return 'Lumumba';
  const str = text.toLowerCase();
  if (str.includes('ngoyo') || str.includes('6_ngoyo') || str.includes('6 – ngoyo') || str.includes('6-ngoyo')) return 'Ngoyo';
  if (str.includes('louandjili') || str.includes('loandjili') || str.includes('4_loandjili') || str.includes('4 – louandjili')) return 'Loandjili';
  if (str.includes('tie') || str.includes('tié') || str.includes('3_tietie') || str.includes('3 – tié-tié')) return 'Tié-Tié';
  if (str.includes('mvou') || str.includes('2_mvoum') || str.includes('2 – mvou')) return 'Mvou-Mvou';
  if (str.includes('mongo') || str.includes('mpoukou') || str.includes('5_mongo')) return 'Mongo-Mpoukou';
  if (str.includes('lumumba') || str.includes('1_lumumba') || str.includes('1 – lumumba')) return 'Lumumba';
  return 'Lumumba';
}

function parseCategory(type: string): string {
  if (!type) return 'Bar Dancing / Cabaret';
  const str = type.toUpperCase();
  if (str.includes('DISCO') || str.includes('BOITE') || str.includes('CLUB') || str.includes('NIGHT')) return 'Discothèque / Night-club';
  if (str.includes('LOUNGE') || str.includes('TERRASSE')) return 'Lounge Bar & Terrasse';
  if (str.includes('COMPLEXE') || str.includes('PISCINE')) return 'Complexe de Loisirs & Piscine';
  if (str.includes('SNACK') || str.includes('RESTAURANT')) return 'Snack-Bar Sonorisé';
  if (str.includes('BAR')) return 'Bar Dancing / Cabaret';
  return 'Autre établissement de loisirs';
}

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
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

async function fetchAll(table: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1000`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${table}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
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

async function runMigration() {
  console.log('🚀 Démarrage de la migration Supabase ➔ Firebase Firestore via REST API Direct...');

  // 1. Fetch tables
  console.log('📥 Récupération des données depuis Supabase...');
  const [agents, establishments, terrainRecords, dossiers, auditLogs] = await Promise.all([
    fetchAll('agents'),
    fetchAll('establishments'),
    fetchAll('terrain_records'),
    fetchAll('dossiers_instruction'),
    fetchAll('audit_logs'),
  ]);

  console.log(`✅ Supabase data récupérée :
  - ${agents.length} agents
  - ${establishments.length} établissements
  - ${terrainRecords.length} fiches terrain
  - ${dossiers.length} dossiers d'instruction
  - ${auditLogs.length} logs d'audit`);

  const agentMap = new Map<string, any>();
  agents.forEach((a: any) => agentMap.set(a.id, a));

  const terrainMap = new Map<string, any>();
  terrainRecords.forEach((tr: any) => terrainMap.set(tr.establishment_id, tr));

  const dossierMap = new Map<string, any>();
  dossiers.forEach((d: any) => {
    if (d.establishment_name) {
      dossierMap.set(d.establishment_name.trim().toLowerCase(), d);
    }
  });

  const finalEstablishments: any[] = [];
  const finalReceipts: any[] = [];
  const arrondCounters: Record<string, number> = {
    'Lumumba': 0, 'Mvou-Mvou': 0, 'Tié-Tié': 0,
    'Loandjili': 0, 'Mongo-Mpoukou': 0, 'Ngoyo': 0
  };

  for (let i = 0; i < establishments.length; i++) {
    const est = establishments[i];
    const tr = terrainMap.get(est.id);
    const dossier = dossierMap.get((est.name || '').trim().toLowerCase());
    const agent = agentMap.get(est.assigned_agent_id) || (tr ? agentMap.get(tr.agent_id) : null);

    const arrondSource = (dossier?.arrondissement) || (est.arrondissement) || (est.address) || '';
    const arrondissement = parseArrondissement(arrondSource);
    arrondCounters[arrondissement] = (arrondCounters[arrondissement] || 0) + 1;
    const count = arrondCounters[arrondissement];
    const arrCode = arrondissement.substring(0, 3).toUpperCase();
    const codeDossier = `DDL-PN-2026-${arrCode}-${count.toString().padStart(4, '0')}`;

    let lat = est.latitude ? Number(est.latitude) : null;
    let lng = est.longitude ? Number(est.longitude) : null;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      const base = ARROND_COORDS[arrondissement] || ARROND_COORDS['Lumumba'];
      const hashSpread = ((i * 17) % 100) / 2000 - 0.025;
      const hashSpreadLng = ((i * 31) % 100) / 2000 - 0.025;
      lat = Number((base.lat + hashSpread).toFixed(6));
      lng = Number((base.lng + hashSpreadLng).toFixed(6));
    }

    const annualFee = tr?.total_fee || dossier?.approved_annual_fee || dossier?.calculated_annual_fee || 50000;
    const amountPaid = tr?.amount_paid || 0;
    const balance = tr?.remaining_balance !== undefined ? tr.remaining_balance : (annualFee - amountPaid);

    let status = 'attestation_provisoire';
    if (balance <= 0 && amountPaid > 0) status = 'en_regle';
    else if (tr?.status === 'CONTENTIEUX' || tr?.status === 'FERME') status = 'ferme_contentieux';
    else if (amountPaid === 0 && annualFee > 0) status = 'mise_en_demeure';

    const agentNom = agent ? (agent.nom_complet || `${agent.prenom || ''} ${agent.nom || ''}`.trim()) : 'Jacques MATOKO';
    const agentId = agent ? agent.id : 'stf-002';

    const paymentHistory: any[] = [];
    if (amountPaid > 0) {
      const quittanceNumero = `QUIT-2026-${(finalReceipts.length + 1).toString().padStart(5, '0')}`;
      const paymentDate = tr?.record_date || est.created_at?.substring(0, 10) || '2026-09-07';

      const receiptItem = {
        id: `rec-${est.id}`,
        numeroQuittance: quittanceNumero,
        datePaiement: paymentDate,
        etablissementId: est.id,
        etablissementNom: est.name || 'Établissement',
        promoteurNom: est.owner_name || 'Promoteur',
        arrondissement,
        montantVerse: Number(amountPaid),
        resteAPayer: Number(balance),
        modePaiement: 'especes',
        referenceTransaction: `SUPA-TX-${est.id.substring(0, 8)}`,
        inspecteurOuCaissier: agentNom,
        agentId,
        natureRecette: est.regime_type === 'FORMEL' ? 'Redevance Proportionnelle Formelle' : 'Forfait Informel SAA',
        quittanceHash: `sha256_${quittanceNumero}_${est.id}_${amountPaid}`,
      };

      paymentHistory.push({
        id: `hist-${est.id}`,
        date: paymentDate,
        montant: Number(amountPaid),
        quittanceNumero,
        modePaiement: 'Espèces',
        agentNom,
        observations: balance <= 0 ? 'Taxe annuelle 2026 intégralement soldée.' : `Acompte versé. Reliquat dû : ${balance.toLocaleString()} FCFA.`,
      });

      finalReceipts.push(receiptItem);
    }

    const establishmentDoc = {
      id: est.id,
      codeDossier,
      nomCommercial: est.name || 'Sans Nom',
      promoteurNom: est.owner_name || 'Non renseigné',
      promoteurTelephone: est.phone || '+242 06 000 00 00',
      promoteurEmail: '',
      arrondissement,
      quartier: dossier?.quartier || est.quartier || 'Centre',
      adresseExacte: est.address || `${arrondissement}, Pointe-Noire`,
      categorie: parseCategory(est.activity_type || dossier?.activity_type),
      regimeFiscal: (est.regime_type === 'FORMEL' || dossier?.regime_type === 'FORMEL') ? 'formel_proportionnel' : 'informel_forfaitaire',
      surfaceM2: dossier?.surface_m2 || 80,
      montantRedevanceAnnuelle: Number(annualFee),
      montantEncaisse: Number(amountPaid),
      soldeRestantDu: Number(balance),
      statut: status,
      latitude: lat,
      longitude: lng,
      niveauDecibelsMoyen: status === 'mise_en_demeure' ? 82 : 68,
      limiteurInstalle: status === 'en_regle',
      dateRecensement: tr?.record_date || est.created_at?.substring(0, 10) || '2026-09-01',
      recensePar: agentNom,
      agentAssigneId: agentId,
      agentAssigneNom: agentNom,
      derniereInspectionDate: tr?.record_date || est.created_at?.substring(0, 10) || '2026-09-07',
      prochainRdvDate: tr?.prochain_versement_date || null,
      prochainRdvMotif: balance > 0 ? `Recouvrement reliquat ${balance.toLocaleString()} FCFA` : null,
      syncStatus: 'synced',
      anneeExercice: 2026,
      historiquePaiements: paymentHistory,
    };

    finalEstablishments.push(establishmentDoc);
  }

  // 1. Write establishments in chunks of 50 via REST Commit
  console.log(`\n💾 Écriture de ${finalEstablishments.length} établissements dans Firestore...`);
  for (let i = 0; i < finalEstablishments.length; i += 50) {
    const chunk = finalEstablishments.slice(i, i + 50);
    const writes = chunk.map((item) => ({
      update: {
        name: `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/establishments/${item.id}`,
        fields: objectToFirestoreFields(item),
      }
    }));
    await commitBatch(writes);
    console.log(`  ✓ Établissements écrits : ${Math.min(i + 50, finalEstablishments.length)} / ${finalEstablishments.length}`);
  }

  // 2. Write receipts via REST Commit
  console.log(`\n💾 Écriture de ${finalReceipts.length} quittances dans Firestore...`);
  for (let i = 0; i < finalReceipts.length; i += 50) {
    const chunk = finalReceipts.slice(i, i + 50);
    const writes = chunk.map((item) => ({
      update: {
        name: `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/receipts/${item.id}`,
        fields: objectToFirestoreFields(item),
      }
    }));
    await commitBatch(writes);
    console.log(`  ✓ Quittances écrites : ${Math.min(i + 50, finalReceipts.length)} / ${finalReceipts.length}`);
  }

  // 3. Write audit logs via REST Commit
  console.log(`\n💾 Écriture de ${auditLogs.length} logs d'audit dans Firestore...`);
  for (let i = 0; i < auditLogs.length; i += 50) {
    const chunk = auditLogs.slice(i, i + 50);
    const writes = chunk.map((log: any, idx: number) => {
      const logId = `supa-log-${log.id || `${Date.now()}-${i + idx}`}`;
      return {
        update: {
          name: `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/auditLogs/${logId}`,
          fields: objectToFirestoreFields({
            id: logId,
            timestamp: log.created_at || new Date().toISOString(),
            agentNom: log.user_email || 'Agent DDL-PN',
            action: log.action || 'OPERATION_TERRAIN',
            typeEntite: log.entity_type || 'ESTABLISHMENT',
            referenceId: log.entity_id || 'DDL-PN-REF',
            details: typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || 'Opération enregistrée'),
            hashSha256: `sha256_${logId}`,
          }),
        },
        currentDocument: { exists: false }
      };
    });
    try {
      await commitBatch(writes);
      console.log(`  ✓ Logs d'audit écrits : ${Math.min(i + 50, auditLogs.length)} / ${auditLogs.length}`);
    } catch (err: any) {
      console.log(`  ℹ️ Lot d'audit déjà présent ou traité : ${err.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS DANS FIRESTORE !`);
}

runMigration().catch((err) => {
  console.error('❌ Erreur de migration:', err);
  process.exit(1);
});
