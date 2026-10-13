/**
 * Modèle et Référentiel Officiel du Plan de Travail Annuel (PTA 2026)
 * Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)
 * République du Congo - Ministère de l'Industrie Culturelle, Touristique, Artistique et des Loisirs
 * Directeur Départemental : Jean Richard NTSEKE NGOUAKA
 */

export interface PtaActivityItem {
  id: string;
  activite: string;
  objectifs: string;
  resultatsAttendus: string;
  actionsRequises: string;
  indicateursResultats: string;
  sourcesVerification: string;
  responsables: string;
  periodes: {
    t1: boolean;
    t2: boolean;
    t3: boolean;
    t4: boolean;
  };
  // Données de suivi trimestriel
  suiviTrimestriel?: {
    t1?: { realise: boolean; taux: number; observations: string };
    t2?: { realise: boolean; taux: number; observations: string };
    t3?: { realise: boolean; taux: number; observations: string };
    t4?: { realise: boolean; taux: number; observations: string };
  };
}

export interface PtaTableSection {
  id: string;
  numero: number;
  titre: string;
  service: string;
  activites: PtaActivityItem[];
}

export interface PtaBudgetItem {
  id: string;
  poste: string;
  detail: string;
  coutUnitaire: string;
  quantite: string;
  totalCfa: number;
}

export interface PtaBudgetSection {
  id: string;
  lettre: 'A' | 'B' | 'C' | 'D' | 'E';
  titre: string;
  lignes: PtaBudgetItem[];
  sousTotalCfa: number;
}

export interface PtaPriorityActivity {
  id: string;
  numero: number;
  activite: string;
  responsable: string;
  periodes: {
    t1: boolean;
    t2: boolean;
    t3: boolean;
    t4: boolean;
  };
  cibleAnnuelle: string;
  cibleTrimestre: {
    t1?: string;
    t2?: string;
    t3?: string;
    t4?: string;
  };
}

export interface PtaRiskItem {
  id: string;
  risque: string;
  probabilite: 'Faible' | 'Moyenne' | 'Élevée';
  impact: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  attenuation: string;
}

export interface PtaKpiItem {
  id: string;
  indicateur: string;
  cible2026: string;
  suiviTrimestriel: string;
}

export interface OfficialPta2026Data {
  annee: number;
  titre: string;
  ministere: string;
  republique: string;
  devise: string;
  directionGenerale: string;
  directionDepartementale: string;
  signataireNom: string;
  signataireTitre: string;
  dateSignature: string;
  lieuSignature: string;

  // Note de présentation
  notePresentation: {
    contexteLecons2025: string[];
    partenaires2025: string[];
    orientationsStrategiques4Piliers: string[];
    ambitionRealismeResume: string;
    objectifGlobal: string;
    conditionsReussite: string[];
  };

  // Les 7 Tableaux d'activités ministériels
  tableauxActivites: PtaTableSection[];

  // Chronogramme récapitulatif des 13 activités prioritaires
  chronogrammePrioritaire: PtaPriorityActivity[];

  // Budget prévisionnel minimal (3 696 000 FCFA)
  budgetSections: PtaBudgetSection[];
  totalGeneralBudgetCfa: number;

  // Stratégie de mobilisation des ressources
  strategieMobilisation: {
    partenariatsFinanciersMateriels: { partenaire: string; apport: string }[];
    contributionsEntreprisesPointsFocaux: string[];
    appuiBudgetaireDGL: string[];
    contributionsMairiesArrondissement: string[];
  };

  // 4 Axes stratégiques
  axesStrategiques: {
    axe1: { titre: string; actions: string[] };
    axe2: { titre: string; actions: string[] };
    axe3: { titre: string; actions: string[] };
    axe4: { titre: string; actions: string[] };
  };

  // Coordination interne & externe
  coordination: {
    interne: string[];
    externe: string[];
  };

  // Gestion des risques
  gestionRisques: PtaRiskItem[];

  // KPIs
  kpisQuantitatifs: PtaKpiItem[];
  kpisQualitatifs: string[];

  // Recommandations prioritaires à la hiérarchie
  recommandationsHierarchie: {
    id: string;
    numero: number;
    titre: string;
    priorite: 'CRITIQUE' | 'HAUTE' | 'MOYENNE';
    points: string[];
    justification: string;
  }[];

  // Conclusion
  conclusion: {
    paragrapheIntro: string;
    actionsTotal: number;
    trimestres: number;
    budgetTotalTexte: string;
    transformation2026: string;
  };

  // Annexes
  annexes: {
    zonesIntervention: string[];
    partenairesConfirmes: { nom: string; type: string }[];
    partenairesPotentiels: string[];
    calendrierEvenements2026: { date: string; evenement: string }[];
    conventionPointsCles: string[];
  };
}

