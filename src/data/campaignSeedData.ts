import { CampaignBatch, CampaignMessage } from '../types';

export interface CampaignTemplate {
  id: string;
  titre: string;
  typeCampagne: 'voeux_decembre_2026' | 'recouvrement_janvier_2027_zero' | 'rappel_echeance_janvier_2027_solde' | 'personnalise';
  cibleDefaut: 'all' | 'zero_entree' | 'en_cours_acompte' | 'solde_en_regle';
  periode: 'decembre_2026' | 'janvier_2027' | 'courant';
  objet: string;
  corpsTexte: string;
  canalRecommande: 'whatsapp' | 'sms' | 'email' | 'courrier_a4';
  description: string;
}

export const OFFICIAL_CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'tmpl-voeux-dec-2026',
    titre: 'Meilleurs Vœux Décembre 2026 & Prélude Exercice 2027',
    typeCampagne: 'voeux_decembre_2026',
    cibleDefaut: 'all',
    periode: 'decembre_2026',
    objet: 'Vœux de Fin d’Année 2026 & Préparation de l’Exercice 2027 • DDL-Pointe-Noire',
    corpsTexte:
`🏛️ RÉPUBLIQUE DU CONGO • DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE

Cher(e) Promoteur {NOM_PROMOTEUR} ({NOM_ETABLISSEMENT} - {ARRONDISSEMENT}),

À l'approche des festivités de fin d'année 2026, le Directeur Départemental des Loisirs de Pointe-Noire, M. NTSEKE NGOUAKA Jean Richard, ainsi que l'ensemble des cadres de la Direction, vous adressent leurs vœux les plus chaleureux de santé, de prospérité et de plein succès pour votre établissement.

Nous saluons votre contribution au rayonnement récréatif de notre ville océane. Nous vous rappelons avec bienveillance que les formalités d'ouverture et de renouvellement de l'Autorisation d'Exploitation Départementale pour le nouvel exercice 2027 débuteront dès le 02 Janvier 2027 (Loi N° 21-2019).

Nos équipes de la Brigade SAA et de la Régie SAF restent à votre entière disposition au Bâtiment de la Préfecture, sis au Centre-Ville, en face du Trésor Public, au rez-de-chaussée (Tél: +242 06 186 4275 • Email: ddloisirs_pnr@loisirs.cg).

Bonne et heureuse fête de fin d'année 2026 !
— NTSEKE NGOUAKA Jean Richard, Directeur Départemental des Loisirs de Pointe-Noire`,
    canalRecommande: 'whatsapp',
    description: 'Campagne institutionnelle bienveillante de fin d’année adressée à tous les exploitants récréatifs recensés pour fidéliser et préparer la rentrée fiscale 2027.',
  },
  {
    id: 'tmpl-recouvrement-jan-2027-zero',
    titre: 'Avis de Recouvrement Impérieux Janvier 2027 (Établissements 0 Entrée)',
    typeCampagne: 'recouvrement_janvier_2027_zero',
    cibleDefaut: 'zero_entree',
    periode: 'janvier_2027',
    objet: 'AVIS DE RECOUVREMENT RÉGALIEN & SOMMATION DE RÉGULARISATION 2027 • DDL-PN',
    corpsTexte:
`⚠️ DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE • SERVICE RÉGIE SAF & SAA
AVIS OFFICIEL DE RECOUVREMENT • EXERCICE 2027 (Loi N° 21-2019 / Note 151)

Destinataire : {NOM_PROMOTEUR} — Exploitant de « {NOM_ETABLISSEMENT} » ({ARRONDISSEMENT}, Dossier {CODE_DOSSIER})

Monsieur / Madame l'Exploitant,

Les états financiers de la Régie des Recettes SAF constatent à ce jour un solde de ZÉRO ENTRÉE (0 FCFA versé) au titre des redevances d'exploitation prévues par la Loi républicaine. Votre dette cumulée s'élève à {RESTE_A_PAYER} FCFA.

En ce début d'exercice budgétaire 2027, vous êtes formellement mis en demeure de vous présenter sans délai sous huitaine (8 jours ouvrés) au Guichet Unique de la Régie SAF (Bâtiment de la Préfecture, sis au Centre-Ville, en face du Trésor Public, au rez-de-chaussée) ou de procéder au télépaiement officiel sécurisé (Airtel Money / MTN MoMo).

À défaut de paiement ou de protocole d'apurement validé, la Direction Départementale engagera les mesures de police administrative prévues par les textes (fermeture administrative immédiate, saisie conservatoire et poursuites de contentieux).

Fait à Pointe-Noire pour valoir sommation d'État.
— Pour la Régie SAF & la Brigade SAA • Direction Départementale des Loisirs (Tél: +242 06 186 4275)`,
    canalRecommande: 'whatsapp',
    description: 'Avis officiel impérieux sommant les établissements sans aucun versement (0 FCFA versé) de se régulariser sous 8 jours dès l’ouverture de l’exercice 2027.',
  },
  {
    id: 'tmpl-rappel-solde-jan-2027',
    titre: 'Rappel d’Exigences 2027 & Renouvellement Annuel (Soldés & Acomptes)',
    typeCampagne: 'rappel_echeance_janvier_2027_solde',
    cibleDefaut: 'en_cours_acompte',
    periode: 'janvier_2027',
    objet: 'Rappel des Exigences 2027 & Renouvellement de l’Autorisation d’Exploitation • DDL-PN',
    corpsTexte:
`🏛️ DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
NOTIFICATION ANNUELLE DE RENOUVELLEMENT • EXERCICE 2027

À l'attention de M./Mme {NOM_PROMOTEUR} (« {NOM_ETABLISSEMENT} » - {ARRONDISSEMENT})
Dossier Réf : {CODE_DOSSIER}

Cher Partenaire Récréatif,

En conformité avec la Loi N° 21-2019 fixant le régime annuel des débits de boissons et complexes de loisirs, nous vous informons du lancement officiel de la campagne de reconduction des Autorisations d'Exploitation pour l'année 2027.

Point de situation de votre établissement :
• Statut fiscal antérieur : {STATUT_PAIEMENT}
• Redevance annuelle 2027 fixée : {MONTANT_REDEVANCE} FCFA
• Montant restant à régulariser : {RESTE_A_PAYER} FCFA

Vous êtes invité à effectuer le règlement auprès de notre Régie SAF ou via votre espace Télépaiement Promoteur afin de recevoir votre Diplôme A4 officiel scellé 2027 doté du QR Code infalsifiable.

La Direction vous remercie pour votre civisme républicain continu.
— Le Directeur Départemental des Loisirs de Pointe-Noire`,
    canalRecommande: 'whatsapp',
    description: 'Notification courtoise de renouvellement annuel envoyée aux exploitants déjà connus, en cours de paiement ou ayant soldé leur exercice précédent.',
  },
];

