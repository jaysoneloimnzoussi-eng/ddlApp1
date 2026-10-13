import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  CheckCircle2,
  Send,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Building2,
  Search,
  PlusCircle,
  Check,
  Target,
} from 'lucide-react';
import { OfficialDocumentHeader } from '../common/OfficialDocumentHeader';
import { printHtmlElement } from '../../services/printService';
import { generateUniversalAdministrativeDocx, generatePta2026Docx } from '../../services/docxGenerator';
import { generateAttestationQrCode, getAttestationVerificationUrl } from '../../services/qrService';
import { formatCfa } from '../../services/crypto';
import { Arrondissement, EstablishmentCategory, QUARTIERS_PAR_ARRONDISSEMENT } from '../../types';
import { Pta2026CanvaEditor, Pta2026CanvaPreview } from './Pta2026CanvaSection';

export type AdminDocType =
  | 'plan_travail_annuel'
  | 'lettre_transmission'
  | 'attestation_depot'
  | 'recepisse_conformite'
  | 'rapport_activite'
  | 'convocation'
  | 'invitation'
  | 'termes_de_reference'
  | 'note_service'
  | 'soit_transmis'
  | 'decision_departementale';

interface DocumentSectionItem {
  id: string;
  titre?: string;
  contenu: string;
}

