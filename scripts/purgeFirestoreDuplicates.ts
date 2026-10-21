import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function cleanString(str?: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function cleanDigits(str?: string): string {
  return (str || '').replace(/[^0-9]/g, '');
}

function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore).filter((v) => v !== undefined);
  }
  if (typeof obj === 'object' && obj.constructor === Object) {
    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = cleanForFirestore(v);
      }
    }
    return clean;
  }
  return obj;
}

function isSameEstablishment(a: any, b: any): boolean {
  if (!a || !b) return false;
  if (a.id === b.id) return true;

  if (a.codeDossier && b.codeDossier && a.codeDossier.trim().toUpperCase() === b.codeDossier.trim().toUpperCase()) {
    return true;
  }

  const cleanNomA = cleanString(a.nomCommercial || a.nom);
  const cleanNomB = cleanString(b.nomCommercial || b.nom);

  if (!cleanNomA || !cleanNomB || cleanNomA !== cleanNomB) {
    return false;
  }

  const cleanArrA = cleanString(a.arrondissement);
  const cleanArrB = cleanString(b.arrondissement);

  const cleanTelA = cleanDigits(a.promoteurTelephone || a.telephone);
  const cleanTelB = cleanDigits(b.promoteurTelephone || b.telephone);

  if (!cleanArrA || !cleanArrB || cleanArrA === cleanArrB) {
    return true;
  }

  if (cleanTelA && cleanTelB && cleanTelA.length >= 7 && cleanTelB.length >= 7 && (cleanTelA.endsWith(cleanTelB) || cleanTelB.endsWith(cleanTelA))) {
    return true;
  }

  return false;
}

