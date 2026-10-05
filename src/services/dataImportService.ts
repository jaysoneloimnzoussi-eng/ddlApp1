import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Establishment, CashReceipt, InspectionSchedule, LegalAct, Arrondissement, EstablishmentCategory, ComplianceStatus } from '../types';

export type ImportTargetCollection = 'establishments' | 'receipts' | 'schedules' | 'legalActs';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

export interface ImportPreviewItem {
  id: string;
  sourceData: Record<string, any>;
  mappedData: Record<string, any>;
  isValid: boolean;
  validationErrors: string[];
}

export interface ImportExecutionResult {
  total: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  importedItems: any[];
  durationMs: number;
}

// Heuristic synonyms for auto-mapping Supabase / SQL fields to DDL-PN Firestore entities
const FIELD_SYNONYMS: Record<string, string[]> = {
  // Establishments
  nomCommercial: ['nom_commercial', 'nom', 'enseigne', 'name', 'commercial_name', 'etablissement_nom'],
  promoteurNom: ['promoteur_nom', 'promoteur', 'gerant', 'proprietaire', 'owner', 'manager_name'],
  promoteurTelephone: ['promoteur_telephone', 'telephone', 'phone', 'contact_phone', 'mobile', 'tel'],
  promoteurEmail: ['promoteur_email', 'email', 'mail', 'contact_email'],
  arrondissement: ['arrondissement', 'district', 'commune', 'zone', 'ville_arrondissement'],
  quartier: ['quartier', 'neighborhood', 'secteur'],
  adresseExacte: ['adresse_exacte', 'adresse', 'address', 'localisation'],
  categorie: ['categorie', 'category', 'type_activite', 'activite', 'activity_type'],
  regimeFiscal: ['regime_fiscal', 'regime', 'fiscal_regime', 'tax_type'],
  surfaceM2: ['surface_m2', 'surface', 'superficie', 'area', 'm2'],
  montantRedevanceAnnuelle: ['montant_redevance_annuelle', 'redevance_annuelle', 'redevance', 'taxe_annuelle', 'annual_fee', 'montant_annuel'],
  montantEncaisse: ['montant_encaisse', 'encaisse', 'deja_paye', 'paid_amount', 'verse'],
  soldeRestantDu: ['solde_restant_du', 'solde_du', 'solde', 'reste_a_payer', 'remaining_balance'],
  statut: ['statut', 'status', 'compliance_status', 'etat'],
  latitude: ['latitude', 'lat', 'gps_lat', 'y'],
  longitude: ['longitude', 'lng', 'lon', 'gps_lng', 'x'],
  niveauDecibelsMoyen: ['niveau_decibels_moyen', 'decibels', 'db', 'dba', 'bruit', 'noise_level'],
  limiteurInstalle: ['limiteur_installe', 'limiteur', 'has_limiter', 'sound_limiter'],
  agentAssigneId: ['agent_assigne_id', 'agent_id', 'inspecteur_id', 'assigned_agent_id'],
  agentAssigneNom: ['agent_assigne_nom', 'agent_nom', 'inspecteur_nom', 'assigned_agent_name'],
  recensePar: ['recense_par', 'recenseur', 'agent_recenseur', 'created_by'],

  // Receipts
  numeroQuittance: ['numero_quittance', 'quittance_numero', 'quittance', 'receipt_number', 'reference'],
  datePaiement: ['date_paiement', 'date', 'payment_date', 'created_at'],
  etablissementId: ['etablissement_id', 'establishment_id', 'id_etablissement'],
  etablissementNom: ['etablissement_nom', 'nom_etablissement', 'establishment_name'],
  montantVerse: ['montant_verse', 'montant', 'versement', 'amount', 'paid'],
  resteAPayer: ['reste_a_payer', 'solde', 'balance_due'],
  modePaiement: ['mode_paiement', 'mode', 'payment_method', 'paiement'],

  // Schedules
  dateTournee: ['date_tournee', 'date', 'tournee_date', 'scheduled_date'],
  heure: ['heure', 'time', 'scheduled_time'],
  brigadeAssignee: ['brigade_assignee', 'brigade', 'team'],
  inspecteurChef: ['inspecteur_chef', 'inspecteur', 'lead_inspector'],
  typeMission: ['type_mission', 'mission', 'mission_type'],

  // Legal Acts
  referenceNumero: ['reference_numero', 'reference', 'numero', 'ref_act'],
  dateEmission: ['date_emission', 'date', 'issue_date'],
  motifs: ['motifs', 'motif', 'reasons', 'description'],
  delaiHeures: ['delai_heures', 'delai', 'delay_hours'],
};