export const AdministrativeDraftingCanvaModule: React.FC = () => {
  const { establishments, addEstablishment, showNotification, setActiveModule, officialPtaData } = useApp();

  // Selected template type
  const [docType, setDocType] = useState<AdminDocType>('plan_travail_annuel');
  const [attestationQrCodeUrl, setAttestationQrCodeUrl] = useState<string>('');

  // Interactive margin controls (Congolese official standard: Left 2.5cm, Right 2.0cm, Top 2.0cm, Bottom 2.0cm)
  const [margeGaucheCm, setMargeGaucheCm] = useState<number>(2.5);
  const [margeDroiteCm, setMargeDroiteCm] = useState<number>(2.0);
  const [margeHautCm, setMargeHautCm] = useState<number>(2.0);
  const [margeBasCm, setMargeBasCm] = useState<number>(2.0);

  // Form fields : Numéro d'acte NON généré automatiquement (saisie manuelle par l'agent)
  const [numeroActe, setNumeroActe] = useState<string>('');
  const [dateLieu, setDateLieu] = useState<string>('Pointe-Noire, le 12 octobre 2026');
  const [emetteurTitre, setEmetteurTitre] = useState<string>('Le Directeur Départemental des Loisirs de Pointe-Noire');
  const [destinataireTitre, setDestinataireTitre] = useState<string>('');
  const [destinataireVille, setDestinataireVille] = useState<string>('');
  const [titreCentral, setTitreCentral] = useState<string>('ATTESTATION DE DÉPÔT');
  const [objet, setObjet] = useState<string>("Dépôt de dossier technique d'agrément d'établissement de loisirs");
  const [reference, setReference] = useState<string>('');
  const [formuleAppel, setFormuleAppel] = useState<string>('');
  const [signataireNom, setSignataireNom] = useState<string>('Jean Richard NTSEKE NGOUAKA');
  const [signataireTitre, setSignataireTitre] = useState<string>('Le Directeur Départemental des Loisirs de Pointe-Noire');
  const [piecesJointes, setPiecesJointes] = useState<string>('Récépissé de versement SAF et Quittance de régularisation.');
  const [ampliations, setAmpliations] = useState<string>(
    '- DGL / Brazzaville\n- Préfecture du Département de Pointe-Noire\n- Mairie Centrale de Pointe-Noire\n- Brigade de Salubrité Acoustique (SAA)\n- Archives / Chrono'
  );

  // Établissement actif lié (pour le texte et le QR code de certification)
  const [currentEstDetails, setCurrentEstDetails] = useState<{
    nom: string;
    promoteur: string;
    codeDossier: string;
    arrondissement: string;
    quartier: string;
    categorie: string;
  }>({
    nom: 'LE ROCHER',
    promoteur: 'Monsieur Jack MATOKO',
    codeDossier: 'DDL-PN-2026-REC-042',
    arrondissement: 'Tié-Tié',
    quartier: 'Fond Tié-Tié',
    categorie: 'Bar Dancing / Cabaret',
  });

  // Mode de gestion établissement dans le Canva
  const [etablissementSourceMode, setEtablissementSourceMode] = useState<'select_db' | 'create_db' | 'manual'>('select_db');
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>('');
  const [etablissementSearch, setEtablissementSearch] = useState<string>('');

  // Formulaire d'enregistrement rapide d'un nouvel espace dans la base de données
  const [newEstNom, setNewEstNom] = useState<string>('');
  const [newEstPromoteur, setNewEstPromoteur] = useState<string>('');
  const [newEstTelephone, setNewEstTelephone] = useState<string>('');
  const [newEstArrondissement, setNewEstArrondissement] = useState<Arrondissement>('Tié-Tié');
  const [newEstQuartier, setNewEstQuartier] = useState<string>('Fond Tié-Tié');
  const [newEstCategorie, setNewEstCategorie] = useState<EstablishmentCategory>('Bar Dancing / Cabaret');
  const [isSavingNewEst, setIsSavingNewEst] = useState<boolean>(false);

  // Sections of document body (Modèle sans statut de loi non vérifié)
  const [sections, setSections] = useState<DocumentSectionItem[]>([
    {
      id: '1',
      titre: '',
      contenu:
        "Le Directeur Départemental des Loisirs de Pointe-Noire soussigné atteste par la présente que l'établissement de loisirs dénommé « LE ROCHER », exploité par Monsieur Jack MATOKO, relevant de la catégorie Bar Dancing / Cabaret, sis à Pointe-Noire, Arrondissement Tié-Tié (Quartier Fond Tié-Tié), a régulièrement déposé auprès de nos services son dossier technique de régularisation et d'obtention de l'agrément d'exploitation, et s'est acquitté des redevances départementales requises auprès de la Régie Financière.",
    },
    {
      id: '2',
      titre: '',
      contenu:
        "La présente attestation confère au promoteur la faculté de poursuivre ses activités à titre strictement transitoire, en attendant la délivrance solennelle de l'Agrément Ministériel Définitif instruit par la Direction Générale des Loisirs à Brazzaville. L'exploitant s'engage expressément à respecter les prescriptions réglementaires en vigueur, notamment en ce qui concerne la salubrité des lieux, la sécurité physique des usagers et la préservation de la tranquillité publique.",
    },
    {
      id: '3',
      titre: '',
      contenu:
        "Délivrée pour valoir et servir ce que de droit, la présente attestation est valable pour une période de quatre-vingt-dix (90) jours renouvelable à compter de sa signature, et demeure révocable sans préavis en cas de constatation d'infraction caractérisée ou de trouble grave à la tranquillité publique.",
    },
  ]);

  // Synchronisation dynamique du QR Code scannable officiel (placé en haut à droite)
  useEffect(() => {
    let isMounted = true;
    const updateQr = async () => {
      try {
        const qrUrl = await generateAttestationQrCode(
          {
            referenceNumero: numeroActe.trim() || 'RÉFÉRENCE EN COURS D\'ENREGISTREMENT',
            etablissementNom: currentEstDetails.nom,
            promoteurNom: currentEstDetails.promoteur,
            dateDepot: dateLieu,
            codeDossier: currentEstDetails.codeDossier,
            statut: 'CONFORME ET REGULIER',
          },
          160
        );
        if (isMounted) {
          setAttestationQrCodeUrl(qrUrl);
        }
      } catch (err) {
        console.error('Erreur génération QR Code Attestation:', err);
      }
    };
    updateQr();
    return () => {
      isMounted = false;
    };
  }, [numeroActe, dateLieu, currentEstDetails]);

  // Injecte les données d'un établissement dans le texte de l'attestation
  const applyEstablishmentData = (data: {
    nom: string;
    promoteur: string;
    arrondissement: string;
    quartier?: string;
    categorie: string;
    codeDossier?: string;
  }) => {
    setCurrentEstDetails({
      nom: data.nom,
      promoteur: data.promoteur,
      codeDossier: data.codeDossier || 'DDL-PN-REC-2026',
      arrondissement: data.arrondissement,
      quartier: data.quartier || '',
      categorie: data.categorie,
    });

    const quartierText = data.quartier ? ` (Quartier ${data.quartier})` : '';

    setSections((prev) => {
      const updated = [...prev];
      if (updated[0]) {
        updated[0] = {
          ...updated[0],
          contenu: `Le Directeur Départemental des Loisirs de Pointe-Noire soussigné atteste par la présente que l'établissement de loisirs dénommé « ${data.nom.toUpperCase()} », exploité par ${data.promoteur}, relevant de la catégorie ${data.categorie}, sis à Pointe-Noire, Arrondissement ${data.arrondissement}${quartierText}, a régulièrement déposé auprès de nos services son dossier technique de régularisation et d'obtention de l'agrément d'exploitation, et s'est acquitté des redevances départementales requises auprès de la Régie Financière.`,
        };
      }
      return updated;
    });
  };

  // Sélection d'un établissement existant depuis la base de données
  const handleSelectFromDb = (estId: string) => {
    setSelectedEstablishmentId(estId);
    const est = establishments.find((e) => e.id === estId);
    if (!est) return;

    applyEstablishmentData({
      nom: est.nomCommercial,
      promoteur: est.promoteurNom,
      arrondissement: est.arrondissement,
      quartier: est.quartier,
      categorie: est.categorie,
      codeDossier: est.codeDossier,
    });

    showNotification('info', `Données de « ${est.nomCommercial} » extraites de la base de données.`);
  };

  // Enregistrement in situ d'un nouvel établissement en base de données + injection attestation
  const handleCreateAndApplyNewEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstNom.trim()) {
      showNotification('warning', "Veuillez renseigner le nom commercial de l'établissement.");
      return;
    }

    setIsSavingNewEst(true);
    try {
      const created = await addEstablishment({
        nomCommercial: newEstNom.trim(),
        promoteurNom: newEstPromoteur.trim() || 'Promoteur non renseigné',
        promoteurTelephone: newEstTelephone.trim() || '06 000 00 00',
        arrondissement: newEstArrondissement,
        quartier: newEstQuartier.trim() || 'Centre',
        adresseExacte: `${newEstArrondissement}, ${newEstQuartier}`,
        categorie: newEstCategorie,
        regimeFiscal: 'informel_forfaitaire',
        surfaceM2: 120,
        montantRedevanceAnnuelle: 150000,
        montantEncaisse: 50000,
        soldeRestantDu: 100000,
        statut: 'attestation_provisoire',
        latitude: -4.77,
        longitude: 11.86,
        niveauDecibelsMoyen: 65,
        limiteurInstalle: false,
        dateRecensement: new Date().toISOString().split('T')[0],
        recensePar: 'Direction Départementale des Loisirs',
        agentAssigneId: 'stf-001',
        agentAssigneNom: 'Direction Centrale DDL-PN',
      });

      setSelectedEstablishmentId(created.id);
      applyEstablishmentData({
        nom: created.nomCommercial,
        promoteur: created.promoteurNom,
        arrondissement: created.arrondissement,
        quartier: created.quartier,
        categorie: created.categorie,
        codeDossier: created.codeDossier,
      });

      // Réinitialiser les champs de création
      setNewEstNom('');
      setNewEstPromoteur('');
      setNewEstTelephone('');
      setEtablissementSourceMode('select_db');

      showNotification('success', `Nouvel établissement « ${created.nomCommercial} » enregistré en base de données et lié à l'attestation !`);
    } catch (err) {
      console.error("Erreur enregistrement établissement:", err);
      showNotification('error', "Échec de l'enregistrement de l'établissement en base de données.");
    } finally {
      setIsSavingNewEst(false);
    }
  };

  // Liste filtrée des établissements pour recherche rapide
  const filteredEstablishments = useMemo(() => {
    if (!etablissementSearch.trim()) return establishments;
    const q = etablissementSearch.toLowerCase();
    return establishments.filter(
      (e) =>
        e.nomCommercial.toLowerCase().includes(q) ||
        e.promoteurNom.toLowerCase().includes(q) ||
        e.arrondissement.toLowerCase().includes(q) ||
        (e.quartier && e.quartier.toLowerCase().includes(q))
    );
  }, [establishments, etablissementSearch]);

  // Quick preset loader with authentic administrative content
  const handleLoadPreset = (type: AdminDocType) => {
    setDocType(type);
    if (type === 'plan_travail_annuel') {
      setTitreCentral('PLAN DE TRAVAIL ANNUEL 2026');
      return;
    }
    if (type === 'attestation_depot') {
      setNumeroActe(''); // Numéro vide pour saisie manuelle sans autogénération
      setDateLieu('Pointe-Noire, le 12 octobre 2026');
      setEmetteurTitre('Le Directeur Départemental des Loisirs de Pointe-Noire');
      setDestinataireTitre('');
      setDestinataireVille('');
      setTitreCentral('ATTESTATION DE DÉPÔT');
      setObjet("Dépôt de dossier technique d'agrément d'établissement de loisirs");
      setReference(''); // Référence non obligatoire / sans lois arbitraires
      setFormuleAppel('');
      setSignataireTitre('Le Directeur Départemental des Loisirs de Pointe-Noire');
      setSignataireNom('Jean Richard NTSEKE NGOUAKA');
      setPiecesJointes('Récépissé de versement SAF et Quittance de régularisation.');
      setAmpliations(
        '- DGL / Brazzaville\n- Préfecture du Département de Pointe-Noire\n- Mairie Centrale de Pointe-Noire\n- Brigade de Salubrité Acoustique (SAA)\n- Archives / Chrono'
      );
      setSections([
        {
          id: '1',
          titre: '',
          contenu: `Le Directeur Départemental des Loisirs de Pointe-Noire soussigné atteste par la présente que l'établissement de loisirs dénommé « ${currentEstDetails.nom.toUpperCase()} », exploité par ${currentEstDetails.promoteur}, relevant de la catégorie ${currentEstDetails.categorie}, sis à Pointe-Noire, Arrondissement ${currentEstDetails.arrondissement}${currentEstDetails.quartier ? ` (Quartier ${currentEstDetails.quartier})` : ''}, a régulièrement déposé auprès de nos services son dossier technique de régularisation et d'obtention de l'agrément d'exploitation, et s'est acquitté des redevances départementales requises auprès de la Régie Financière.`,
        },
        {
          id: '2',
          titre: '',
          contenu:
            "La présente attestation confère au promoteur la faculté de poursuivre ses activités à titre strictement transitoire, en attendant la délivrance solennelle de l'Agrément Ministériel Définitif instruit par la Direction Générale des Loisirs à Brazzaville. L'exploitant s'engage expressément à respecter les prescriptions réglementaires en vigueur, notamment en ce qui concerne la salubrité des lieux, la sécurité physique des usagers et la préservation de la tranquillité publique.",
        },
        {
          id: '3',
          titre: '',
          contenu:
            "Délivrée pour valoir et servir ce que de droit, la présente attestation est valable pour une période de quatre-vingt-dix (90) jours renouvelable à compter de sa signature, et demeure révocable sans préavis en cas de constatation d'infraction caractérisée ou de trouble grave à la tranquillité publique.",
        },
      ]);
    } else if (type === 'recepisse_conformite') {
      setNumeroActe('');
      setDateLieu(`Pointe-Noire, le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`);
      setEmetteurTitre('Le Directeur Départemental des Loisirs de Pointe-Noire');
      setDestinataireTitre('');
      setDestinataireVille('');
      setTitreCentral('RÉCÉPISSÉ DE DÉPÔT & BORDEREAU DE CONFORMITÉ DES PIÈCES');
      setObjet("Instruction de dossier technique d'agrément d'établissement de loisirs (Notes N° 151 & 152/MTL-CAB)");
      setReference('Note de Service N° 151/MTL-CAB du 03 août 2022 et Note de Service N° 152/MTL-CAB du 05 août 2022');
      setFormuleAppel('');
      setSignataireTitre('Le Directeur Départemental des Loisirs de Pointe-Noire');
      setSignataireNom('Jean Richard NTSEKE NGOUAKA');
      setPiecesJointes("Dossier physique relié, Quitus Sapeurs-Pompiers, Quittance SAF d'enquête terrain (30.000 FCFA)");
      setAmpliations(
        '- DGL / Brazzaville\n- Préfecture de Pointe-Noire\n- Mairie Centrale de Pointe-Noire\n- Service Administratif et Financier (SAF)\n- Archives / Chrono'
      );
      setSections([
        {
          id: '1',
          titre: 'I. IDENTIFICATION DU PROMOTEUR ET DE L\'ESPACE',
          contenu: `Le Directeur Départemental des Loisirs de Pointe-Noire certifie avoir reçu ce jour le dossier complet de demande d'autorisation d'ouverture et d'exploitation de l'établissement dénommé « ${currentEstDetails.nom.toUpperCase()} », exploité par ${currentEstDetails.promoteur}, relevant de la catégorie ${currentEstDetails.categorie}, sis à Pointe-Noire, Arrondissement ${currentEstDetails.arrondissement}${currentEstDetails.quartier ? ` (Quartier ${currentEstDetails.quartier})` : ''}.`,
        },
        {
          id: '2',
          titre: 'II. ÉTAT DE CONFORMITÉ DES QUATRE (04) SOUS-DOSSIERS (NOTE 152/MTL-CAB)',
          contenu: `Après vérification contradictoire au guichet de la Direction Départementale, la composition du dossier est certifiée régulière :
• DEMANDE ÉCRITE : Demande manuscrite réglementaire adressée au Ministre chargé des loisirs.
• SOUS-DOSSIER TECHNIQUE : Plan de masse et de situation, règlement intérieur, quitus des sapeurs-pompiers, quitus CNSS, contrat de bail ou titre de propriété en République du Congo.
• SOUS-DOSSIER ADMINISTRATIF : Pièce d'identité en cours de validité, certificat de nationalité, casier judiciaire datant de moins de 3 mois, CV du gérant, certificat médical délivré par les services d'hygiène, attestation RCCM, statuts notariés.
• SOUS-DOSSIER FINANCIER : Patente de l'année en cours, compte d'exploitation prévisionnel sur 3 ans, attestation d'assurance multirisque professionnelle.`,
        },
        {
          id: '3',
          titre: 'III. SITUATION FINANCIÈRE RÉGALIENNE & ENQUÊTE DE TERRAIN',
          contenu: `Le promoteur s'est acquitté des frais d'enquête de terrain départementale d'un montant de trente mille (30.000) Francs CFA auprès de la Régie SAF (quittance enregistrée), ainsi que des frais d'étude du dossier (taux légal de 50% de la redevance fixé par la Note N° 151/MTL-CAB). La descente sur site de la brigade de contrôle SAA est programmée.`,
        },
        {
          id: '4',
          titre: 'IV. PORTÉE ET VALEUR DU RÉCÉPISSÉ',
          contenu: `Le présent récépissé est délivré pour valoir et servir ce que de droit, et atteste de la parfaite recevabilité du dossier instruit par nos services avant transmission hiérarchique à la Direction Générale des Loisirs pour délivrance de l'Agrément Ministériel. Il confère le droit d'exercice transitoire pour une durée maximale de quatre-vingt-dix (90) jours.`,
        },
      ]);
    } else if (type === 'lettre_transmission') {
      setNumeroActe('N°035/MCAPNIT/DGL/DPN/DDL-PN');
      setDateLieu('Pointe-Noire, le 08 octobre 2026');
      setEmetteurTitre('Le Directeur Départemental des Loisirs de Pointe-Noire');
      setDestinataireTitre('Madame la Directrice Générale des Loisirs');
      setDestinataireVille('Brazzaville');
      setTitreCentral('');
      setObjet("Transmission du Rapport d'Activités du 3ème Trimestre 2026.");
      setReference('N°033/MCAPNIT/DGL/DPN/DDL-PN du 23 septembre 2026.');
      setFormuleAppel('Madame la Directrice Générale,');
      setPiecesJointes("Rapport d'Activités du 3ème Trimestre 2026.");
      setSections([
        {
          id: '1',
          titre: '',
          contenu:
            "J'ai l'honneur de vous transmettre, ci-joint, le Rapport d'Activités du troisième trimestre 2026 de la Direction Départementale des Loisirs de Pointe-Noire, couvrant la période du 1er juillet au 30 septembre 2026.",
        },
        {
          id: '2',
          titre: '',
          contenu:
            "Ce rapport rend fidèlement compte des réalisations des quatre services techniques (SAA, SAF, SPA, SSI), de notre participation aux cérémonies officielles départementales du mois de septembre, ainsi que des contraintes logistiques prioritaires dont le dénouement requiert votre bienveillant arbitrage.",
        },
        {
          id: '3',
          titre: '',
          contenu:
            "Veuillez agréer, Madame la Directrice Générale, l'expression de ma considération très distinguée.",
        },
      ]);
    } else if (type === 'rapport_activite') {
      setNumeroActe('N°033/MCAPNIT/DGL/DPN/DDL-PN/RAP');
      setDestinataireTitre('Monsieur le Directeur Général des Loisirs');
      setDestinataireVille('Brazzaville');
      setTitreCentral('RAPPORT D\'ACTIVITÉS DU TROISIÈME TRIMESTRE 2026');
      setObjet("Bilan d'exécution des missions départementales de régulation des loisirs (Juillet - Septembre 2026)");
      setReference('Plan de Travail Annuel (PTA 2026) et Loi N° 21-2019 du 13 juin 2019');
      setFormuleAppel('Monsieur le Directeur Général,');
      setPiecesJointes('Tableaux statistiques consolidés SSI et états d\'émargement SAF.');
      setSections([
        {
          id: '1',
          titre: 'I. SITUATION ADMINISTRATIVE ET GOUVERNANCE',
          contenu:
            "Au cours du troisième trimestre 2026, la Direction Départementale des Loisirs a poursuivi la mise en œuvre de ses missions régaliennes avec rigueur. La concertation hebdomadaire de coordination technique a permis de traiter avec diligence cent pour cent (100%) du courrier reçu et de consolider nos relations de travail avec les institutions préfectorales et municipales de Pointe-Noire.",
        },
        {
          id: '2',
          titre: 'II. CONTRÔLE DE SALUBRITÉ ACOUSTIQUE ET POLICE ADMINISTRATIVE (SAA)',
          contenu:
            "La brigade mobile départementale a conduit trente-quatre (34) missions d'inspection inopinée, tant de jour que de nuit, dans les six arrondissements de la ville. Sur cent-vingt (120) établissements audités au sonomètre étalonné, 78% respectent désormais le seuil réglementaire de 65 dB(A). Douze (12) mises en demeure ont été formellement notifiées pour émergences sonores excessives.",
        },
        {
          id: '3',
          titre: 'III. RECOUVREMENT DES REDEVANCES DÉPARTEMENTALES (SAF)',
          contenu:
            "La Régie Financière SAF a enregistré au troisième trimestre un montant total d'encaissements de 6 950 000 FCFA au titre des redevances annuelles et des frais d'enregistrement de dossiers d'agrément, marquant une progression de 18% par rapport au trimestre précédent.",
        },
        {
          id: '4',
          titre: 'IV. RECOMMANDATIONS ET PERSPECTIVES POUR LE QUATRIÈME TRIMESTRE',
          contenu:
            "Il apparaît urgent d'allouer à la brigade départementale un véhicule de patrouille dédié et deux sonomètres de précision supplémentaires, ainsi que d'intensifier la sensibilisation de proximité auprès des exploitants de loisirs des arrondissements périphériques (Mongo-Poukou et Ngoyo).",
        },
      ]);
    } else if (type === 'convocation') {
      setNumeroActe('N°038/MCAPNIT/DGL/DPN/DDL-PN/SAA');
      setDestinataireTitre('Monsieur le Promoteur de l\'Établissement de Loisirs');
      setDestinataireVille('Pointe-Noire');
      setTitreCentral('CONVOCATION OFFICIELLE');
      setObjet('Convocation pour régularisation administrative et conciliation sonométrique (Loi N° 21-2019)');
      setReference('Procès-verbal de constatation sonométrique contradictoire de la Brigade SAA N°PV-2026/089');
      setFormuleAppel('Monsieur le Promoteur,');
      setPiecesJointes('Fiche technique de mesure contradictoire (78 dB(A) relevé à 23h30).');
      setSections([
        {
          id: '1',
          titre: '1. MOTIF DE LA CONVOCATION',
          contenu:
            "Vous êtes prié de vous présenter personnellement, ou dûment représenté par un mandataire légal, auprès des services techniques de la Direction Départementale des Loisirs de Pointe-Noire le vendredi 16 octobre 2026 à 10 heures précises, au bureau du Chef de Service de l'Animation et des Agréments (SAA).",
        },
        {
          id: '2',
          titre: '2. OBJET DU DOSSIER',
          contenu:
            "Cette convocation fait suite aux contrôles de terrain nocturnes ayant mis en évidence des émergences sonores répétées excédant le seuil réglementaire de 65 dB(A) fixé par la Loi N° 21-2019, ainsi qu'au défaut de quittance de paiement de votre redevance annuelle auprès de la Régie Financière SAF.",
        },
        {
          id: '3',
          titre: '3. PIÈCES EXIGÉES ET MESURES CONSERVATOIRES',
          contenu:
            "Vous voudrez bien vous munir de votre attestation provisoire d'enregistrement, de vos quittances de paiement SAF, ainsi que des spécifications techniques de vos équipements d'amplification sonore. À défaut de comparution à la date fixée, une mesure conservatoire de fermeture administrative immédiate sera requise.",
        },
      ]);
    } else if (type === 'invitation') {
      setNumeroActe('N°039/MCAPNIT/DGL/DPN/DDL-PN/INV');
      setDestinataireTitre('Mesdames et Messieurs les Promoteurs et Exploitants d\'Établissements de Loisirs');
      setDestinataireVille('Pointe-Noire');
      setTitreCentral('INVITATION OFFICIELLE');
      setObjet('Invitation à la Table Ronde Départementale sur la Salubrité Acoustique et les Loisirs Sains');
      setReference('Campagne départementale de vulgarisation de la Loi N° 21-2019 du 13 juin 2019');
      setFormuleAppel('Mesdames, Messieurs les Promoteurs,');
      setPiecesJointes('Ordre du jour de la réunion et guide pratique des agréments ministériels.');
      setSections([
        {
          id: '1',
          titre: '1. CADRE DE LA CONCERTATION',
          contenu:
            "J'ai l'honneur de vous inviter à prendre part aux travaux de la table ronde départementale d'information et de concertation que la Direction Départementale des Loisirs de Pointe-Noire organise le mardi 27 octobre 2026 à 09 heures précises dans la grande salle des conférences de la Mairie Centrale de Pointe-Noire.",
        },
        {
          id: '2',
          titre: '2. OBJECTIFS DES ÉCHANGES',
          contenu:
            "Cette rencontre solennelle vise à faire le point sur l'application de la réglementation des seuils sonores nocturnes (65 dB(A)), à vulgariser les modalités d'obtention des agréments ministériels définitifs et à promouvoir un partenariat de civisme environnemental entre l'administration publique et les acteurs économiques des loisirs.",
        },
        {
          id: '3',
          titre: '3. CONFIRMATION DE PARTICIPATION',
          contenu:
            "Compte tenu de la haute portée institutionnelle de cet événement placé sous le patronage des autorités départementales, votre présence effective est vivement attendue.",
        },
      ]);
    } else if (type === 'termes_de_reference') {
      setNumeroActe('N°040/MCAPNIT/DGL/DPN/DDL-PN/TDR');
      setDestinataireTitre('');
      setDestinataireVille('');
      setTitreCentral('TERMES DE RÉFÉRENCE (TDR)');
      setObjet("Mission de Recensement Géolocalisé et d'Audit Acoustique des Établissements de Loisirs (T4 2026)");
      setReference('Rapport d\'Activités du Troisième Trimestre 2026 et Directives Générales DGL Brazzaville');
      setFormuleAppel('');
      setPiecesJointes('Fiche technique d\'enquête SIG et calendrier prévisionnel des tournées.');
      setSections([
        {
          id: '1',
          titre: 'I. CONTEXTE ET JUSTIFICATION',
          contenu:
            "La prolifération des espaces festifs et récréatifs dans le Département de Pointe-Noire exige une actualisation exhaustive du répertoire statistique départemental. Afin d'assurer un encadrement réglementaire optimal, de préserver la tranquillité des riverains et de sécuriser les recettes non fiscales de l'État, la conduite d'un recensement géolocalisé s'impose.",
        },
        {
          id: '2',
          titre: 'II. OBJECTIFS SPÉCIFIQUES DE L\'OPÉRATION',
          contenu:
            "1. Géolocaliser par coordonnées GPS l'ensemble des débits de boissons, cabarets, dancings, terrasses et boîtes de nuit dans les six arrondissements.\n2. Évaluer le niveau de conformité acoustique à l'aide de sonomètres numériques de précision.\n3. Auditer l'acquittement des droits départementaux SAF et assister les promoteurs dans l'obtention de l'agrément ministériel.",
        },
        {
          id: '3',
          titre: 'III. MÉTHODOLOGIE ET LIVRABLES ATTENDUS',
          contenu:
            "La brigade mobile opérera par maillage d'arrondissement sur une période de trente (30) jours ouvrés. Les livrables comprendront une base de données SIG cartographique, une synthèse statistique des conformités et un rapport général adressé à la DGL à Brazzaville.",
        },
      ]);
    } else if (type === 'note_service') {
      setNumeroActe('N°042/MCAPNIT/DGL/DPN/DDL-PN/NOTE');
      setDestinataireTitre('Mesdames et Messieurs les Exploitants d\'Établissements de Loisirs');
      setDestinataireVille('Pointe-Noire');
      setTitreCentral('NOTE DE SERVICE CIRCULAIRE');
      setObjet('Rappel des dispositions relatives aux émergences sonores et aux déclarations préalables');
      setReference('Loi N° 21-2019 du 13 juin 2019 fixant les règles applicables aux activités de loisirs');
      setFormuleAppel('Mesdames et Messieurs les Exploitants,');
      setPiecesJointes('Barème réglementaire des seuils sonores autorisés.');
      setSections([
        {
          id: '1',
          titre: '1. RESPECT DES SEUILS ACOUSTIQUES NOCTURNES',
          contenu:
            "Il est formellement rappelé à l'ensemble des promoteurs de bars-dancings, terrasses, cabarets et boîtes de nuit que le niveau de pression acoustique extérieur ne saurait excéder soixante-cinq décibels (65 dB(A)) au-delà de 22 heures, sous peine de mise en demeure et de fermeture administrative immédiate.",
        },
        {
          id: '2',
          titre: '2. OBLIGATION D\'ATTESTATION PROVISOIRE',
          contenu:
            "Tout établissement ne disposant pas d'un agrément définitif ou d'une attestation provisoire de dépôt délivrée par la Direction Départementale est tenu de se rapprocher sans délai du guichet unique du Service SAA pour régulariser sa situation administrative.",
        },
      ]);
    } else if (type === 'soit_transmis') {
      setNumeroActe('BT-2026/10/002/DDL-PN-DGL');
      setDestinataireTitre('Madame la Directrice Générale des Loisirs');
      setDestinataireVille('Brazzaville');
      setTitreCentral('BORDEREAU D\'ENVOI (SOIT-TRANSMIS)');
      setObjet("Transmission de vingt-quatre (24) dossiers pour délivrance d'agrément ministériel");
      setReference('Loi N° 21-2019 et décrets d\'application relatifs aux agréments');
      setFormuleAppel('');
      setPiecesJointes('Dossiers d\'établissements régularisés et quittances SAF Trésor.');
      setSections([
        {
          id: '1',
          titre: 'DÉSIGNATION DES PIÈCES TRANSMISES',
          contenu:
            "Sont transmis ce jour sous pli officiel à la Direction Générale des Loisirs à Brazzaville les dossiers d'établissements de loisirs de Pointe-Noire ayant satisfait aux audits techniques d'acoustique, d'hygiène et au paiement intégral des droits départementaux requis.",
        },
        {
          id: '2',
          titre: 'POUR ATTRIBUTION ET DÉCISION',
          contenu:
            "Ces dossiers complets sont transmis pour instruction technique définitive, validation ministérielle et signature des arrêtés d'agrément par Son Excellence Madame la Ministre.",
        },
      ]);
    } else if (type === 'decision_departementale') {
      setNumeroActe('N°044/MCAPNIT/DGL/DPN/DDL-PN/DEC');
      setDestinataireTitre('');
      setDestinataireVille('');
      setTitreCentral('DÉCISION DÉPARTEMENTALE');
      setObjet('Portant constitution de la Brigade Mixte Spéciale de Contrôle des Établissements de Loisirs');
      setReference('Loi N° 21-2019 et Arrêté préfectoral fixant les règles de police administrative');
      setFormuleAppel('');
      setPiecesJointes('Liste nominative des agents assermentés de contrôle.');
      setSections([
        {
          id: '1',
          titre: 'ARTICLE 1er : CRÉATION ET MISSIONS',
          contenu:
            "Il est institué auprès de la Direction Départementale des Loisirs de Pointe-Noire une Brigade Mixte Spéciale chargée de veiller au respect des seuils de salubrité sonore nocturne, de contrôler la détention des titres d'exploitation et de réprimer les infractions à la Loi N° 21-2019.",
        },
        {
          id: '2',
          titre: 'ARTICLE 2 : COMPOSITION ET COORDINATION',
          contenu:
            "La Brigade Mixte Spéciale est coordonnée par le Chef de Service SAA. Elle intègre les inspecteurs assermentés de la DDL-PN, les régisseurs du Service Financier SAF et bénéficie du concours des forces de police territorialement compétentes.",
        },
        {
          id: '3',
          titre: 'ARTICLE 3 : DISPOSITIONS FINALES',
          contenu:
            "La présente décision prend effet à compter de sa signature et sera enregistrée et communiquée partout où besoin sera, notamment à Monsieur le Préfet du Département de Pointe-Noire et à la Direction Générale des Loisirs à Brazzaville.",
        },
      ]);
    }
    showNotification('info', `Modèle officiel chargé : ${type.replace(/_/g, ' ').toUpperCase()}`);
  };

  // Section manipulation
  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        titre: `Section ${prev.length + 1}`,
        contenu: 'Texte officiel en police Garamond taille 13...',
      },
    ]);
  };

  const handleRemoveSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSection = (id: string, field: 'titre' | 'contenu', val: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  // Print function
  const handlePrintDocument = () => {
    if (docType === 'plan_travail_annuel') {
      printHtmlElement('canva-printable-pta-2026', 'Plan_de_Travail_Annuel_PTA_2026_DDL_PN');
      return;
    }
    printHtmlElement('canva-printable-doc', `${titreCentral || 'Document_Officiel'}_${numeroActe}`);
  };

  // Word export function
  const handleDownloadDocx = async () => {
    if (docType === 'plan_travail_annuel') {
      try {
        await generatePta2026Docx(officialPtaData);
        showNotification('success', 'Plan de Travail Annuel (PTA 2026) exporté en format Microsoft Word (.docx) avec succès !');
      } catch (err: any) {
        showNotification('error', `Erreur lors de l'exportation Word : ${err.message}`);
      }
      return;
    }

    try {
      await generateUniversalAdministrativeDocx({
        titreActe: titreCentral || 'DOCUMENT OFFICIEL',
        numeroActe,
        dateLieu,
        destinataireTitre: destinataireTitre || undefined,
        destinataireVille: destinataireVille || undefined,
        emetteurTitre,
        objet: objet || undefined,
        reference: reference || undefined,
        formuleAppel: formuleAppel || undefined,
        sections: sections.map((s) => ({
          titre: s.titre || undefined,
          contenu: s.contenu,
        })),
        signataireNom,
        signataireTitre,
        piecesJointes: piecesJointes || undefined,
        ampliations: ampliations
          ? ampliations
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
          : undefined,
        margeGaucheCm,
        margeDroiteCm,
        margeHautCm,
        margeBasCm,
      });
      showNotification('success', 'Document exporté en format Microsoft Word (.docx) avec succès !');
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'exportation Word : ${err.message}`);
    }
  };

  // Helper to reset official margins
  const handleResetMargins = () => {
    setMargeGaucheCm(2.5);
    setMargeDroiteCm(2.0);
    setMargeHautCm(2.0);
    setMargeBasCm(2.0);
    showNotification('info', 'Marges officielles congolaises restaurées : G 2.5cm, D 2.0cm, H 2.0cm, B 2.0cm');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              MOD-19
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>Canva de Rédaction Rapide de Documents Administratifs</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Générateur institutionnel DDL-PN conforme : En-tête exclusif MCAPNIT/DGL, police Garamond 13pt, marges officielles (Gauche 2.5cm, Droite/Haut/Bas 2.0cm), impression A4 vectorielle et export Word .docx
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveModule('MOD-09')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Soit-Transmis DGL (MOD-09)</span>
          </button>
          <button
            onClick={handleDownloadDocx}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
            title="Télécharger ce document en format Microsoft Word .docx pour d'éventuels ajustements"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger Word (.docx)</span>
          </button>
          <button
            onClick={handlePrintDocument}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
            title="Imprimer directement en A4 avec les marges officielles"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Document A4</span>
          </button>
        </div>
      </div>

      {/* Preset template selector bar */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200">Modèles Pré-configurés DDL-PN :</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'plan_travail_annuel', label: 'Plan de Travail Annuel (PTA 2026)', icon: Target },
            { id: 'attestation_depot', label: 'Attestation de Dépôt (LE ROCHER)', icon: ShieldCheck },
            { id: 'recepisse_conformite', label: 'Récépissé de Conformité (Note 152)', icon: FileCheck },
            { id: 'lettre_transmission', label: 'Lettre de Transmission', icon: Send },
            { id: 'rapport_activite', label: 'Rapport d\'Activités / Bilan', icon: FileText },
            { id: 'convocation', label: 'Convocation Officielle', icon: FileCheck },
            { id: 'invitation', label: 'Invitation Officielle', icon: Sparkles },
            { id: 'termes_de_reference', label: 'Termes de Référence (TDR)', icon: BookOpen },
            { id: 'note_service', label: 'Note de Service', icon: AlertCircle },
            { id: 'soit_transmis', label: 'Bordereau Soit-Transmis', icon: Layers },
            { id: 'decision_departementale', label: 'Décision Administrative', icon: CheckCircle2 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleLoadPreset(item.id as AdminDocType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                docType === item.id
                  ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/40'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: PTA 2026 specialized Canva OR standard Administrative Document Canvas */}
      {docType === 'plan_travail_annuel' ? (
        <div className="space-y-4">
          <div className="no-print p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Référentiel Officiel PTA 2026 Conforme :</strong> Note de présentation, 7 Tableaux d&apos;activités ministériels, Chronogramme des 13 actions prioritaires, Budget prévisionnel minimal ({formatCfa(officialPtaData.totalGeneralBudgetCfa)}), 4 Axes stratégiques et Recommandations hiérarchiques.
              </span>
            </div>
            <button
              onClick={() => setActiveModule('MOD-06')}
              className="text-xs font-bold text-white bg-emerald-700/60 hover:bg-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer shrink-0 transition"
            >
              <span>Évaluer dans Rapports Trimestriels (MOD-06)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="no-print lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl max-h-[calc(100vh-180px)] overflow-y-auto">
              <Pta2026CanvaEditor />
            </div>
            <div className="lg:col-span-7 flex flex-col items-center">
              <Pta2026CanvaPreview />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: EDITOR FORM */}
          <div className="no-print lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl max-h-[calc(100vh-180px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Paramètres du Document Administratif</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Garamond 13pt
            </span>
          </div>

          {/* Section Réglage des Marges Administratives */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-indigo-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Marges de mise en page (Norme officielle A4)</span>
              </span>
              <button
                type="button"
                onClick={handleResetMargins}
                className="text-[10px] text-indigo-400 hover:text-indigo-200 underline cursor-pointer"
                title="Rétablir les marges officielles : G 2.5cm, D 2.0cm, H 2.0cm, B 2.0cm"
              >
                Rétablir défaut
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Gauche (Reliure)</label>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="4.0"
                    value={margeGaucheCm}
                    onChange={(e) => setMargeGaucheCm(parseFloat(e.target.value) || 2.5)}
                    className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-center text-xs"
                  />
                  <span className="text-[10px] text-slate-400">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Droite</label>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.5"
                    value={margeDroiteCm}
                    onChange={(e) => setMargeDroiteCm(parseFloat(e.target.value) || 2.0)}
                    className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-center text-xs"
                  />
                  <span className="text-[10px] text-slate-400">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Haut</label>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.5"
                    value={margeHautCm}
                    onChange={(e) => setMargeHautCm(parseFloat(e.target.value) || 2.0)}
                    className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-center text-xs"
                  />
                  <span className="text-[10px] text-slate-400">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Bas</label>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.5"
                    value={margeBasCm}
                    onChange={(e) => setMargeBasCm(parseFloat(e.target.value) || 2.0)}
                    className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-center text-xs"
                  />
                  <span className="text-[10px] text-slate-400">cm</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic text-left">
              Norme République du Congo : Marge gauche à 2.5 cm pour reliure/registre d&apos;enregistrement, autres marges à 2.0 cm.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* LIAISON ÉTABLISSEMENT : BASE DE DONNÉES SOUVERAINE DDL-PN */}
            {docType === 'attestation_depot' && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>Établissement (Base DDL-PN)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEtablissementSourceMode('select_db')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        etablissementSourceMode === 'select_db'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      <span>Extraire (Base)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEtablissementSourceMode('create_db')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        etablissementSourceMode === 'create_db'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Nouvel Espace</span>
                    </button>
                  </div>
                </div>

                {/* Badge de l'établissement actuellement lié */}
                <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px]">
                  <span className="text-slate-400">Établissement lié :</span>
                  <span className="font-bold text-emerald-300 truncate max-w-[210px]">
                    « {currentEstDetails.nom} » ({currentEstDetails.promoteur})
                  </span>
                </div>

                {/* MODE 1 : RECHERCHE ET EXTRACTION DANS LA BASE */}
                {etablissementSourceMode === 'select_db' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={etablissementSearch}
                        onChange={(e) => setEtablissementSearch(e.target.value)}
                        placeholder="Rechercher par nom, promoteur, quartier..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded-lg p-1 bg-slate-900/50">
                      {filteredEstablishments.length === 0 ? (
                        <p className="text-[10px] text-slate-500 text-center py-2">
                          Aucun établissement trouvé dans la base.
                        </p>
                      ) : (
                        filteredEstablishments.slice(0, 15).map((est) => {
                          const isSelected = selectedEstablishmentId === est.id;
                          return (
                            <button
                              key={est.id}
                              type="button"
                              onClick={() => handleSelectFromDb(est.id)}
                              className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/70 border border-emerald-600/50 text-white'
                                  : 'hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="truncate flex-1">
                                <p className="font-bold text-[11px] text-slate-100 truncate">
                                  {est.nomCommercial}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {est.promoteurNom} • {est.arrondissement} {est.quartier ? `(${est.quartier})` : ''}
                                </p>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-mono">
                                {est.categorie}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* MODE 2 : ENREGISTREMENT RAPIDE D'UN NOUVEL ESPACE DANS LA BASE */}
                {etablissementSourceMode === 'create_db' && (
                  <form onSubmit={handleCreateAndApplyNewEstablishment} className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                        Nom Commercial de l'Établissement *
                      </label>
                      <input
                        type="text"
                        required
                        value={newEstNom}
                        onChange={(e) => setNewEstNom(e.target.value)}
                        placeholder="Ex: LE ROCHER / VIP LOUNGE"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                          Nom du Gérant / Promoteur
                        </label>
                        <input
                          type="text"
                          value={newEstPromoteur}
                          onChange={(e) => setNewEstPromoteur(e.target.value)}
                          placeholder="Ex: Monsieur Jack MATOKO"
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                          Téléphone Promoteur
                        </label>
                        <input
                          type="text"
                          value={newEstTelephone}
                          onChange={(e) => setNewEstTelephone(e.target.value)}
                          placeholder="06 000 00 00"
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                          Arrondissement
                        </label>
                        <select
                          value={newEstArrondissement}
                          onChange={(e) => {
                            const arr = e.target.value as Arrondissement;
                            setNewEstArrondissement(arr);
                            const qList = QUARTIERS_PAR_ARRONDISSEMENT[arr];
                            if (qList && qList.length > 0) setNewEstQuartier(qList[0]);
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        >
                          <option value="Lumumba">Lumumba</option>
                          <option value="Mvou-Mvou">Mvou-Mvou</option>
                          <option value="Tié-Tié">Tié-Tié</option>
                          <option value="Loandjili">Loandjili</option>
                          <option value="Mongo-Mpoukou">Mongo-Mpoukou</option>
                          <option value="Ngoyo">Ngoyo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                          Quartier
                        </label>
                        <select
                          value={newEstQuartier}
                          onChange={(e) => setNewEstQuartier(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        >
                          {(QUARTIERS_PAR_ARRONDISSEMENT[newEstArrondissement] || []).map((q) => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                        Catégorie d'Activité
                      </label>
                      <select
                        value={newEstCategorie}
                        onChange={(e) => setNewEstCategorie(e.target.value as EstablishmentCategory)}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                      >
                        <option value="Bar Dancing / Cabaret">Bar Dancing / Cabaret</option>
                        <option value="Discothèque / Night-club">Discothèque / Night-club</option>
                        <option value="Lounge Bar & Terrasse">Lounge Bar & Terrasse</option>
                        <option value="Snack-Bar Sonorisé">Snack-Bar Sonorisé</option>
                        <option value="Espace Récréatif & Salle Polyvalente">Espace Récréatif & Salle Polyvalente</option>
                        <option value="Complexe de Loisirs & Piscine">Complexe de Loisirs & Piscine</option>
                        <option value="Autre établissement de loisirs">Autre établissement de loisirs</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingNewEst}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSavingNewEst ? (
                        <span>Enregistrement en cours...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Enregistrer en Base & Appliquer à l'Attestation</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Act Number & Date/Location - Saisie Manuelle sans autogénération */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Numéro d&apos;Acte / Réf. (Saisie Manuelle)
                </label>
                <input
                  type="text"
                  value={numeroActe}
                  onChange={(e) => setNumeroActe(e.target.value)}
                  placeholder="Ex: N°042/MCAPNIT/DGL/DPN/DDL-PN/2026"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Date et Lieu</label>
                <input
                  type="text"
                  value={dateLieu}
                  onChange={(e) => setDateLieu(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            {/* Recipient & City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Destinataire (Titre / Qualité)</label>
                <input
                  type="text"
                  value={destinataireTitre}
                  onChange={(e) => setDestinataireTitre(e.target.value)}
                  placeholder="Ex: Madame la Directrice Générale des Loisirs"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ville</label>
                <input
                  type="text"
                  value={destinataireVille}
                  onChange={(e) => setDestinataireVille(e.target.value)}
                  placeholder="Brazzaville / Pointe-Noire"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            {/* Central Document Title (optional) */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Titre Central (optionnel pour courriers)</label>
              <input
                type="text"
                value={titreCentral}
                onChange={(e) => setTitreCentral(e.target.value)}
                placeholder="Ex: CONVOCATION OFFICIELLE / TERMES DE RÉFÉRENCE"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 uppercase"
              />
            </div>

            {/* Objet & Référence */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Objet du Courrier / Document</label>
              <input
                type="text"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Référence (textes, lettres antérieures)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 italic"
              />
            </div>

            {/* Formule d'appel */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Formule d&apos;Appel</label>
              <input
                type="text"
                value={formuleAppel}
                onChange={(e) => setFormuleAppel(e.target.value)}
                placeholder="Ex: Madame la Directrice Générale, / Monsieur le Promoteur,"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            {/* Corps du texte : Sections éditables */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold">Corps du document ({sections.length} paragraphes/sections)</label>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter une section</span>
                </button>
              </div>

              <div className="space-y-3">
                {sections.map((sec, idx) => (
                  <div key={sec.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Section {idx + 1}</span>
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(sec.id)}
                          className="p-1 rounded text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                          title="Supprimer cette section"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={sec.titre || ''}
                      onChange={(e) => handleUpdateSection(sec.id, 'titre', e.target.value)}
                      placeholder="Sous-titre de section (optionnel)"
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold"
                    />

                    <textarea
                      rows={3}
                      value={sec.contenu}
                      onChange={(e) => handleUpdateSection(sec.id, 'contenu', e.target.value)}
                      placeholder="Texte du paragraphe..."
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Qualité du Signataire</label>
                <input
                  type="text"
                  value={signataireTitre}
                  onChange={(e) => setSignataireTitre(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nom du Signataire</label>
                <input
                  type="text"
                  value={signataireNom}
                  onChange={(e) => setSignataireNom(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* Pièces jointes & Ampliations */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Pièce(s) Jointe(s)</label>
              <input
                type="text"
                value={piecesJointes}
                onChange={(e) => setPiecesJointes(e.target.value)}
                placeholder="Ex: Rapport d'Activités du 3ème Trimestre 2026."
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Ampliations / Copies</label>
              <textarea
                rows={3}
                value={ampliations}
                onChange={(e) => setAmpliations(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REALISTIC A4 PREVIEW IN GARAMOND 13PT & OFFICIAL CONGOLESE MARGINS */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Top Preview Bar */}
          <div className="no-print w-full max-w-[210mm] flex items-center justify-between pb-2 mb-2 text-xs text-slate-400 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Aperçu Papier A4 Conforme (Police Garamond 13pt • Marges : G {margeGaucheCm}cm, D {margeDroiteCm}cm, H {margeHautCm}cm, B {margeBasCm}cm)
              </span>
            </span>
            <div className="flex items-center gap-2">
              {docType === 'attestation_depot' && (
                <a
                  href={getAttestationVerificationUrl({
                    referenceNumero: numeroActe.trim() || 'RÉFÉRENCE EN COURS D\'ENREGISTREMENT',
                    etablissementNom: currentEstDetails.nom,
                    promoteurNom: currentEstDetails.promoteur,
                    dateDepot: dateLieu,
                    codeDossier: currentEstDetails.codeDossier,
                    statut: 'CONFORME ET REGULIER',
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-[11px] shadow transition flex items-center gap-1 cursor-pointer"
                  title="Tester la page publique de certification liée au QR Code"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Tester Vérification QR</span>
                </a>
              )}
              <button
                onClick={handleDownloadDocx}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Télécharger Word (.docx)</span>
              </button>
              <button
                onClick={handlePrintDocument}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] shadow transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Imprimer A4</span>
              </button>
            </div>
          </div>

          {/* PAGE A4 OFFICIELLE AVEC ID POUR IMPRESSION ISOLÉE */}
          <div
            id="canva-printable-doc"
            className="page-a4 bg-white text-slate-900 rounded-xl shadow-2xl max-w-[210mm] w-full border border-slate-300 font-garamond leading-relaxed select-text"
            style={{
              paddingTop: `${margeHautCm}cm`,
              paddingBottom: `${margeBasCm}cm`,
              paddingLeft: `${margeGaucheCm}cm`,
              paddingRight: `${margeDroiteCm}cm`,
            }}
          >
            {/* EN-TÊTE OFFICIEL EXCLUSIF DE LA DIRECTION (AVEC QR CODE EN HAUT À DROITE SOUS LA DEVISE) */}
            <OfficialDocumentHeader
              numeroActe={numeroActe || undefined}
              emetteurTitre={emetteurTitre}
              destinataireTitre={destinataireTitre || undefined}
              destinataireVille={destinataireVille || undefined}
              showDestinataire={Boolean(destinataireTitre)}
              dateLieu={dateLieu}
              qrCodeUrl={docType === 'attestation_depot' ? attestationQrCodeUrl : undefined}
            />

            {/* TITRE CENTRAL SI PRÉSENT */}
            {titreCentral && (
              <div className="text-center my-6 py-2 border-y-2 border-slate-900 bg-slate-50/50">
                <h2 className="font-bold text-[14pt] uppercase tracking-wider text-slate-950">
                  {titreCentral}
                </h2>
              </div>
            )}

            {/* OBJET & RÉFÉRENCE */}
            {(objet || reference) && (
              <div className="my-5 text-[12.5pt] space-y-1">
                {objet && (
                  <p>
                    <span className="font-bold">Objet : </span>
                    <span className="font-semibold">{objet}</span>
                  </p>
                )}
                {reference && (
                  <p className="italic">
                    <span className="font-bold not-italic">Référence : </span>
                    <span>{reference}</span>
                  </p>
                )}
              </div>
            )}

            {/* FORMULE D'APPEL SI PRÉSENTE */}
            {formuleAppel && (
              <div className="mt-6 mb-3 text-[13pt] font-medium text-left">
                {formuleAppel}
              </div>
            )}

            {/* CORPS DU DOCUMENT (PARAGRAPHES & SECTIONS) EN GARAMOND 13PT */}
            <div className="mt-4 text-[13pt] leading-[1.65] space-y-5 text-justify">
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-1.5">
                  {sec.titre && (
                    <h3 className="font-bold text-[12.5pt] uppercase text-slate-950 border-b border-slate-300 pb-0.5 mt-4">
                      {sec.titre}
                    </h3>
                  )}
                  <p style={{ textIndent: '1.5cm' }} className="whitespace-pre-line">
                    {sec.contenu}
                  </p>
                </div>
              ))}
            </div>

            {/* BLOC SIGNATURE OFFICIELLE */}
            <div className="mt-10 mr-4 flex flex-col items-end text-center">
              <div className="w-80 space-y-14">
                <p className="font-bold text-[12pt] text-slate-950">
                  {signataireTitre}
                </p>
                <div>
                  <p className="font-bold text-[13.5pt] uppercase text-slate-950 tracking-wide underline underline-offset-4 decoration-1">
                    {signataireNom}
                  </p>
                </div>
              </div>
            </div>

            {/* PIÈCES JOINTES & AMPLIATIONS EN BAS */}
            <div className="mt-10 pt-4 border-t border-slate-200/80 text-[11pt] text-slate-800 space-y-3">
              {piecesJointes && (
                <p className="italic">
                  <span className="font-bold not-italic">Pièce(s) jointe(s) : </span>
                  <span>{piecesJointes}</span>
                </p>
              )}

              {ampliations && (
                <div>
                  <p className="font-bold text-[10.5pt] text-slate-900 mb-0.5">Ampliations :</p>
                  <pre className="font-garamond text-[10.5pt] text-slate-700 whitespace-pre-wrap leading-tight">
                    {ampliations}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
