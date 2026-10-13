/**
 * Référentiel Réglementaire Officiel DDL-PN
 * Basé sur :
 * 1. Note de Service N° 151/MTL-CAB du 03 août 2022 (Frais d'autorisation d'ouverture et d'exploitation)
 * 2. Note de Service N° 152/MTL-CAB du 05 août 2022 (Composition du dossier d'agrément et 4 sous-dossiers)
 * 3. Fiche Locale DDL-PN / SAF Pointe-Noire (Pièces d'ouverture et Frais d'enquête = 30.000 FCFA)
 */

export interface OfficialTariffItem {
  id: string;
  code: string;
  section: string; // 'I- Salles de jeux', 'J- Salles de cinéma', 'K- Débits de boisson', etc.
  libelle: string;
  typeTarif: 'par_m2' | 'forfait' | 'exonere';
  tarifUnitaireCfa: number; // Montant forfaitaire ou tarif par m²
  unite?: string; // 'par m²', 'forfaitaire'
  description?: string;
  delaiValiditeMois?: number;
}

export const OFFICIAL_INVESTIGATION_FEE_CFA = 30000; // Frais d'enquête de terrain DDL-PN (Fiche locale SAF Pointe-Noire)
export const OFFICIAL_STUDY_SHARE_PERCENT = 50; // 50% reversé à l'Administration des loisirs pour l'étude du dossier (Note 151/MTL-CAB)