export const INITIAL_CAMPAIGN_BATCHES: CampaignBatch[] = [
  {
    id: 'batch-2026-dec-01',
    titre: 'Vague Globale de Meilleurs Vœux 2026 & Prélude 2027',
    typeCampagne: 'voeux_decembre_2026',
    cibleSegment: 'all',
    periodeCible: 'decembre_2026',
    dateCreation: '2026-10-17T03:30:00.000Z',
    totalCibles: 36,
    totalEnvoyes: 12,
    canalPrincipal: 'whatsapp',
    statut: 'en_cours',
    auteurNom: 'NTSEKE NGOUAKA Jean Richard (Directeur)',
  },
  {
    id: 'batch-2027-jan-zero',
    titre: 'Recouvrement Impérieux 2027 — Établissements Zéro Paiement',
    typeCampagne: 'recouvrement_janvier_2027_zero',
    cibleSegment: 'zero_entree',
    periodeCible: 'janvier_2027',
    dateCreation: '2026-10-17T03:45:00.000Z',
    totalCibles: 8,
    totalEnvoyes: 3,
    canalPrincipal: 'whatsapp',
    statut: 'en_cours',
    auteurNom: 'Brigade SAA / Régie SAF',
  },
];

export const INITIAL_CAMPAIGN_MESSAGES: CampaignMessage[] = [
  {
    id: 'msg-seed-001',
    campagneId: 'batch-2026-dec-01',
    campaignType: 'voeux_decembre_2026',
    channel: 'whatsapp',
    establishmentId: 'est-gcal-001',
    etablissementNom: 'Espace Prestige Vicky',
    promoteurNom: 'Promoteur Vicky',
    promoteurTelephone: '06 419 18 79',
    arrondissement: 'Tié-Tié',
    categorie: 'Lounge Bar & Terrasse',
    statutPaiement: 'acompte',
    montantRedevance: 50000,
    montantPaye: 35000,
    resteAPayer: 15000,
    messageContent: 'Meilleurs vœux de fin d’année 2026 transmis par le Directeur Départemental M. NTSEKE NGOUAKA Jean Richard pour Espace Prestige Vicky.',
    dateEnvoi: '2026-10-17T03:32:00.000Z',
    statutEnvoi: 'delivre',
    expediteurNom: 'Direction Départementale des Loisirs',
    referenceRelance: 'REL-2026-DEC-0001',
  },
  {
    id: 'msg-seed-002',
    campagneId: 'batch-2027-jan-zero',
    campaignType: 'recouvrement_janvier_2027_zero',
    channel: 'whatsapp',
    establishmentId: 'est-gcal-002',
    etablissementNom: 'Espace Toulan',
    promoteurNom: 'Promoteur Toulan',
    promoteurTelephone: '+242 06 600 00 00',
    arrondissement: 'Lumumba',
    categorie: 'Bar Dancing / Cabaret',
    statutPaiement: 'zero_entree',
    montantRedevance: 50000,
    montantPaye: 0,
    resteAPayer: 50000,
    messageContent: 'Avis officiel de mise en demeure et sommation de paiement sous huitaine transmis.',
    dateEnvoi: '2026-10-17T03:46:00.000Z',
    statutEnvoi: 'envoye',
    expediteurNom: 'Régie SAF / Brigade SAA',
    referenceRelance: 'REL-2027-JAN-0002',
  },
];