export const INITIAL_OFFICIAL_PTA_2026: OfficialPta2026Data = {
  annee: 2026,
  titre: 'PLAN DE TRAVAIL ANNUEL 2026',
  ministere: "MINISTÈRE DE L'INDUSTRIE CULTURELLE, TOURISTIQUE, ARTISTIQUE ET DES LOISIRS",
  republique: 'RÉPUBLIQUE DU CONGO',
  devise: 'Unité - Travail - Progrès',
  directionGenerale: 'DIRECTION GÉNÉRALE DES LOISIRS',
  directionDepartementale: 'DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE',
  signataireNom: 'Jean Richard NTSEKE NGOUAKA',
  signataireTitre: 'Le Directeur Départemental des Loisirs de Pointe-Noire',
  dateSignature: 'janvier 2026',
  lieuSignature: 'Pointe-Noire',

  notePresentation: {
    contexteLecons2025: [
      'Insuffisance de moyens de transport pour les missions de terrain',
      'Complexité administrative excessive freinant la régularisation des établissements',
    ],
    partenaires2025: [
      'Globaline (secteur privé)',
      'Institut Français de Pointe-Noire (coopération culturelle)',
      'Wing Wah (secteur privé)',
    ],
    orientationsStrategiques4Piliers: [
      'Consolidation des partenariats stratégiques pour compenser l’absence de budget propre',
      'Priorisation des missions de contrôle qualité des établissements de loisirs dans les 6 arrondissements et la communauté urbaine de Tchamba Nzassi',
      'Organisation d’activités d’animation inclusives ciblant les écoles, les personnes âgées, les orphelins et les personnes vulnérables',
      'Simplification administrative pour faciliter la régularisation des établissements',
    ],
    ambitionRealismeResume:
      'Ce plan compte sept (7) activités principales séquencées en 65 actions concrètes réparties sur 4 trimestres, avec un budget prévisionnel minimal de 3 696 000 FCFA.',
    objectifGlobal:
      '« Assurer au travers du développement du secteur des loisirs, le bien-être physique et moral des populations, la lutte contre la pauvreté, la diversification des produits touristiques, la promotion de l’identité culturelle et le rayonnement international de la République du Congo ».',
    conditionsReussite: [
      'La formalisation rapide des conventions de partenariat',
      'L’allocation d’un budget minimal pour les déplacements de terrain',
      'La simplification des procédures administratives par la hiérarchie',
      'L’engagement et la coordination de tous les acteurs impliqués',
    ],
  },

  tableauxActivites: [
    {
      id: 'tab-1-saf',
      numero: 1,
      titre: 'ACTIVITÉS DU SERVICE ADMINISTRATIF, FINANCIER ET MATÉRIEL (SAF)',
      service: 'SAF',
      activites: [
        {
          id: 'saf-act-1',
          activite: 'Gestion administrative courante',
          objectifs: 'Assurer le bon fonctionnement administratif de la DDL',
          resultatsAttendus: 'Les activités administratives sont gérées de manière efficace et continue',
          actionsRequises: 'Traitement quotidien du courrier ; Tenue des registres ; Classement et archivage ; Suivi des actes administratifs',
          indicateursResultats: 'Registres tenus à jour ; Courriers traités dans les délais ; Archives organisées',
          sourcesVerification: 'Registres disponibles ; Bordereaux de transmission ; Rapports mensuels',
          responsables: 'DDL, Chef SAF',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'saf-act-2',
          activite: 'Gestion des ressources humaines',
          objectifs: 'Optimiser la gestion du personnel et améliorer les conditions de travail',
          resultatsAttendus: 'Le personnel est géré efficacement et les conditions de travail sont améliorées',
          actionsRequises: 'Tenue du registre de présence ; Suivi des congés et absences ; Gestion des mouvements du personnel ; Plaidoyer pour le renforcement de l’équipe',
          indicateursResultats: 'Registre de présence à jour ; 5 agents supplémentaires sollicités ; Amélioration des espaces de travail',
          sourcesVerification: 'Registre de présence ; Correspondances ; Notes de service',
          responsables: 'DDL, Chef SAF',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'saf-act-3',
          activite: 'Gestion du budget et des finances',
          objectifs: 'Mobiliser et gérer les ressources financières de manière transparente',
          resultatsAttendus: 'Les ressources sont mobilisées et utilisées de manière optimale',
          actionsRequises: 'Élaboration du budget prévisionnel 2026 ; Suivi de l’exécution budgétaire ; Recherche de financements complémentaires ; Reporting financier trimestriel',
          indicateursResultats: '1 budget prévisionnel élaboré ; 4 rapports financiers produits ; Partenariats financiers formalisés',
          sourcesVerification: 'Budget disponible ; Rapports financiers ; Conventions signées',
          responsables: 'DDL, Chef SAF',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'saf-act-4',
          activite: 'Gestion logistique et matérielle',
          objectifs: 'Améliorer les moyens logistiques de la DDL',
          resultatsAttendus: 'Les moyens de déplacement et équipements sont disponibles',
          actionsRequises: 'Plaidoyer pour acquisition d’un véhicule ; Plaidoyer pour 2 motos ; Organisation des locations de bus pour missions ; Acquisition de tablettes pour collecte de données',
          indicateursResultats: '1 véhicule sollicité ; 2 motos sollicitées ; Locations de bus effectuées selon besoins ; 4 tablettes acquises',
          sourcesVerification: 'Correspondances ; Bordereaux de location ; Procès-verbaux de réception',
          responsables: 'DDL, Chef SAF, Partenaires',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
      ],
    },
    {
      id: 'tab-2-autorisation',
      numero: 2,
      titre: 'ACTIVITÉS DU SERVICE DE L’AUTORISATION',
      service: 'Service Autorisation',
      activites: [
        {
          id: 'aut-act-1',
          activite: 'Application des textes réglementaires',
          objectifs: 'Faire connaître et respecter la réglementation en matière de loisirs',
          resultatsAttendus: 'Les acteurs connaissent et appliquent la réglementation',
          actionsRequises: 'Vulgarisation des Notes N°151 et 152/MTL-CAB ; Organisation de séances d’information ; Distribution de documents explicatifs',
          indicateursResultats: '7 descentes de vulgarisation réalisées (1 par zone) ; 200 documents distribués',
          sourcesVerification: 'Rapports de descente ; Listes de présence ; Photos',
          responsables: 'Chef Service Autorisation, Agents',
          periodes: { t1: true, t2: true, t3: false, t4: false },
        },
        {
          id: 'aut-act-2',
          activite: 'Organisation des missions de contrôle qualité des établissements',
          objectifs: 'Vérifier la conformité réglementaire et la qualité des installations de loisirs',
          resultatsAttendus: 'Les établissements respectent les normes de sécurité et de qualité',
          actionsRequises: 'Élaboration des TDR ; Planification des missions par zone ; Réalisation de 2 missions par trimestre ; Production de rapports de contrôle ; Mise en demeure des établissements non conformes',
          indicateursResultats: '1 TDR élaboré ; 8 missions réalisées (2 par trimestre) ; 7 zones couvertes ; Rapports de contrôle produits ; PV de mise en demeure établis',
          sourcesVerification: 'TDR disponible ; Rapports de mission ; Fiches de contrôle ; PV de mise en demeure',
          responsables: 'DDL, Chef Service Autorisation, Agents de terrain',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'aut-act-3',
          activite: 'Plaidoyer pour la simplification administrative',
          objectifs: 'Faciliter l’accès à l’autorisation d’exploitation',
          resultatsAttendus: 'La procédure d’autorisation est simplifiée et accessible',
          actionsRequises: 'Analyse des blocages actuels ; Rédaction d’une note de proposition ; Transmission à la DGL et au Cabinet ; Suivi du dossier',
          indicateursResultats: '1 note de proposition rédigée ; Note transmise à la hiérarchie ; Réponse obtenue',
          sourcesVerification: 'Note de proposition ; Bordereau de transmission ; Réponse de la hiérarchie',
          responsables: 'DDL, Chef Service Autorisation',
          periodes: { t1: true, t2: false, t3: false, t4: false },
        },
        {
          id: 'aut-act-4',
          activite: 'Accompagnement des usagers',
          objectifs: 'Faciliter la constitution des dossiers d’autorisation',
          resultatsAttendus: 'Les usagers sont mieux accompagnés dans leurs démarches',
          actionsRequises: 'Mise en place d’un guichet d’information ; Élaboration d’un guide simplifié ; Permanence hebdomadaire pour assistance',
          indicateursResultats: '1 guichet opérationnel ; 1 guide élaboré et distribué ; Permanences assurées',
          sourcesVerification: 'Guide disponible ; Registre des consultations ; Dossiers constitués',
          responsables: 'Chef Service Autorisation',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
      ],
    },
    {
      id: 'tab-3-statistiques',
      numero: 3,
      titre: 'ACTIVITÉS DU SERVICE DES STATISTIQUES, DE L’INFORMATION ET DE LA DOCUMENTATION',
      service: 'Service Statistiques & Documentation',
      activites: [
        {
          id: 'stat-act-1',
          activite: 'Finalisation du recensement des acteurs de loisirs',
          objectifs: 'Disposer d’une base de données complète et actualisée',
          resultatsAttendus: 'Le recensement est finalisé et exploitable',
          actionsRequises: 'Finalisation de la collecte dans les zones restantes ; Saisie et traitement des données ; Validation de la base de données',
          indicateursResultats: '7 zones recensées ; Base de données créée ; 1 rapport de recensement produit',
          sourcesVerification: 'Fiches de recensement ; Base de données ; Rapport final',
          responsables: 'Chef Service Statistiques, Agents',
          periodes: { t1: true, t2: true, t3: false, t4: false },
        },
        {
          id: 'stat-act-2',
          activite: 'Élaboration de la cartographie des opérateurs',
          objectifs: 'Disposer d’une représentation visuelle des établissements de loisirs',
          resultatsAttendus: 'La cartographie est produite et diffusée',
          actionsRequises: 'Exploitation de la base de données ; Géolocalisation des établissements ; Production de la cartographie ; Diffusion aux partenaires',
          indicateursResultats: '1 cartographie produite ; Cartographie diffusée',
          sourcesVerification: 'Cartographie disponible ; Bordereaux de transmission',
          responsables: 'Chef Service Statistiques',
          periodes: { t1: false, t2: true, t3: false, t4: false },
        },
        {
          id: 'stat-act-3',
          activite: 'Enquête sur les besoins en loisirs de la population',
          objectifs: 'Identifier les attentes et besoins de la population',
          resultatsAttendus: 'L’enquête est réalisée et analysée',
          actionsRequises: 'Finalisation du questionnaire ; Formation des enquêteurs ; Réalisation de l’enquête dans les 7 zones ; Traitement et analyse des données ; Production du rapport d’enquête',
          indicateursResultats: '1 questionnaire finalisé ; 4 enquêteurs formés ; 7 zones enquêtées ; 1 rapport d’enquête produit',
          sourcesVerification: 'Questionnaire ; Fiches d’enquête ; Rapport d’enquête',
          responsables: 'DDL, Chef Service Statistiques',
          periodes: { t1: true, t2: true, t3: true, t4: false },
        },
        {
          id: 'stat-act-4',
          activite: 'Production et diffusion de l’information',
          objectifs: 'Améliorer la communication institutionnelle',
          resultatsAttendus: 'L’information sur les loisirs est diffusée régulièrement',
          actionsRequises: 'Élaboration de supports de communication ; Diffusion via réseaux sociaux ; Production d’un bulletin trimestriel',
          indicateursResultats: '4 bulletins produits ; Publications régulières sur réseaux sociaux',
          sourcesVerification: 'Bulletins disponibles ; Publications en ligne',
          responsables: 'Chef Service Statistiques, Community Manager',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
      ],
    },
    {
      id: 'tab-4-promotion',
      numero: 4,
      titre: 'ACTIVITÉS DU SERVICE DE LA PROMOTION ET ANIMATION',
      service: 'Service Promotion & Animation',
      activites: [
        {
          id: 'prom-act-1',
          activite: 'Organisation d’activités de loisirs avec les écoles',
          objectifs: 'Promouvoir les loisirs sains auprès des élèves',
          resultatsAttendus: 'Des activités sont organisées dans les établissements scolaires',
          actionsRequises: 'Identification et prise de contact avec 10 écoles ; Élaboration d’un programme d’activités ; Organisation de concours de scrabble ; Organisation de matchs inter-classes ; Organisation de séances de sensibilisation',
          indicateursResultats: '10 écoles contactées ; 1 programme élaboré ; 4 concours de scrabble réalisés ; 4 matchs inter-classes organisés ; 6 séances de sensibilisation',
          sourcesVerification: 'Courriers de prise de contact ; Programme d’activités ; Rapports d’activités ; Photos ; Listes de présence',
          responsables: 'Chef Service Promotion, Partenaires (Globaline, Institut Français)',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'prom-act-2',
          activite: 'Organisation d’activités pour personnes âgées',
          objectifs: 'Favoriser le bien-être et l’inclusion sociale des seniors',
          resultatsAttendus: 'Des activités adaptées sont proposées aux personnes âgées',
          actionsRequises: 'Identification d’associations ou groupes de seniors ; Organisation de randonnées pédestres mensuelles ; Organisation de séances de jeux de société ; Organisation d’ateliers culturels',
          indicateursResultats: '2 associations identifiées ; 8 randonnées organisées ; 4 séances de jeux organisées',
          sourcesVerification: 'Répertoire des associations ; Calendrier des activités ; Rapports d’activités ; Photos',
          responsables: 'Chef Service Promotion, Partenaires',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'prom-act-3',
          activite: 'Programme d’initiation au scrabble pour orphelins',
          objectifs: 'Offrir des activités ludiques et éducatives aux enfants vulnérables',
          resultatsAttendus: 'Le programme est mis en œuvre et bénéficie à au moins 30 orphelins',
          actionsRequises: 'Identification de structures d’accueil ; Acquisition de matériel (tabliers, jetons) ; Recrutement d’un formateur ; Organisation de séances hebdomadaires',
          indicateursResultats: '2 structures identifiées ; Matériel acquis ; 1 formateur recruté ; 30 enfants bénéficiaires ; 20 séances réalisées',
          sourcesVerification: 'Conventions avec structures ; Factures d’achat ; Contrat formateur ; Feuilles de présence ; Rapports mensuels',
          responsables: 'Chef Service Promotion, Partenaires (Wing Wah, Institut Français)',
          periodes: { t1: false, t2: true, t3: true, t4: true },
        },
        {
          id: 'prom-act-4',
          activite: 'Randonnées avec les clubs de marcheurs',
          objectifs: 'Promouvoir l’activité physique et la découverte du territoire',
          resultatsAttendus: 'Des randonnées sont organisées régulièrement',
          actionsRequises: 'Identification des clubs de marcheurs ; Élaboration d’un calendrier de randonnées ; Organisation de 2 randonnées par trimestre',
          indicateursResultats: '3 clubs identifiés ; 1 calendrier élaboré ; 8 randonnées organisées',
          sourcesVerification: 'Répertoire des clubs ; Calendrier ; Rapports de randonnées ; Photos',
          responsables: 'Chef Service Promotion',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
      ],
    },
    {
      id: 'tab-5-partenariats',
      numero: 5,
      titre: 'FORMALISATION ET DÉVELOPPEMENT DES PARTENARIATS STRATÉGIQUES',
      service: 'Direction & Services',
      activites: [
        {
          id: 'part-act-1',
          activite: 'Formalisation des partenariats avec Globaline, Institut Français et Wing Wah',
          objectifs: 'Sécuriser les engagements et définir les modalités de collaboration',
          resultatsAttendus: 'Des conventions de partenariat sont signées',
          actionsRequises: 'Élaboration de projets de conventions ; Négociation des termes ; Signature des conventions ; Organisation d’une cérémonie de lancement',
          indicateursResultats: '3 conventions signées ; 1 cérémonie organisée',
          sourcesVerification: 'Conventions signées ; Procès-verbal de cérémonie ; Photos',
          responsables: 'DDL, Partenaires',
          periodes: { t1: true, t2: true, t3: false, t4: false },
        },
        {
          id: 'part-act-2',
          activite: 'Développement de nouveaux partenariats',
          objectifs: 'Élargir le réseau de partenaires et mobiliser plus de ressources',
          resultatsAttendus: 'De nouveaux partenaires sont identifiés et sollicités',
          actionsRequises: 'Identification de 5 partenaires potentiels ; Élaboration et transmission de courriers ; Suivi des sollicitations ; Négociation des termes',
          indicateursResultats: '5 partenaires identifiés ; 5 courriers transmis ; 2 nouveaux partenaires engagés',
          sourcesVerification: 'Répertoire des partenaires ; Courriers ; Accords ou conventions',
          responsables: 'DDL, Chefs de services',
          periodes: { t1: true, t2: true, t3: true, t4: false },
        },
        {
          id: 'part-act-3',
          activite: 'Création et opérationnalisation des points focaux en entreprise',
          objectifs: 'Renforcer la collaboration avec le secteur privé pour promouvoir les loisirs sains',
          resultatsAttendus: 'Les points focaux sont créés, formés et actifs',
          actionsRequises: 'Relance des 6 entreprises identifiées en 2025 ; Identification de 4 nouvelles entreprises ; Création de 10 points focaux ; Formation des points focaux ; Suivi trimestriel des activités',
          indicateursResultats: '10 entreprises engagées ; 10 points focaux créés ; 10 points focaux formés ; 4 rapports de suivi produits',
          sourcesVerification: 'Répertoire des entreprises ; Conventions signées ; Attestations de formation ; Rapports de suivi',
          responsables: 'DDL, Chef Service Promotion, Entreprises',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
      ],
    },
    {
      id: 'tab-6-institutionnel',
      numero: 6,
      titre: 'ACTIVITÉS INSTITUTIONNELLES ET REPRÉSENTATION',
      service: 'Direction & Personnel',
      activites: [
        {
          id: 'inst-act-1',
          activite: 'Participation aux cérémonies officielles',
          objectifs: 'Assurer la représentation institutionnelle de la DDL',
          resultatsAttendus: 'La DDL est présente aux événements majeurs du département',
          actionsRequises: 'Identification du calendrier officiel ; Participation aux cérémonies ; Production de comptes-rendus',
          indicateursResultats: 'Présence à toutes les cérémonies majeures ; Comptes-rendus produits',
          sourcesVerification: 'Calendrier des événements ; Comptes-rendus ; Photos',
          responsables: 'DDL, Personnel',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'inst-act-2',
          activite: 'Coordination avec les services techniques départementaux',
          objectifs: 'Renforcer la collaboration interservices',
          resultatsAttendus: 'Des mécanismes de coordination sont établis',
          actionsRequises: 'Organisation de réunions trimestrielles ; Échanges d’informations ; Élaboration de rapports conjoints',
          indicateursResultats: '4 réunions organisées ; Rapports conjoints produits',
          sourcesVerification: 'PV de réunions ; Rapports disponibles',
          responsables: 'DDL, Services techniques',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
      ],
    },
    {
      id: 'tab-7-suivi',
      numero: 7,
      titre: 'SUIVI-ÉVALUATION ET REPORTING',
      service: 'Direction & Chefs de Services',
      activites: [
        {
          id: 'suiv-act-1',
          activite: 'Élaboration des rapports trimestriels',
          objectifs: 'Assurer un suivi régulier de l’exécution du PTA',
          resultatsAttendus: 'Les rapports trimestriels sont produits et transmis',
          actionsRequises: 'Collecte des données d’activités ; Rédaction des rapports ; Transmission à la DGL',
          indicateursResultats: '4 rapports trimestriels produits ; Rapports transmis dans les délais',
          sourcesVerification: 'Rapports disponibles ; Bordereaux de transmission',
          responsables: 'DDL, Chefs de services',
          periodes: { t1: true, t2: true, t3: true, t4: true },
        },
        {
          id: 'suiv-act-2',
          activite: 'Évaluation à mi-parcours',
          objectifs: 'Évaluer l’état d’avancement et ajuster la stratégie si nécessaire',
          resultatsAttendus: 'Une évaluation est réalisée et des ajustements proposés',
          actionsRequises: 'Organisation d’un atelier d’évaluation ; Analyse des écarts ; Proposition d’ajustements ; Validation des ajustements',
          indicateursResultats: '1 atelier organisé ; 1 rapport d’évaluation produit ; Ajustements validés',
          sourcesVerification: 'Rapport d’évaluation ; PV d’atelier ; Note d’ajustement',
          responsables: 'DDL, Chefs de services',
          periodes: { t1: false, t2: true, t3: false, t4: false },
        },
        {
          id: 'suiv-act-3',
          activite: 'Élaboration du rapport annuel 2026',
          objectifs: 'Dresser le bilan consolidé de l’année',
          resultatsAttendus: 'Le rapport annuel est produit et transmis',
          actionsRequises: 'Consolidation des données annuelles ; Rédaction du rapport ; Transmission à la DGL et au Cabinet',
          indicateursResultats: '1 rapport annuel produit ; Rapport transmis',
          sourcesVerification: 'Rapport disponible ; Bordereau de transmission',
          responsables: 'DDL, Chefs de services',
          periodes: { t1: false, t2: false, t3: false, t4: true },
        },
      ],
    },
  ],

  chronogrammePrioritaire: [
    {
      id: 'prio-1',
      numero: 1,
      activite: 'Formalisation des conventions avec les 3 partenaires stratégiques',
      responsable: 'DDL',
      periodes: { t1: true, t2: true, t3: false, t4: false },
      cibleAnnuelle: '3 conventions signées',
      cibleTrimestre: { t1: '2 conventions', t2: '1 convention' },
    },
    {
      id: 'prio-2',
      numero: 2,
      activite: 'Missions de contrôle qualité (2 par trimestre)',
      responsable: 'Chef Service Autorisation',
      periodes: { t1: true, t2: true, t3: true, t4: true },
      cibleAnnuelle: '8 missions de contrôle (7 zones)',
      cibleTrimestre: { t1: '2 missions', t2: '2 missions', t3: '2 missions', t4: '2 missions' },
    },
    {
      id: 'prio-3',
      numero: 3,
      activite: 'Finalisation du recensement et création de la base de données',
      responsable: 'Chef Service Statistiques',
      periodes: { t1: true, t2: true, t3: false, t4: false },
      cibleAnnuelle: '100% des 7 zones recensées',
      cibleTrimestre: { t1: '50% zones', t2: '100% base validée' },
    },
    {
      id: 'prio-4',
      numero: 4,
      activite: 'Réalisation de l’enquête sur les besoins en loisirs',
      responsable: 'Chef Service Statistiques',
      periodes: { t1: true, t2: true, t3: true, t4: false },
      cibleAnnuelle: '1 rapport d’enquête (7 zones)',
      cibleTrimestre: { t1: 'Questionnaire finalisé', t2: 'Enquête terrain', t3: 'Rapport produit' },
    },
    {
      id: 'prio-5',
      numero: 5,
      activite: 'Organisation d’activités avec les écoles (concours, matchs)',
      responsable: 'Chef Service Promotion',
      periodes: { t1: true, t2: true, t3: true, t4: true },
      cibleAnnuelle: '8 activités (4 concours + 4 matchs)',
      cibleTrimestre: { t1: '2 activités', t2: '2 activités', t3: '2 activités', t4: '2 activités' },
    },
    {
      id: 'prio-6',
      numero: 6,
      activite: 'Programme d’initiation au scrabble pour orphelins',
      responsable: 'Chef Service Promotion',
      periodes: { t1: false, t2: true, t3: true, t4: true },
      cibleAnnuelle: '30 orphelins formés (20 séances)',
      cibleTrimestre: { t2: 'Lancement & matériel', t3: '10 séances', t4: '10 séances & bilan' },
    },
    {
      id: 'prio-7',
      numero: 7,
      activite: 'Randonnées avec seniors et clubs de marcheurs',
      responsable: 'Chef Service Promotion',
      periodes: { t1: true, t2: true, t3: true, t4: true },
      cibleAnnuelle: '8 randonnées (2 par trimestre)',
      cibleTrimestre: { t1: '2 randonnées', t2: '2 randonnées', t3: '2 randonnées', t4: '2 randonnées' },
    },
    {
      id: 'prio-8',
      numero: 8,
      activite: 'Création et formation de 10 points focaux en entreprise',
      responsable: 'DDL',
      periodes: { t1: true, t2: true, t3: true, t4: true },
      cibleAnnuelle: '10 points focaux actifs',
      cibleTrimestre: { t1: '3 points focaux', t2: '3 points focaux', t3: '2 points focaux', t4: '2 points focaux' },
    },
    {
      id: 'prio-9',
      numero: 9,
      activite: 'Plaidoyer pour la simplification administrative',
      responsable: 'DDL',
      periodes: { t1: true, t2: false, t3: false, t4: false },
      cibleAnnuelle: '1 note de proposition transmise',
      cibleTrimestre: { t1: 'Note rédigée et transmise' },
    },
    {
      id: 'prio-10',
      numero: 10,
      activite: 'Plaidoyer pour moyens logistiques (véhicule, motos)',
      responsable: 'DDL',
      periodes: { t1: true, t2: false, t3: false, t4: false },
      cibleAnnuelle: '1 véhicule + 2 motos sollicités',
      cibleTrimestre: { t1: 'Dossier logistique déposé' },
    },
    {
      id: 'prio-11',
      numero: 11,
      activite: 'Production de la cartographie des opérateurs',
      responsable: 'Chef Service Statistiques',
      periodes: { t1: false, t2: true, t3: false, t4: false },
      cibleAnnuelle: '1 cartographie SIG diffusée',
      cibleTrimestre: { t2: 'Cartographie éditée' },
    },
    {
      id: 'prio-12',
      numero: 12,
      activite: 'Évaluation à mi-parcours',
      responsable: 'DDL',
      periodes: { t1: false, t2: true, t3: false, t4: false },
      cibleAnnuelle: '1 atelier & rapport d’évaluation',
      cibleTrimestre: { t2: 'Atelier de mi-parcours' },
    },
    {
      id: 'prio-13',
      numero: 13,
      activite: 'Élaboration du rapport annuel 2026',
      responsable: 'DDL',
      periodes: { t1: false, t2: false, t3: false, t4: true },
      cibleAnnuelle: '1 rapport annuel consolidé',
      cibleTrimestre: { t4: 'Rapport annuel finalisé' },
    },
  ],

  budgetSections: [
    {
      id: 'bud-sec-a',
      lettre: 'A',
      titre: 'MISSIONS DE TERRAIN ET DÉPLACEMENTS',
      lignes: [
        {
          id: 'b-a-1',
          poste: 'Location de bus pour missions de contrôle',
          detail: '4h par mission × 8 missions',
          coutUnitaire: '4 500 FCFA/h',
          quantite: '32 heures',
          totalCfa: 144000,
        },
        {
          id: 'b-a-2',
          poste: 'Location de bus pour recensement',
          detail: '4h par descente × 7 zones',
          coutUnitaire: '4 500 FCFA/h',
          quantite: '28 heures',
          totalCfa: 126000,
        },
        {
          id: 'b-a-3',
          poste: 'Location de bus pour enquête besoins',
          detail: '4h par zone × 7 zones',
          coutUnitaire: '4 500 FCFA/h',
          quantite: '28 heures',
          totalCfa: 126000,
        },
        {
          id: 'b-a-4',
          poste: 'Frais de carburant et déplacements à pied',
          detail: 'Forfait mensuel',
          coutUnitaire: '25 000 FCFA',
          quantite: '12 mois',
          totalCfa: 300000,
        },
      ],
      sousTotalCfa: 696000,
    },
    {
      id: 'bud-sec-b',
      lettre: 'B',
      titre: 'ACTIVITÉS D’ANIMATION ET PROMOTION',
      lignes: [
        {
          id: 'b-b-1',
          poste: 'Concours de scrabble dans les écoles',
          detail: '4 concours',
          coutUnitaire: '50 000 FCFA',
          quantite: '4',
          totalCfa: 200000,
        },
        {
          id: 'b-b-2',
          poste: 'Matchs inter-classes',
          detail: '4 matchs',
          coutUnitaire: '75 000 FCFA',
          quantite: '4',
          totalCfa: 300000,
        },
        {
          id: 'b-b-3',
          poste: 'Programme scrabble pour orphelins',
          detail: 'Matériel + formateur',
          coutUnitaire: '500 000 FCFA',
          quantite: 'Forfait',
          totalCfa: 500000,
        },
        {
          id: 'b-b-4',
          poste: 'Randonnées seniors et clubs marcheurs',
          detail: '8 randonnées',
          coutUnitaire: '30 000 FCFA',
          quantite: '8',
          totalCfa: 240000,
        },
        {
          id: 'b-b-5',
          poste: 'Séances de jeux pour personnes âgées',
          detail: '4 séances',
          coutUnitaire: '40 000 FCFA',
          quantite: '4',
          totalCfa: 160000,
        },
      ],
      sousTotalCfa: 1400000,
    },
    {
      id: 'bud-sec-c',
      lettre: 'C',
      titre: 'ÉQUIPEMENTS ET MATÉRIEL',
      lignes: [
        {
          id: 'b-c-1',
          poste: 'Tablettes pour collecte de données',
          detail: 'Android',
          coutUnitaire: '100 000 FCFA',
          quantite: '4',
          totalCfa: 400000,
        },
        {
          id: 'b-c-2',
          poste: 'Matériel de communication (dépliants, affiches)',
          detail: 'Forfait',
          coutUnitaire: '150 000 FCFA',
          quantite: 'Forfait',
          totalCfa: 150000,
        },
        {
          id: 'b-c-3',
          poste: 'Fournitures de bureau',
          detail: 'Forfait mensuel',
          coutUnitaire: '25 000 FCFA',
          quantite: '12 mois',
          totalCfa: 300000,
        },
      ],
      sousTotalCfa: 850000,
    },
    {
      id: 'bud-sec-d',
      lettre: 'D',
      titre: 'FORMATION ET RENFORCEMENT DE CAPACITÉS',
      lignes: [
        {
          id: 'b-d-1',
          poste: 'Formation des points focaux en entreprise',
          detail: '10 points focaux',
          coutUnitaire: '30 000 FCFA',
          quantite: '10',
          totalCfa: 300000,
        },
        {
          id: 'b-d-2',
          poste: 'Formation des enquêteurs',
          detail: '4 enquêteurs',
          coutUnitaire: '25 000 FCFA',
          quantite: '4',
          totalCfa: 100000,
        },
      ],
      sousTotalCfa: 400000,
    },
    {
      id: 'bud-sec-e',
      lettre: 'E',
      titre: 'ÉVÉNEMENTS ET CÉRÉMONIES',
      lignes: [
        {
          id: 'b-e-1',
          poste: 'Cérémonie de lancement des partenariats',
          detail: 'Événement officiel',
          coutUnitaire: '200 000 FCFA',
          quantite: '1',
          totalCfa: 200000,
        },
        {
          id: 'b-e-2',
          poste: 'Atelier d’évaluation à mi-parcours',
          detail: 'Atelier institutionnel',
          coutUnitaire: '150 000 FCFA',
          quantite: '1',
          totalCfa: 150000,
        },
      ],
      sousTotalCfa: 350000,
    },
  ],
  totalGeneralBudgetCfa: 3696000,

  strategieMobilisation: {
    partenariatsFinanciersMateriels: [
      { partenaire: 'Globaline', apport: 'Financement des concours scolaires et fourniture de lots' },
      { partenaire: 'Institut Français de Pointe-Noire', apport: 'Mise à disposition d’espaces et d’animateurs pour activités culturelles' },
      { partenaire: 'Wing Wah', apport: 'Soutien au programme scrabble pour orphelins' },
    ],
    contributionsEntreprisesPointsFocaux: [
      'Participation financière forfaitaire par entreprise',
      'Mise à disposition de ressources humaines ou logistiques',
    ],
    appuiBudgetaireDGL: [
      'Sollicitation d’une enveloppe minimale pour les missions prioritaires',
      'Demande d’inscription au budget 2026 du Ministère',
    ],
    contributionsMairiesArrondissement: [
      'Co-financement des activités organisées dans leurs zones',
      'Mise à disposition d’espaces publics',
    ],
  },

  axesStrategiques: {
    axe1: {
      titre: 'AXE 1 : RÉGULATION ET CONTRÔLE',
      actions: [
        'Finaliser le recensement des établissements de loisirs',
        'Réaliser 8 missions de contrôle qualité dans les 7 zones',
        'Simplifier les procédures administratives',
      ],
    },
    axe2: {
      titre: 'AXE 2 : PARTENARIATS ET MOBILISATION DE RESSOURCES',
      actions: [
        'Formaliser les 3 partenariats stratégiques (Globaline, IF, Wing Wah)',
        'Créer 10 points focaux en entreprise',
        'Développer 2 nouveaux partenariats',
      ],
    },
    axe3: {
      titre: 'AXE 3 : ANIMATION ET INCLUSION SOCIALE',
      actions: [
        'Organiser des activités dans 10 écoles',
        'Lancer le programme scrabble pour orphelins',
        'Organiser des activités pour personnes âgées',
      ],
    },
    axe4: {
      titre: 'AXE 4 : INFORMATION ET COMMUNICATION',
      actions: [
        'Produire la cartographie des opérateurs',
        'Réaliser l’enquête sur les besoins en loisirs',
        'Développer la communication institutionnelle',
      ],
    },
  },

  coordination: {
    interne: [
      'Réunion hebdomadaire de coordination DDL / Chefs de services',
      'Point mensuel sur l’état d’avancement du PTA',
      'Reporting trimestriel à la Direction Générale des Loisirs',
    ],
    externe: [
      'Comité de suivi des partenariats (réunion trimestrielle)',
      'Liaison régulière avec les mairies d’arrondissement',
      'Collaboration avec la Direction Départementale de la Sécurité Civile',
    ],
  },

  gestionRisques: [
    {
      id: 'risk-1',
      risque: 'Absence de financement',
      probabilite: 'Élevée',
      impact: 'Critique',
      attenuation: 'Prioriser les activités sans coût, mobiliser les partenaires, échelonner les activités',
    },
    {
      id: 'risk-2',
      risque: 'Défaillance des partenaires',
      probabilite: 'Moyenne',
      impact: 'Élevé',
      attenuation: 'Diversifier les partenaires, formaliser les engagements par conventions',
    },
    {
      id: 'risk-3',
      risque: 'Insuffisance de moyens de transport',
      probabilite: 'Élevée',
      impact: 'Élevé',
      attenuation: 'Planifier les missions groupées, utiliser les transports en commun, solliciter l’appui logistique',
    },
    {
      id: 'risk-4',
      risque: 'Manque de personnel',
      probabilite: 'Moyenne',
      impact: 'Moyen',
      attenuation: 'Former le personnel existant, solliciter des stagiaires, mobiliser des volontaires',
    },
    {
      id: 'risk-5',
      risque: 'Non-simplification administrative',
      probabilite: 'Moyenne',
      impact: 'Élevé',
      attenuation: 'Intensifier le plaidoyer, proposer des alternatives pratiques',
    },
  ],

  kpisQuantitatifs: [
    {
      id: 'kpi-1',
      indicateur: 'Nombre de missions de contrôle qualité réalisées',
      cible2026: '8 missions',
      suiviTrimestriel: 'T1: 2, T2: 2, T3: 2, T4: 2',
    },
    {
      id: 'kpi-2',
      indicateur: 'Nombre d’établissements recensés',
      cible2026: '100% des 7 zones',
      suiviTrimestriel: 'T1-T2: 100%',
    },
    {
      id: 'kpi-3',
      indicateur: 'Nombre de conventions de partenariat signées',
      cible2026: '5 conventions',
      suiviTrimestriel: 'T1-T2: 3, T3: 2',
    },
    {
      id: 'kpi-4',
      indicateur: 'Nombre de points focaux créés et formés',
      cible2026: '10 points focaux',
      suiviTrimestriel: 'T1: 3, T2: 3, T3: 2, T4: 2',
    },
    {
      id: 'kpi-5',
      indicateur: 'Nombre d’activités scolaires organisées',
      cible2026: '8 (4 concours + 4 matchs)',
      suiviTrimestriel: '2 par trimestre',
    },
    {
      id: 'kpi-6',
      indicateur: 'Nombre d’orphelins bénéficiaires du programme scrabble',
      cible2026: '30 orphelins',
      suiviTrimestriel: 'T2-T4',
    },
    {
      id: 'kpi-7',
      indicateur: 'Nombre de randonnées organisées',
      cible2026: '8 randonnées',
      suiviTrimestriel: '2 par trimestre',
    },
    {
      id: 'kpi-8',
      indicateur: 'Nombre de rapports trimestriels produits',
      cible2026: '4 rapports',
      suiviTrimestriel: '1 par trimestre',
    },
  ],

  kpisQualitatifs: [
    'Niveau de satisfaction des partenaires (enquête semestrielle)',
    'Taux de régularisation des établissements de loisirs',
    'Qualité des installations contrôlées (conformité aux normes)',
    'Pertinence des données statistiques collectées',
    'Visibilité et notoriété de la DDL (présence médiatique, réseaux sociaux)',
  ],

  recommandationsHierarchie: [
    {
      id: 'rec-1',
      numero: 1,
      titre: 'ALLOCATION BUDGÉTAIRE MINIMALE',
      priorite: 'CRITIQUE',
      points: [
        'Allouer une enveloppe budgétaire minimale de 3 696 000 FCFA',
        'Les missions de contrôle qualité (696 000 FCFA)',
        'Les activités d’animation sociale (1 400 000 FCFA)',
        'Les équipements de base (850 000 FCFA)',
      ],
      justification:
        'Sans ce budget minimal, la DDL ne pourra pas remplir ses missions de régulation, de contrôle et de promotion des loisirs sains.',
    },
    {
      id: 'rec-2',
      numero: 2,
      titre: 'ACQUISITION DE MOYENS LOGISTIQUES',
      priorite: 'CRITIQUE',
      points: [
        'Acquérir 1 véhicule de service pour les missions de terrain',
        'Acquérir 2 motos pour les déplacements rapides dans les arrondissements',
      ],
      justification:
        'L’absence de moyens de transport propres limite considérablement la capacité d’intervention de la DDL et génère des coûts de location récurrents.',
    },
    {
      id: 'rec-3',
      numero: 3,
      titre: 'SIMPLIFICATION DES PROCÉDURES ADMINISTRATIVES',
      priorite: 'HAUTE',
      points: [
        'Réviser la liste des pièces exigées pour l’autorisation d’exploitation',
        'Réduire le nombre de documents requis',
        'Faciliter l’accès à la régularisation et améliorer le taux de conformité',
      ],
      justification:
        'La complexité actuelle décourage les opérateurs et limite l’efficacité du service d’autorisation.',
    },
    {
      id: 'rec-4',
      numero: 4,
      titre: 'RENFORCEMENT DES RESSOURCES HUMAINES',
      priorite: 'HAUTE',
      points: [
        'Affecter 5 agents fonctionnaires supplémentaires à la DDL',
        '2 agents pour le service de l’Autorisation',
        '2 agents pour le service des Statistiques',
        '1 agent pour le service de la Promotion',
      ],
      justification:
        'L’effectif actuel est insuffisant pour couvrir les 7 zones du département et assurer un suivi régulier des activités.',
    },
    {
      id: 'rec-5',
      numero: 5,
      titre: 'VALIDATION DES CONVENTIONS DE PARTENARIAT',
      priorite: 'MOYENNE',
      points: [
        'Faciliter la signature rapide des conventions de partenariat avec Globaline, l’Institut Français et Wing Wah',
        'Sécuriser les engagements et débloquer les ressources complémentaires',
      ],
      justification:
        'Les conventions constituent le levier d’exécution principal face à l’absence de budget autonome.',
    },
  ],

  conclusion: {
    paragrapheIntro:
      'Le Plan de Travail Annuel 2026 de la Direction Départementale des Loisirs de Pointe-Noire marque un tournant stratégique. Face à la persistance des contraintes budgétaires et logistiques, ce plan adopte une approche réaliste et pragmatique.',
    actionsTotal: 65,
    trimestres: 4,
    budgetTotalTexte: '3 696 000 FCFA',
    transformation2026:
      'L’année 2026 doit être celle de la transformation de la DDL : passer d’une structure en survie institutionnelle à une direction opérationnelle, crédible et efficace, capable de jouer pleinement son rôle dans le développement durable et responsable du secteur des loisirs à Pointe-Noire.',
  },

  annexes: {
    zonesIntervention: [
      'Arrondissement 1 - Lumumba',
      'Arrondissement 2 - Mvou-Mvou',
      'Arrondissement 3 - Tié-Tié',
      'Arrondissement 4 - Loandjili',
      'Arrondissement 5 - Mongo-Mpoukou',
      'Arrondissement 6 - Ngoyo',
      'Communauté Urbaine de Tchamba Nzassi',
    ],
    partenairesConfirmes: [
      { nom: 'Globaline', type: 'Secteur privé' },
      { nom: 'Institut Français de Pointe-Noire', type: 'Coopération culturelle' },
      { nom: 'Wing Wah', type: 'Secteur privé' },
    ],
    partenairesPotentiels: [
      'Mairies des 6 arrondissements',
      'Direction Départementale de la Sécurité Civile',
      'Entreprises de plus de 50 employés',
      'Associations de jeunesse et d’éducation populaire',
      'Structures d’accueil pour orphelins et personnes vulnérables',
    ],
    calendrierEvenements2026: [
      { date: '1er mai 2026', evenement: 'Fête du Travail' },
      { date: '15 août 2026', evenement: 'Anniversaire de l’Indépendance' },
      { date: '27 septembre 2026', evenement: 'Journée Mondiale du Tourisme' },
      { date: '28 novembre 2026', evenement: 'Proclamation de la République' },
      { date: '1er décembre 2026', evenement: 'Journée Mondiale de Lutte contre le VIH/SIDA' },
    ],
    conventionPointsCles: [
      'Objet et durée de la convention',
      'Engagements réciproques des parties',
      'Modalités de mise en œuvre',
      'Suivi et évaluation',
      'Modalités de résiliation',
    ],
  },
};