export const OFFICIAL_TARIFFS: OfficialTariffItem[] = [
  // I- Salles de jeux
  {
    id: 'tar-casino',
    code: 'I-6',
    section: 'I- Salles de jeux',
    libelle: 'Casino',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 5000000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-billard',
    code: 'I-7',
    section: 'I- Salles de jeux',
    libelle: 'Salle de billard',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 500000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-bowling',
    code: 'I-8',
    section: 'I- Salles de jeux',
    libelle: 'Salle de bowling',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 500000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-jackpot',
    code: 'I-9',
    section: 'I- Salles de jeux',
    libelle: 'Jackpot',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 3500000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-jeux-video',
    code: 'I-10',
    section: 'I- Salles de jeux',
    libelle: 'Salle de jeux vidéo (par m²)',
    typeTarif: 'par_m2',
    tarifUnitaireCfa: 5000,
    unite: 'par m²',
  },

  // J- Salles de cinéma
  {
    id: 'tar-cine-petit',
    code: 'J-4',
    section: 'J- Salles de cinéma',
    libelle: 'Ciné petit écran',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-cine-foot',
    code: 'J-5',
    section: 'J- Salles de cinéma',
    libelle: 'Ciné foot / Vidéo club',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-cine-grand',
    code: 'J-6',
    section: 'J- Salles de cinéma',
    libelle: 'Ciné grand écran',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 500000,
    unite: 'forfaitaire',
  },

  // K- Débits de boisson (par m2)
  {
    id: 'tar-discotheque',
    code: 'K-6',
    section: 'K- Débits de boisson (par m²)',
    libelle: 'Discothèque',
    typeTarif: 'par_m2',
    tarifUnitaireCfa: 1500,
    unite: 'par m²',
  },
  {
    id: 'tar-night-club-vip',
    code: 'K-7',
    section: 'K- Débits de boisson (par m²)',
    libelle: 'Night-club, VIP',
    typeTarif: 'par_m2',
    tarifUnitaireCfa: 1500,
    unite: 'par m²',
  },
  {
    id: 'tar-bar-dancing',
    code: 'K-8',
    section: 'K- Débits de boisson (par m²)',
    libelle: 'Bar, bar dancing, cabaret',
    typeTarif: 'par_m2',
    tarifUnitaireCfa: 1000,
    unite: 'par m²',
  },
  {
    id: 'tar-cave',
    code: 'K-9',
    section: 'K- Débits de boisson (par m²)',
    libelle: 'Cave',
    typeTarif: 'par_m2',
    tarifUnitaireCfa: 1000,
    unite: 'par m²',
  },
  {
    id: 'tar-buvette',
    code: 'K-10',
    section: 'K- Débits de boisson (par m²)',
    libelle: 'Buvette / Snack-bar',
    typeTarif: 'par_m2',
    tarifUnitaireCfa: 1000,
    unite: 'par m²',
  },

  // L- Sites de loisirs
  {
    id: 'tar-maisons-loisirs',
    code: 'L-8',
    section: 'L- Sites de loisirs',
    libelle: 'Maisons de loisirs',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 100000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-centre-vacances',
    code: 'L-9',
    section: 'L- Sites de loisirs',
    libelle: 'Centre de loisirs avec ou sans hébergement (centre de vacances)',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 100000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-parc-loisirs',
    code: 'L-10',
    section: 'L- Sites de loisirs',
    libelle: 'Parc de loisirs',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 100000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-village-loisirs',
    code: 'L-11',
    section: 'L- Sites de loisirs',
    libelle: 'Village de loisirs',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 100000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-complexe-loisirs',
    code: 'L-12',
    section: 'L- Sites de loisirs',
    libelle: 'Base de loisirs (complexe de loisirs & piscine)',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 100000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-base-nautique',
    code: 'L-13',
    section: 'L- Sites de loisirs',
    libelle: 'Base nautique / Espace balnéaire',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 100000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-parc-aquatique',
    code: 'L-14',
    section: 'L- Sites de loisirs',
    libelle: 'Parc aquatique',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 100000,
    unite: 'forfaitaire',
  },

  // M- Jeux de hasard
  {
    id: 'tar-tombola-pub',
    code: 'M-7',
    section: 'M- Jeux de hasard',
    libelle: 'Tombola à but publicitaire',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 1000000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-loterie-pub',
    code: 'M-8',
    section: 'M- Jeux de hasard',
    libelle: 'Loterie à but publicitaire',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 2000000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-loterie-tv',
    code: 'M-9',
    section: 'M- Jeux de hasard',
    libelle: 'Loterie classique télévisée',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-paris-sportifs',
    code: 'M-10',
    section: 'M- Jeux de hasard',
    libelle: 'Paris sportifs physiques',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-pari-equestre',
    code: 'M-11',
    section: 'M- Jeux de hasard',
    libelle: 'Pari équestre',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 80000000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-jeux-en-ligne',
    code: 'M-12',
    section: 'M- Jeux de hasard',
    libelle: 'Jeux en ligne (casino, football, loterie, paris sportifs en ligne)',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 80000000,
    unite: 'forfaitaire',
  },

  // N- Fêtes foraines
  {
    id: 'tar-kermesse',
    code: 'N-5',
    section: 'N- Fêtes foraines',
    libelle: 'Kermesse',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-cirque',
    code: 'N-6',
    section: 'N- Fêtes foraines',
    libelle: 'Cirque',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-carnaval',
    code: 'N-7',
    section: 'N- Fêtes foraines',
    libelle: 'Carnaval',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-foire',
    code: 'N-8',
    section: 'N- Fêtes foraines',
    libelle: 'Foire',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },

  // O & P- Festivals et Rallye
  {
    id: 'tar-festival',
    code: 'O',
    section: 'O- Festivals et activités événementielles',
    libelle: 'Festivals et activités événementielles',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },
  {
    id: 'tar-rallye',
    code: 'P',
    section: 'P- Rallye',
    libelle: 'Rallye',
    typeTarif: 'forfait',
    tarifUnitaireCfa: 50000,
    unite: 'forfaitaire',
  },

  // Exonérations officielles "Loisirs sains"
  {
    id: 'tar-exo-aires-jeux',
    code: 'EXO-1',
    section: 'Loisirs sains exonérés',
    libelle: 'Aires de jeux',
    typeTarif: 'exonere',
    tarifUnitaireCfa: 0,
    unite: 'exonéré',
    description: 'Exonération légale pour promotion des loisirs sains (Note 151)',
  },
  {
    id: 'tar-exo-ludotheques',
    code: 'EXO-2',
    section: 'Loisirs sains exonérés',
    libelle: 'Ludothèques',
    typeTarif: 'exonere',
    tarifUnitaireCfa: 0,
    unite: 'exonéré',
    description: 'Exonération légale pour promotion des loisirs sains (Note 151)',
  },
  {
    id: 'tar-exo-clubs',
    code: 'EXO-3',
    section: 'Loisirs sains exonérés',
    libelle: 'Clubs de loisirs',
    typeTarif: 'exonere',
    tarifUnitaireCfa: 0,
    unite: 'exonéré',
    description: 'Exonération légale pour promotion des loisirs sains (Note 151)',
  },
  {
    id: 'tar-exo-caritatif',
    code: 'EXO-4',
    section: 'Loisirs sains exonérés',
    libelle: 'Loteries et tombolas à but caritatif',
    typeTarif: 'exonere',
    tarifUnitaireCfa: 0,
    unite: 'exonéré',
    description: 'Exonération légale pour promotion des activités d’intérêt général (Note 151)',
  },
];

