# Plan d'Implémentation : Enrichissement du Formulaire de Programmation des Descentes de Terrain (Quartiers, Base Firestore, Saisie Manuelle du Montant & Complément de Fiche)

Ce plan détaille l'intégration de la sélection dynamique des quartiers de Pointe-Noire, la persistance automatique en temps réel dans Firestore de tout nouvel établissement créé depuis l'agenda, la saisie manuelle personnalisée du montant à recouvrer lors de la descente, ainsi que le lien d'accès direct vers le module de recensement pour compléter les informations ultérieurement.

## Décisions Clés & Retours Utilisateur

> [!IMPORTANT]
> Les options validées lors du recueil des besoins :
> - **Présentation du formulaire** : Formulaire compact avec volet dépliable (*accordeon*) pour les informations complémentaires (catégorie d'établissement, promoteur, téléphone, repère local).
> - **Traitement du montant saisi** : Enregistré à la fois comme solde / redevance exigible sur l'établissement et comme `montantAcompteAttendu` assigné à la mission de descente.
> - **Accès ultérieur aux modifications** : Bouton d'accès direct et intuitif vers le module de Recensement (`MOD-02`) et la fiche complète de l'établissement (via toast de confirmation et fiche détaillée de la descente).

---

## 1. Vue d'Ensemble & Fonctionnalités Clés

### Objectifs
1. **Sélection dynamique des Quartiers** :
   - Associer à chaque arrondissement de Pointe-Noire (Lumumba, Mvou-Mvou, Tié-Tié, Loandjili, Mongo-Mpoukou, Ngoyo) sa liste officielle de quartiers issue du dictionnaire `QUARTIERS_PAR_ARRONDISSEMENT`.
   - Permettre la sélection rapide du quartier et la saisie libre si un quartier non répertorié ou un repère local spécifique est nécessaire.

2. **Enregistrement Immédiat et Souverain dans Firestore** :
   - Lorsqu'un agent ou inspecteur choisit « *+ Saisir un autre établissement* », l'établissement créé est immédiatement enregistré dans la collection Firestore `establishments` via `addEstablishment()` avec génération automatique du code dossier DDL-PN officiel (ex: `PN-TT-2026-XXXX`).
   - Disponibilité instantanée dans l'ensemble des modules (SIG Cartographie, Recouvrement SAF, Recensement terrain).

3. **Saisie Manuelle du Montant à Payer / Recouvrer** :
   - Ajout d'un champ numérique dédié au montant exigible / à recouvrer lors de la descente (en FCFA).
   - Prise en compte immédiate pour les nouveaux établissements (initialisation de la redevance / solde restant dû) et personnalisation de l'acompte attendu pour les établissements existants.

4. **Volet Dépliable pour Informations Complémentaires** :
   - Dépliage fluide (*toggle accordéon*) pour renseigner : promoteur / gérant, contact téléphonique, catégorie (Bar Dancing, Discothèque, Lounge, etc.), repère ou adresse exacte.

5. **Passerelle Rapide vers le Recensement Terrain** :
   - Action directe « *Compléter la fiche au Recensement* » dans l'agenda pour permettre l'ajout futur de photos, coordonnées GPS précises, relevés de décibels au sonomètre et pièces justificatives.

---

## 2. Expérience Utilisateur & Design d'Interface

### Parcours Utilisateur
```
[Bouton "+ Programmer une descente"]
              │
              ▼
    [Modale de Programmation]
              │
    ┌─────────┴──────────────────────────────────────────┐
    ▼                                                    ▼
[Établissement existant]                     [+ Saisir un autre établissement]
- Sélecteur d'établissement                  - Nom commercial
- Affichage solde & quartier                 - Arrondissement (1 à 6)
- Montant à recouvrer ajustable              - Quartier (liste filtrée selon arrondissement)
                                             - Montant à recouvrer (FCFA)
                                             - [Volet dépliable] Infos complémentaires
                                               (Promoteur, Téléphone, Catégorie, Adresse)
              │                                          │
              └───────────────────┬──────────────────────┘
                                  ▼
           [Date, Heure, Nature mission & Notes]
                                  │
                                  ▼
               [Bouton "Programmer cette descente"]
                                  │
                                  ▼
              ┌──────────────────────────────────────────┐
              │ 1. Sauvegarde Firestore 'establishments' │
              │ 2. Sauvegarde Firestore 'schedules'      │
              │ 3. Sync optionnelle Google Agenda        │
              │ 4. Toast de succès avec lien Recensement │
              └──────────────────────────────────────────┘
```

### Directives Visuelles & Ergonomie
- **Design Institutionnel DDL-PN** : Typographie lisible, fond blanc / ardoise respectant le mode clair/sombre.
- **Micro-interactions compactes** :
  - Sélecteur en deux volets coordonnées Arrondissement $\rightarrow$ Quartier avec actualisation instantanée.
  - Champ de montant avec séparateur automatique des milliers et libellé clair `FCFA`.
  - Bouton accordéon épuré `+ Ajouter plus de détails (Promoteur, Téléphone, Catégorie)` sans alourdir le flux de programmation rapide.

---

## 3. Architecture Technique & Flux de Données

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MobileAgentCalendarModule                       │
│                                                                        │
│   state: isCustomEst, createArrondissement, createQuartier,             │
│          createMontantAPayer, isDetailsExpanded, ...                   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    handleCreateAppointment()                   │   │
│   │                                                                │   │
│   │  if (isCustomEst):                                             │   │
│   │    1. newEst = await addEstablishment({                        │   │
│   │         nomCommercial, arrondissement, quartier,               │   │
│   │         montantRedevanceAnnuelle: createMontantAPayer,         │   │
│   │         soldeRestantDu: createMontantAPayer,                   │   │
│   │         promoteurNom, promoteurTelephone, categorie, ...       │   │
│   │       })                                                       │   │
│   │                                                                │   │
│   │  2. await addSchedule({                                        │   │
│   │       etablissementId: newEst.id,                              │   │
│   │       montantAcompteAttendu: createMontantAPayer,              │   │
│   │       arrondissement, ...                                      │   │
│   │     })                                                         │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               AppContext                               │
│                                                                        │
│   addEstablishment()  ──► Firestore: /establishments/{estId}           │
│   addSchedule()       ──► Firestore: /schedules/{scheduleId}           │
│   setActiveModule()   ──► Navigation fluide vers MOD-02 (Recensement)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Plan d'Exécution par Étapes

1. **Intégration du sélecteur de quartier & état local** :
   - Importer `QUARTIERS_PAR_ARRONDISSEMENT` dans `MobileAgentCalendarModule.tsx`.
   - Initialiser l'état `createQuartier` synchronisé avec le changement d'`arrondissement`.
   - Ajouter l'option de saisie libre si "Autre quartier" est retenu.

2. **Champs de montant et volet dépliable** :
   - Ajouter l'input `createMontantAPayer` (valeur par défaut suggérée, ex: `50000` FCFA).
   - Intégrer les champs complémentaires repliables : `promoteurNom`, `promoteurTelephone`, `categorie`, `repereLocal` ou `adresseExacte`.

3. **Enregistrement Firestore complet & chaînage de mission** :
   - Mettre à jour `handleCreateAppointment` pour persister l'établissement complet avec son quartier sélectionné et ses montants financiers.
   - Associer le montant à recouvrer directement à la descente créée (`montantAcompteAttendu`).

4. **Passerelle de navigation vers le Recensement** :
   - Proposer une action de redirection directe vers `MOD-02` avec pré-sélection de l'établissement créé.
   - Ajouter un bouton dans la vue détaillée de la descente programmée permettant d'accéder d'un clic au dossier de recensement pour modification.

5. **Validation et Compilation** :
   - Vérifier la conformité TypeScript et compiler avec `compile_applet`.
