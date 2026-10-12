# Canva de Rédaction : Refonte de l'Attestation de Dépôt & Intégration Base de Données

Ce plan détaille la mise en conformité administrative rigoureuse de l'Attestation de Dépôt dans le Canva de Rédaction : centrage des en-têtes républicains, relocalisation du QR Code d'authentification en haut à droite directement sous « Unité – Travail – Progrès », élimination de tous les textes superflus non vérifiés (mentions de lois non avérées et cartouche de « contrôle officiel de salubrité »), désactivation de la génération automatique du numéro de document pour saisie manuelle par l'agent, et intégration bidirectionnelle avec la base de données Firestore des établissements (sélection avec autocomplétion des données ou enregistrement in situ d'un nouvel établissement).

## Décisions Clés & Retours Utilisateur

> [!IMPORTANT]
> **Décisions confirmées par l'utilisateur :**
> - **Numéro de document non généré automatiquement** : Le champ du numéro d'acte ne s'auto-génère plus avec des numéros arbitraires ; il est éditable manuellement dès l'ouverture, permettant à l'agent d'inscrire le numéro d'enregistrement officiel du registre physique.
> - **En-têtes centrés** : L'en-tête officiel républicain est restructuré avec un centrage parfait de chaque colonne (ministère/direction à gauche centré sur son bloc, République/devise à droite centré sur son bloc).
> - **Emplacement du QR Code** : Le QR code est extrait du bas de page et repositionné en haut à droite, immédiatement en dessous de « Unité – Travail – Progrès » et de son filet de séparation.
> - **Suppression des textes non vérifiés** : Suppression intégrale du bloc de texte « Contrôle Officiel de Salubrité Acoustique & de Conformité », de la mention de loi contestée (« Loi N° 21-2019 du 13 juin 2019 ») et du statut légal non vérifié.
> - **Liaison avec la base de données Firestore** :
>   1. **Mode Extraction / Sélection** : Menu déroulant et barre de recherche rapide connectée à la collection des établissements (`establishments`) pour charger instantanément les informations (nom de l'établissement, gérant/promoteur, adresse, arrondissement, catégorie).
>   2. **Mode Nouvel Enregistrement** : Possibilité d'enregistrer directement un nouvel espace dans la base de données depuis le Canva pour délivrer l'attestation dans la foulée.

---

## 1. Présentation & Objectifs Fonctionnels

- **Régularité Républicaine** : Conformer la maquette visuelle au standard exact des actes émis par la Direction Départementale des Loisirs de Pointe-Noire (DDL-PN).
- **Sobriété Administrative** : Supprimer les formulations artificielles et références législatives non vérifiées pour conserver un document épuré, solennel et juridiquement inattaquable.
- **Continuité des Données Terrain** : Lier l'émission d'attestation à la base de données vivante de la DDL-PN afin d'éviter la double saisie et les fautes d'orthographe sur les noms de promoteurs et établissements.
- **Souveraineté & Traçabilité** : Le QR code placé en haut à droite continue de pointer vers la page de vérification publique officielle sécurisée, certifiant le document sans surcharger le corps du texte.

---

## 2. Expérience Utilisateur & Design Visuel

### A. Disposition de la Page A4 Républicaine (Police Garamond)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MINISTÈRE DE LA CULTURE, DES ARTS,  │            RÉPUBLIQUE DU CONGO        │
│ DU PATRIMOINE NATIONAL ET DE        │         Unité – Travail – Progrès     │
│    L'INDUSTRIE TOURISTIQUE          │        ───────────────────────────    │
│              ───                    │             ┌──────────────┐          │
│ DIRECTION GÉNÉRALE DES LOISIRS      │             │   QR CODE    │          │
│              ───                    │             │ DE CONFORMITÉ│          │
│  DÉPARTEMENT DE POINTE-NOIRE        │             │   OFFICIEL   │          │
│              ───                    │             └──────────────┘          │
│ DIRECTION DÉPARTEMENTALE DES LOISIRS│                                       │
│          DE POINTE-NOIRE            │                                       │
│              ───                    │                                       │
│        [ N° d'Acte Saisi ]          │                                       │
├─────────────────────────────────────┴───────────────────────────────────────┤
│                                            Pointe-Noire, le [Date choisie]  │
│                                                                             │
│                            ATTESTATION DE DÉPÔT                             │
│                                                                             │
│ Objet : Dépôt de dossier technique d'agrément d'établissement de loisirs    │
│                                                                             │
│ Le Directeur Départemental des Loisirs de Pointe-Noire soussigné atteste    │
│ par la présente que l'établissement dénommé « [NOM ÉTABLISSEMENT] »,        │
│ exploité par [NOM DU GÉRANT/PROMOTEUR], relevant de la catégorie            │
│ [CATÉGORIE], sis à Pointe-Noire, Arrondissement [ARRONDISSEMENT], a         │
│ régulièrement déposé auprès de nos services son dossier technique de        │
│ régularisation et d'obtention de l'agrément d'exploitation.                 │
│                                                                             │
│ La présente attestation confère au promoteur la faculté de poursuivre ses   │
│ activités à titre transitoire, en attendant la délivrance de l'Agrément     │
│ Ministériel Définitif instruit par la Direction Générale des Loisirs.       │
│                                                                             │
│ Délivrée pour valoir et servir ce que de droit, la présente attestation     │
│ est valable pour une période de quatre-vingt-dix (90) jours renouvelable.   │
│                                                                             │
│                                            Le Directeur Départemental       │
│                                            des Loisirs de Pointe-Noire      │
│                                                                             │
│                                            Jean Richard NTSEKE NGOUAKA      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### B. Parcours Utilisateur & Interface du Canva

1. **Sélecteur de Source Établissement (Base de Données / Nouveau)** :
   - Un sélecteur ergonomique en tête du formulaire d'édition permet de choisir :
     - *« Extraire d'un établissement existant »* : champ de recherche avec autocomplétion sur la collection Firestore (ex: recherche "LE ROCHER", "VIP", etc.). Sélectionner un établissement injecte automatiquement son nom, son promoteur, sa catégorie, son quartier/arrondissement dans le corps du document et dans le QR code.
     - *« Enregistrer un nouvel espace »* : formulaire rapide (Nom, Promoteur, Arrondissement, Categorie, Téléphone) qui enregistre l'établissement directement dans Firestore puis préremplit immédiatement l'attestation.
     - *« Saisie libre manuelle »* : pour les cas exceptionnels.
2. **Saisie du Numéro de Document** :
   - Champ de texte libre éditable, non imposé automatiquement, avec placeholder indicatif discret (`Ex: N° 042/MCAPNIT/DGL/DPN/DDL-PN/2026`).
3. **Élimination des Textes Parasites** :
   - Suppression du cartouche gris inférieur contenant les mentions « Contrôle Officiel de Salubrité Acoustique & de Conformité » et « Loi N° 21-2019 ».
   - Suppression de la référence à la loi dans le corps du texte et suppression du champ Référence s'il n'est pas renseigné.
4. **Impression & Export Téléchargement** :
   - L'impression A4 et l'export Word (.docx) reflètent fidèlement ce nouvel agencement (en-têtes centrés, QR code en haut à droite, zéro texte superflus).

---

## 3. Choix Techniques & Arbitrages

- **Emplacement du QR Code dans l'en-tête** :
  - *Choix retenu* : Intégration dans le composant `OfficialDocumentHeader` sous la devise nationale, avec une taille élégante (72x72px / ~19mm) garantissant une numérisation instantanée par caméra mobile tout en respectant l'équilibre de la page.
  - *Raison* : Positionnement standard des cachets et repères de sécurité administratifs modernes, libérant complètement l'espace pour le texte de l'acte.
- **En-têtes Centrés par Colonne** :
  - *Choix retenu* : La colonne gauche (Ministère -> Direction) applique `text-center` sur sa propre largeur (50%), et la colonne droite (République -> Devise -> QR Code) applique `text-center` sur sa largeur (50%), avec les tirets d'espacement républicains parfaitement centrés.
  - *Raison* : Rendu officiel solennel, conforme à la tradition administrative congolaise.
- **Gestion des Établissements Firestore** :
  - *Choix retenu* : Utilisation du hook `useApp()` (`establishments`, `addEstablishment`), connecté en temps réel à Firestore avec synchronisation IndexedDB offline.
  - *Raison* : Cohérence totale avec le reste de l'application (Recensement, Régie SAF, SIG) et disponibilité 100% hors-ligne.

---

## 4. Architecture Technique & Flux de Données

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE TECHNIQUE DU CANVA DDL-PN                   │
└─────────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────────┐
         │             Collection Firestore                 │
         │          db.collection('establishments')         │
         └────────────────────────┬─────────────────────────┘
                                  │ (Abonnement en temps réel & Cache IndexedDB)
                                  ▼
         ┌──────────────────────────────────────────────────┐
         │               AppContext (useApp)                │
         │   • establishments: Establishment[]              │
         │   • addEstablishment(newEst)                     │
         └────────────────────────┬─────────────────────────┘
                                  │
                                  ▼
         ┌──────────────────────────────────────────────────┐
         │       AdministrativeDraftingCanvaModule          │
         │  1. Sélecteur Source (Existant / Création)       │
         │  2. Saisie manuelle du numéro d'acte             │
         │  3. Formattage du texte sans références de loi   │
         │  4. Calcul du QR Code (services/qrService.ts)    │
         └────────────────────────┬─────────────────────────┘
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     OfficialDocumentHeader    │   │      Aperçu A4 & Print        │
│ • En-têtes centrés (G & D)    │   │ • Typographie Garamond        │
│ • "Unité – Travail – Progrès" │   │ • Corps textuel nettoyé       │
│ • QR Code sous la devise      │   │ • Bloc signature directeur    │
└───────────────────────────────┘   └───────────────────────────────┘
```

### Plan d'Implémentation Détaillé

1. **Mise à niveau de `OfficialDocumentHeader.tsx`** :
   - Centrer le contenu de la colonne gauche (Ministère, Direction Générale, Département, DDL-PN, numéro d'acte).
   - Centrer la colonne droite (République, devise).
   - Accepter une prop optionnelle `qrCodeUrl?: string` et afficher le QR code directement sous le filet de séparation de la devise nationale en haut à droite.
2. **Refonte de `AdministrativeDraftingCanvaModule.tsx`** :
   - Retirer la valeur par défaut automatique du numéro d'acte ou initialiser à vide pour saisie manuelle.
   - Ajouter un sélecteur d'établissement avec recherche rapide parmi `establishments` de `useApp()`.
   - Ajouter une modal / volet rapide d'enregistrement d'un nouvel établissement (connecté à `addEstablishment`).
   - Nettoyer le texte du modèle LE ROCHER en enlevant les références de loi contestées et le champ référence.
   - Supprimer le bloc inférieur « Contrôle Officiel de Salubrité Acoustique & de Conformité ».
   - Transmettre `attestationQrCodeUrl` à `OfficialDocumentHeader`.
3. **Mise à jour du générateur Word `docxGenerator.ts`** :
   - Mettre à jour l'en-tête du document Word pour refléter le centrage et la position du QR Code.
4. **Vérification et Compilation** :
   - Tester le bon fonctionnement de la saisie manuelle, de l'extraction base de données, du centrage des en-têtes et du rendu d'impression A4.