async function run() {
  console.log('[FIREBASE SDK] Tentative d\'authentification...');
  try {
    await signInAnonymously(auth);
    console.log('[FIREBASE SDK] Authentification réussie (UID:', auth.currentUser?.uid, ')');
  } catch (authErr: any) {
    console.warn('[FIREBASE SDK] Auth info:', authErr.message);
  }

  console.log('[FIREBASE SDK] Lecture de la collection "establishments"...');
  const snap = await getDocs(collection(db, 'establishments'));
  console.log(`[FIREBASE SDK] ${snap.docs.length} établissement(s) récupéré(s).`);

  const establishments: any[] = [];
  snap.forEach((d) => {
    establishments.push({ ...d.data(), id: d.id });
  });

  const snapRec = await getDocs(collection(db, 'receipts'));
  console.log(`[FIREBASE SDK] ${snapRec.docs.length} quittance(s) récupérée(s).`);
  const receipts: any[] = [];
  snapRec.forEach((d) => receipts.push({ ...d.data(), id: d.id }));

  const snapSch = await getDocs(collection(db, 'schedules'));
  console.log(`[FIREBASE SDK] ${snapSch.docs.length} mission(s) récupérée(s).`);
  const schedules: any[] = [];
  snapSch.forEach((d) => schedules.push({ ...d.data(), id: d.id }));

  // Regroupement des doublons
  const groups: any[][] = [];
  establishments.forEach((est) => {
    let matched = groups.find((g) => isSameEstablishment(g[0], est));
    if (matched) {
      matched.push(est);
    } else {
      groups.push([est]);
    }
  });

  const duplicateGroups = groups.filter((g) => g.length > 1);
  console.log(`[FIREBASE SDK] ${groups.length} établissement(s) uniques.`);
  console.log(`[FIREBASE SDK] ${duplicateGroups.length} groupe(s) de doublons trouvés !`);

  if (duplicateGroups.length === 0) {
    console.log('[FIREBASE SDK] Aucun doublon détecté dans Firestore !');
    process.exit(0);
  }

  const idRemap = new Map<string, string>();
  const updates: any[] = [];
  const toDeleteIds: string[] = [];

  duplicateGroups.forEach((group, idx) => {
    const canonical = group.reduce((best, curr) => {
      const bestScore =
        (best.historiquePaiements?.length || 0) * 10 +
        (Number(best.montantEncaisse) > 0 ? 8 : 0) +
        (best.numeroAttestation ? 5 : 0) +
        (best.adresseExacte ? 3 : 0) +
        (best.agentAssigneNom ? 2 : 0);
      const currScore =
        (curr.historiquePaiements?.length || 0) * 10 +
        (Number(curr.montantEncaisse) > 0 ? 8 : 0) +
        (curr.numeroAttestation ? 5 : 0) +
        (curr.adresseExacte ? 3 : 0) +
        (curr.agentAssigneNom ? 2 : 0);
      return currScore > bestScore ? curr : best;
    }, group[0]);

    console.log(`\nGroupe ${idx + 1} : "${canonical.nomCommercial}" (${group.length} occurrences)`);
    console.log(`  ★ Canonique conservé : ${canonical.id}`);

    let totalEncaisse = Number(canonical.montantEncaisse) || 0;
    let totalRedevance = Number(canonical.montantRedevanceAnnuelle) || 50000;
    let contactTel = canonical.promoteurTelephone || '';
    let contactEmail = canonical.promoteurEmail || '';
    let promoteur = canonical.promoteurNom || '';
    let quartier = canonical.quartier || '';
    let adresse = canonical.adresseExacte || '';
    let decibels = Number(canonical.niveauDecibelsMoyen) || 70;
    let limiteur = Boolean(canonical.limiteurInstalle);
    let attestationNum = canonical.numeroAttestation;
    let attestationDate = canonical.dateDelivranceAttestation;
    let assignedAgentId = canonical.agentAssigneId || '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc';
    let assignedAgentNom = canonical.agentAssigneNom || 'Jacques MATOKO';

    const allHistories = [...(canonical.historiquePaiements || [])];

    group.forEach((dup) => {
      if (dup.id !== canonical.id) {
        idRemap.set(dup.id, canonical.id);
        toDeleteIds.push(dup.id);

        if (!contactTel && dup.promoteurTelephone) contactTel = dup.promoteurTelephone;
        if (!contactEmail && dup.promoteurEmail) contactEmail = dup.promoteurEmail;
        if (!promoteur && dup.promoteurNom) promoteur = dup.promoteurNom;
        if (!quartier && dup.quartier) quartier = dup.quartier;
        if (!adresse && dup.adresseExacte) adresse = dup.adresseExacte;
        if (dup.limiteurInstalle) limiteur = true;
        if (Number(dup.niveauDecibelsMoyen) > 0) decibels = Number(dup.niveauDecibelsMoyen);
        if (Number(dup.montantEncaisse) > totalEncaisse) totalEncaisse = Number(dup.montantEncaisse);
        if (Number(dup.montantRedevanceAnnuelle) > totalRedevance) totalRedevance = Number(dup.montantRedevanceAnnuelle);
        if (!attestationNum && dup.numeroAttestation) {
          attestationNum = dup.numeroAttestation;
          attestationDate = dup.dateDelivranceAttestation;
        }
        if (dup.agentAssigneId && !canonical.agentAssigneId) {
          assignedAgentId = dup.agentAssigneId;
          assignedAgentNom = dup.agentAssigneNom || 'Jacques MATOKO';
        }

        if (dup.historiquePaiements && Array.isArray(dup.historiquePaiements)) {
          dup.historiquePaiements.forEach((p: any) => {
            if (!allHistories.some((h: any) => (h.id === p.id || (h.quittanceNumero && h.quittanceNumero === p.quittanceNumero)) && h.date === p.date)) {
              allHistories.push(p);
            }
          });
        }
      }
    });

    const groupIds = new Set(group.map((e) => e.id));
    const relevantReceipts = receipts.filter((r) => groupIds.has(r.etablissementId));
    const sumReceipts = relevantReceipts.reduce((sum, r) => sum + (Number(r.montantVerse) || 0), 0);
    if (sumReceipts > totalEncaisse) {
      totalEncaisse = sumReceipts;
    }

    const soldeRestantDu = Math.max(0, totalRedevance - totalEncaisse);

    const merged = {
      ...canonical,
      promoteurNom: promoteur,
      promoteurTelephone: contactTel,
      promoteurEmail: contactEmail,
      quartier,
      adresseExacte: adresse,
      montantRedevanceAnnuelle: totalRedevance,
      montantEncaisse: totalEncaisse,
      soldeRestantDu,
      niveauDecibelsMoyen: decibels,
      limiteurInstalle: limiteur,
      numeroAttestation: attestationNum || null,
      dateDelivranceAttestation: attestationDate || null,
      agentAssigneId: assignedAgentId,
      agentAssigneNom: assignedAgentNom,
      historiquePaiements: allHistories,
    };

    updates.push(merged);
  });

  console.log(`\n========================================`);
  console.log(`RÉSUMÉ :`);
  console.log(`- Fiches canoniques à mettre à jour : ${updates.length}`);
  console.log(`- Doublons à supprimer de Firestore : ${toDeleteIds.length}`);
  console.log(`========================================\n`);

  // Operations list
  type Op = { type: 'set'; path: string; id: string; data: any } | { type: 'delete'; path: string; id: string } | { type: 'update'; path: string; id: string; data: any };
  const allOps: Op[] = [];

  updates.forEach((est) => {
    allOps.push({ type: 'set', path: 'establishments', id: est.id, data: cleanForFirestore(est) });
  });

  toDeleteIds.forEach((dupId) => {
    allOps.push({ type: 'delete', path: 'establishments', id: dupId });
  });

  receipts.forEach((r) => {
    if (idRemap.has(r.etablissementId)) {
      const canonicalId = idRemap.get(r.etablissementId)!;
      const canonicalEst = updates.find((e) => e.id === canonicalId);
      allOps.push({
        type: 'update',
        path: 'receipts',
        id: r.id,
        data: cleanForFirestore({
          etablissementId: canonicalId,
          etablissementNom: canonicalEst?.nomCommercial || r.etablissementNom,
        })
      });
    }
  });

  schedules.forEach((s) => {
    if (idRemap.has(s.etablissementId)) {
      const canonicalId = idRemap.get(s.etablissementId)!;
      const canonicalEst = updates.find((e) => e.id === canonicalId);
      allOps.push({
        type: 'update',
        path: 'schedules',
        id: s.id,
        data: cleanForFirestore({
          etablissementId: canonicalId,
          etablissementNom: canonicalEst?.nomCommercial || s.etablissementNom,
        })
      });
    }
  });

  console.log(`[FIREBASE SDK] ${allOps.length} opérations au total.`);

  // Commit in chunks of 200 operations
  const CHUNK_SIZE = 200;
  for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
    const chunk = allOps.slice(i, i + CHUNK_SIZE);
    console.log(`[FIREBASE SDK] Commit lot ${Math.floor(i / CHUNK_SIZE) + 1} / ${Math.ceil(allOps.length / CHUNK_SIZE)} (${chunk.length} ops)...`);
    const batch = writeBatch(db);
    chunk.forEach((op) => {
      const docRef = doc(db, op.path, op.id);
      if (op.type === 'set') {
        batch.set(docRef, op.data, { merge: true });
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      } else if (op.type === 'update') {
        batch.update(docRef, op.data);
      }
    });
    await batch.commit();
  }

  console.log(`\n🎉 SUCCÈS TOTAL : ${toDeleteIds.length} doublons supprimés définitivement de Firestore !`);
  console.log(`🎉 ${updates.length} établissements canoniques consolidés.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[ERREUR]', err);
  process.exit(1);
});
