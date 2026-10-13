export type Arrondissement =
  | 'Lumumba'
  | 'Mvou-Mvou'
  | 'Tié-Tié'
  | 'Loandjili'
  | 'Mongo-Mpoukou'
  | 'Ngoyo';

export const QUARTIERS_PAR_ARRONDISSEMENT: Record<Arrondissement, string[]> = {
  Lumumba: [
    'Centre-Ville Administratif',
    'Plateau',
    'Côte Sauvage',
    'Losange',
    'KM 4 (Kilomètre 4)',
    'Zone Portuaire / Wharf',
    'Quartier Chic',
    'Grand Marché',
    'Tchicamba',
    'Autre quartier (Lumumba)',
  ],
  'Mvou-Mvou': [
    'Mvou-Mvou Centre',
    'Mawata',
    'OCH (Office Congolais de l\'Habitat)',
    'Quartier 204',
    'Quartier 205',
    'Nkouikou',
    'Saint-Pierre',
    'La Glacière',
    'Marché Central Mvou-Mvou',
    'Autre quartier (Mvou-Mvou)',
  ],
  'Tié-Tié': [
    'Tié-Tié Centre',
    'Fond Tié-Tié',
    'Mbota',
    'Cité des 100 Maisons',
    'Marché Tié-Tié',
    'Quartier Rex',
    'Songolo Ouest',
    'Casis',
    'Quartier 305',
    'Quartier 306',
    'Autre quartier (Tié-Tié)',
  ],
  Loandjili: [
    'Loandjili Centre',
    'Vindoulou',
    'Mpaka',
    'Mongo-Kamba',
    'Faubourg',
    'Nkayi-Bouanga',
    'Siafoumou',
    'Quartier 401',
    'Quartier 402',
    'Quartier 411',
    'Autre quartier (Loandjili)',
  ],
  'Mongo-Mpoukou': [
    'Mongo-Mpoukou Centre',
    'Makayabou',
    'Tchinambi 1',
    'Koufoli',
    'Coraf',
    'Mayinga',
    'Côte Matève Ouest',
    'Camp Militaire',
    'Quartier 501',
    'Quartier 502',
    'Autre quartier (Mongo-Mpoukou)',
  ],
  Ngoyo: [
    'Ngoyo Centre',
    'Côte Matève',
    'Patra',
    'Tchimbamba',
    'Route de Djéno',
    'Quartier Péage',
    'Loubi',
    'Tchiniambi 2',
    'Quartier 601',
    'Quartier 602',
    'Autre quartier (Ngoyo)',
  ],
};

export type EstablishmentCategory =
  | 'Discothèque / Night-club'
  | 'Bar Dancing / Cabaret'
  | 'Lounge Bar & Terrasse'
  | 'Espace Récréatif & Salle Polyvalente'
  | 'Snack-Bar Sonorisé'
  | 'Complexe de Loisirs & Piscine'
  | 'Autre établissement de loisirs';

export type ComplianceStatus =
  | 'en_regle'              // Vert
  | 'attestation_provisoire'// Bleu
  | 'mise_en_demeure'       // Orange
  | 'ferme_contentieux';    // Rouge

export type UserRole =
  | 'directeur'
  | 'inspecteur_saa'
  | 'caissier_saf'
  | 'agent_spa'
  | 'administrateur'
  | 'promoteur';

export interface PaymentHistoryItem {
  id: string;
  date: string;
  montant: number;
  quittanceNumero: string;
  modePaiement: string;
  agentNom: string;
  observations?: string;
}

export interface Establishment {
  id: string;
  codeDossier: string; // Ex: DDL-PN-2026-LUM-0012
  nomCommercial: string;
  promoteurNom: string;
  promoteurTelephone: string;
  promoteurEmail?: string;
  arrondissement: Arrondissement;
  quartier: string;
  adresseExacte: string;
  categorie: EstablishmentCategory;
  regimeFiscal: 'informel_forfaitaire' | 'formel_proportionnel';
  surfaceM2: number;
  montantRedevanceAnnuelle: number; // En FCFA
  montantEncaisse: number;         // En FCFA
  soldeRestantDu: number;          // En FCFA
  statut: ComplianceStatus;
  latitude: number;
  longitude: number;
  niveauDecibelsMoyen: number; // dB(A)
  limiteurInstalle: boolean;
  dateRecensement: string;
  recensePar: string; // Nom de l'agent ou brigade

  // Strict Agent Siloing (Un seul agent responsable exclusif)
  agentAssigneId: string;    // Ex: 'stf-002' (Gildas Ambetos)
  agentAssigneNom: string;   // Ex: 'Gildas Ambetos'

  derniereInspectionDate?: string;
  miseEnDemeureDate?: string;
  miseEnDemeureExpireAt?: string;
  numeroAttestation?: string;
  dateDelivranceAttestation?: string;
  syncStatus?: 'synced' | 'pending';

  // Historique dynamique des acomptes & tournées
  historiquePaiements?: PaymentHistoryItem[];
  prochainRdvDate?: string;
  prochainRdvHeure?: string;
  prochainRdvMotif?: string;

  // Reconduction / Renouvellement Annuel (Exercice N+1)
  premierAcompteDate?: string;
  renouvellementAnnuelDate?: string;
  anneeExercice?: number;

  // Signalement Fermeture / Établissement Éteint
  estEteintOuFerme?: boolean;
  dateConstatFermeture?: string;
  motifFermeture?: string;
  constateParAgentNom?: string;
  observationsFermeture?: string;

