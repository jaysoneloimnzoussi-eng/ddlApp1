# Cycle Complet de Régularisation du Tenancier : Du Repérage au Solde

Plan d'architecture et de mise en œuvre pour intégrer de façon transversale le processus administratif et financier des tenanciers d'établissements de loisirs : repérage terrain, convocation officielle au forfait informel de 50 000 FCFA, négociation motivée du montant, encaissement fractionné (acomptes / solde) au bureau ou in situ, et délivrance des actes officiels.

---

## Synthèse des Décisions & Choix Confirmés

> [!IMPORTANT]
> Suite à vos réponses aux questions de cadrage, les principes suivants sont entérinés pour l'ensemble de la plateforme :
> - **Cycle intégré transverse** : Le cycle complet (Repérage $\to$ Convocation $\to$ Négociation $\to$ Acomptes / RDV $\to$ Solde $\to$ Autorisation) irrigue tous les modules clés (Recensement Terrain, Agenda & Brigade SAA, Régie SAF, Actes & Impressions A4).
> - **Document officiel initial** : Édition immédiate d'une **Convocation Officielle de Régularisation (Forfait initial 50 000 FCFA)** avec QR Code de contrôle, délai de comparution (8 à 15 jours) et liste des pièces à fournir.
> - **Négociation souple & traçabilité** : Possibilité d'ajuster librement le montant de la redevance à la baisse (ou à la hausse selon le standing réel) avec saisie obligatoire d'un motif de négociation archivé dans le journal d'audit.

---

## 1. Vue d'Ensemble & Cycle de Vie du Tenancier

Le cycle de régularisation s'articule autour de 4 étapes administratives interconnectées :

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CYCLE DE VIE DU TENANCIER                       │
└────────────────────────────────────────────────────────────────────────┘

  [ ÉTAPE 1 : REPÉRAGE IN SITU ]
  Inspecteur SAA repère l'établissement informel sur le terrain
  └─► Création dossier & Statut: `convocation_delivree`
  └─► Fixation du forfait initial standard : 50 000 FCFA
  └─► Génération immédiate de la Convocation A4 / QR Code / RDV comparution
               │
               ▼
  [ ÉTAPE 2 : PRÉSENTATION & NÉGOCIATION ]
  Le promoteur se présente à la Direction (ou lors de la tournée)
  └─► Dépôt des pièces d'identité et d'exploitation
  └─► Option d'ajustement du forfait (ex: 50 000 ➔ 35 000 FCFA)
  └─► Enregistrement du motif de révision + validation traçable
               │
               ▼
  [ ÉTAPE 3 : PAIEMENT FRACTIONNÉ & GESTION DES RENDEZ-VOUS ]
  Trois options opérationnelles pour le tenancier :
  ├─► Option A : Paiement immédiat d'un Acompte (ex: 20 000 FCFA) à la Régie
  │             └─► Quittance SAF instantanée + RDV automatique pour le reste
  ├─► Option B : Paiement sur place / sur le terrain à la brigade mobile
  │             └─► Quittance mobile in situ avec géolocalisation
  └─► Option C : Accord d'échéancier avec Rendez-vous ferme
                └─► Inscription prioritaire dans l'Agenda Google de la tournée
               │
               ▼
  [ ÉTAPE 4 : SOLDE DÉFINITIF & DÉLIVRANCE DES TITRES ]
  Reste à payer = 0 FCFA
  └─► Statut : `en_regle`
  └─► Délivrance de l'Attestation Provisoire ou de l'Autorisation Départementale
  └─► Programmation automatique du renouvellement à N+1 (date anniversaire)
