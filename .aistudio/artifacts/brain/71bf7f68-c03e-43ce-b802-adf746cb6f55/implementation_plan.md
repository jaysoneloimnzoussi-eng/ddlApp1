# Plan d'Architecture : Déduplication Souveraine, Recherche de Descentes et Ruban Financier d'Agenda (DDL-PN)

Plan d'intégration et de consolidation pour éliminer les doublons d'établissements dans la base Firestore tout en respectant la règle métier (un établissement est suivi par un agent unique, mais un promoteur peut posséder plusieurs établissements distincts), enrichir le formulaire de programmation de descentes d'un sélecteur intelligent avec recherche multicritère, doter le calendrier d'une navigation instantanée vers le jour de la descente (prévue ou réalisée) avec surbrillance, et intégrer un ruban d'analyse financière des recettes recouvrées par période (semaine, mois, trimestre, année).

## Décisions Validées et Choix Utilisateur

> [!IMPORTANT]
> Les réponses fournies lors de la phase de clarification ont permis d'arrêter les orientations suivantes :

- **Règle d'Unicité & Déduplication** : Fusion intelligente automatique consolidant l'ensemble des historiques de paiement, conservant le solde réel et désignant un agent référent unique et exclusif par établissement physique, sans confondre les établissements d'un même promoteur ayant des noms commerciaux ou adresses distincts.
- **Recherche Calendaire** : Navigation souveraine automatique vers le jour précis (prévu ou déjà déroulé) où la descente est enregistrée pour l'établissement recherché, avec bascule immédiate en vue jour, surbrillance dorée et ouverture de la fiche de mission.
- **Synthèse Financière** : Intégration d'un ruban d'indicateurs financiers en tête du calendrier récapitulant les recettes récoltées (cette semaine, ce mois-ci, ce trimestre et total cumulé) avec détail interactif des quittances émises.

---

## 1. Vue d'Ensemble & Objectifs Métiers

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      DIRECTION DÉPARTEMENTALE DES LOISIRS (PN)                         │
│                           Système Souverain v3.0                                       │
└───────────────────────────────────┬────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
 ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
 │ 1. DÉDUPLICATION  │    │ 2. PROGRAMMATION  │    │ 3. CALENDRIER &   │
 │   INTELLIGENTE    │    │    DE DESCENTE    │    │  RUBAN FINANCIER  │
 │ Unicité Établiss. │    │ Recherche rapide  │    │ Navigation jour   │
 │ 1 agent exclusif  │    │ Nom, tél, promoteur│    │ Surbrillance doré │
 │ Multi-sites tenanc│    │ Auto-remplissage  │    │ Recettes S/M/T    │
 └───────────────────┘    └───────────────────┘    └───────────────────┘
```

- **Problème résolu** : 
  1. La multiplication des doublons d'un même établissement dans Firestore fausse les statistiques départementales et disperse les encaissements partiels.
  2. Les agents devaient retaper manuellement les données dans le formulaire de programmation de descentes au lieu de lier un établissement existant.
  3. La recherche dans l'agenda manquait de rétroaction visuelle pour situer directement la date exacte d'une mission.
  4. L'absence d'une synthèse financière immédiate en tête d'agenda empêchait le chef de brigade d'évaluer la cadence des recouvrements de la semaine ou du mois.

---

## 2. Expérience Utilisateur & Design d'Interface

### 2.1 Formulaire « Programmer une descente de terrain »
- **Champ de recherche d'établissement avec autocomplétion instantanée** :
  - Barre de recherche contextuelle filtrant en temps réel sur le nom commercial, le nom du promoteur, le quartier et le numéro de téléphone.
  - Menu déroulant élégant (respectant le design républicain et anti-slop) avec affichage du quartier, de l'arrondissement, de l'agent référent actuel et du statut financier (à jour ou solde dû).
  - Sélection en 1 clic : auto-remplissage immédiat des champs (nom, contact promoteur, quartier, arrondissement, montant attendu pré-calculé d'après le solde restant).
  - Option explicite « Nouvel établissement » si l'inspection vise un site non encore répertorié.

### 2.2 Navigation et Recherche Calendaire Ciblée
- **Localisation instantanée du jour d'inspection** :
  - Dès qu'un établissement est sélectionné dans la recherche du calendrier, l'application recalcule la date de la descente (dernière descente effectuée ou prochaine descente programmée).
  - Transition fluide : mise à jour de la date active (`currentDate`), passage automatique en vue `jour` ou centrage sur la semaine correspondante.
  - Effet visuel de surbrillance républicaine (bordure émeraude/or animée `ring-2 ring-emerald-500 shadow-md`) autour de la carte de la mission pour attirer le regard de l'agent sans délai.

### 2.3 Ruban de Synthèse des Recettes Récoltées
- **Bannière financière en en-tête du calendrier** :
  - **Recettes de la Semaine** : total encaissé (du lundi au dimanche de la date visualisée) + nombre de quittances.
  - **Recettes du Mois** : montant cumulé sur le mois en cours + comparaison au montant attendu.
  - **Recettes du Trimestre / Année** : vision consolidée de la brigade.
  - Possibilité de cliquer sur un bloc financier pour ouvrir le journal des quittances correspondantes avec références officielles.

---

## 3. Logique Métier & Règles de Déduplication

```
                  ┌──────────────────────────────────────────────┐
                  │   IDENTIFICATION DES DOUBLONS D'UN ÉTABLIS.  │
                  │ (Même nom normalisé + même quartier/arrond.) │
                  └───────────────────────┬──────────────────────┘
                                          │
                                          ▼
                  ┌──────────────────────────────────────────────┐
                  │       DÉTERMINATION DU FICHIER CANONIQUE     │
                  │   - Conserve l'historique complet des paiem. │
                  │   - Additionne les montants déjà encaissés   │
                  │   - Recalcule le solde dû                    │
                  │   - Conserve le dernier relevé sonométrique  │
                  └───────────────────────┬──────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
  ┌─────────────────────────────────┐           ┌────────────────────────────────┐
  │      AGENT RÉFÉRENT UNIQUE      │           │      GESTION MULTI-SITES       │
  │ 1 seul agent de terrain assigné │           │ Si même promoteur mais noms/   │
  │ à l'établissement (exclusivité) │           │ adresses différents : sites    │
  │                                 │           │ distincts préservés !          │
  └─────────────────────────────────┘           └────────────────────────────────┘
