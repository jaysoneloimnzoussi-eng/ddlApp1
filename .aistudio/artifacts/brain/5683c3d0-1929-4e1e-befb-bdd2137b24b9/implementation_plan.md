# Plan d'Harmonisation : Intégration des Notes de Service N° 151, N° 152 & Fiche Locale DDL-PN

Ce plan détaille l'intégration et l'harmonisation complète des trois documents réglementaires officiels soumis par l'Administration dans l'ensemble des modules opérationnels de l'application DDL-PN :
1. **Note de Service N° 151/MTL-CAB du 03 août 2022** : Grille tarifaire officielle nationale par m² et forfaits, quote-part de 50% des frais réservée à l'Administration des loisirs pour l'étude de dossier, et liste des activités de loisirs sains exonérées.
2. **Note de Service N° 152/MTL-CAB du 05 août 2022** : Composition normative des 4 sous-dossiers d'agrément (Demande écrite, Sous-dossier Technique, Sous-dossier Administratif, Sous-dossier Financier) et régime des promoteurs de nationalité étrangère (parrainage congolais obligatoire pour les jeux de hasard).
3. **Fiche Locale DDL-PN (SAF / Pointe-Noire)** : Checklist réglementaire des pièces exigibles pour l'ouverture d'un débit de boissons/club et frais d'enquête départementale de terrain fixés à **30 000 FCFA** avec visa officiel de la Direction.

---

## Retours Utilisateur & Décisions Confirmées

> [!IMPORTANT]
> **Choix validés lors de la clarification :**
> - **Portée de l'harmonisation** : Intégration transversale dans tous les modules clés de l'application (`MOD-12` Simulateur Juridique, `MOD-02` Recensement Terrain, `MOD-10` Régie SAF, `MOD-19` Canva de Rédaction, et impressions officielles).
> - **Ventilation financière régalienne** : Décomposition rigoureuse des montants sur les quittances et caisses :
>   1. Frais d'enquête terrain DDL-PN : **30 000 FCFA**
>   2. Frais d'étude de dossier (Administration des Loisirs) : **50% du montant d'autorisation**
>   3. Reversé Trésor Public : **50% restant**
>   4. Barème officiel par m² (Discothèques/VIP: 1 500 F/m², Bars/Caves: 1 000 F/m²) ou forfaits (Casinos, Billards, Parcs, Cinémas).
> - **Acte administratif supplémentaire** : Génération et impression au format officiel A4 d'un **Récépissé de Dépôt de Dossier & Bordereau de Conformité des Pièces** avec cases à cocher, QR code de certification publique et cachet officiel DDL-PN.

---

## 1. Synthèse des Textes Réglementaires Intégrés

### A. Grille Tarifaire Officielle (Note N° 151/MTL-CAB)
- **Débits de boissons (au m²)** :
  - Discothèque, Night-club, VIP : **1 500 FCFA / m²**
  - Bar, bar dancing, cabaret : **1 000 FCFA / m²**
  - Cave, Buvette : **1 000 FCFA / m²**
  - Snack-Bar : **1 000 FCFA / m²**
- **Salles de jeux** :
  - Casino : **5 000 000 FCFA**
  - Jackpot : **3 500 000 FCFA**
  - Salle de billard, Bowling : **500 000 FCFA**
  - Salle de jeux vidéo : **5 000 FCFA / m²**
- **Salles de cinéma** :
  - Ciné grand écran : **500 000 FCFA**
  - Ciné petit écran, Ciné foot : **50 000 FCFA**
- **Sites de loisirs (Maisons, Centres de vacances, Parcs, Villages, Complexes, Bases nautiques/aquatiques)** : **100 000 FCFA**
- **Jeux de hasard & Paris** :
  - Tombola publicitaire : **1 000 000 FCFA** | Loterie publicitaire : **2 000 000 FCFA**
  - Loterie télévisée, Paris sportifs physiques : **50 000 000 FCFA**
  - Pari équestre, Jeux en ligne : **80 000 000 FCFA**
- **Fêtes foraines, Festivals, Kermesses, Cirques, Foires, Rallyes** : **50 000 FCFA**
- **Exonérations (Loisirs Sains)** : Aires de jeux, ludothèques, clubs de loisirs, loteries et tombolas à but caritatif.
- **Règle des 50%** : 50% du montant est prélevé pour l'Administration des Loisirs pour l'étude du dossier avant reversement au Trésor Public.

