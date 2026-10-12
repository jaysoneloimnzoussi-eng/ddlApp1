# Modèle Officiel d'Attestation de Dépôt & Système de Vérification QR Code

Ce plan détaille l'intégration fidèle et rigoureuse du modèle officiel d'Attestation de Dépôt dans le Canva de Rédaction et les impressions avec la police officielle Garamond, accompagné d'un QR Code scannable redirigeant vers une page publique de certification de conformité munie du sceau officiel républicain.

## Décisions Clés Validées

> [!IMPORTANT]
> Les choix suivants ont été confirmés par l'utilisateur :
> - **Emplacement** : Intégration directe dans le module **Canva de Rédaction Administrative** et dans le système central d'**Impression officielle (PrintModal)**.
> - **Typographie** : Utilisation stricte de la police officielle **Garamond** (`EB Garamond`), police réglementaire de la Direction Départementale des Loisirs.
> - **Vérification** : Création d'une **page web publique de certification** dédiée, accessible sans authentification par tout smartphone scannant le QR Code officiel.
> - **Fidélité au modèle** : Respect strict du modèle « LE ROCHER » sans ajout ni suppression de formules administratives.

---

## 1. Présentation & Objectifs

- **Fonctionnalité** : Permettre aux agents habilités de rédiger, personnaliser et imprimer l'Attestation de Dépôt officielle selon le modèle exact du dossier LE ROCHER, tout en apposant automatiquement un QR Code scannable menant vers une page de vérification garantissant l'authenticité républicaine du document.
- **Utilisateurs cibles** : Direction Départementale des Loisirs de Pointe-Noire (Directeur, chefs de service, inspecteurs) et public/autorités de contrôle vérifiant les documents sur le terrain.
- **Bénéfice majeur** : Conformité administrative absolue, zéro falsification grâce au sceau et à la page publique de certification en ligne.

---

## 2. Expérience Utilisateur & Design Visuel

- **Parcours Utilisateur** :
  1. *Dans le Canva de Rédaction* : L'utilisateur choisit le modèle « Attestation de Dépôt ». Le texte officiel complet s'affiche instantanément dans la police **Garamond**, structuré avec le format officiel (en-tête républicain, références juridiques, informations de l'établissement LE ROCHER, formule d'attestation, mention de validité et bloc signature avec sceau).
  2. *Génération du QR Code* : Le QR Code est calculé en temps réel avec l'URL publique de vérification de l'attestation (`https://.../#verify-attestation?ref=...`).
  3. *Impression A4 / Export* : L'impression génère une feuille A4 impeccable avec la police Garamond et le QR Code haute résolution.
  4. *Scan par un tiers* : Tout smartphone (appareil photo standard) scannant le QR Code ouvre instantanément la page publique de conformité affichant un badge vert de certification, le sceau républicain et les données du document.

- **Identité Visuelle & Typographie** :
  - **Police d'écriture** : `EB Garamond` / `Garamond` appliquée à l'intégralité du document (titres, corps, mentions, signatures).
  - **Mise en page solennelle** : Marges républicaines équilibrées, armoiries / en-tête officiel DDL-PN, devise « Unité – Travail – Progrès », sceau d'État officiel.
  - **Page publique de certification** : Design sobre, institutionnel et responsive avec carte de sécurité, sceau officiel de la République du Congo, horodatage certifié et badge de validation vert.

---

## 3. Choix Techniques & Arbitrages

- **Format de l'URL du QR Code** :
  - *Choix retenu* : URL web absolue basée sur l'URL courante de l'application (ex. `window.location.origin + '/#verify-attestation?ref=...'`) encodant les paramètres essentiels (numéro de référence, nom de l'établissement, date de dépôt, hash d'intégrité).
  - *Raison* : Permet une lecture native immédiate par n'importe quelle caméra de smartphone (iOS/Android) sans nécessiter d'application tierce.
- **Accès public sans authentification** :
  - *Choix retenu* : Route publique dédiée dans l'application accessible directement sans exiger de connexion ou de mot de passe.
  - *Raison* : Un inspecteur ou une autorité de contrôle doit pouvoir scanner et constater immédiatement la validité du document sur le terrain.
- **Typographie Garamond** :
  - *Choix retenu* : Import Google Fonts `@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap');` combiné avec les polices système de secours (`Garamond, 'Times New Roman', serif`).
  - *Raison* : Garantit un rendu identique sur tous les navigateurs et lors de l'impression PDF/papier.

---

## 4. Architecture Technique & Flux de Données

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUX TECHNIQUE ATTESTATION                         │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────┐
  │ Module Canva de Rédaction       │
  │ (AdministrativeDraftingCanva)   │
  │ • Sélection "Attestation Dépôt" │
  │ • Typographie Garamond intégrale│
  │ • Édition texte modèle LE ROCHER│
  └────────────────┬────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────┐
  │ Service QR Code (qrService.ts)  │
  │ • Génération URL de vérification│
  │ • Encodage QR haute résolution  │
  └────────────────┬────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────────┐   ┌──────────────────────────────────────────────┐
│ Impression A4    │   │ Page Publique de Certification               │
│ (PrintModal.tsx) │   │ (AttestationVerificationView.tsx)            │
│ • Police Garamond│   │ • Détection ?verify-attestation ou hash      │
│ • QR Code réel   │   │ • Badge vert : "Document Certifié Conforme"  │
│ • Sceau officiel │   │ • Données : Établissement, Réf, DDL-PN, Sceau│
└──────────────────┘   └──────────────────────────────────────────────┘
```

### Plan de Déploiement & Vérification
1. Mettre à jour `index.html` et `src/index.css` pour inclure toutes les graisses de la police `EB Garamond`.
2. Mettre à jour `src/services/qrService.ts` avec la fonction de génération de lien de vérification scannable universel.
3. Créer la vue publique de certification `src/components/public/AttestationVerificationView.tsx`.
4. Intégrer la route publique dans `src/App.tsx`.
5. Intégrer le modèle officiel d'Attestation de Dépôt dans `AdministrativeDraftingCanvaModule.tsx` et `PrintModal.tsx`.
6. Valider le build avec `compile_applet`.