```

1. **Règle du Promoteur Multi-Établissements** :
   - Un tenancier (ex: *M. Moukala*) peut posséder le bar *« Le Grand Baobab »* à Tié-Tié et la boîte de nuit *« L'Impérial Club »* à Lumumba. Ces deux entités sont conservées comme des établissements distincts car leurs assiettes fiscales et localisations diffèrent.
2. **Règle du Doublon Strict d'Établissement** :
   - Deux fiches ayant un nom commercial phonétiquement ou textuellement identique dans le même quartier ou avec le même numéro de téléphone sont fusionnées dans l'entité canonique la plus complète.
   - Les quittances rattachées aux doublons sont réassignées vers l'ID canonique.
   - L'agent de terrain historique ou le plus récemment actif est assigné comme unique agent responsable.
   - Suppression en cascade des fiches redondantes dans Firestore pour assainir la base.

---

## 4. Architecture Technique & Modifications Prévues

### Diagramme de flux des données

```
┌────────────────────────────────────────────────────────────────────────┐
│                             AppContext                                 │
│  - establishments: Establishment[] (dédupliqués & synchronisés)       │
│  - receipts: CashReceipt[]                                             │
│  - schedules: InspectionSchedule[]                                     │
│  - consolidateAndDeduplicateEstablishments() -> Firestore batch        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│     MobileAgentCalendarModule        │  │ Formulaire « Programmer... » │
│  - Ruban Financier (Semaine / Mois)  │  │ - Autocomplète prédictif     │
│  - Recherche Établissement           │  │ - Remplissage auto           │
│  - Saut de date automatique & Focus  │  │ - Liaison ID canonique       │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Plan d'exécution par composant :
1. **`src/context/AppContext.tsx`** :
   - Renforcer la fonction de déduplication automatique lors du chargement initial depuis Firestore et lors des créations d'établissements.
   - Veiller à préserver la relation 1 agent <-> 1 établissement tout en tolérant 1 promoteur -> N établissements.
   - Exposer un helper d'assainissement Firestore pour supprimer définitivement les doublons orphelins de la collection `etablissements`.
2. **`src/components/modules/MobileAgentCalendarModule.tsx`** :
   - **Ruban financier** : Afficher un bandeau d'indicateurs métriques au sommet du calendrier avec sélection dynamique de la semaine/mois.
   - **Formulaire d'ajout de descente** : Intégrer un sélecteur avec moteur de recherche en direct pour lier l'établissement canonique et pré-remplir ses coordonnées géographiques et agent attitré.
   - **Recherche du calendrier** : Lorsqu'un établissement est sélectionné dans les résultats de recherche, identifier sa descente la plus pertinente, basculer sur sa date exacte (`setCurrentDate`), activer la vue correspondante et animer la carte pour la repérer immédiatement.
3. **Validation & Compilation** :
   - Vérification TypeScript intégrale (`npm run lint`).
   - Compilation Vite (`compile_applet`).