/**
 * Clean and parse CSV content into array of record objects
 */
export function parseCsv(csvText: string): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter: comma, semicolon, or tab
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  // Helper to split row respecting quoted values
  const splitLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = splitLine(lines[0]);
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.length === headers.length || values.some((v) => v !== '')) {
      const row: Record<string, any> = {};
      headers.forEach((h, index) => {
        let val: any = values[index] ?? '';
        // Auto convert numbers and booleans
        if (val.toLowerCase() === 'true') val = true;
        else if (val.toLowerCase() === 'false') val = false;
        else if (!isNaN(Number(val)) && val !== '') val = Number(val);
        row[h] = val;
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parse JSON text that may be an array, or an object wrapper { data: [...] } or { result: [...] }
 */
export function parseJson(jsonText: string): Record<string, any>[] {
  const parsed = JSON.parse(jsonText);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.data)) return parsed.data;
    if (Array.isArray(parsed.rows)) return parsed.rows;
    if (Array.isArray(parsed.items)) return parsed.items;
    if (Array.isArray(parsed.result)) return parsed.result;
    return [parsed];
  }
  return [];
}

/**
 * Fetch rows directly from Supabase PostgREST endpoint
 */
export async function fetchFromSupabaseApi(
  supabaseUrl: string,
  anonKey: string,
  tableName: string,
  limit: number = 500
): Promise<Record<string, any>[]> {
  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*&limit=${limit}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur Supabase (${response.status} ${response.statusText}): ${errText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("La réponse de l'API Supabase ne contient pas un tableau de données.");
  }
  return data;
}

/**
 * Generate automatic mapping recommendations based on source keys and target collection
 */
export function generateAutoMapping(
  sourceKeys: string[],
  target: ImportTargetCollection
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerKeys = sourceKeys.map((k) => ({ original: k, lower: k.toLowerCase().replace(/[\s\-_]/g, '') }));

  Object.entries(FIELD_SYNONYMS).forEach(([targetField, synonyms]) => {
    // Check direct match
    const direct = lowerKeys.find((k) => k.lower === targetField.toLowerCase());
    if (direct) {
      mapping[direct.original] = targetField;
      return;
    }
    // Check synonyms
    for (const syn of synonyms) {
      const cleanSyn = syn.toLowerCase().replace(/[\s\-_]/g, '');
      const match = lowerKeys.find((k) => k.lower === cleanSyn);
      if (match && !mapping[match.original]) {
        mapping[match.original] = targetField;
        break;
      }
    }
  });

  return mapping;
}

const VALID_ARRONDISSEMENTS: Arrondissement[] = [
  'Lumumba',
  'Mvou-Mvou',
  'Tié-Tié',
  'Loandjili',
  'Mongo-Mpoukou',
  'Ngoyo',
];

/**
 * Clean & normalize Arrondissement name
 */
