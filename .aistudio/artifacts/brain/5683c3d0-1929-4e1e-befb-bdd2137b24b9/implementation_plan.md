# Plan d'Implémentation : Canva de Rédaction Rapide PTA 2026 & Liaison Dynamique des Rapports Trimestriels

Ce projet met en place le système officiel de rédaction et de suivi du **Plan de Travail Annuel 2026 (PTA 2026)** de la Direction Départementale des Loisirs de Pointe-Noire (DDL-PN), fidèle au document de référence de 20 pages (Note de présentation, 7 Tableaux d'activités, Chronogramme des 13 actions prioritaires, Budget prévisionnel minimal de 3 696 000 FCFA, 4 Axes stratégiques, KPI et Recommandations). Il lie organiquement ce PTA au **Canva de rédaction des Rapports Trimestriels (T1 à T4)** pour pré-remplir automatiquement les indicateurs, calculer les taux d'exécution physique et financière, et exporter les documents officiels aux normes A4 et Word (.docx).

---

## Décisions Clés & Choix Confirmés par l'Utilisateur

> [!IMPORTANT]
> **Décisions confirmées en Phase 1 :**
> 1. **Emplacement & Architecture unifiée** : Intégration d'un sous-onglet / canva dédié "PTA 2026" dans le Canva Administratif (MOD-19), et liaison interactive directe dans le module des Rapports Trimestriels (MOD-06) ainsi que le Suivi PTA (MOD-13).
> 2. **Automatisation des Rapports Trimestriels** : Pré-remplissage automatique des indicateurs cibles du PTA pour le trimestre sélectionné (T1, T2, T3 ou T4), synchronisation avec les données réelles de terrain (établissements recensés, missions de contrôle effectuées, quittances de régie), calcul immédiat des pourcentages d'exécution et des écarts.
> 3. **Formats d'exportation républicains** : Impression A4 officielle avec en-têtes républicains complets (République du Congo / Unité - Travail - Progrès, Ministère, DGL, DDL-PN, signature de Jean Richard NTSEKE NGOUAKA) et exportation Word (.docx) native complète et éditable.

---

## 1. Vue d'Ensemble & Concept

### Qu'est-ce que ce système apporte ?
- **Rédaction et personnalisation rapide du PTA 2026** : Un canva modulaire permettant d'éditer la note de présentation, les 7 tableaux d'activités par service (SAF, Autorisation, Statistiques, Promotion, Partenariats, Institutionnel, Suivi-Évaluation), le chronogramme des 13 activités prioritaires, le budget de 3 696 000 FCFA (Postes A à E) et les recommandations.
- **Liaison temps réel PTA ↔ Rapports Trimestriels** : Chaque rapport trimestriel (T1, T2, T3, T4) charge automatiquement la matrice du PTA 2026. L'agent sélectionne le trimestre et voit instantanément les activités programmées pour cette période, les objectifs fixés, les réalisations effectives tirées de la base de données (ex: 2 missions de contrôle qualité/trimestre, 100% du recensement en T1-T2, etc.), avec calcul automatique du taux de complétion.
- **Pérennité et conformité hiérarchique** : Génération de documents administratifs souverains respectant scrupuleusement la typographie républicaine, les mentions légales du Directeur Départemental et le bordereau de transmission à la DGL Brazzaville.

---

## 2. Expérience Utilisateur & Design Visuel

### Parcours Utilisateur
1. **Accès au Canva PTA 2026** :
   - Depuis le menu principal ou le sélecteur de documents du Canva Administratif (MOD-19), l'utilisateur choisit le modèle *Plan de Travail Annuel (PTA 2026)* ou clique sur le nouveau raccourci *Générer le PTA officiel*.
   - Le formulaire structuré présente 5 onglets thématiques : *1. Note & Piliers*, *2. 7 Tableaux d'activités*, *3. Chronogramme (T1-T4)*, *4. Budget (3.696.000 FCFA)*, *5. Risques, KPI & Recommandations*.
2. **Édition Rapide & Pré-remplissage Intelligent** :
   - Un bouton *Charger le PTA Officiel 2026 Conforme* insère instantanément les 65 actions concrètes, les 7 tableaux ministériels et le budget validé.
   - L'utilisateur peut adapter les valeurs, ajouter des activités spécifiques ou ajuster les budgets par poste.
3. **Liaison dans les Rapports Trimestriels (MOD-06)** :
   - L'utilisateur ouvre le module MOD-06 et sélectionne le trimestre (*T1*, *T2*, *T3* ou *T4*).
   - Un bloc dédié **Évaluation Trimestrielle calquée sur le PTA 2026** apparaît avec la liste des activités attendues pour ce trimestre.
   - Chaque ligne affiche : Activité, Service responsable, Cible PTA, Réalisation de terrain (calculée ou ajustable), % d'exécution avec barre de progression colorée (vert ≥ 80%, orange 50-79%, rouge < 50%), et champ de justification des écarts.
4. **Impression A4 & Export Word (.docx)** :
   - Bouton d'impression directe A4 ouvrant la mise en page fidèle avec marges républicaines (2,5 cm gauche, 2,0 cm droite/haut/bas).
   - Bouton de téléchargement Word (`.docx`) structuré avec tableaux natifs, styles hiérarchiques et signature officielle.

### Identité Visuelle & Typographie
- **Typographie** : Famille républicaine Garamond (`font-serif`) pour le rendu des documents officiels, et Cinzel/Inter pour l'interface de gestion.
- **Thématique** : Mode sombre souverain émeraude / ardoise (`bg-slate-950`, bordures `emerald-500/30`, accents or républicain `amber-500`) et bascule instantanée en mode clair fond blanc (`bg-slate-50`).

---

## 3. Décisions Produits & Arbitrages Techniques

1. **Source de Vérité du PTA 2026** :
   - *Choix* : Définir une structure de données TypeScript exhaustive `OfficialPta2026Data` dans `src/data/officialPtaData.ts`, sauvegardée avec persistance locale et synchronisable avec Firestore (`pta/2026`).
   - *Pourquoi* : Permet une utilisation 100% hors-ligne sur le terrain pour les agents mobiles tout en garantissant une synchronisation centrale pour le Directeur.
2. **Couplage Dynamique MOD-19 (Canva) et MOD-06 (Rapports)** :
   - *Choix* : Partager l'état du PTA via le contexte global `AppContext` (`currentPta`, `updatePta`, `getPtaMilestonesForQuarter(quarter)`).
   - *Pourquoi* : Toute modification apportée au PTA dans le Canva se reflète immédiatement et automatiquement dans les rapports trimestriels sans saisie redondante.
3. **Moteur d'Export Word (`docx`)** :
   - *Choix* : Extension de `docxGenerator.ts` avec deux générateurs officiels : `generatePta2026Docx` (document complet de 20 pages avec tous les tableaux) et `generateLinkedQuarterlyReportDocx` (rapport trimestriel avec matrice PTA).

---

## 4. Architecture Technique & Flux de Données

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION DDL-PN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │               RÉFÉRENTIEL OFFICIEL PTA 2026                         │   │
│   │   (Note de Présentation, 7 Tableaux, 13 Activités, Budget 3.696M)   │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 AppContext (Gestion d'État Centralisée)             │   │
│   │   - ptaData: OfficialPta2026Data                                    │   │
│   │   - updatePtaSection(section, data)                                 │   │
│   │   - getQuarterlyPtaActivities(quarter: 'T1'|'T2'|'T3'|'T4')         │   │
│   │   - syncPtaToFirestore()                                            │   │
│   └───────────────┬──────────────────────────────────┬──────────────────┘   │
│                   │                                  │                      │
│                   ▼                                  ▼                      │
│   ┌───────────────────────────────┐  ┌──────────────────────────────────┐   │
│   │   MOD-19 : CANVA DE RÉDACTION │  │   MOD-06 : RAPPORTS TRIMESTRIELS │   │
│   │   - Modèle officiel PTA 2026  │  │   - Sélecteur de Trimestre (T1-T4│   │
│   │   - Formulaire d'édition      │  │   - Matrice PTA synchronisée     │   │
│   │   - Prévisualisation A4       │  │   - Calcul auto % exécution      │   │
│   │   - Export docx & Print       │  │   - Export docx & Print          │   │
│   └───────────────────────────────┘  └──────────────────────────────────┘   │
│                   │                                  │                      │
│                   └──────────────────┬───────────────┘                      │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │               SERVICES DE SORTIE RÉPUBLICAINE                       │   │
│   │   - docxGenerator : generatePta2026Docx, generateQuarterlyReportDocx│   │
│   │   - printService  : printHtmlElement (Format A4 Garamond Officiel)  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Plan d'Exécution Détaillé
1. **Création du Référentiel de Données `src/data/officialPtaData.ts`** :
   - Structure complète des 7 tableaux d'activités (SAF, Autorisation, Statistiques, Promotion, Partenariats, Institutionnel, Suivi-Évaluation).
   - Modélisation du chronogramme récapitulatif des 13 activités avec ciblage par trimestre.
   - Détail chiffré du budget de 3 696 000 FCFA (Sections A à E).
   - Liste des 4 axes stratégiques et des 5 recommandations prioritaires de Jean Richard NTSEKE NGOUAKA.
2. **Enrichissement de `AppContext.tsx` et `src/types/index.ts`** :
   - Ajout des types `OfficialPtaData`, `PtaTableActivity`, `PtaBudgetSection`, `QuarterlyPtaLink`.
   - Exposition des fonctions de mise à jour et d'extraction filtrée par trimestre.
3. **Extension du Canva Administratif (`AdministrativeDraftingCanvaModule.tsx`)** :
   - Ajout du type de document `plan_travail_annuel` dans le sélecteur.
   - Interface d'édition rapide avec aperçu direct du document officiel et bouton de restauration du modèle officiel conforme.
4. **Liaison Dynamique dans les Rapports Trimestriels (`QuarterlyReportsModule.tsx`)** :
   - Intégration de la matrice d'évaluation trimestrielle liée au PTA avec calcul automatique des réalisations et du taux d'exécution physique/financière.
   - Affichage synthétique des indicateurs clés (8 missions qualité, 10 points focaux, 3 partenaires, etc.).
5. **Génération DOCX & Impression A4 (`docxGenerator.ts`)** :
   - Implémentation de `generatePta2026Docx` produisant le document complet avec les 7 tableaux docx natifs, le budget et la signature républicaine.
   - Mise à jour de `generateQuarterlyReportDocx` pour intégrer le tableau de bord PTA du trimestre.
6. **Vérification, Compilation et Tests** :
   - Validation stricte TypeScript avec `lint_applet` (`tsc --noEmit`) et `compile_applet`.
   - Test des fonctions d'export et de navigation.