### B. Composition des 4 Sous-Dossiers (Note N° 152/MTL-CAB)
- **Demande écrite** adressée au Ministre en charge des loisirs.
- **Sous-dossier Technique** : Plan de masse et plan de situation, règlement intérieur des jeux, quitus sapeurs-pompiers, quitus CNSS, titre de propriété ou contrat de bail (adresse au Congo), organigramme service client (jeux de hasard), contrat de parrainage congolais (si étranger), contrats de travail personnel congolais (si étranger), contrat partenaires locaux.
- **Sous-dossier Administratif** : CNI/Passeport/Carte séjour, certificat de nationalité, casier judiciaire (< 3 mois), CV du gérant/diplôme/attestation d'expérience, certificat médical hygiène, attestation RCCM, statuts de la société.
- **Sous-dossier Financier** : Patente de l'année en cours, compte d'exploitation prévisionnel sur 3 ans, reçu de paiement des frais d'autorisation, attestation d'assurance multirisque.

### C. Fiche Locale DDL-PN (Pointe-Noire)
- Frais d'enquête de terrain : **30 000 FCFA** (mention officielle visée par la Direction Départementale).
- Spécificités débits de boissons / VIP / Night-clubs.

---

## 2. Expérience Utilisateur & Parcours Opérationnels

### Flux 1 : Simulateur Régalien & Textes Juridiques (`MOD-12`)
- **Onglet Textes Réglementaires** : Consultation intégrale de la Note N° 151, de la Note N° 152 et de la Fiche Locale DDL-PN aux côtés de la Loi N° 21-2019 et de l'Arrêté Préfectoral.
- **Simulateur Tarifaire Automatisé** :
  - Sélection de la catégorie exacte selon la nomenclature officielle (I à P).
  - Calcul dynamique en direct : Saisie de la surface en m² pour les débits de boissons et jeux vidéo, ou application instantanée du forfait officiel.
  - Panneau récapitulatif avec ventilation triple : Montant total, Quote-part Étude 50% (Administration), Part Trésor Public 50%, et Frais d'enquête terrain (30 000 FCFA).

### Flux 2 : Fiche Terrain & Recensement (`MOD-02`)
- **Checklist Interactive des Pièces à Fournir** : Volet rétractable lors du recensement avec suivi des 4 sous-dossiers. L'inspecteur coche les pièces physiquement présentées (Quitus pompiers, RCCM, Casier judiciaire, Bail, Patente, Assurance, etc.).
- **Calculateur de Redevance Intégré** : Dès la saisie de la surface et de la catégorie, application stricte de la note 151.
- **Indicateur de Complétude** : Calcul automatique du taux de complétude du dossier (ex: 85% - 11/13 pièces fournies).

### Flux 3 : Régie Financière SAF & Émission de Quittances (`MOD-10`)
- **Ventilation Réglementaire sur la Quittance POS 58mm et Facture A4** :
  - Ligne 1 : Frais d'enquête administrative et de terrain (DDL-PN) = 30 000 FCFA
  - Ligne 2 : Frais d'étude de dossier (50% Note 151) = [Montant] FCFA
  - Ligne 3 : Redevance annuelle d'exploitation / Trésor (50%) = [Montant] FCFA
  - Ligne 4 : Total encaissé / Reste à recouvrer.
- **Registre des Recettes** : Filtrage par nature de recette (Enquête 30k, Étude dossier 50%, Redevance m²).

### Flux 4 : Canva de Rédaction Administrative (`MOD-19`)
- **Nouveau Modèle d'Acte** : *« Récépissé d'Instruction & Bordereau de Conformité des Pièces »*.
- **Impression A4 Républicaine** : Document solennel en typographie Garamond avec en-têtes centrés, tableau officiel des pièces vérifiées, visa de conformité, montant des frais d'enquête (30 000 FCFA) et d'autorisation, QR code de vérification public.

---

## 3. Choix Techniques & Arbitrages

- **Centralisation des Données Tarifaires (`src/data/officialTariffs.ts`)** :
  - *Choix retenu* : Créer un fichier de constantes unifié contenant la nomenclature complète des catégories, les tarifs au m², les forfaits fixes, les pièces des 4 sous-dossiers, et les textes intégraux des notes 151 et 152.
  - *Bénéfice* : Évite la duplication de code entre le simulateur, le recensement terrain, la régie SAF et le canva administratif.
- **Compatibilité Descendante des Établissements Existants** :
  - *Choix retenu* : Conserver les données existantes de la base Firestore tout en leur attribuant la grille tarifaire exacte de la Note 151 lors des calculs de redevance annuelle.
  - *Bénéfice* : Zéro régression sur les 250+ établissements importés depuis le calendrier et Supabase.
