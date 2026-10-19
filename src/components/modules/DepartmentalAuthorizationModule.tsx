import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from '../common/DdlLogo';
import { DepartmentalAuthorization, Establishment } from '../../types';
import { formatCfa } from '../../services/crypto';
import { generateDepartmentalAuthorizationDocx } from '../../services/docxGenerator';
import {
  Award,
  ShieldCheck,
  FileCheck2,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Eye,
  PlusCircle,
  FileSignature,
  Stamp,
  QrCode,
  Shield,
  FileText,
  Copy,
  Check,
  Crown,
  Layers,
  MapPin,
} from 'lucide-react';

export const DepartmentalAuthorizationModule: React.FC = () => {
  const {
    authorizations,
    establishments,
    receipts,
    staff,
    currentAgent,
    currentUserRole,
    issueDepartmentalAuthorization,
    signDepartmentalAuthorization,
    revokeDepartmentalAuthorization,
    openPrintModal,
    showNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'delivrer' | 'registre'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArrondissement, setSelectedArrondissement] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal d'approbation et signature (Directeur ou Chef de Service Assistance et Autorisation par ordre - P.O.)
  const [signingAuth, setSigningAuth] = useState<DepartmentalAuthorization | null>(null);
  const [signatureType, setSignatureType] = useState<'directeur' | 'chef_saa_po'>('directeur');
  const [signataireNom, setSignataireNom] = useState('Jacques MATOKO');
  const [directorNotes, setDirectorNotes] = useState(
    "Vu les avis favorables de la brigade SAA et de la régie SAF. Autorisation accordée pour l'exercice 2026."
  );

  // Option de signature directe à l'émission
  const [creationSignMode, setCreationSignMode] = useState<'pending' | 'directeur' | 'chef_saa_po'>('pending');

  // Modal d'aperçu du diplôme A4 solennel
  const [previewAuth, setPreviewAuth] = useState<DepartmentalAuthorization | null>(null);

  // État du formulaire de délivrance
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>('');
  const [referenceArrete, setReferenceArrete] = useState('Arrêté N° 042/MID-DGL/DDL-PN-2026');
  const [inspecteurNom, setInspecteurNom] = useState('Gildas Ambetos');
  const [observationsSaa, setObservationsSaa] = useState('Établissement conforme. Limiteur acoustique 85 dB(A) installé et scellé. Issues de secours dégagées.');
  const [regisseurNom, setRegisseurNom] = useState('Patrice Bitemo');
  const [quittanceRef, setQuittanceRef] = useState('');
  const [quittanceMontant, setQuittanceMontant] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLinkAuthId, setCopiedLinkAuthId] = useState<string | null>(null);

  // Établissements éligibles (soldés ou ayant versé un acompte significatif)
  const eligibleEstablishments = useMemo(() => {
    return establishments.filter((est) => {
      // Exclure ceux qui ont déjà une autorisation délivrée active
      const hasActive = authorizations.some(
        (a) => a.etablissementId === est.id && (a.statut === 'delivre' || a.statut === 'approuve_directeur')
      );
      return !hasActive;
    });
  }, [establishments, authorizations]);

  // Synchronisation lors de la sélection d'un établissement
  const handleSelectEstablishment = (estId: string) => {
    setSelectedEstablishmentId(estId);
    const est = establishments.find((e) => e.id === estId);
    if (!est) return;

    // Trouver la dernière quittance correspondante
    const estReceipts = receipts.filter((r) => r.etablissementId === est.id);
    if (estReceipts.length > 0) {
      const lastReceipt = estReceipts[estReceipts.length - 1];
      setQuittanceRef(lastReceipt.numeroQuittance);
      setQuittanceMontant(lastReceipt.montantVerse);
    } else {
      setQuittanceRef(`QUIT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setQuittanceMontant(est.montantEncaisse || est.montantRedevanceAnnuelle || 150000);
    }
  };

  // Soumission de la nouvelle autorisation
  const handleSubmitNewAuthorization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstablishmentId) {
      showNotification('warning', 'Veuillez sélectionner un établissement bénéficiaire.');
      return;
    }

    const est = establishments.find((e) => e.id === selectedEstablishmentId);
    if (!est) return;

    setIsSubmitting(true);
    try {
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      const dateDelivrance = today.toISOString().substring(0, 10);
      const dateExpiration = nextYear.toISOString().substring(0, 10);

      // Si l'utilisateur est le directeur, on signe directement
      const isDirector = currentUserRole === 'directeur' || currentAgent?.role === 'directeur';

      await issueDepartmentalAuthorization({
        referenceArrete,
        anneeExercice: 2026,
        dateDelivrance,
        dateExpiration,
        etablissementId: est.id,
        codeDossier: est.codeDossier,
        nomCommercial: est.nomCommercial,
        promoteurNom: est.promoteurNom,
        promoteurTelephone: est.promoteurTelephone,
        arrondissement: est.arrondissement,
        quartier: est.quartier,
        adresseExacte: est.adresseExacte,
        categorie: est.categorie,
        surfaceM2: est.surfaceM2 || 120,
        montantRedevanceAcquittee: quittanceMontant || est.montantEncaisse || est.montantRedevanceAnnuelle,
        quittanceReference: quittanceRef || 'QUIT-2026-VALIDE',
        quittanceDate: dateDelivrance,
        visaInspecteurChef: {
          signe: true,
          nomInspecteur: inspecteurNom,
          dateVisa: dateDelivrance,
          observationsConformite: observationsSaa,
        },
        visaRegisseurSaf: {
          signe: true,
          nomRegisseur: regisseurNom,
          dateVisa: dateDelivrance,
          quittanceNumero: quittanceRef || 'QUIT-2026-VALIDE',
        },
        signatureDirecteur: {
          signe: creationSignMode !== 'pending',
          nomDirecteur: creationSignMode === 'directeur' ? 'Jacques MATOKO' : (currentAgent?.nomComplet || inspecteurNom || 'Gildas Ambetos'),
          signataireNom: creationSignMode === 'directeur' ? 'Jacques MATOKO' : (currentAgent?.nomComplet || inspecteurNom || 'Gildas Ambetos'),
          typeSignataire: creationSignMode === 'chef_saa_po' ? 'chef_saa_po' : 'directeur',
          qualite: creationSignMode === 'chef_saa_po'
            ? 'Pour le Directeur Départemental et par ordre (P.O.), Le Chef de Service Assistance et Autorisation'
            : 'Le Directeur Départemental des Loisirs de Pointe-Noire',
          dateSignature: creationSignMode !== 'pending' ? dateDelivrance : '',
          parapheOfficiel: creationSignMode === 'chef_saa_po'
            ? 'Signé P.O. • Chef SAA • 2026'
            : 'Approuvé • DDL-PN • 2026',
          mentionPo: creationSignMode === 'chef_saa_po' ? 'Pour le Directeur Départemental et par ordre (P.O.)' : undefined,
        },
        statut: creationSignMode !== 'pending' ? 'delivre' : 'en_instruction',
      });

      setActiveTab('registre');
      setSelectedEstablishmentId('');
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Erreur lors de la délivrance : ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ouverture du modal de signature avec pré-remplissage selon le rôle
  const handleOpenSignModal = (auth: DepartmentalAuthorization) => {
    setSigningAuth(auth);
    if (currentUserRole === 'inspecteur_saa' || currentAgent?.service === 'SAA') {
      setSignatureType('chef_saa_po');
      setSignataireNom(currentAgent?.nomComplet || 'Gildas Ambetos');
    } else {
      setSignatureType('directeur');
      setSignataireNom('Jacques MATOKO');
    }
  };

  // Traitement de l'approbation et signature (Directeur ou Chef SAA P.O.)
  const handleConfirmDirectorSign = async () => {
    if (!signingAuth) return;
    try {
      await signDepartmentalAuthorization(
        signingAuth.id,
        signataireNom,
        signatureType,
        signatureType === 'chef_saa_po'
          ? 'Pour le Directeur Départemental et par ordre (P.O.), Le Chef de Service Assistance et Autorisation'
          : 'Le Directeur Départemental des Loisirs de Pointe-Noire'
      );
      setSigningAuth(null);
    } catch (err: any) {
      showNotification('error', `Erreur lors de la signature : ${err?.message}`);
    }
  };

  // Copier le lien officiel de vérification
  const handleCopyVerificationUrl = (auth: DepartmentalAuthorization) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ddlpn.loisirs.gouv.cg';
    const isPo = auth.signatureDirecteur?.typeSignataire === 'chef_saa_po';
    const signNom = auth.signatureDirecteur?.signataireNom;
    let url = `${origin}/?verify=auth&num=${encodeURIComponent(auth.numeroAutorisation)}&etab=${encodeURIComponent(auth.nomCommercial)}&hash=${encodeURIComponent(auth.documentHash)}`;
    if (isPo) {
      url += `&po=true`;
    }
    if (signNom) {
      url += `&sign=${encodeURIComponent(signNom)}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedLinkAuthId(auth.id);
    showNotification('success', 'Lien officiel de vérification QR copié dans le presse-papier !');
    setTimeout(() => setCopiedLinkAuthId(null), 3000);
  };

  // Filtrage du registre
  const filteredAuthorizations = useMemo(() => {
    return authorizations.filter((auth) => {
      const matchesSearch =
        auth.nomCommercial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auth.numeroAutorisation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auth.promoteurNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auth.codeDossier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesArr = selectedArrondissement === 'all' || auth.arrondissement === selectedArrondissement;
      const matchesStatus = selectedStatus === 'all' || auth.statut === selectedStatus;

      return matchesSearch && matchesArr && matchesStatus;
    });
  }, [authorizations, searchQuery, selectedArrondissement, selectedStatus]);

  // Statistiques
  const stats = useMemo(() => {
    const total = authorizations.length;
    const delivrees = authorizations.filter((a) => a.statut === 'delivre').length;
    const enAttenteDirecteur = authorizations.filter((a) => a.statut === 'en_instruction' || !a.signatureDirecteur.signe).length;
    const montantTotal = authorizations.reduce((sum, a) => sum + (a.montantRedevanceAcquittee || 0), 0);

    return { total, delivrees, enAttenteDirecteur, montantTotal };
  }, [authorizations]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Régalien & Présentation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/80 border border-amber-600/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 flex z-10">
          <div className="flex-1 bg-[#009543]" />
          <div className="flex-1 bg-[#fbde4a]" />
          <div className="flex-1 bg-[#dc241f]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
          <div className="flex items-start gap-4">
            <DdlLogo size="md" rounded="2xl" bordered={true} className="w-16 h-16 shadow-lg shrink-0 border-amber-500/40" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  MOD-20
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  Titre Régalien Suprême
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Loi N° 21-2019 • Note 151
                </span>
              </div>
              <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100 tracking-wide">
                Autorisation d'Exploitation Départementale
              </h1>
              <p className="font-garamond text-sm md:text-base text-slate-300 italic leading-relaxed">
                Délivrance solennelle, instruction tripartite (SAA • SAF • Direction) et validation souveraine du Directeur Départemental des Loisirs de Pointe-Noire.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('delivrer')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Nouvelle Autorisation
            </button>
            <button
              onClick={() => setActiveTab('registre')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Registre Officiel ({authorizations.length})
            </button>
          </div>
        </div>

        {/* 4 Indicateurs Clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Titres Délivrés (Actifs)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">{stats.delivrees}</span>
              <span className="text-[11px] text-emerald-500/80 font-medium">Diplômes A4 scellés</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Attente Signature</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400">{stats.enAttenteDirecteur}</span>
              <span className="text-[11px] text-amber-500/80 font-medium">Dir. ou Chef SAA (P.O.)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Établissements Éligibles</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-cyan-400">{eligibleEstablishments.length}</span>
              <span className="text-[11px] text-cyan-500/80 font-medium">Dossiers régularisés</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Recettes Titres Sécurisées</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg md:text-xl font-bold font-mono text-amber-300">{formatCfa(stats.montantTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Onglets de Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-slate-800/90 text-amber-400 border-b-2 border-amber-500 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Award className="w-4 h-4" />
          Workflow d'Instruction & Circuit des Visas
        </button>

        <button
          onClick={() => setActiveTab('delivrer')}
          className={`px-5 py-3 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'delivrer'
              ? 'bg-slate-800/90 text-amber-400 border-b-2 border-amber-500 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          Émettre une Autorisation
        </button>

        <button
          onClick={() => setActiveTab('registre')}
          className={`px-5 py-3 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'registre'
              ? 'bg-slate-800/90 text-amber-400 border-b-2 border-amber-500 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          Registre Officiel des Diplômes ({authorizations.length})
        </button>
      </div>

      {/* TAB 1: WORKFLOW D'INSTRUCTION */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Schéma du Circuit Régalien */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="font-cinzel text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Stamp className="w-5 h-5 text-amber-400" />
              Circuit Administratif de Délivrance de l'Autorisation Départementale
            </h2>
            <p className="text-sm text-slate-400 mb-6 font-garamond italic">
              Conformément à la Loi N° 21-2019 et aux directives de la Direction Départementale des Loisirs de Pointe-Noire.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Étape 1 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    ÉTAPE 01
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-sm text-slate-200">Instruction Technique SAA</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Contrôle sonométrique in situ (&lt; 85 dB(A)), vérification du limiteur sonore homologué et visite de sécurité des issues.
                </p>
                <div className="pt-2 text-[11px] text-emerald-400 font-medium">
                  ✓ Visa Inspecteur Principal SAA
                </div>
              </div>

              {/* Étape 2 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    ÉTAPE 02
                  </span>
                  <FileCheck2 className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-sm text-slate-200">Visa Comptable Régie SAF</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Apurement intégral ou régularisation de la redevance annuelle d'exploitation au livre de caisse SAF avec émission de quittance.
                </p>
                <div className="pt-2 text-[11px] text-cyan-400 font-medium">
                  ✓ Visa & Quittance Régisseur SAF
                </div>
              </div>

              {/* Étape 3 */}
              <div className="bg-amber-950/30 border-2 border-amber-600/60 rounded-xl p-4 relative space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40">
                    ÉTAPE 03 CRITIQUE
                  </span>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-sm text-amber-200">Signature Directeur ou Chef SAA (P.O.)</h3>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  Approbation directe du Directeur Départemental (Jacques MATOKO) ou signature par ordre (P.O.) par le Chef de Service Assistance et Autorisation (SAA).
                </p>
                <div className="pt-2 text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  <Stamp className="w-3.5 h-3.5" />
                  Sceau Officiel & Mention P.O.
                </div>
              </div>

              {/* Étape 4 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    ÉTAPE 04
                  </span>
                  <QrCode className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-sm text-slate-200">Diplôme A4 & Scellement</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Édition du diplôme A4 solennel avec QR Code cryptographique infalsifiable et export Word docx officiel.
                </p>
                <div className="pt-2 text-[11px] text-indigo-400 font-medium">
                  ✓ Scellement SHA-256 Public
                </div>
              </div>
            </div>
          </div>

          {/* Demandes en Attente de Signature */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Dossiers en Attente de Signature (Directeur ou Chef SAA P.O.)
                </h2>
                <p className="text-xs text-slate-400 font-garamond italic">
                  Ces établissements ont validé les visas SAA et SAF. La signature peut être apposée par le Directeur Départemental ou par ordre (P.O.) par le Chef de Service Assistance et Autorisation.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold font-mono">
                {authorizations.filter((a) => !a.signatureDirecteur.signe).length} dossier(s)
              </span>
            </div>

            {authorizations.filter((a) => !a.signatureDirecteur.signe).length === 0 ? (
              <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-300">Toutes les autorisations sont signées et à jour !</p>
                <p className="text-xs text-slate-500 mt-1">
                  Aucun titre en attente du paraphe du Directeur Départemental.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {authorizations
                  .filter((a) => !a.signatureDirecteur.signe)
                  .map((auth) => (
                    <div
                      key={auth.id}
                      className="bg-slate-950/80 border border-amber-600/40 rounded-xl p-5 hover:border-amber-500 transition-all shadow-md space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] font-mono text-amber-400 font-bold block">
                            {auth.numeroAutorisation}
                          </span>
                          <h4 className="font-cinzel font-bold text-slate-100 text-base">
                            {auth.nomCommercial}
                          </h4>
                          <p className="text-xs text-slate-400">
                            Exploitant : <span className="text-slate-200">{auth.promoteurNom}</span>
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">
                          Visa Dir. Requis
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Arrondissement :</span>
                          <span className="text-slate-300 font-medium">{auth.arrondissement}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Redevance :</span>
                          <span className="text-emerald-400 font-mono font-bold">
                            {formatCfa(auth.montantRedevanceAcquittee)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Visa SAA :</span>
                          <span className="text-slate-300">✓ {auth.visaInspecteurChef.nomInspecteur}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Quittance SAF :</span>
                          <span className="text-slate-300 font-mono">✓ {auth.quittanceReference}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenSignModal(auth)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Stamp className="w-4 h-4" />
                          Signer (Directeur ou Chef SAA P.O.)
                        </button>
                        <button
                          onClick={() => setPreviewAuth(auth)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          Aperçu
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ÉMETTRE UNE NOUVELLE AUTORISATION */}
      {activeTab === 'delivrer' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-4xl mx-auto">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h2 className="font-cinzel text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-amber-400" />
              Émission d'une Autorisation d'Exploitation Départementale
            </h2>
            <p className="text-sm text-slate-400 font-garamond italic mt-1">
              Remplissez les détails d'instruction, vérifiez les visas de conformité technique et comptable pour générer le titre officiel.
            </p>
          </div>

          <form onSubmit={handleSubmitNewAuthorization} className="space-y-6">
            {/* 1. Sélection de l'établissement bénéficiaire */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Établissement Bénéficiaire & Dossier Régularisé *
              </label>
              <select
                value={selectedEstablishmentId}
                onChange={(e) => handleSelectEstablishment(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:border-amber-500 focus:outline-none transition-colors"
              >
                <option value="">-- Choisir un établissement éligible --</option>
                {eligibleEstablishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nomCommercial} — {est.arrondissement} (Promoteur : {est.promoteurNom}) • {formatCfa(est.montantEncaisse)} encaissés
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Seuls les établissements recensés et disposant d'un dossier conforme sont éligibles au titre régalien définitif.
              </p>
            </div>

            {/* Récapitulatif automatique de l'établissement sélectionné */}
            {selectedEstablishmentId && (() => {
              const est = establishments.find((e) => e.id === selectedEstablishmentId);
              if (!est) return null;
              return (
                <div className="bg-slate-950/80 border border-amber-600/30 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-cinzel text-base font-bold text-amber-300">
                      {est.nomCommercial}
                    </span>
                    <span className="font-mono text-slate-400">{est.codeDossier}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Promoteur :</span>
                      <strong className="text-slate-100">{est.promoteurNom}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Téléphone :</span>
                      <strong className="text-slate-100">{est.promoteurTelephone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Localisation :</span>
                      <strong className="text-slate-100">{est.arrondissement} ({est.quartier})</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Surface Utile :</span>
                      <strong className="text-slate-100">{est.surfaceM2 || 120} m²</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. Référence de l'Arrêté & Base Juridique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Référence de l'Arrêté Préfectoral / Ministériel
                </label>
                <input
                  type="text"
                  value={referenceArrete}
                  onChange={(e) => setReferenceArrete(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Exercice Budgétaire Souverain
                </label>
                <input
                  type="text"
                  value="2026 (Valable 1 an renouvelable)"
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 text-sm font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* 3. Bloc Visa Technique SAA */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Visa Technique SAA (Service des Activités et Agréments)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Inspecteur Chef Signataire</label>
                  <select
                    value={inspecteurNom}
                    onChange={(e) => setInspecteurNom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Gildas Ambetos">Gildas Ambetos (Inspecteur Principal SAA)</option>
                    <option value="Christian Pandi">Christian Pandi (Inspecteur SAA)</option>
                    <option value="Brice Moukoko">Brice Moukoko (Chef de Brigade)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Constat Sonorité & Conformité</label>
                  <input
                    type="text"
                    value={observationsSaa}
                    onChange={(e) => setObservationsSaa(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* 4. Bloc Visa Comptable SAF */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4" />
                Visa Financier SAF (Service Administratif et Financier)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Régisseur des Recettes</label>
                  <input
                    type="text"
                    value={regisseurNom}
                    onChange={(e) => setRegisseurNom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">N° Quittance Libératoire</label>
                  <input
                    type="text"
                    value={quittanceRef}
                    onChange={(e) => setQuittanceRef(e.target.value)}
                    required
                    placeholder="QUIT-2026-XXXX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Montant Redevance Acquittée (FCFA)</label>
                  <input
                    type="number"
                    value={quittanceMontant}
                    onChange={(e) => setQuittanceMontant(Number(e.target.value))}
                    required
                    min={0}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 5. Option de Signature Immédiate */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Stamp className="w-4 h-4" />
                Modalité de Signature & Approbation Officielle
              </h3>
              <p className="text-[11px] text-slate-400 font-garamond italic">
                L'autorisation peut être délivrée en instruction ou signée immédiatement soit par le Directeur Départemental, soit par ordre (P.O.) par le Chef de Service Assistance et Autorisation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <label
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                    creationSignMode === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="creationSignMode"
                      value="pending"
                      checked={creationSignMode === 'pending'}
                      onChange={() => setCreationSignMode('pending')}
                      className="accent-amber-500"
                    />
                    <span className="font-semibold text-xs">Mettre en Instruction</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2">Visas validés, en attente de signature</span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                    creationSignMode === 'directeur'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="creationSignMode"
                      value="directeur"
                      checked={creationSignMode === 'directeur'}
                      onChange={() => setCreationSignMode('directeur')}
                      className="accent-emerald-500"
                    />
                    <span className="font-semibold text-xs flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      Signer : Directeur
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2">Jacques MATOKO (Signature directe)</span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                    creationSignMode === 'chef_saa_po'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="creationSignMode"
                      value="chef_saa_po"
                      checked={creationSignMode === 'chef_saa_po'}
                      onChange={() => setCreationSignMode('chef_saa_po')}
                      className="accent-blue-500"
                    />
                    <span className="font-semibold text-xs flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      Signer : Chef SAA (P.O.)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2">Par ordre du Directeur (Gildas Ambetos)</span>
                </label>
              </div>
            </div>

            {/* Boutons d'Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedEstablishmentId}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-102 cursor-pointer"
              >
                <Stamp className="w-4 h-4" />
                {isSubmitting ? 'Émission en cours...' : 'Émettre l\'Autorisation Départementale'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: REGISTRE OFFICIEL DES AUTORISATIONS */}
      {activeTab === 'registre' && (
        <div className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom d'établissement, N° d'autorisation, promoteur, dossier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedArrondissement}
                onChange={(e) => setSelectedArrondissement(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">Tous les Arrondissements</option>
                <option value="Lumumba">1 - Lumumba</option>
                <option value="Mvou-Mvou">2 - Mvou-Mvou</option>
                <option value="Tié-Tié">3 - Tié-Tié</option>
                <option value="Loandjili">4 - Loandjili</option>
                <option value="Mongo-Mpoukou">5 - Mongo-Mpoukou</option>
                <option value="Ngoyo">6 - Ngoyo</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">Tous les Statuts</option>
                <option value="delivre">Délivré & Signé</option>
                <option value="en_instruction">En Instruction (Attente Dir.)</option>
                <option value="revoque">Révoqué</option>
              </select>
            </div>
          </div>

          {/* Table / Grille des Titres */}
          <div className="space-y-3">
            {filteredAuthorizations.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Aucune autorisation trouvée pour ces critères.</p>
              </div>
            ) : (
              filteredAuthorizations.map((auth) => {
                const isSigned = auth.signatureDirecteur.signe && auth.statut === 'delivre';

                return (
                  <div
                    key={auth.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-amber-600/50 rounded-2xl p-5 shadow-lg transition-all space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Award className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                              {auth.numeroAutorisation}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {auth.codeDossier}
                            </span>
                            {isSigned ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Validé & Signé
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                En Attente Directeur
                              </span>
                            )}
                          </div>
                          <h3 className="font-cinzel text-lg font-bold text-slate-100 mt-1">
                            {auth.nomCommercial}
                          </h3>
                          <p className="text-xs text-slate-400 font-garamond italic">
                            Exploitant légal : <span className="text-slate-200 not-italic font-semibold">{auth.promoteurNom}</span> • {auth.categorie}
                          </p>
                        </div>
                      </div>

                      {/* Boutons d'Action Rapide */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Imprimer Diplôme A4 */}
                        <button
                          onClick={() => openPrintModal('a4_departmental_authorization', auth)}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Imprimer le Diplôme A4 officiel avec Sceau"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer A4
                        </button>

                        {/* Télécharger Word docx */}
                        <button
                          onClick={() => generateDepartmentalAuthorizationDocx(auth)}
                          className="px-3.5 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Exporter le document Word officiel conforme"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export Word (.docx)
                        </button>

                        {/* Aperçu */}
                        <button
                          onClick={() => setPreviewAuth(auth)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Voir
                        </button>

                        {/* Copier Lien QR Vérification */}
                        <button
                          onClick={() => handleCopyVerificationUrl(auth)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Copier le lien public de vérification par QR code"
                        >
                          {copiedLinkAuthId === auth.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <QrCode className="w-3.5 h-3.5" />
                          )}
                          Lien QR
                        </button>

                        {/* Si non signé : bouton signature */}
                        {!isSigned && (
                          <button
                            onClick={() => setSigningAuth(auth)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Stamp className="w-3.5 h-3.5" />
                            Signer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Données Détaillées du Titre */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Arrondissement :</span>
                        <span className="text-slate-200 font-medium">{auth.arrondissement} ({auth.quartier})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Période de Validité :</span>
                        <span className="text-emerald-400 font-semibold">
                          Du {auth.dateDelivrance} au {auth.dateExpiration}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Redevance & Quittance :</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {formatCfa(auth.montantRedevanceAcquittee)}
                        </span>
                        <span className="text-slate-500 text-[10px] block font-mono">
                          N° {auth.quittanceReference}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Signature Souveraine :</span>
                        <span className="text-slate-200 font-serif italic">
                          {auth.signatureDirecteur.signataireNom || auth.signatureDirecteur.nomDirecteur || 'Jacques MATOKO'}
                        </span>
                        <span className="text-[10px] text-emerald-400 block font-mono">
                          {auth.signatureDirecteur.signe
                            ? (auth.signatureDirecteur.typeSignataire === 'chef_saa_po'
                                ? 'Signé P.O. (Chef SAA)'
                                : 'Approuvé Dir. avec Sceau')
                            : 'En attente de signature'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: APPROBATION & SIGNATURE DIRECTORALE (JACQUES MATOKO) */}
      {signingAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-600/60 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Stamp className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-slate-100">
                    Approbation Souveraine du Directeur
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direction Départementale des Loisirs de Pointe-Noire
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSigningAuth(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-950/20 border border-amber-600/30 rounded-xl p-4 space-y-2 text-xs">
              <p className="text-slate-300">
                Vous vous apprêtez à apposer la signature officielle et le Sceau d'État pour l'autorisation :
              </p>
              <div className="font-mono text-amber-400 font-bold text-sm">
                {signingAuth.numeroAutorisation} — {signingAuth.nomCommercial}
              </div>
              <p className="text-slate-400 italic font-garamond">
                Promoteur : {signingAuth.promoteurNom} • {signingAuth.arrondissement} • Redevance réglée : {formatCfa(signingAuth.montantRedevanceAcquittee)}
              </p>
            </div>

            <div className="space-y-4">
              {/* Choix du signataire : Directeur ou Chef SAA par ordre */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Qualité du Signataire Républicain
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureType('directeur');
                      setSignataireNom('Jacques MATOKO');
                      setDirectorNotes("Vu les avis favorables de la brigade SAA et de la régie SAF. Autorisation départementale accordée pour l'exercice 2026.");
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      signatureType === 'directeur'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Crown className={`w-4 h-4 shrink-0 mt-0.5 ${signatureType === 'directeur' ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-100">Le Directeur Départemental</span>
                      <span className="text-[10px] text-slate-400 block">Signature directe de Jacques MATOKO</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSignatureType('chef_saa_po');
                      setSignataireNom(currentAgent?.nomComplet || 'Gildas Ambetos');
                      setDirectorNotes("Pour le Directeur Départemental et par ordre (P.O.), vu la conformité technique du dossier et l'apurement des redevances régies.");
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      signatureType === 'chef_saa_po'
                        ? 'bg-blue-500/15 border-blue-500 text-blue-200 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${signatureType === 'chef_saa_po' ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-100">Chef de Service SAA (P.O.)</span>
                      <span className="text-[10px] text-slate-400 block">Délégation de signature Par Ordre</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {signatureType === 'chef_saa_po'
                    ? 'Nom du Chef de Service SAA Signataire (P.O.)'
                    : 'Nom du Directeur Départemental Signataire'}
                </label>
                <input
                  type="text"
                  value={signataireNom}
                  onChange={(e) => setSignataireNom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                  placeholder="Nom et prénom officiel"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mention & Formule d'Approbation
                </label>
                <textarea
                  rows={2}
                  value={directorNotes}
                  onChange={(e) => setDirectorNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Sceau & Paraphe Visuel Dynamique */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              signatureType === 'chef_saa_po'
                ? 'bg-blue-950/30 border-blue-600/40'
                : 'bg-amber-950/30 border-amber-600/40'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center rotate-12 ${
                  signatureType === 'chef_saa_po' ? 'border-blue-500/80' : 'border-red-600/80'
                }`}>
                  <span className={`text-[7px] font-bold uppercase text-center leading-tight ${
                    signatureType === 'chef_saa_po' ? 'text-blue-400' : 'text-red-500'
                  }`}>
                    {signatureType === 'chef_saa_po' ? (
                      <>DDL-PN<br/>SERVICE SAA<br/>PAR ORDRE</>
                    ) : (
                      <>DDL-PN<br/>SCEAU<br/>DIRECTORAL</>
                    )}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-serif italic font-bold text-slate-100">{signataireNom}</p>
                  <p className="text-[10px] text-slate-300">
                    {signatureType === 'chef_saa_po'
                      ? 'Pour le Directeur Départemental et P.O., Le Chef de Service Assistance & Autorisation'
                      : 'Le Directeur Départemental des Loisirs de Pointe-Noire'}
                  </p>
                  <p className={`text-[9px] font-mono font-bold ${
                    signatureType === 'chef_saa_po' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {signatureType === 'chef_saa_po'
                      ? 'Paraphe : Signé P.O. • Chef SAA • 2026'
                      : 'Paraphe : Approuvé • DDL-PN • 2026'}
                  </p>
                </div>
              </div>
              <ShieldCheck className={`w-6 h-6 ${signatureType === 'chef_saa_po' ? 'text-blue-400' : 'text-emerald-400'}`} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSigningAuth(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectorSign}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
              >
                <Stamp className="w-4 h-4" />
                {signatureType === 'chef_saa_po'
                  ? 'Signer Par Ordre (P.O.) & Apposer le Sceau'
                  : 'Confirmer la Signature & Apposer le Sceau'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APERÇU DIRECT DU DIPLÔME SOLENNEL A4 */}
      {previewAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel text-base font-bold text-slate-100">
                  Aperçu du Diplôme Solennel A4 • {previewAuth.numeroAutorisation}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPrintModal('a4_departmental_authorization', previewAuth)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer
                </button>
                <button
                  onClick={() => generateDepartmentalAuthorizationDocx(previewAuth)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Word (.docx)
                </button>
                <button
                  onClick={() => setPreviewAuth(null)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex justify-center bg-slate-950/50">
              {/* Reproduction fidèle du diplôme A4 */}
              <div className="bg-[#fcfbf7] text-slate-900 p-8 rounded-xl shadow-2xl border-4 border-double border-amber-700/60 w-full max-w-[190mm] font-garamond space-y-4">
                <div className="h-1.5 w-full rounded-full flex overflow-hidden mb-3">
                  <div className="flex-1 bg-[#009543]" />
                  <div className="flex-1 bg-[#fbde4a]" />
                  <div className="flex-1 bg-[#dc241f]" />
                </div>

                <div className="flex justify-between items-start border-b border-amber-800/20 pb-3 text-[9px] text-slate-700">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-slate-800">RÉPUBLIQUE DU CONGO</p>
                    <p className="italic font-serif">Unité • Travail • Progrès</p>
                    <p className="font-bold text-amber-950 uppercase pt-1">DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</p>
                  </div>
                  <DdlLogo size="xs" rounded="full" bordered={true} className="w-12 h-12" />
                  <div className="text-right font-mono text-[8.5px]">
                    <p className="font-bold text-emerald-800">{previewAuth.numeroAutorisation}</p>
                    <p>{previewAuth.referenceArrete}</p>
                  </div>
                </div>

                <div className="text-center py-2 border-y border-amber-800/30 bg-amber-500/10">
                  <h3 className="font-cinzel text-lg font-black text-amber-950 tracking-wider">
                    AUTORISATION D'EXPLOITATION DÉPARTEMENTALE
                  </h3>
                  <p className="text-[10px] text-amber-900 uppercase">Titre Définitif d'Exercice des Activités de Loisirs</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-700/40 rounded-lg p-3 text-[10px] space-y-1">
                  <p className="font-cinzel text-sm font-bold text-slate-950 uppercase">{previewAuth.nomCommercial}</p>
                  <p className="text-slate-700">Exploitant : <strong>{previewAuth.promoteurNom}</strong></p>
                  <p className="text-slate-700">Activité : <strong>{previewAuth.categorie}</strong> • Localisation : <strong>{previewAuth.arrondissement} ({previewAuth.quartier})</strong></p>
                  <p className="text-slate-700">Validité : <strong className="text-emerald-800">Du {previewAuth.dateDelivrance} au {previewAuth.dateExpiration}</strong></p>
                  <p className="text-slate-700 font-mono">Quittance SAF : <strong>{previewAuth.quittanceReference}</strong> ({formatCfa(previewAuth.montantRedevanceAcquittee)})</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-800/20 text-center text-[8px]">
                  <div className="border border-slate-300 p-1.5 rounded bg-white/60">
                    <p className="font-bold text-slate-700">Visa SAA</p>
                    <p className="italic text-slate-600">{previewAuth.visaInspecteurChef.nomInspecteur}</p>
                    <p className="text-emerald-700 font-medium">Conforme</p>
                  </div>
                  <div className="border border-slate-300 p-1.5 rounded bg-white/60">
                    <p className="font-bold text-slate-700">Visa SAF</p>
                    <p className="italic text-slate-600">{previewAuth.visaRegisseurSaf.nomRegisseur}</p>
                    <p className="text-emerald-700 font-medium">Apuré</p>
                  </div>
                  <div className="border-2 border-amber-600 p-1.5 rounded bg-amber-50/60">
                    <p className="font-bold text-amber-950">
                      {previewAuth.signatureDirecteur.typeSignataire === 'chef_saa_po'
                        ? 'Pour le Directeur & P.O. (Chef SAA)'
                        : 'Le Directeur Départemental'}
                    </p>
                    <p className="font-serif italic font-bold text-slate-900">
                      {previewAuth.signatureDirecteur.signataireNom || previewAuth.signatureDirecteur.nomDirecteur || 'Jacques MATOKO'}
                    </p>
                    <p className="text-emerald-800 font-mono font-bold">
                      {previewAuth.signatureDirecteur.parapheOfficiel || (previewAuth.signatureDirecteur.typeSignataire === 'chef_saa_po' ? 'Signé P.O. • Chef SAA • 2026' : 'Approuvé • DDL-PN • 2026')}
                    </p>
                  </div>
                </div>

                <div className="p-2 bg-slate-100 border border-slate-300 rounded font-mono text-[7px] text-slate-500 text-center">
                  Empreinte SHA-256 : {previewAuth.documentHash} • Document officiel infalsifiable
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
