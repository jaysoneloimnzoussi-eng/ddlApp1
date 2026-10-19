# Plan d'Implémentation — Module MOD-20 : Autorisation d'Exploitation Départementale

## 1. Synthèse Exécutive & Alignement Utilisateur

Conformément aux réponses fournies lors du cadrage interactif, nous créons un module autonome **MOD-20 : Autorisation d'Exploitation Départementale**.

Ce module permet à la **Direction Départementale des Loisirs de Pointe-Noire (MCAPNIT / DGL)** de délivrer, gérer, archiver et authentifier le **titre régalien suprême** accordé aux établissements de loisirs de Pointe-Noire : l'**Autorisation d'Exploitation Départementale Définitive** (renouvelable annuellement conformément à la Loi N° 21-2019 et à la Note de service N° 151/MTL-CAB).

### Critères & Modalités Clés Validés :
* **Déclenchement & Validation Souveraine** : Approbation directe et signature solennelle du **Directeur Départemental des Loisirs** (workflow d'instruction, visa de conformité SAA, visa financier SAF, et validation finale Directorale avec apposition du sceau et paraphe).
* **Restitution & Format Officiel** : 
  1. **Diplôme A4 Solennel Imprimable** : Mise en page prestigieuse grand format avec les armes et sceaux de la République du Congo (« *Unité - Travail - Progrès* »), liséré républicain tricolore (Vert-Jaune-Rouge), typographies officielles d'apparat (**Cinzel** pour les en-têtes et titres régaliens, **EB Garamond** pour les visas juridiques et formules d'octroi, **JetBrains Mono** pour la référence souveraine et l'horodatage cryptographique).
  2. **QR Code de Sécurité & Certification Publique** : Intégration d'un QR code infalsifiable renvoyant vers la vérification instantanée (`/?verify=autorisation&num=...`).
  3. **Exportation Word (.docx)** : Génération automatisée du document Word officiel conforme au protocole administratif de la République du Congo pour archivage et modifications bureautiques.
* **Intégration Applicative** : Module autonome **MOD-20** accessible dans la barre latérale (`Sidebar`), la navigation mobile (`MobileBottomNav`), la palette de commandes (`CommandPalette`) et synchronisé avec `AppContext` et Firebase Firestore.

---

## 2. Charte Graphique, Typographies & Architecture Visuelle

### A. Polices d'Écriture Officielles de la Direction
* **En-têtes d'État & Titres Récoltés** : `Cinzel` (Romain impérial, majuscules ciselées, espacement majestueux `tracking-widest`).
* **Corps de Texte Régalien & Formules Protocolaires** : `EB Garamond` (Élégance institutionnelle des actes administratifs d'État, italique de chancellerie pour les considérants et arrêtés).
* **Références, Numérotations & Sécurité SHA-256** : `JetBrains Mono` (Rigueur géométrique, zéro barré, lisibilité absolue des codes).
* **Interface Opérationnelle & Tableaux de Bord** : `Plus Jakarta Sans` (Clarté ergonomique moderne pour les listes, filtres et boutons).

### B. Palette de Couleurs Officielles & Papier d'Apparat
* **Fond Parchemin d'État** : Teinte ivoire antique (`#FCFBF7` / `slate-50`), bordure guillochée dorée bronze (`#B45309` / `#D97706`) et liseré républicain congolais.
* **Typographie Encre Noire Officielle** : Noir carbone institutionnel (`#0F172A` / `#1E293B`) avec rehauts vert émeraude républicain (`#047857`) et or ambré (`#B45309`).
* **Sceau Numérique & Filigrane** : Armoiries de la République du Congo en filigrane central anti-contrefaçon et sceau rond de la Direction Départementale des Loisirs.

---

## 3. Périmètre Technique & Fichiers Concernés

1. **`src/types/index.ts`** :
   * Définition de l'interface `DepartmentalAuthorization` (id, numeroAutorisation, dateDelivrance, dateExpiration, etablissementId, nomCommercial, promoteurNom, arrondissement, quartier, categorie, surfaceM2, statut, visaInspecteurChef, visaRegisseurSaf, signatureDirecteur, referenceArrete, qrCodeUrl, documentHash).
   * Extension de `AppModuleId` pour inclure `'MOD-20'`.
   * Extension du statut d'établissement (`'autorisation_definitive'`).

2. **`src/services/docxGenerator.ts`** :
   * Implémentation de la fonction `generateDepartmentalAuthorizationDocx` pour générer le fichier Word `.docx` officiel reprenant fidèlement les sceaux, visas et formules protocolaires.

3. **`src/services/qrService.ts`** :
   * Ajout de `generateAuthorizationQrCode(auth: DepartmentalAuthorization)` pour coder l'URL publique de vérification.

4. **`src/context/AppContext.tsx`** :
   * État `authorizations: DepartmentalAuthorization[]` synchronisé dans le `localStorage` (`ddl_real_authorizations_v5`) et Firestore (`departmentalAuthorizations`).
   * Méthodes `issueDepartmentalAuthorization`, `revokeDepartmentalAuthorization`, `validateDirectorSignature`.

5. **`src/components/modules/DepartmentalAuthorizationModule.tsx` (NOUVEAU COMPOSANT)** :
   * Tableau de bord d'instruction Directorale : dossiers éligibles (soldés ou dispensés), autorisations en cours d'instruction, autorisations délivrées et archivées.
   * Console d'approbation et signature Directorale en 1-clic avec cachet officiel.
   * Aperçu dynamique en direct du Diplôme d'Autorisation A4.
   * Boutons d'exportation : Imprimer Diplôme A4 officiel et Télécharger Word (.docx).

6. **`src/components/common/PrintModal.tsx`** :
   * Intégration du gabarit d'impression haute définition A4 `a4_departmental_authorization`.

7. **`src/components/common/PublicDocumentVerification.tsx`** & **`src/App.tsx`** :
   * Prise en charge de `?verify=auth` et `?verify=autorisation` pour authentifier publiquement le diplôme scanné par la police ou le public.

8. **`src/components/common/Sidebar.tsx`**, **`src/components/common/CommandPalette.tsx`** & **`src/components/common/MobileBottomNav.tsx`** :
   * Ajout de l'entrée `'MOD-20'` avec icône d'autorité (`Award` / `ShieldCheck`).

---

## 4. Étapes d'Exécution & Vérification

* **Étape 1** : Mise à jour des types (`index.ts`) et de la persistance centrale (`AppContext.tsx`).
* **Étape 2** : Ajout des générateurs Word (`docxGenerator.ts`) et QR Code (`qrService.ts`).
* **Étape 3** : Création du module complet `DepartmentalAuthorizationModule.tsx` respectant la charte graphique prestigieuse (Cinzel, EB Garamond, République du Congo).
* **Étape 4** : Intégration dans `PrintModal.tsx`, `Sidebar.tsx`, `App.tsx` et `CommandPalette.tsx`.
* **Étape 5** : Vérification de la compilation (`compile_applet`) et validation TypeScript (`lint_applet`).