- **Typographie & Charte Graphique Officielle** :
  - *Choix retenu* : Respect rigoureux des standards de la DDL-PN : `Plus Jakarta Sans` pour les écrans de gestion, `JetBrains Mono / tabular-nums` pour les montants financiers et surfaces, et `EB Garamond` pour les documents officiels imprimables.

---

## 4. Architecture Système & Flux de Données

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 RÉFÉRENTIEL OFFICIEL DDL-PN (NOTES 151, 152 & SAF)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
         ┌──────────────────────────┐      ┌──────────────────────────┐
         │ Note 151/MTL-CAB         │      │ Note 152/MTL-CAB & SAF   │
         │ • Tarifs m² (1500 / 1000)│      │ • 4 Sous-dossiers        │
         │ • Forfaits fixes (I à P) │      │ • Pièces à fournir       │
         │ • 50% Frais d'étude      │      │ • Enquête : 30 000 FCFA  │
         │ • Exonérations saines    │      │ • Parrainage étrangers   │
         └────────────┬─────────────┘      └────────────┬─────────────┘
                      │                                 │
                      └────────────────┬────────────────┘
                                       ▼
                      ┌─────────────────────────────────┐
                      │    src/data/officialTariffs.ts  │
                      │  Constantes & Fonctions Calcul  │
                      └────────────────┬────────────────┘
                                       │
         ┌───────────────┬─────────────┼─────────────┬───────────────┐
         ▼               ▼             ▼             ▼               ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐
  │   MOD-12    │ │   MOD-02    │ │ MOD-10  │ │   MOD-19    │ │  PrintModal │
  │ Simulateur  │ │ Recensement │ │  Régie  │ │   Canva     │ │ & POS 58mm  │
  │  & Textes   │ │  Checklist  │ │   SAF   │ │  Récépissé  │ │ Ventilation │
  └─────────────┘ └─────────────┘ └─────────┘ └─────────────┘ └─────────────┘
```

### Modules et Composants Impactés :
1. `src/data/officialTariffs.ts` : Nouveau référentiel unifié des tarifs, sous-dossiers et textes des notes de service 151 et 152.
2. `src/components/modules/LegalTextsAndSimulatorModule.tsx` : Intégration du simulateur officiel basé sur la Note 151 (m², forfaits, 50% étude, 30 000 FCFA enquête) et ajout des textes intégraux consultables.
3. `src/components/modules/FieldRecensementModule.tsx` : Intégration du sélecteur de sous-dossiers et checklist de pièces conformes Note 152 + Fiche DDL-PN.
4. `src/components/modules/SafRegieRecettesModule.tsx` : Mise à niveau de l'encaissement et des modèles de quittance avec ventilation détaillée (Enquête 30 000 FCFA, Frais d'étude 50%, Taxe d'exploitation).
5. `src/components/modules/AdministrativeDraftingCanvaModule.tsx` : Ajout du modèle d'acte officiel républicain « Récépissé d'Instruction & Contrôle des Pièces ».
6. `src/services/docxGenerator.ts` & `src/components/common/PrintModal.tsx` : Support de l'impression A4 et POS du nouveau récépissé et des quittances ventilées.

---

## 5. Plan de Vérification & Recette

1. **Vérification du Simulateur** :
   - Tester le calcul d'une discothèque de 200 m² : `200 * 1500 = 300 000 FCFA`, quote-part étude = `150 000 FCFA`, trésor = `150 000 FCFA`, frais d'enquête = `30 000 FCFA`.
   - Tester un bar dancing de 150 m² : `150 * 1000 = 150 000 FCFA`, quote-part étude = `75 000 FCFA`, trésor = `75 000 FCFA`.
   - Tester un casino forfaitaire : `5 000 000 FCFA`, quote-part étude = `2 500 000 FCFA`.
2. **Vérification de la Checklist Dossier** :
   - Cocher les 4 sous-dossiers et vérifier le calcul du taux de complétude et la détection des pièces obligatoires (ex: quitus pompiers, casier judiciaire, patente).
3. **Vérification de la Régie SAF** :
   - Générer une quittance avec ventilation et vérifier l'affichage à l'écran, le ticket POS 58mm et la quittance grand format A4.
4. **Vérification du Canva & Impressions** :
   - Visualiser et imprimer le Récépissé Officiel A4 avec QR Code scannable et en-têtes centrés républicains.
5. **Compilation & Linting** :
   - Exécution de `compile_applet` et validation du build de production sans régression.
