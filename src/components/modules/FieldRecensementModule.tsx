import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPinPlus,
  Compass,
  Calculator,
  Save,
  Wifi,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Volume2,
  Maximize2,
  Radio,
  Sliders,
  Lock,
  UserCheck,
  Shield,
  CalendarCheck,
  CalendarClock,
  Clock,
  Building,
  Edit3,
  X,
  CheckSquare,
  FileCheck2,
  BadgeAlert,
} from 'lucide-react';
import {
  Arrondissement,
  EstablishmentCategory,
  ComplianceStatus,
  QUARTIERS_PAR_ARRONDISSEMENT,
  Establishment,
} from '../../types';
import { formatCfa } from '../../services/crypto';
import { SonometerTool } from '../common/SonometerTool';
import {
  computeOfficialFees,
  OFFICIAL_INVESTIGATION_FEE_CFA,
  OFFICIAL_DOSSIER_CHECKLIST,
} from '../../data/officialTariffs';
import { PhotoCapture } from '../common/PhotoCapture';
import { SignaturePad } from '../common/SignaturePad';
import { openWhatsAppReminder } from '../../services/whatsappService';

export const FieldRecensementModule: React.FC = () => {
  const {
    establishments,
    visibleEstablishments,
    currentAgent,
    currentAgentId,
    currentUserRole,
    staff,
    addEstablishment,
    addSchedule,
    updateEstablishment,
    rescheduleAppointment,
    showNotification,
    isOnline,
    offlineQueueCount,
    syncOfflineQueue,
    openPrintModal,
    setActiveModule,
    theme,
    selectedEstablishmentForRecensement,
    setSelectedEstablishmentForRecensement,
  } = useApp();

  const isLight = theme === 'light';

  // Form states
  const [nomCommercial, setNomCommercial] = useState('');
  const [promoteurNom, setPromoteurNom] = useState('');
  const [promoteurTelephone, setPromoteurTelephone] = useState('');
  const [promoteurEmail, setPromoteurEmail] = useState('');
  const [arrondissement, setArrondissement] = useState<Arrondissement>('Lumumba');
  const [quartier, setQuartier] = useState<string>(QUARTIERS_PAR_ARRONDISSEMENT['Lumumba'][0]);
  const [repereLocal, setRepereLocal] = useState('');
  const [statutInitial, setStatutInitial] = useState<ComplianceStatus>('mise_en_demeure');
  const [adresseExacte, setAdresseExacte] = useState('');
  const [categorie, setCategorie] = useState<EstablishmentCategory>('Bar Dancing / Cabaret');
  const [regimeFiscal, setRegimeFiscal] = useState<'informel_forfaitaire' | 'formel_proportionnel'>('informel_forfaitaire');
  const [surfaceM2, setSurfaceM2] = useState<number>(80);
  const [forfaitStandard, setForfaitStandard] = useState<number>(50000);
  const [latitude, setLatitude] = useState<number>(-4.795);
  const [longitude, setLongitude] = useState<number>(11.85);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [niveauDecibels, setNiveauDecibels] = useState<number>(75);
  const [limiteurInstalle, setLimiteurInstalle] = useState<boolean>(false);
  const [selectedAssignedAgentId, setSelectedAssignedAgentId] = useState<string>(() => {
    if (currentAgentId !== 'all') return currentAgentId;
    const defaultAgent = staff.find((s) => s.service === 'SAA') || staff[1] || staff[0];
    return defaultAgent ? defaultAgent.id : '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc';
  });
  const [showSonometer, setShowSonometer] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);

  // Sync selected agent if currentAgentId changes
  useEffect(() => {
    if (currentAgentId !== 'all') {
      setSelectedAssignedAgentId(currentAgentId);
    } else if (!staff.some((s) => s.id === selectedAssignedAgentId)) {
      const defaultAgent = staff.find((s) => s.service === 'SAA') || staff[1] || staff[0];
      if (defaultAgent) setSelectedAssignedAgentId(defaultAgent.id);
    }
  }, [currentAgentId, staff, selectedAssignedAgentId]);

  // Optional first intervention scheduling on the spot
  const [planifierIntervention, setPlanifierIntervention] = useState<boolean>(false);
  const [dateIntervention, setDateIntervention] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [heureIntervention, setHeureIntervention] = useState<string>('10:00');
  const [motifIntervention, setMotifIntervention] = useState<'Recouvrement' | 'Contrôle Décibels' | 'Signification Mise en Demeure'>('Recouvrement');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArrFilter, setSelectedArrFilter] = useState<string>('all');
  const [selectedQuartierFilter, setSelectedQuartierFilter] = useState<string>('all');

  // Dossier réglementaire Note 152 / SAF
  const [fraisEnquetePaye, setFraisEnquetePaye] = useState<boolean>(false);
  const [dossierChecklist, setDossierChecklist] = useState<Record<string, boolean>>({});
  const [showDossierChecklist, setShowDossierChecklist] = useState<boolean>(false);

  // Automatic calculation of redevance conforme Note 151/MTL-CAB
  const officialFeeInfo = computeOfficialFees(categorie, surfaceM2, false);
  const redevanceCalculee =
    regimeFiscal === 'informel_forfaitaire'
      ? forfaitStandard
      : officialFeeInfo.montantAutorisation;

  const piecesCheckedCount = Object.values(dossierChecklist).filter(Boolean).length;
  const tauxCompletude = Math.round((piecesCheckedCount / OFFICIAL_DOSSIER_CHECKLIST.length) * 100);

  // Modal Édition / Complément de fiche d'un établissement
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  const [editNomCommercial, setEditNomCommercial] = useState('');
  const [editPromoteurNom, setEditPromoteurNom] = useState('');
  const [editPromoteurTel, setEditPromoteurTel] = useState('');
  const [editPromoteurEmail, setEditPromoteurEmail] = useState('');
  const [editArrondissement, setEditArrondissement] = useState<Arrondissement>('Lumumba');
  const [editQuartier, setEditQuartier] = useState<string>('');
  const [editAdresseExacte, setEditAdresseExacte] = useState('');
  const [editCategorie, setEditCategorie] = useState<EstablishmentCategory>('Bar Dancing / Cabaret');
  const [editRedevance, setEditRedevance] = useState<number>(60000);
  const [editSoldeRestant, setEditSoldeRestant] = useState<number>(60000);
  const [editStatut, setEditStatut] = useState<ComplianceStatus>('mise_en_demeure');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const openEditEstablishment = (est: Establishment) => {
    setEditingEst(est);
    setEditNomCommercial(est.nomCommercial);
    setEditPromoteurNom(est.promoteurNom || '');
    setEditPromoteurTel(est.promoteurTelephone || '');
    setEditPromoteurEmail(est.promoteurEmail || '');
    const arr = (est.arrondissement as Arrondissement) || 'Lumumba';
    setEditArrondissement(arr);
    setEditQuartier(est.quartier || (QUARTIERS_PAR_ARRONDISSEMENT[arr] ? QUARTIERS_PAR_ARRONDISSEMENT[arr][0] : 'Centre-Ville'));
    setEditAdresseExacte(est.adresseExacte || '');
    setEditCategorie(est.categorie || 'Bar Dancing / Cabaret');
    setEditRedevance(est.montantRedevanceAnnuelle || 60000);
    setEditSoldeRestant(est.soldeRestantDu ?? (est.montantRedevanceAnnuelle || 60000));
    setEditStatut(est.statut || 'mise_en_demeure');
  };

  const handleEditArrondissementChange = (newArr: Arrondissement) => {
    setEditArrondissement(newArr);
    const quartiers = QUARTIERS_PAR_ARRONDISSEMENT[newArr] || [];
    if (quartiers.length > 0) {
      setEditQuartier(quartiers[0]);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEst) return;
    setIsUpdating(true);
    try {
      await updateEstablishment(editingEst.id, {
        nomCommercial: editNomCommercial.trim(),
        promoteurNom: editPromoteurNom.trim(),
        promoteurTelephone: editPromoteurTel.trim(),
        promoteurEmail: editPromoteurEmail.trim(),
        arrondissement: editArrondissement,
        quartier: editQuartier.trim(),
        adresseExacte: editAdresseExacte.trim(),
        categorie: editCategorie,
        montantRedevanceAnnuelle: Number(editRedevance) || 0,
        soldeRestantDu: Number(editSoldeRestant) || 0,
        statut: editStatut,
      });
      showNotification('success', `Fiche de « ${editNomCommercial} » mise à jour avec succès dans la base.`);
      setEditingEst(null);
    } catch (err: any) {
      showNotification('error', `Erreur lors de la mise à jour: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Modal Reprogrammation RDV Tenancier
  const [reschedulingEst, setReschedulingEst] = useState<Establishment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleHeure, setRescheduleHeure] = useState<string>('10:00');
  const [rescheduleMotif, setRescheduleMotif] = useState<string>('Report convenu avec le promoteur');
  const [rescheduleCustomMotif, setRescheduleCustomMotif] = useState<string>('');
  const [rescheduleObservations, setRescheduleObservations] = useState<string>('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState<boolean>(false);

  const handleOpenReschedule = (est: Establishment) => {
    setReschedulingEst(est);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().substring(0, 10);
    setRescheduleDate(est.prochainRdvDate || tomorrowStr);
    setRescheduleHeure(est.prochainRdvHeure || '10:00');
    setRescheduleMotif(est.prochainRdvMotif || 'Report convenu avec le promoteur');
    setRescheduleCustomMotif('');
    setRescheduleObservations('');
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingEst) return;
    if (!rescheduleDate) {
      showNotification('error', 'Veuillez sélectionner une date de rendez-vous valide.');
      return;
    }
    setIsSubmittingReschedule(true);
    try {
      const finalMotif = rescheduleMotif === 'Autre motif convenu...'
        ? (rescheduleCustomMotif.trim() || 'Report convenu avec le promoteur')
        : rescheduleMotif;

      await rescheduleAppointment({
        establishmentId: reschedulingEst.id,
        nextRdvDate: rescheduleDate,
        nextRdvHeure: rescheduleHeure,
        nextRdvMotif: finalMotif,
        reportObservations: rescheduleObservations.trim() || undefined,
      });

      setReschedulingEst(null);
    } catch (err: any) {
      showNotification('error', `Erreur lors de la reprogrammation : ${err.message || 'Erreur inconnue'}`);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Traite la navigation directe depuis l'agenda des descentes
  useEffect(() => {
    if (selectedEstablishmentForRecensement) {
      const target = establishments.find((e) => e.id === selectedEstablishmentForRecensement);
      if (target) {
        setSearchTerm(target.codeDossier || target.nomCommercial);
        openEditEstablishment(target);
      }
      setSelectedEstablishmentForRecensement(null);
    }
  }, [selectedEstablishmentForRecensement, establishments, setSelectedEstablishmentForRecensement]);

  // 1-Click GPS Capture
  const handleCaptureGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(5)));
          setLongitude(Number(pos.coords.longitude.toFixed(5)));
          setIsLocating(false);
        },
        (err) => {
          console.warn("Positionnement par défaut Pointe-Noire:", err);
          const defaults: Record<Arrondissement, [number, number]> = {
            Lumumba: [-4.795, 11.851],
            'Mvou-Mvou': [-4.774, 11.867],
            'Tié-Tié': [-4.782, 11.892],
            Loandjili: [-4.743, 11.879],
            'Mongo-Mpoukou': [-4.758, 11.912],
            Ngoyo: [-4.835, 11.898],
          };
          const [lat, lng] = defaults[arrondissement];
          setLatitude(lat);
          setLongitude(lng);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomCommercial.trim() || !promoteurNom.trim()) {
      showNotification('warning', 'Veuillez renseigner le nom de l\'établissement et le nom du promoteur.');
      return;
    }

    setIsSubmitting(true);
    // Anti-bloquage: garantit que le bouton ne mouline jamais en continu même en cas d'interruption réseau
    const safetyTimeout = setTimeout(() => {
      setIsSubmitting(false);
    }, 4000);

    try {
      const defaultAgent = staff.find((s) => s.service === 'SAA') || staff[1] || staff[0];
      const assignedAgentId = (currentAgentId !== 'all' && currentAgentId !== 'stf-002')
        ? currentAgentId
        : (selectedAssignedAgentId !== 'stf-002' ? selectedAssignedAgentId : (defaultAgent?.id || '24234c2a-3c46-4f7b-b69a-c82df1c7bbfc'));
      const assignedAgent = staff.find((s) => s.id === assignedAgentId) || defaultAgent;
      const fullQuartier = repereLocal.trim() ? `${quartier} (${repereLocal.trim()})` : quartier;

      const createdEst = await addEstablishment({
        nomCommercial: nomCommercial.trim(),
        promoteurNom: promoteurNom.trim(),
        promoteurTelephone: promoteurTelephone.trim() || '+242 06 000 00 00',
        promoteurEmail: promoteurEmail.trim(),
        arrondissement,
        quartier: fullQuartier,
        adresseExacte: adresseExacte.trim() || `${fullQuartier}, ${arrondissement}`,
        categorie,
        regimeFiscal,
        surfaceM2: Number(surfaceM2),
        montantRedevanceAnnuelle: redevanceCalculee,
        montantEncaisse: statutInitial === 'en_regle' ? redevanceCalculee : 0,
        soldeRestantDu: statutInitial === 'en_regle' ? 0 : redevanceCalculee,
        statut: statutInitial,
        latitude,
        longitude,
        niveauDecibelsMoyen: Number(niveauDecibels),
        limiteurInstalle,
        dateRecensement: new Date().toISOString().substring(0, 10),
        recensePar: assignedAgent ? assignedAgent.nomComplet : 'Jacques MATOKO',
        agentAssigneId: assignedAgent ? assignedAgent.id : assignedAgentId,
        agentAssigneNom: assignedAgent ? assignedAgent.nomComplet : 'Jacques MATOKO',
        photoUrl: photoUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        dossierChecklist,
        piecesFourniesCount: piecesCheckedCount,
        tauxCompletudeDossier: tauxCompletude,
        fraisEnquetePaye,
      });

      // Optional First Intervention / Tournée
      if (planifierIntervention && createdEst) {
        await addSchedule({
          dateTournee: dateIntervention,
          heure: heureIntervention,
          etablissementId: createdEst.id,
          etablissementNom: createdEst.nomCommercial,
          arrondissement: createdEst.arrondissement,
          brigadeAssignee: assignedAgent?.brigadeAffectee || 'Brigade SAA',
          inspecteurChef: assignedAgent?.nomComplet || 'Jacques MATOKO',
          agentId: assignedAgent ? assignedAgent.id : assignedAgentId,
          typeMission: motifIntervention,
          montantAcompteAttendu: createdEst.soldeRestantDu > 0 ? createdEst.soldeRestantDu : undefined,
          notes: `Première visite suite au recensement sur le terrain.`,
          statut: 'planifie',
        });
        showNotification(
          'success',
          `Établissement « ${createdEst.nomCommercial} » enregistré et intervention planifiée au ${dateIntervention} (${heureIntervention}) dans l'Agenda !`
        );
      } else {
        showNotification(
          'success',
          `Établissement « ${nomCommercial} » recensé avec succès (${arrondissement} - ${quartier}).`
        );
      }

      // Reset Form
      setNomCommercial('');
      setPromoteurNom('');
      setPromoteurTelephone('');
      setPromoteurEmail('');
      setRepereLocal('');
      setAdresseExacte('');
      setStatutInitial('mise_en_demeure');
      setPlanifierIntervention(false);
      setPhotoUrl('');
      setSignatureUrl('');
      setShowSignaturePad(false);
    } catch (err: any) {
      console.error("Erreur enregistrement recensement:", err);
      showNotification('error', `Erreur lors de l'enregistrement : ${err?.message || 'Erreur inconnue'}`);
    } finally {
      clearTimeout(safetyTimeout);
      setIsSubmitting(false);
    }
  };

  // List filtered by search, arrondissement & quartier
  const displayedEstablishments = (visibleEstablishments || []).filter((est) => {
    if (!est) return false;
    const nom = (est.nomCommercial || '').toLowerCase();
    const promoteur = (est.promoteurNom || '').toLowerCase();
    const dossier = (est.codeDossier || '').toLowerCase();
    const quartierStr = (est.quartier || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();

    const matchSearch =
      !search ||
      nom.includes(search) ||
      promoteur.includes(search) ||
      dossier.includes(search) ||
      quartierStr.includes(search);

    const matchArr = selectedArrFilter === 'all' || est.arrondissement === selectedArrFilter;

    const matchQuartier =
      selectedQuartierFilter === 'all' ||
      quartierStr.includes((selectedQuartierFilter || '').toLowerCase());

    return matchSearch && matchArr && matchQuartier;
  });

  return (
    <div className={`p-4 md:p-6 space-y-6 max-w-7xl mx-auto transition-colors duration-200 ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`}>
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              MOD-02
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Recensement de Terrain & Brigade Mobile SAA
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fiche technique in situ, géolocalisation GPS 1-clic, attribution exclusive à l'agent et exécution hors-ligne
          </p>
        </div>

        {/* Offline status indicator & Sync */}
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connecté (Sync Immédiat)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>
                Mode Terrain Hors-Ligne (
                {Math.max(offlineQueueCount, establishments.filter((e) => e.syncStatus === 'pending').length)} fiches en file)
              </span>
            </div>
          )}

          {isOnline && (
            <button
              onClick={syncOfflineQueue}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                Math.max(offlineQueueCount, establishments.filter((e) => e.syncStatus === 'pending').length) > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Synchroniser vos recensements locaux avec Firebase Firestore"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {Math.max(offlineQueueCount, establishments.filter((e) => e.syncStatus === 'pending').length) > 0
                  ? `Synchroniser (${Math.max(
                      offlineQueueCount,
                      establishments.filter((e) => e.syncStatus === 'pending').length
                    )})`
                  : 'Sync Firestore'}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulaire de Saisie Terrain (5 colonnes) */}
        <div className={`lg:col-span-5 border rounded-xl p-5 shadow-sm space-y-4 transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPinPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Fiche d'Identification In Situ</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Formulaire Inspecteur
            </span>
          </div>

          {/* Strict Silo Agent Attribution Banner */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-200">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {currentAgent
                  ? `Assignation exclusive : ${currentAgent.nomComplet}`
                  : 'Mode Super-Admin (Sélectionnez l\'agent exclusif)'}
              </span>
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-300">
              Deux agents ne peuvent pas traiter le même établissement. Seul l'agent assigné pourra effectuer les relances.
            </p>

            {currentAgentId === 'all' && (
              <div className="pt-1.5">
                <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Attribuer exclusivement à l'agent :
                </label>
                <select
                  value={selectedAssignedAgentId}
                  onChange={(e) => setSelectedAssignedAgentId(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  {staff.filter(s => s.service === 'SAA').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nomComplet} ({s.brigadeAffectee})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Nom & Promoteur */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Nom Commercial de l'Établissement *
              </label>
              <input
                type="text"
                required
                value={nomCommercial}
                onChange={(e) => setNomCommercial(e.target.value)}
                placeholder="Ex: Le Palmier VIP Lounge"
                className={`w-full px-3 py-2 rounded-lg border font-medium focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Nom du Promoteur *</label>
                <input
                  type="text"
                  required
                  value={promoteurNom}
                  onChange={(e) => setPromoteurNom(e.target.value)}
                  placeholder="Ex: Jean-Pierre Tchicaya"
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Téléphone Contact *</label>
                <input
                  type="text"
                  required
                  value={promoteurTelephone}
                  onChange={(e) => setPromoteurTelephone(e.target.value)}
                  placeholder="+242 06 ..."
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Arrondissement & Quartier avec liste déroulante dynamique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Arrondissement *</label>
                <select
                  value={arrondissement}
                  onChange={(e) => {
                    const nextArr = e.target.value as Arrondissement;
                    setArrondissement(nextArr);
                    const list = QUARTIERS_PAR_ARRONDISSEMENT[nextArr] || [];
                    setQuartier(list[0] || '');
                  }}
                  className={`w-full px-3 py-2 rounded-lg border font-semibold focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                  }`}
                >
                  <option value="Lumumba">1. Lumumba</option>
                  <option value="Mvou-Mvou">2. Mvou-Mvou</option>
                  <option value="Tié-Tié">3. Tié-Tié</option>
                  <option value="Loandjili">4. Loandjili</option>
                  <option value="Mongo-Mpoukou">5. Mongo-Mpoukou</option>
                  <option value="Ngoyo">6. Ngoyo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Quartier (Liste Déroulante) *
                </label>
                <select
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-medium focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                  }`}
                >
                  {(QUARTIERS_PAR_ARRONDISSEMENT[arrondissement] || []).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Repère Local ou Rue */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Précision / Repère Local ou Rue
              </label>
              <input
                type="text"
                value={repereLocal}
                onChange={(e) => setRepereLocal(e.target.value)}
                placeholder="Ex: Kilomètre 4, vers Total, Rue 14"
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Photo de l'établissement */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-sky-950/20 border-sky-800/40'
            }`}>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                📸 Photo de l'Établissement (Optionnel)
              </span>
              <PhotoCapture
                currentPhoto={photoUrl}
                onPhotoCaptured={(data) => setPhotoUrl(data)}
                onPhotoRemoved={() => setPhotoUrl('')}
                label="Prendre une photo de l'établissement"
              />
            </div>

            {/* Signature numérique du promoteur */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isLight ? 'bg-violet-50/60 border-violet-200' : 'bg-violet-950/20 border-violet-800/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  ✍️ Signature Numérique du Promoteur (Optionnel)
                </span>
                {signatureUrl ? (
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                    ✓ Signature capturée
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad((v) => !v)}
                    className="text-[10px] px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold transition"
                  >
                    {showSignaturePad ? 'Masquer' : 'Ouvrir le Pad'}
                  </button>
                )}
              </div>
              {showSignaturePad && !signatureUrl && (
                <SignaturePad
                  onSave={(dataUrl) => {
                    setSignatureUrl(dataUrl);
                    setShowSignaturePad(false);
                  }}
                  onCancel={() => setShowSignaturePad(false)}
                />
              )}
              {signatureUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="h-12 border rounded bg-white dark:bg-slate-900 object-contain"
                    style={{ maxWidth: 180 }}
                  />
                  <button
                    type="button"
                    onClick={() => { setSignatureUrl(''); setShowSignaturePad(true); }}
                    className="text-[10px] px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition"
                  >
                    Refaire
                  </button>
                </div>
              )}
            </div>

            {/* Statut Administratif & Dépôt du Dossier (Non Automatique) */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Statut Administratif & Attestation de Dépôt
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Non Automatique
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-900/50">
                  <input
                    type="radio"
                    name="dossierStatus"
                    checked={statutInitial === 'mise_en_demeure'}
                    onChange={() => setStatutInitial('mise_en_demeure')}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      En Instance de Régularisation (Mise en Demeure / Dossier Non Déposé)
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Statut par défaut lors du recensement. Aucune attestation ne sera délivrée tant que les pièces n'ont pas été reçues.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-900/50">
                  <input
                    type="radio"
                    name="dossierStatus"
                    checked={statutInitial === 'attestation_provisoire'}
                    onChange={() => setStatutInitial('attestation_provisoire')}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      Dossier Physique Déposé au Guichet (Attestation Provisoire Accordée)
                    </span>
                    <p className="text-[10px] text-slate-500">
                      À sélectionner UNIQUEMENT si le promoteur a formellement remis son dossier technique complet au bureau DDL-PN.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Adresse Exacte</label>
              <input
                type="text"
                value={adresseExacte}
                onChange={(e) => setAdresseExacte(e.target.value)}
                placeholder="Avenue, numéro de parcelle ou rue"
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* GPS 1-Clic Capture */}
            <div className={`p-3 border rounded-lg space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Coordonnées GPS In Situ
                </span>
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={isLocating}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1 transition hover:bg-emerald-500"
                >
                  <Compass className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Acquisition...' : 'Capturer GPS (1-Clic)'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className={`p-1.5 rounded border ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                  Lat: {latitude}
                </div>
                <div className={`p-1.5 rounded border ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                  Long: {longitude}
                </div>
              </div>
            </div>

            {/* Catégorie & Régime Fiscal */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Catégorie de Loisirs</label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as EstablishmentCategory)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                }`}
              >
                <option value="Discothèque / Night-club">Discothèque / Night-club</option>
                <option value="Bar Dancing / Cabaret">Bar Dancing / Cabaret</option>
                <option value="Lounge Bar & Terrasse">Lounge Bar & Terrasse</option>
                <option value="Espace Récréatif & Salle Polyvalente">Espace Récréatif & Salle Polyvalente</option>
                <option value="Snack-Bar Sonorisé">Snack-Bar Sonorisé</option>
                <option value="Complexe de Loisirs & Piscine">Complexe de Loisirs & Piscine</option>
                <option value="Autre établissement de loisirs">Autre établissement</option>
              </select>
            </div>

            {/* Régime fiscal & Simulateur instantané Note 151/MTL-CAB */}
            <div className={`p-3 border rounded-lg space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  Redevance d'Autorisation (Note 151)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {formatCfa(redevanceCalculee)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegimeFiscal('informel_forfaitaire')}
                  className={`py-1.5 px-2 rounded text-[11px] font-semibold transition border ${
                    regimeFiscal === 'informel_forfaitaire'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isLight
                        ? 'bg-white text-slate-700 border-slate-300'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Forfait Informel SAA
                </button>
                <button
                  type="button"
                  onClick={() => setRegimeFiscal('formel_proportionnel')}
                  className={`py-1.5 px-2 rounded text-[11px] font-semibold transition border ${
                    regimeFiscal === 'formel_proportionnel'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isLight
                        ? 'bg-white text-slate-700 border-slate-300'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Barème Officiel Note 151
                </button>
              </div>

              {regimeFiscal === 'informel_forfaitaire' ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Forfait Informel standard :</span>
                  <input
                    type="number"
                    value={forfaitStandard}
                    onChange={(e) => setForfaitStandard(Number(e.target.value))}
                    className={`w-28 px-2 py-1 rounded border text-right font-mono font-bold text-emerald-600 ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Superficie utile ({officialFeeInfo.tauxUnitaire > 0 ? `${formatCfa(officialFeeInfo.tauxUnitaire)}/m²` : 'Forfait'}) :
                    </span>
                    <input
                      type="number"
                      value={surfaceM2}
                      onChange={(e) => setSurfaceM2(Number(e.target.value))}
                      className={`w-28 px-2 py-1 rounded border text-right font-mono font-bold text-blue-600 ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>↳ Quote-part Étude 50% : {formatCfa(Math.round(redevanceCalculee * 0.5))}</span>
                    <span>Trésor 50% : {formatCfa(Math.round(redevanceCalculee * 0.5))}</span>
                  </div>
                </div>
              )}

              {/* Frais d'enquête terrain 30 000 FCFA (Fiche Locale SAF DDL-PN) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Frais d'Enquête Terrain (30 000 FCFA)
                  </span>
                  <span className="text-[9.5px] text-slate-400">Régie SAF DDL-PN (déplacement brigade)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFraisEnquetePaye(!fraisEnquetePaye)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition font-mono ${
                    fraisEnquetePaye
                      ? 'bg-emerald-600 text-white'
                      : isLight
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {fraisEnquetePaye ? '30 000 F Acquitté' : 'À Recouvrer'}
                </button>
              </div>
            </div>

            {/* Volet Contrôle des Pièces du Dossier (Note 152 / SAF) */}
            <div className={`p-3 border rounded-lg space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  Pièces du Dossier (Note 152 & SAF)
                </span>
                <button
                  type="button"
                  onClick={() => setShowDossierChecklist(!showDossierChecklist)}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  {showDossierChecklist ? 'Réduire' : `Vérifier (${piecesCheckedCount}/${OFFICIAL_DOSSIER_CHECKLIST.length})`}
                </button>
              </div>

              {/* Jauge de complétude */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Complétude du dossier d'agrément</span>
                  <span className={`font-bold ${tauxCompletude >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {piecesCheckedCount} / {OFFICIAL_DOSSIER_CHECKLIST.length} ({tauxCompletude}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      tauxCompletude >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${tauxCompletude}%` }}
                  />
                </div>
              </div>

              {showDossierChecklist && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {OFFICIAL_DOSSIER_CHECKLIST.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-[11px] transition"
                    >
                      <input
                        type="checkbox"
                        checked={!!dossierChecklist[doc.id]}
                        onChange={(e) =>
                          setDossierChecklist((prev) => ({
                            ...prev,
                            [doc.id]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 leading-tight">
                        <span className={dossierChecklist[doc.id] ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                          {doc.libelle}
                        </span>
                        {doc.obligatoire && (
                          <span className="ml-1 text-[9px] text-red-500 font-bold">*</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Décibels & Sonomètre Intégré */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  Niveau Sonore : <span className="font-mono text-amber-600 font-bold ml-1">{niveauDecibels} dB(A)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSonometer(!showSonometer)}
                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Radio className="w-3 h-3" />
                  <span>{showSonometer ? 'Masquer Sonomètre' : 'Ouvrir Sonomètre SAA'}</span>
                </button>
              </div>

              {showSonometer && (
                <SonometerTool
                  initialDb={niveauDecibels}
                  onCaptureDecibels={(db) => {
                    setNiveauDecibels(db);
                    setShowSonometer(false);
                  }}
                />
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="limiteurCheckbox"
                  checked={limiteurInstalle}
                  onChange={(e) => setLimiteurInstalle(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="limiteurCheckbox" className="font-medium text-[11px] text-slate-600 dark:text-slate-400">
                  Dispositif limiteur de son homologué présent
                </label>
              </div>
            </div>

            {/* Option Planification Intervention Immédiate */}
            <div className={`p-3 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/30 border-blue-900/60'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="planifierInterventionCheck"
                  checked={planifierIntervention}
                  onChange={(e) => setPlanifierIntervention(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="planifierInterventionCheck" className="font-bold text-xs text-blue-700 dark:text-blue-300 cursor-pointer flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Programmer immédiatement une 1ère intervention / visite</span>
                </label>
              </div>

              {planifierIntervention && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">Date :</label>
                    <input
                      type="date"
                      value={dateIntervention}
                      onChange={(e) => setDateIntervention(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                      required={planifierIntervention}
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">Heure :</label>
                    <input
                      type="time"
                      value={heureIntervention}
                      onChange={(e) => setHeureIntervention(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs"
                      required={planifierIntervention}
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-0.5">Motif :</label>
                    <select
                      value={motifIntervention}
                      onChange={(e) => setMotifIntervention(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs font-semibold"
                    >
                      <option value="Recouvrement">Recouvrement Acompte</option>
                      <option value="Contrôle Décibels">Contrôle Décibels</option>
                      <option value="Signification Mise en Demeure">Mise en Demeure</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Valider & Enregistrer Fiche Terrain {planifierIntervention ? '& RDV' : ''}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Liste des Établissements Recensés (7 colonnes) */}
        <div className={`lg:col-span-7 border rounded-xl p-5 shadow-sm flex flex-col transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>
                  {currentAgentId !== 'all'
                    ? `Dossiers sous suivi exclusif (${displayedEstablishments.length})`
                    : `Registre Départemental (${displayedEstablishments.length})`}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                {currentAgentId !== 'all'
                  ? `Seuls les dossiers de ${currentAgent?.nomComplet} sont affichés.`
                  : 'Vue globale administrateur sur l\'ensemble des 6 arrondissements.'}
              </p>
            </div>

            {/* Search, Arrondissement & Quartier Filters for Statistics */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className={`pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none w-28 sm:w-36 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Filtre Arrondissement */}
              <select
                value={selectedArrFilter}
                onChange={(e) => {
                  setSelectedArrFilter(e.target.value);
                  setSelectedQuartierFilter('all');
                }}
                className={`px-2 py-1.5 rounded-lg border text-xs font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
              >
                <option value="all">Tous Arrondissements</option>
                <option value="Lumumba">1. Lumumba</option>
                <option value="Mvou-Mvou">2. Mvou-Mvou</option>
                <option value="Tié-Tié">3. Tié-Tié</option>
                <option value="Loandjili">4. Loandjili</option>
                <option value="Mongo-Mpoukou">5. Mongo-Mpoukou</option>
                <option value="Ngoyo">6. Ngoyo</option>
              </select>

              {/* Filtre Quartier Déroulant */}
              <select
                value={selectedQuartierFilter}
                onChange={(e) => setSelectedQuartierFilter(e.target.value)}
                className={`px-2 py-1.5 rounded-lg border text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
              >
                <option value="all">Tous Quartiers</option>
                {selectedArrFilter !== 'all' ? (
                  (QUARTIERS_PAR_ARRONDISSEMENT[selectedArrFilter as Arrondissement] || []).map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))
                ) : (
                  Array.from(new Set((visibleEstablishments || []).map((e) => e?.quartier))).filter(Boolean).map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1 max-h-[640px]">
            {displayedEstablishments.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Building className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-semibold">Aucun établissement ne correspond aux critères.</p>
              </div>
            ) : (
              displayedEstablishments.map((est) => {
                const isAttestationEligible =
                  est?.statut === 'attestation_provisoire' ||
                  est?.statut === 'en_regle' ||
                  Boolean(est?.numeroAttestation);

                const arrStr = est?.arrondissement || 'Lumumba';
                const statutDisplay = est?.statut === 'attestation_provisoire'
                  ? 'Attestation Délivrée'
                  : (est?.statut || 'mise_en_demeure').replace('_', ' ');

                return (
                  <div
                    key={est.id}
                    className={`p-3.5 rounded-lg border transition space-y-2 text-xs ${
                      isLight
                        ? 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                        : 'bg-slate-950/60 hover:border-slate-700 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 mr-2">
                          {est.codeDossier || 'DDL-PN-2026'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {est.nomCommercial || 'Établissement SAA'}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Promoteur: <span className="font-semibold text-slate-700 dark:text-slate-300">{est.promoteurNom || 'N/A'}</span> ({est.promoteurTelephone || 'N/A'})
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            est.statut === 'en_regle'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : est.statut === 'attestation_provisoire'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300'
                          }`}
                        >
                          {statutDisplay}
                        </span>
                        <p className="font-mono text-[10px] text-slate-400">
                          {est.syncStatus === 'synced' ? (
                            <span className="text-emerald-600 flex items-center justify-end gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Synchro OK
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center justify-end gap-1 font-semibold">
                              <WifiOff className="w-3 h-3" /> Hors-ligne
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Arrondissement & Quartier :</span>
                        <span className="font-semibold truncate block">
                          {arrStr} • {est.quartier || 'Centre'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Redevance:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatCfa(est.montantRedevanceAnnuelle || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Solde restant:</span>
                        <span className="font-mono font-bold text-blue-600">
                          {formatCfa(est.soldeRestantDu || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Agent exclusif:</span>
                        <span className="truncate block font-semibold text-blue-700 dark:text-blue-300">
                          {est.agentAssigneNom || est.recensePar || 'Non assigné'}
                        </span>
                      </div>
                    </div>

                    {/* Rendez-vous fixé ou convenu */}
                    {est.prochainRdvDate && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span>
                            Rendez-vous fixé : <strong>{est.prochainRdvDate}</strong> à <strong>{est.prochainRdvHeure || '10:00'}</strong>
                          </span>
                          {est.prochainRdvMotif && (
                            <span className="text-purple-600 dark:text-purple-400 italic">
                              ({est.prochainRdvMotif})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(est)}
                          className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition cursor-pointer shrink-0"
                          title="Modifier la date ou l'heure de ce rendez-vous"
                        >
                          Changer date
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60 flex-wrap">
                      {/* Rappel WhatsApp */}
                      {est.promoteurTelephone && (
                        <button
                          type="button"
                          onClick={() => openWhatsAppReminder({
                            phone: est.promoteurTelephone,
                            etablissementNom: est.nomCommercial,
                            promoteurNom: est.promoteurNom,
                            montantDu: est.soldeRestantDu,
                            rdvDate: est.prochainRdvDate,
                          })}
                          className="px-2.5 py-1 rounded bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Envoyer un rappel WhatsApp au promoteur"
                        >
                          <span className="text-[12px]">💬</span>
                          WhatsApp
                        </button>
                      )}
                      {/* Bouton Éditer Fiche */}
                      <button
                        type="button"
                        onClick={() => openEditEstablishment(est)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Modifier ou compléter les informations de cet établissement"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                        <span>Éditer Fiche</span>
                      </button>

                      {/* Reprogrammer RDV Tenancier */}
                      <button
                        type="button"
                        onClick={() => handleOpenReschedule(est)}
                        className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Reprogrammer ou fixer un rendez-vous avec ce tenancier"
                      >
                        <CalendarClock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>{est.prochainRdvDate ? 'Reprogrammer RDV' : 'Fixer RDV'}</span>
                      </button>

                      <button
                        onClick={() => setActiveModule('MOD-01')}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <CalendarCheck className="w-3 h-3 text-blue-600" />
                        Gérer RDV & Acomptes
                      </button>

                      {/* Attestation conditionnelle : UNIQUEMENT si le dossier est déposé et validé */}
                      {isAttestationEligible ? (
                        <button
                          onClick={() => openPrintModal('a4_attestation', est)}
                          className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Imprimer l'attestation de dépôt validée"
                        >
                          <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>Attestation A4</span>
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const arrPrefix = (arrStr || 'PNR').substring(0, 3).toUpperCase();
                            await updateEstablishment(est.id, {
                              statut: 'attestation_provisoire',
                              numeroAttestation: `ATT-2026-${arrPrefix}-${Date.now().toString().slice(-4)}`,
                              dateDelivranceAttestation: new Date().toISOString().substring(0, 10),
                            });
                            showNotification('success', `Dépôt physique validé pour « ${est.nomCommercial} ». Attestation Provisoire accordée.`);
                          }}
                          className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Valider le dépôt physique au guichet pour accorder l'attestation"
                        >
                          <CheckCircle2 className="w-3 h-3 text-amber-600" />
                          <span>Valider Dépôt Dossier</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL ÉDITION / COMPLÉMENT DE FICHE ÉTABLISSEMENT */}
      {editingEst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Compléter / Modifier la Fiche Établissement</span>
                </h3>
                <p className="text-xs text-indigo-100 font-mono">
                  {editingEst.codeDossier || 'Dossier DDL-PN'} • {editingEst.nomCommercial}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEst(null)}
                className="p-1 rounded-full hover:bg-indigo-700 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Nom commercial :</label>
                <input
                  type="text"
                  required
                  value={editNomCommercial}
                  onChange={(e) => setEditNomCommercial(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Arrondissement :</label>
                  <select
                    value={editArrondissement}
                    onChange={(e) => handleEditArrondissementChange(e.target.value as Arrondissement)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="Lumumba">1 - Lumumba</option>
                    <option value="Mvou-Mvou">2 - Mvou-Mvou</option>
                    <option value="Tié-Tié">3 - Tié-Tié</option>
                    <option value="Loandjili">4 - Loandjili</option>
                    <option value="Mongo-Mpoukou">5 - Mongo-Mpoukou</option>
                    <option value="Ngoyo">6 - Ngoyo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Quartier :</label>
                  <select
                    value={editQuartier}
                    onChange={(e) => setEditQuartier(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    {(QUARTIERS_PAR_ARRONDISSEMENT[editArrondissement] || []).map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Repère local / Adresse exacte :</label>
                <input
                  type="text"
                  placeholder="Ex: Face marché central, avenue de la Paix"
                  value={editAdresseExacte}
                  onChange={(e) => setEditAdresseExacte(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Promoteur / Gérant :</label>
                  <input
                    type="text"
                    required
                    value={editPromoteurNom}
                    onChange={(e) => setEditPromoteurNom(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Téléphone (WhatsApp) :</label>
                  <input
                    type="text"
                    placeholder="+242 06 000 00 00"
                    value={editPromoteurTel}
                    onChange={(e) => setEditPromoteurTel(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Catégorie :</label>
                  <select
                    value={editCategorie}
                    onChange={(e) => setEditCategorie(e.target.value as EstablishmentCategory)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="Bar Dancing / Cabaret">Bar Dancing / Cabaret</option>
                    <option value="Discothèque / Night-club">Discothèque / Night-club</option>
                    <option value="Lounge Bar & Terrasse">Lounge Bar & Terrasse</option>
                    <option value="Snack-Bar Sonorisé">Snack-Bar Sonorisé</option>
                    <option value="Espace Récréatif & Salle Polyvalente">Espace Récréatif</option>
                    <option value="Complexe de Loisirs & Piscine">Complexe de Loisirs</option>
                    <option value="Autre établissement de loisirs">Autre établissement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Statut de conformité :</label>
                  <select
                    value={editStatut}
                    onChange={(e) => setEditStatut(e.target.value as ComplianceStatus)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="mise_en_demeure">Mise en Demeure (Orange)</option>
                    <option value="attestation_provisoire">Attestation Provisoire (Bleu)</option>
                    <option value="en_regle">En Règle / Agrément Définitif (Vert)</option>
                    <option value="ferme_contentieux">Fermeture / Contentieux (Rouge)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Redevance Annuelle (FCFA) :</label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={editRedevance}
                    onChange={(e) => setEditRedevance(Number(e.target.value))}
                    className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Solde Restant Dû (FCFA) :</label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={editSoldeRestant}
                    onChange={(e) => setEditSoldeRestant(Number(e.target.value))}
                    className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEst(null)}
                  className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL REPROGRAMMATION DU RENDEZ-VOUS DU TENANCIER */}
      {reschedulingEst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  <span>Reprogrammer le Rendez-vous Tenancier</span>
                </h3>
                <p className="text-xs text-purple-100 font-mono">
                  {reschedulingEst.codeDossier || 'Dossier DDL-PN'} • {reschedulingEst.nomCommercial}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReschedulingEst(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Récapitulatif établissement */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {reschedulingEst.nomCommercial}
                  </span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                    {reschedulingEst.arrondissement} ({reschedulingEst.quartier || 'Centre'})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-500 text-[11px]">
                  <div>Promoteur : <strong className="text-slate-700 dark:text-slate-300">{reschedulingEst.promoteurNom}</strong></div>
                  <div>Tél : <span className="font-mono text-purple-600">{reschedulingEst.promoteurTelephone}</span></div>
                  <div>Reste à payer : <strong className="font-mono text-emerald-600">{formatCfa(reschedulingEst.soldeRestantDu)}</strong></div>
                  <div>Agent assigné : <strong>{reschedulingEst.agentAssigneNom || 'Agent SAA'}</strong></div>
                </div>
                {reschedulingEst.prochainRdvDate && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>RDV précédent : <strong>{reschedulingEst.prochainRdvDate}</strong> à <strong>{reschedulingEst.prochainRdvHeure || '10:00'}</strong> ({reschedulingEst.prochainRdvMotif || 'Non spécifié'})</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleConfirmReschedule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">
                      Nouvelle Date Convenue *
                    </label>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">
                      Heure de Passage / Audition *
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleHeure}
                      onChange={(e) => setRescheduleHeure(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">
                    Motif de la reprogrammation *
                  </label>
                  <select
                    value={rescheduleMotif}
                    onChange={(e) => setRescheduleMotif(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  >
                    <option value="Report convenu avec le promoteur">Report convenu avec le promoteur</option>
                    <option value="Promoteur en déplacement / Absence momentanée">Promoteur en déplacement / Absence momentanée</option>
                    <option value="Délai supplémentaire accordé pour versement acompte">Délai supplémentaire accordé pour versement acompte</option>
                    <option value="Visite technique acoustique & limiteur de son">Visite technique acoustique & limiteur de son</option>
                    <option value="Audition contradictoire au bureau de la Brigade">Audition contradictoire au bureau de la Brigade</option>
                    <option value="Dossier en cours de constitution / Dépôt physique">Dossier en cours de constitution / Dépôt physique</option>
                    <option value="Autre motif convenu...">Autre motif convenu...</option>
                  </select>
                </div>

                {rescheduleMotif === 'Autre motif convenu...' && (
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">
                      Préciser le motif personnalisé *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Attente signature bail commercial..."
                      value={rescheduleCustomMotif}
                      onChange={(e) => setRescheduleCustomMotif(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                      }`}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">
                    Observations de terrain ou engagements du tenancier
                  </label>
                  <textarea
                    rows={2}
                    value={rescheduleObservations}
                    onChange={(e) => setRescheduleObservations(e.target.value)}
                    placeholder="Ex: Le promoteur a promis d'apporter l'acompte de 50 000 FCFA lors de ce passage."
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReschedulingEst(null)}
                    className="px-4 py-2 rounded-xl border font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReschedule}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReschedule ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <CalendarClock className="w-4 h-4" />
                        <span>Confirmer la Reprogrammation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