/**
 * Calculateur officiel conforme à la Note de Service N° 151/MTL-CAB
 */
export interface FeeCalculationResult {
  categorieLibelle: string;
  typeTarif: 'par_m2' | 'forfait' | 'exonere';
  surfaceM2?: number;
  tauxUnitaire: number;
  montantAutorisation: number;
  partAdministrationEtude: number; // 50%
  partTresorPublic: number; // 50%
  fraisEnqueteTerrain: number; // 30 000 FCFA
  totalExigible: number; // montantAutorisation + fraisEnqueteTerrain
}

export function computeOfficialFees(
  tariffIdOrLibelle: string,
  surfaceM2: number = 0,
  includeEnqueteFee: boolean = true
): FeeCalculationResult {
  const item =
    OFFICIAL_TARIFFS.find(
      (t) =>
        t.id === tariffIdOrLibelle ||
        t.libelle.toLowerCase() === tariffIdOrLibelle.toLowerCase() ||
        t.code.toLowerCase() === tariffIdOrLibelle.toLowerCase()
    ) ||
    OFFICIAL_TARIFFS.find((t) => t.id === 'tar-bar-dancing')!;

  let montantAutorisation = 0;
  if (item.typeTarif === 'par_m2') {
    const s = Math.max(1, surfaceM2);
    montantAutorisation = s * item.tarifUnitaireCfa;
  } else if (item.typeTarif === 'forfait') {
    montantAutorisation = item.tarifUnitaireCfa;
  } else {
    montantAutorisation = 0; // Exonéré
  }

  const partAdministrationEtude = Math.round(montantAutorisation * 0.5);
  const partTresorPublic = montantAutorisation - partAdministrationEtude;
  const fraisEnqueteTerrain = includeEnqueteFee ? OFFICIAL_INVESTIGATION_FEE_CFA : 0;
  const totalExigible = montantAutorisation + fraisEnqueteTerrain;

  return {
    categorieLibelle: item.libelle,
    typeTarif: item.typeTarif,
    surfaceM2: item.typeTarif === 'par_m2' ? surfaceM2 : undefined,
    tauxUnitaire: item.tarifUnitaireCfa,
    montantAutorisation,
    partAdministrationEtude,
    partTresorPublic,
    fraisEnqueteTerrain,
    totalExigible,
  };
}

/**
 * 4 Sous-Dossiers Officiels (Note de Service N° 152/MTL-CAB) + Fiche Locale DDL-PN
 */
export interface RequiredDocumentItem {
  id: string;
  code: string;
  libelle: string;
  description: string;
  sousDossier: 'demande' | 'technique' | 'administratif' | 'financier';
  obligatoire: boolean;
  estConditionEtranger?: boolean;
  estConditionJeuxHasard?: boolean;
  noteServiceOrigine: '152/MTL-CAB' | 'DDL-PN-SAF';
}