```

---

## 2. Expérience Utilisateur & Nouveaux Écrans / Composants

### A. Fiche de Recensement & Repérage Terrain (MOD-02)
- **Forfait Informel par Défaut** : Le montant pré-rempli pour tout nouvel établissement informel ou repéré est configuré à **50 000 FCFA**.
- **Action 1-Clic « Délivrer Convocation »** : Un bouton dédié permet d'enregistrer le repérage et d'ouvrir instantanément le document officiel de convocation au format A4 avec QR Code.
- **Délai de comparution paramétrable** : Choix rapide de la date de présentation (sous 48h, 8 jours ou 15 jours) et du lieu (Direction Départementale ou bureau de brigade d'arrondissement).

### B. Interface d'Arbitrage & Négociation de la Redevance
- **Composant de révision financière** intégré dans la fiche établissement et dans le modal d'encaissement :
  - *Montant initial forfaitaire* : 50 000 FCFA (affiché en référence).
  - *Montant négocié / convenu* : Saisie libre (ex: 30 000, 35 000, 40 000 FCFA).
  - *Motif de la révision* (champ obligatoire) : Ex. *"Petite terrasse de quartier, faible capacité d'accueil constatée in situ"*.
  - *Agent négociateur* : Nom et matricule de l'inspecteur ou régisseur responsable.
- **Recalcul dynamique instantané** : Mise à jour automatique du solde restant dû et des acomptes.

### C. Modal d'Encaissement & Échéancier Fléchés
- **Modes de versement adaptés** :
  - *Au bureau (Caisse Régie SAF Trésor)* : Espèces ou virement Trésor.
  - *Sur le terrain (In situ Brigade SAA)* : Espèces ou Télépaiement mobile (Airtel Money / MTN MoMo).
- **Enregistrement de l'acompte + Prise de rendez-vous obligatoire** :
  - Dès qu'un acompte est saisi (ex: 15 000 FCFA sur 35 000 FCFA révisés), l'application propose immédiatement de fixer la date et l'heure du prochain rendez-vous pour solder le reste.
  - L'établissement est retiré des tâches du jour et basculé directement sur la date convenue dans le calendrier de tournée.

### D. Document Officiel A4 : Convocation Administrative Républicaine
Nouveau gabarit d'impression haute fidélité conforme aux standards de l'administration congolaise :
- En-tête officiel : *République du Congo, Unité - Travail - Progrès, Ministère du Tourisme et des Loisirs, Direction Départementale de Pointe-Noire*.
- Armoiries républicaines et ruban tricolore vert-jaune-rouge.
- Titre : **CONVOCATION POUR RÉGULARISATION ADMINISTRATIVE ET FISCALE D'EXPLOITATION**.
- Forfait réglementaire notifié : 50 000 FCFA (Catégorie Établissement Informel / Non immatriculé).
- Date et heure limites de comparution à la Direction Départementale.
- Liste des pièces à apporter :
  1. Copie de la pièce d'identité du promoteur / gérant
  2. Contrat de bail ou titre d'occupation des lieux
  3. Registre du commerce (RCCM) ou déclaration d'activité (si existant)
  4. Quittances antérieures éventuelles
- Mentions légales d'avertissement en cas de non-présentation (mise en demeure et fermeture conservatoire selon la Loi n° 21-2019).
- QR Code sécurisé avec vérification instantanée de l'authenticité de la convocation.
- Bouton d'export Word (`.docx`) et Impression directe A4.

---

## 3. Architecture Technique & Modèle de Données

### Évolution du Modèle de Données (`src/types/index.ts`)
```typescript
export interface NegociationRedevance {
  montantInitialForfaitaire: number; // 50 000 FCFA par défaut
  montantNegocieConvenu: number;     // ex: 35 000 FCFA
  motifNegociation: string;          // justification économique/technique
  dateNegociation: string;
  agentId: string;
  agentNom: string;
}

export interface ConvocationAdministrative {
  id: string;
  referenceConvocation: string;      // ex: CONV-2026-PN-0042
  dateEmission: string;
  dateComparution: string;
  heureComparution?: string;
  lieuComparution: string;           // "Direction Départementale (Bâtiment de la Préfecture, Centre-Ville, en face du Trésor Public, au rez-de-chaussée)"
  montantForfaitNotifie: number;     // 50 000 FCFA
  statut: 'remise_sur_le_terrain' | 'presente' | 'renegociee' | 'soldee' | 'echue';
  documentsRequis: string[];
  observationsTerrain?: string;
}
```

### Intégration dans `Establishment`
- Ajout du statut `'convocation_delivree'` et `'negociation_en_cours'` aux côtés de `'acompte_verse'`, `'en_regle'` et `'mise_en_demeure'`.
- Stockage de l'historique de la négociation et de la dernière convocation émise.
- Synchronisation automatique et transparente dans Firestore avec persistance locale souveraine.

---

## 4. Plan de Déploiement par Étape

1. **Modèle & Types (`src/types/index.ts`)** : Déclaration des types `ConvocationAdministrative`, `NegociationRedevance` et mise à jour de `Establishment`.
2. **Context & Logique Métier (`AppContext.tsx`)** :
   - Initialisation du forfait informel à 50 000 FCFA lors de la création d'une fiche.
   - Méthode `issueConvocation(establishmentId, params)` générant la convocation horodatée avec QR Code.
   - Méthode `negotiateRedevance(establishmentId, nouveauMontant, motif)` mettant à jour le solde et créant l'entrée d'audit.
3. **Gabarit d'Impression A4 (`PrintModal.tsx` & `printTemplates.ts`)** :
   - Modèle officiel d'impression A4 de la Convocation de régularisation républicaine avec QR Code.
   - Export Word `.docx` prêt à l'emploi.
4. **Mise à jour des Vues Utilisateur** :
   - Module Recensement de terrain (`FieldRecensementModule.tsx`) : bouton d'émission de convocation et forfait informel 50 000 FCFA.
   - Module Agenda / Calendrier (`MobileAgentCalendarModule.tsx`) : affichage du badge Convocation, bouton d'ajustement/négociation du montant, et encaissement avec date de prochain RDV.
   - Module Régie SAF & Tableaux de bord : filtres rapides par statut (Convoqués, En négociation, Acomptes, Soldés).