export function normalizeArrondissement(raw: any): Arrondissement {
  if (!raw) return 'Lumumba';
  const str = String(raw).trim().toLowerCase();
  if (str.includes('lumumba') || str.includes('arrond 1') || str.includes('1er')) return 'Lumumba';
  if (str.includes('mvou') || str.includes('arrond 2') || str.includes('2e')) return 'Mvou-Mvou';
  if (str.includes('tie') || str.includes('tié') || str.includes('arrond 3') || str.includes('3e')) return 'Tié-Tié';
  if (str.includes('loandjili') || str.includes('arrond 4') || str.includes('4e')) return 'Loandjili';
  if (str.includes('mongo') || str.includes('mpoukou') || str.includes('arrond 5') || str.includes('5e')) return 'Mongo-Mpoukou';
  if (str.includes('ngoyo') || str.includes('arrond 6') || str.includes('6e')) return 'Ngoyo';
  return 'Lumumba';
}

/**
 * Transform raw record according to mapping and validate target schema
 */
export function mapAndValidateRecord(
  raw: Record<string, any>,
  mapping: Record<string, string>,
  target: ImportTargetCollection,
  index: number
): ImportPreviewItem {
  const mapped: Record<string, any> = {};
  const validationErrors: string[] = [];

  // Apply mapping
  Object.entries(raw).forEach(([sourceCol, value]) => {
    const targetField = mapping[sourceCol];
    if (targetField && targetField !== '__ignore__') {
      mapped[targetField] = value;
    }
  });

  // Preserve or generate identifier
  const id = raw.id ? String(raw.id) : `${target.substring(0, 3)}-supa-${Date.now()}-${index}`;
  mapped.id = id;

  if (target === 'establishments') {
    // Required fields check
    if (!mapped.nomCommercial && !raw.nom && !raw.name) {
      validationErrors.push('Nom commercial manquant');
    }
    mapped.nomCommercial = mapped.nomCommercial || raw.nom || raw.name || `Établissement #${index + 1}`;
    mapped.promoteurNom = mapped.promoteurNom || raw.promoteur || 'Non renseigné';
    mapped.promoteurTelephone = mapped.promoteurTelephone || raw.telephone || '+242 06 000 0000';
    mapped.arrondissement = normalizeArrondissement(mapped.arrondissement || raw.arrondissement);
    mapped.quartier = mapped.quartier || raw.quartier || 'Centre-Ville';
    mapped.adresseExacte = mapped.adresseExacte || raw.adresse || `Avenue Principale, ${mapped.arrondissement}`;
    mapped.categorie = (mapped.categorie as EstablishmentCategory) || 'Lounge Bar & Terrasse';
    mapped.regimeFiscal = mapped.regimeFiscal === 'formel_proportionnel' ? 'formel_proportionnel' : 'informel_forfaitaire';
    mapped.surfaceM2 = Number(mapped.surfaceM2) || 120;
    mapped.montantRedevanceAnnuelle = Number(mapped.montantRedevanceAnnuelle) || 350000;
    mapped.montantEncaisse = Number(mapped.montantEncaisse) || 0;
    mapped.soldeRestantDu = mapped.montantRedevanceAnnuelle - mapped.montantEncaisse;
    mapped.statut = (mapped.statut as ComplianceStatus) || (mapped.soldeRestantDu <= 0 ? 'en_regle' : 'attestation_provisoire');
    mapped.latitude = Number(mapped.latitude) || -4.782 + (Math.random() - 0.5) * 0.05;
    mapped.longitude = Number(mapped.longitude) || 11.854 + (Math.random() - 0.5) * 0.05;
    mapped.niveauDecibelsMoyen = Number(mapped.niveauDecibelsMoyen) || 68;
    mapped.limiteurInstalle = Boolean(mapped.limiteurInstalle);
    mapped.agentAssigneId = mapped.agentAssigneId || 'stf-002';
    mapped.agentAssigneNom = mapped.agentAssigneNom || 'Gildas Ambetos (Inspecteur SAA)';
    mapped.recensePar = mapped.recensePar || 'Import Supabase DDL-PN';
    mapped.anneeExercice = 2026;
    mapped.historiquePaiements = mapped.historiquePaiements || [];
    mapped.codeDossier = mapped.codeDossier || `DDL-PN-2026-${mapped.arrondissement.substring(0, 3).toUpperCase()}-${(index + 100).toString().padStart(4, '0')}`;
  } else if (target === 'receipts') {
    if (!mapped.montantVerse && !raw.montant) {
      validationErrors.push('Montant versé manquant');
    }
    mapped.numeroQuittance = mapped.numeroQuittance || `QUIT-2026-${(index + 800).toString().padStart(5, '0')}`;
    mapped.datePaiement = mapped.datePaiement || new Date().toISOString().substring(0, 10);
    mapped.etablissementId = mapped.etablissementId || `est-imported-${index}`;
    mapped.etablissementNom = mapped.etablissementNom || raw.etablissement || 'Établissement Recensé';
    mapped.promoteurNom = mapped.promoteurNom || 'Promoteur';
    mapped.arrondissement = normalizeArrondissement(mapped.arrondissement);
    mapped.montantVerse = Number(mapped.montantVerse) || Number(raw.montant) || 50000;
    mapped.resteAPayer = Number(mapped.resteAPayer) || 0;
    mapped.modePaiement = mapped.modePaiement || 'especes';
    mapped.quittanceHash = mapped.quittanceHash || `sha256_${Date.now()}_${index}`;
  } else if (target === 'schedules') {
    mapped.dateTournee = mapped.dateTournee || new Date().toISOString().substring(0, 10);
    mapped.heure = mapped.heure || '10:00';
    mapped.etablissementId = mapped.etablissementId || `est-imported-${index}`;
    mapped.etablissementNom = mapped.etablissementNom || 'Établissement';
    mapped.arrondissement = normalizeArrondissement(mapped.arrondissement);
    mapped.brigadeAssignee = mapped.brigadeAssignee || 'Brigade Mobile SAA 1';
    mapped.inspecteurChef = mapped.inspecteurChef || 'Inspecteur Gildas Ambetos';
    mapped.agentId = mapped.agentId || 'stf-002';
    mapped.typeMission = mapped.typeMission || 'Contrôle et Recouvrement SAA';
    mapped.statut = mapped.statut || 'planifie';
  } else if (target === 'legalActs') {
    mapped.type = mapped.type || 'mise_en_demeure';
    mapped.referenceNumero = mapped.referenceNumero || `MED-2026-${(index + 40).toString().padStart(4, '0')}`;
    mapped.dateEmission = mapped.dateEmission || new Date().toISOString().substring(0, 10);
    mapped.etablissementId = mapped.etablissementId || `est-imported-${index}`;
    mapped.etablissementNom = mapped.etablissementNom || 'Établissement';
    mapped.motifs = mapped.motifs || 'Défaut de paiement de la redevance départementale 2026';
    mapped.delaiHeures = Number(mapped.delaiHeures) || 72;
    mapped.statutExecution = mapped.statutExecution || 'en_cours_delai';
  }

  return {
    id,
    sourceData: raw,
    mappedData: mapped,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

/**
 * Write a list of validated records to Firestore directly
 */
export async function executeFirestoreImport(
  targetCollection: ImportTargetCollection,
  items: Record<string, any>[],
  onProgress?: (processed: number, total: number) => void
): Promise<ImportExecutionResult> {
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  const importedItems: any[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const docId = String(item.id);

    try {
      const docRef = doc(db, targetCollection, docId);
      await setDoc(docRef, item, { merge: true });
      successCount++;
      importedItems.push(item);
    } catch (err: any) {
      errorCount++;
      const errMsg = `Erreur sur l'élément ID ${docId}: ${err?.message || String(err)}`;
      errors.push(errMsg);
      console.warn(`[Supabase Import] Echec écriture doc ${docId}:`, err);
      // We don't abort entire import, continue to maximize imported rows
    }

    if (onProgress) {
      onProgress(i + 1, items.length);
    }
  }

  return {
    total: items.length,
    successCount,
    errorCount,
    errors,
    importedItems,
    durationMs: Date.now() - startTime,
  };
}