export const OFFICIAL_DOSSIER_CHECKLIST: RequiredDocumentItem[] = [
  // Demande
  {
    id: 'doc-demande-ecrite',
    code: 'DEM-01',
    libelle: 'Demande écrite adressée au Ministre en charge des loisirs',
    description: 'Demande officielle formalisée avec identité du promoteur et objet de l’agrément',
    sousDossier: 'demande',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },

  // Sous-dossier Technique
  {
    id: 'doc-plan-masse',
    code: 'TECH-01',
    libelle: 'Plan de masse et plan de situation de l’établissement',
    description: 'Indication précise des accès, de la surface utile et de la localisation urbaine',
    sousDossier: 'technique',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-reglement-interieur',
    code: 'TECH-02',
    libelle: 'Règlement intérieur des jeux ou de l’établissement',
    description: 'Modalités d’admission, sécurité des usagers et respect de la tranquillité publique',
    sousDossier: 'technique',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-quitus-pompiers',
    code: 'TECH-03',
    libelle: 'Quitus délivré par les services des sapeurs-pompiers',
    description: 'Certificat de conformité des dispositifs incendie, issues de secours et extincteurs',
    sousDossier: 'technique',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-quitus-cnss',
    code: 'TECH-04',
    libelle: 'Quitus de la CNSS (Caisse Nationale de Sécurité Sociale)',
    description: 'Attestation de régularité des cotisations sociales du personnel',
    sousDossier: 'technique',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-titre-bail',
    code: 'TECH-05',
    libelle: 'Titre de propriété ou contrat de bail (adresse physique au Congo)',
    description: 'Justificatif juridique d’occupation des locaux sis à Pointe-Noire',
    sousDossier: 'technique',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-organigramme-client',
    code: 'TECH-06',
    libelle: 'Organigramme justifiant l’existence d’un service client (Jeux de hasard)',
    description: 'Requis pour les établissements exploitant des jeux de hasard et paris',
    sousDossier: 'technique',
    obligatoire: false,
    estConditionJeuxHasard: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-parrainage-etranger',
    code: 'TECH-07',
    libelle: 'Contrat de parrainage avec un Congolais (Promoteurs étrangers)',
    description: 'Garantie d’un parrain congolais justifiant d’une expérience avérée et attestée par le Ministre',
    sousDossier: 'technique',
    obligatoire: false,
    estConditionEtranger: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-contrat-travail-congolais',
    code: 'TECH-08',
    libelle: 'Contrats de travail justifiant du recrutement d’employés congolais (si étranger)',
    description: 'Engagement de promotion de l’emploi national et des compétences locales',
    sousDossier: 'technique',
    obligatoire: false,
    estConditionEtranger: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-contrat-fournisseurs',
    code: 'TECH-09',
    libelle: 'Contrat avec des fournisseurs et partenaires locaux',
    description: 'Partenariats commerciaux établis sur le territoire de la République du Congo',
    sousDossier: 'technique',
    obligatoire: false,
    noteServiceOrigine: '152/MTL-CAB',
  },

  // Sous-dossier Administratif
  {
    id: 'doc-piece-identite',
    code: 'ADM-01',
    libelle: 'Copie de la pièce d’identité du promoteur ou gérant (CNI, Passeport, Séjour)',
    description: 'Pièce en cours de validité (CNI, passeport ou carte de résident pour étranger)',
    sousDossier: 'administratif',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-certificat-nationalite',
    code: 'ADM-02',
    libelle: 'Certificat de nationalité',
    description: 'Délivré par le Tribunal d’Instance territorialement compétent',
    sousDossier: 'administratif',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-casier-judiciaire',
    code: 'ADM-03',
    libelle: 'Extrait de casier judiciaire datant de moins de trois (3) mois',
    description: 'Bulletin N° 3 vierge de condamnations incompatibles avec la gestion d’un ERP',
    sousDossier: 'administratif',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-cv-gerant',
    code: 'ADM-04',
    libelle: 'Curriculum Vitae (CV) du gérant / diplôme ou attestation d’expérience',
    description: 'Justificatif des qualifications professionnelles dans le secteur de l’hôtellerie ou des loisirs',
    sousDossier: 'administratif',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-certificat-medical',
    code: 'ADM-05',
    libelle: 'Certificat médical du gérant délivré par les services d’hygiène',
    description: 'Aptitude physique et médicale à la manipulation des denrées et gestion d’un débit',
    sousDossier: 'administratif',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-rccm',
    code: 'ADM-06',
    libelle: 'Photocopie de l’attestation d’immatriculation au RCCM',
    description: 'Registre du Commerce et du Crédit Mobilier en règle au Greffe du TGI de Pointe-Noire',
    sousDossier: 'administratif',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-statuts-societe',
    code: 'ADM-07',
    libelle: 'Statuts notariés de la société (pour personnes morales)',
    description: 'Requis si l’établissement est exploité sous forme de SARL, SAS, SA, etc.',
    sousDossier: 'administratif',
    obligatoire: false,
    noteServiceOrigine: '152/MTL-CAB',
  },

  // Sous-dossier Financier
  {
    id: 'doc-patente',
    code: 'FIN-01',
    libelle: 'Photocopie de la patente de l’année en cours',
    description: 'Quittance fiscale d’imposition à la patente municipale/d’État',
    sousDossier: 'financier',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-compte-exploitation-3ans',
    code: 'FIN-02',
    libelle: 'Compte d’exploitation prévisionnel sur trois (3) ans',
    description: 'Budget prévisionnel équilibré attestant de la viabilité économique de l’activité',
    sousDossier: 'financier',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-recu-paiement-frais',
    code: 'FIN-03',
    libelle: 'Reçu de paiement des frais d’autorisation (Note 151) & Enquête (30.000 FCFA)',
    description: 'Quittance officielle SAF / Trésor Public attestant de l’acquittement des droits',
    sousDossier: 'financier',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
  {
    id: 'doc-assurance-multirisque',
    code: 'FIN-04',
    libelle: 'Attestation d’assurance responsabilité civile et multirisque professionnelle',
    description: 'Police d’assurance couvrant les dommages aux tiers et les risques d’exploitation',
    sousDossier: 'financier',
    obligatoire: true,
    noteServiceOrigine: '152/MTL-CAB',
  },
];

/**
 * Textes réglementaires intégraux prêts pour consultation dans MOD-12
 */
export const NOTE_151_MTL_CAB_TEXT = {
  id: 'note-151-mtl-cab',
  reference: 'Note de Service N° 151/MTL-CAB du 03 août 2022',
  signataire: 'Destinée Hermella DOUKAGA, Ministre du Tourisme et des Loisirs',
  objet: 'Fixant les frais inhérents à l’autorisation d’ouverture, d’exploitation des établissements, ou d’exercice des activités de loisirs',
  contenuIntegral: `En attendant la signature en cours de l'arrêté fixant les frais inhérents à l'autorisation d'ouverture, d'exploitation des établissements, ou d'exercice des activités de loisirs, les montants des frais y relatifs sont fixés ainsi qu'il suit, sur toute l'étendue du territoire national :

I- Salles de jeux :
6- Casino : 5 000 000 FCFA
7- Salle de billard : 500 000 FCFA
8- Salle de bowling : 500 000 FCFA
9- Jackpot : 3 500 000 FCFA
10- Salle de jeux vidéo (par m²) : 5 000 FCFA

J- Salles de cinéma :
4- Ciné petit écran : 50 000 FCFA
5- Ciné foot : 50 000 FCFA
6- Ciné grand écran : 500 000 FCFA

K- Débits de boisson (par m²) :
6- Discothèque : 1 500 FCFA
7- Night-club, VIP : 1 500 FCFA
8- Bar, bar dancing, cabaret : 1 000 FCFA
9- Cave : 1 000 FCFA
10- Buvette : 1 000 FCFA

L- Sites de loisirs :
8- Maisons de loisirs : 100 000 FCFA
9- Centre de loisirs avec ou sans hébergement (centre de vacances) : 100 000 FCFA
10- Parc de loisirs : 100 000 FCFA
11- Village de loisirs : 100 000 FCFA
12- Base de loisirs (complexe de loisirs) : 100 000 FCFA
13- Base nautique : 100 000 FCFA
14- Parc aquatique : 100 000 FCFA

M- Jeux de hasard :
7- Tombola à but publicitaire : 1 000 000 FCFA
8- Loterie à but publicitaire : 2 000 000 FCFA
9- Loterie classique télévisée : 50 000 000 FCFA
10- Paris sportifs physiques : 50 000 000 FCFA
11- Pari équestre : 80 000 000 FCFA
12- Jeux en ligne (casino, football, loterie, paris sportifs en ligne) : 80 000 000 FCFA

N- Fêtes foraines :
5- Kermesse : 50 000 FCFA
6- Cirque : 50 000 FCFA
7- Carnaval : 50 000 FCFA
8- Foire : 50 000 FCFA
O- Festivals et activités événementielles : 50 000 FCFA
P- Rallye : 50 000 FCFA

DISPOSITIONS FINANCIÈRES RÉGALIENNES :
Un taux de 50% des frais inhérents à l'autorisation d'ouverture, d'exploitation des établissements, ou d'exercice des activités de loisirs, est reversé à l'Administration de loisirs pour l'étude du dossier, avant reversement des fonds au trésor public.

EXONÉRATIONS POUR LOISIRS SAINS :
Dans le cadre de la promotion des activités de loisirs sains, les frais d'autorisation sont exonérés pour les activités suivantes :
- les aires de jeux ;
- les ludothèques ;
- les clubs de loisirs ;
- les loteries et tombolas à but caritatif.

L'Administration des loisirs est chargée de veiller au strict respect des dispositions de la présente note de service qui abroge toutes dispositions antérieures contraires, et prend effet à compter de la date de signature.

Fait à Brazzaville, le 03 Août 2022
Le Ministre, Destinée Hermella DOUKAGA`,
};

export const NOTE_152_MTL_CAB_TEXT = {
  id: 'note-152-mtl-cab',
  reference: 'Note de Service N° 152/MTL-CAB du 05 août 2022',
  signataire: 'Destinée Hermella DOUKAGA, Ministre du Tourisme et des Loisirs',
  objet: 'Portant composition du dossier de demande d’autorisation d’ouverture et d’exploitation des établissements de loisirs, et fixant une condition particulière d’exercice de certaines activités de loisirs',
  contenuIntegral: `En attendant l'adoption de la loi réglementant le secteur des loisirs en cours d'examen ; en application du décret n° 2021-345 du 06 juillet 2021 relatif aux attributions du Ministre du Tourisme et des Loisirs d'une part, et pour permettre d'autre part, à la direction générale des loisirs d'assurer ses missions régaliennes, notamment celle qui consiste à « instruire les dossiers présentés par les différents promoteurs en vue de la délivrance des autorisations », prévue par le décret n° 2010-245 du 16 mars 2010 portant attributions et organisation de la direction générale des loisirs, en son article 10.

Le dossier de demande d'autorisation d'ouverture, d'exploitation d'un établissement, ou d'exercice d'une activité de loisirs est composé ainsi qu'il suit :

- une demande écrite adressée au ministre chargé des loisirs ;
- un sous-dossier technique ;
- un sous-dossier administratif ;
- un sous-dossier financier.

Le sous-dossier technique comprend :
- un plan de masse et un plan de situation de l'établissement ;
- un règlement intérieur des jeux ;
- un quitus délivré par les services des sapeurs-pompiers ;
- un quitus de la CNSS ;
- un titre de propriété ou un contrat de bail (adresse physique au Congo) ;
- un organigramme justifiant l'existence d'un service client (pour les jeux de hasard) ;
- un contrat de parrainage avec un congolais (pour les étrangers) ;
- des contrats de travail justifiant du recrutement d'employés congolais (pour les étrangers) ;
- un contrat avec des fournisseurs et partenaires locaux.

Le sous-dossier administratif comprend :
- une copie de la pièce d'identité (CNI, passeport, carte de résident ou de séjour) du promoteur ou du gérant ;
- un certificat de nationalité ;
- un casier judiciaire datant de moins de trois (3) mois ;
- un CV du gérant / un diplôme ou une attestation d'expérience dans le domaine ;
- un certificat médical du gérant délivré par les services d'hygiène ;
- une photocopie de l'attestation d'immatriculation au registre de commerce et du crédit mobilier (RCCM) ;
- les Statuts de la société (pour les personnes morales).

Le sous-dossier financier comprend :
- une photocopie de la patente de l'année en cours ;
- un compte d'exploitation prévisionnel sur trois (3) ans ;
- un reçu de paiement des frais d'autorisation ;
- une attestation d'assurance multirisque.

Le dossier est obligatoirement accompagné de frais d'étude destinés à l'Administration des loisirs. Ces frais d'étude représentent un taux de 50% du montant des frais d'autorisation tel que stipulé dans la note de service n° 151/MTL-CAB du 3 août 2022.

CONDITION PARTICULIÈRE POUR CITOYENS ÉTRANGERS (JEUX DE HASARD) :
Les citoyens de nationalité étrangère, désireux d'obtenir une autorisation, pour l'exercice de certaines activités de loisirs, ou pour l'exploitation d'un établissement de loisirs, en plus des dossiers mentionnés ci-dessus, doivent présenter la garantie d'un parrainage de la part d'une personne physique de nationalité congolaise ayant une expérience avérée dans le domaine visé et attestée par le Ministre chargé des Loisirs.
Ces activités concernent principalement les Jeux de hasard, à savoir :
- la tombola ;
- la loterie classique télévisée ;
- les paris sportifs physiques ;
- le pari équestre ;
- les jeux en ligne (casino, football, loterie paris sportifs en ligne).

L'Administration des loisirs est chargée de veiller au strict respect des dispositions de la présente note de service qui abroge toutes dispositions antérieures contraires, et prend effet à compter de la date de signature.

Fait à Brazzaville, le 05 AOÛT 2022
Le Ministre, Destinée Hermella DOUKAGA`,
};

export const FICHE_LOCALE_DDL_PN_TEXT = {
  id: 'fiche-saf-ddl-pn',
  reference: 'Fiche Officielle SAF - Direction Départementale des Loisirs de Pointe-Noire',
  signataire: 'Le Directeur Départemental des Loisirs de Pointe-Noire (DDL-PN / SAF)',
  objet: 'Pièces à fournir pour l’ouverture d’un VIP, Cave, Bar Dancing, Night Club, Video Club, Snack-bar, Discothèque et Frais d’Enquête',
  contenuIntegral: `DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
SERVICE ADMINISTRATIF, FINANCIER ET MATÉRIEL (SAF)

PIÈCES À FOURNIR POUR L'OUVERTURE D'UN V.I.P, CAVE, BAR DANCING, NIGHT CLUB, VIDEO CLUB, SNAKBAR, DISCOTHEQUE... :

1. Une demande manuscrite envoyée au ministère en charge des loisirs ;
2. Un plan de situation de l'établissement ;
3. Un quitus délivré par les services des sapeurs-pompiers ;
4. Un titre de propriété ou un contrat de bail ;
5. Une copie de la carte nationale d'identité (CNI), du passeport, de la carte de résident ou de séjour pour les étrangers ;
6. Un certificat de nationalité ;
7. Un extrait de casier judiciaire ;
8. Un curriculum vitae (CV) du gérant ;
9. Un certificat médical ;
10. Une copie du Registre du commerce et du crédit mobilier (RCCM) ;
11. Une copie de la patente ;
12. Une attestation d'assurance multirisque ;
13. Le reçu de paiement des frais d'autorisation d'exploitation.

FRAIS D'ENQUÊTE DE TERRAIN :
Frais d'enquête = 30.000 Fcs (Trente mille Francs CFA)
Payables auprès de la Régie SAF de la Direction Départementale des Loisirs de Pointe-Noire avant descente des inspecteurs sur site.

Fait à Pointe-Noire
Pour la Direction Départementale des Loisirs`,
};