  // Dossier réglementaire Note 152 / SAF
  dossierChecklist?: Record<string, boolean>;
  piecesFourniesCount?: number;
  tauxCompletudeDossier?: number;
  fraisEnquetePaye?: boolean;

  // Preuve visuelle & Signature in situ
  photoUrl?: string;
  signatureUrl?: string;
}

export interface CashReceipt {
  id: string;
  numeroQuittance: string; // Ex: QUIT-2026-00452
  datePaiement: string;
  etablissementId: string;
  etablissementNom: string;
  promoteurNom: string;
  arrondissement: Arrondissement;
  montantVerse: number; // FCFA
  resteAPayer: number;  // FCFA
  modePaiement: 'especes' | 'momo_mtn' | 'airtel_money' | 'cheque_tresor' | 'virement';
  referenceTransaction?: string;
  inspecteurOuCaissier: string;
  agentId?: string;
  brigadeCode?: string;
  natureRecette: 'Forfait Informel SAA' | 'Redevance Proportionnelle' | 'Pénalité de retard' | 'Taxe d\'agrément provisoire' | 'Frais d\'enquête DDL-PN' | 'Frais d\'étude (Note 151)' | 'Redevance Annuelle d\'Exploitation' | string;
  // Ventilation officielle Note 151 & Fiche SAF
  fraisEnquete?: number;
  fraisEtude?: number;
  partTresor?: number;
  surfaceM2?: number;
  quittanceHash?: string;
  signatureUrl?: string;
}

export interface LegalAct {
  id: string;
  type: 'mise_en_demeure' | 'arrete_fermeture' | 'pv_sonometrie' | 'ordre_mission';
  referenceNumero: string;
  dateEmission: string;
  etablissementId: string;
  etablissementNom: string;
  promoteurNom: string;
  arrondissement: Arrondissement;
  motifs: string;
  delaiHeures?: number; // ex: 72h
  expireAt?: string;
  decibelsMesures?: number; // ex: 92 dB(A)
  inspecteursAssermentes: string[];
  statutExecution: 'actif' | 'execute' | 'leve' | 'transmis_force_publique';
  documentHash: string;
  agentId?: string;
}

export interface InspectionSchedule {
  id: string;
  dateTournee: string;
  heure: string;
  etablissementId: string;
  etablissementNom: string;
  arrondissement: Arrondissement;
  brigadeAssignee: string;
  inspecteurChef: string;
  agentId: string; // ID exclusif de l'agent
  typeMission: 'Recouvrement' | 'Contrôle Décibels' | 'Signification Mise en Demeure' | 'Vérification Agréments' | 'Renouvellement Annuel N+1';
  statut: 'planifie' | 'en_cours' | 'effectue' | 'annule';
  googleCalendarEventId?: string;
  notes?: string;
  historiquePrecedent?: string;
  montantAcompteAttendu?: number;
}

export interface PtaMilestone {
  id: string;
  axeStrategique: string;
  activite: string;
  serviceResponsable: 'SAA' | 'SAF' | 'SPA' | 'SSID';
  responsableNom: string;
  cibleAnnuelle: number;
  realisationActuelle: number;
  unite: string;
  budgetPrevu: number;
  budgetEngage: number;
  tauxExecutionPhysique: number; // en %
  tauxExecutionFinanciere: number; // en %
  statut: 'en_cours' | 'atteint' | 'en_alerte';
}

export interface StaffPersonnel {
  id: string;
  matricule: string;
  nomComplet: string;
  grade: string;
  fonction: string;
  service: 'SAA' | 'SAF' | 'SPA' | 'Direction' | 'SSID';
  brigadeAffectee?: string;
  telephone: string;
  email: string;
  role: UserRole;
  assermentationNumero: string;
  dateAssermentation: string;
  statut: 'actif' | 'en_mission' | 'conge';
  photoUrl?: string;
  calendarColor?: string; // Couleur agenda Google
  pin?: string;           // Code PIN confidentiel (ex: '2026')
  loginId?: string;       // Identifiant unique de connexion (ex: 'matoko.j')
  password?: string;      // Mot de passe confidentiel de l'agent
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  agentNom: string;
  agentMatricule: string;
  action: string;
  typeEntite: string;
  referenceId: string;
  details: string;
  hashSha256: string;
}

export interface JointInspectionReport {
  id: string;
  referenceNumero: string;
  dateControle: string;
  etablissementNom: string;
  arrondissement: Arrondissement;
  representants: {
    administration: string;
    nomRepresentant: string;
    emargement: boolean;
  }[];
  conformiteAcoustique: { conforme: boolean; decibels: number; observations: string };
  conformiteHygiene: { conforme: boolean; observations: string };
  securiteIncendie: { conforme: boolean; extincteursPresents: boolean; issueSecoursDegagee: boolean };
  licenceBoissons: { conforme: boolean; numeroLicence: string };
  decisionCommission: 'Avis Favorable' | 'Avertissement avec Délai' | 'Fermeture Provisoire Proposée';
  recommandations: string;
  hash: string;
}

export interface SoitTransmisDgl {
  id: string;
  numeroBordereau: string; // Ex: BT-2026/04/DDL-PN-DGL
  dateTransmission: string;
  nombreDossiers: number;
  listeEtablissements: {
    etablissementNom: string;
    promoteurNom: string;
    arrondissement: Arrondissement;
    montantRegieAcquitte: number;
    referenceDossier: string;
  }[];
  statut: 'prepare' | 'transmis_brazzaville' | 'recu_brazzaville' | 'agrement_signe';
  signataireDepartemental: string;
  dateAccuseReception?: string;
  observations?: string;
}
