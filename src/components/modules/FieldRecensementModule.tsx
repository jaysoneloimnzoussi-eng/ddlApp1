import React, { useState } from 'react';
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
  Building,
} from 'lucide-react';
import {
  Arrondissement,
  EstablishmentCategory,
  ComplianceStatus,
  QUARTIERS_PAR_ARRONDISSEMENT,
} from '../../types';
import { formatCfa } from '../../services/crypto';
import { SonometerTool } from '../common/SonometerTool';

export const FieldRecensementModule: React.FC = () => {
  const {
    establishments,
    visibleEstablishments,
    currentAgent,
    currentAgentId,
    currentUserRole,
    staff,
    addEstablishment,
    updateEstablishment,
    showNotification,
    isOnline,
    offlineQueueCount,
    syncOfflineQueue,
    openPrintModal,
    setActiveModule,
    theme,
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
  const [selectedAssignedAgentId, setSelectedAssignedAgentId] = useState<string>(
    currentAgentId !== 'all' ? currentAgentId : 'stf-002'
  );
  const [showSonometer, setShowSonometer] = useState<boolean>(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArrFilter, setSelectedArrFilter] = useState<string>('all');
  const [selectedQuartierFilter, setSelectedQuartierFilter] = useState<string>('all');

  // Automatic calculation of redevance
  const redevanceCalculee =
    regimeFiscal === 'informel_forfaitaire'
      ? forfaitStandard
      : Math.max(150000, surfaceM2 * 1200);

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
    if (!nomCommercial || !promoteurNom) return;

    const assignedAgentId = currentAgentId !== 'all' ? currentAgentId : selectedAssignedAgentId;
    const assignedAgent = staff.find((s) => s.id === assignedAgentId);
    const fullQuartier = repereLocal.trim() ? `${quartier} (${repereLocal.trim()})` : quartier;

    await addEstablishment({
      nomCommercial,
      promoteurNom,
      promoteurTelephone: promoteurTelephone || '+242 06 000 00 00',
      promoteurEmail,
      arrondissement,
      quartier: fullQuartier,
      adresseExacte: adresseExacte || `${fullQuartier}, ${arrondissement}`,
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
      recensePar: assignedAgent ? assignedAgent.nomComplet : 'Brigade SAA',
      agentAssigneId: assignedAgentId,
      agentAssigneNom: assignedAgent ? assignedAgent.nomComplet : 'Inspecteur SAA',
    });

    showNotification(
      'success',
      `Établissement « ${nomCommercial} » recensé (${arrondissement} - ${quartier}). Statut : ${
        statutInitial === 'attestation_provisoire' ? 'Attestation de Dépôt accordée' : 'En instance de régularisation'
      }`
    );

    // Reset Form
    setNomCommercial('');
    setPromoteurNom('');
    setPromoteurTelephone('');
    setPromoteurEmail('');
    setRepereLocal('');
    setAdresseExacte('');
    setStatutInitial('mise_en_demeure');
  };

  // List filtered by search, arrondissement & quartier
  const displayedEstablishments = visibleEstablishments.filter((est) => {
    const matchSearch =
      est.nomCommercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.promoteurNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.codeDossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (est.quartier && est.quartier.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchArr = selectedArrFilter === 'all' || est.arrondissement === selectedArrFilter;

    const matchQuartier =
      selectedQuartierFilter === 'all' ||
      (est.quartier && est.quartier.toLowerCase().includes(selectedQuartierFilter.toLowerCase()));

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
              <span>Mode Terrain Hors-Ligne ({offlineQueueCount} fiches en file)</span>
            </div>
          )}

          {offlineQueueCount > 0 && isOnline && (
            <button
              onClick={syncOfflineQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Synchroniser ({offlineQueueCount})
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

            {/* Régime fiscal & Simulateur instantané */}
            <div className={`p-3 border rounded-lg space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  Calculateur Tarif Redevance
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
                  Forfait Informel (Standard)
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
                  Proportionnel (Surface m²)
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
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Superficie exploitée (m²) :</span>
                  <input
                    type="number"
                    value={surfaceM2}
                    onChange={(e) => setSurfaceM2(Number(e.target.value))}
                    className={`w-28 px-2 py-1 rounded border text-right font-mono font-bold text-blue-600 ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
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

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Valider & Enregistrer Fiche Terrain</span>
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
                  Array.from(new Set(visibleEstablishments.map((e) => e.quartier))).filter(Boolean).map((q) => (
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
                  est.statut === 'attestation_provisoire' ||
                  est.statut === 'en_regle' ||
                  Boolean(est.numeroAttestation);

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
                          {est.codeDossier}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {est.nomCommercial}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Promoteur: <span className="font-semibold text-slate-700 dark:text-slate-300">{est.promoteurNom}</span> ({est.promoteurTelephone})
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
                          {est.statut === 'attestation_provisoire' ? 'Attestation Délivrée' : est.statut.replace('_', ' ')}
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
                          {est.arrondissement} • {est.quartier}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Redevance:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatCfa(est.montantRedevanceAnnuelle)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Solde restant:</span>
                        <span className="font-mono font-bold text-blue-600">
                          {formatCfa(est.soldeRestantDu)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Agent exclusif:</span>
                        <span className="truncate block font-semibold text-blue-700 dark:text-blue-300">
                          {est.agentAssigneNom || est.recensePar}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
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
                            if (window.confirm(`Validation administrative :\n\nConfirmez-vous que le promoteur de « ${est.nomCommercial} » a effectivement déposé ses pièces au guichet DDL-PN ?\n\nCette action accordera l'Attestation Provisoire de Dépôt.`)) {
                              await updateEstablishment(est.id, {
                                statut: 'attestation_provisoire',
                                numeroAttestation: `ATT-2026-${est.arrondissement.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                                dateDelivranceAttestation: new Date().toISOString().substring(0, 10),
                              });
                              showNotification('success', `Dossier validé pour ${est.nomCommercial}. Attestation de Dépôt disponible.`);
                            }
                          }}
                          className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="L'attestation n'est pas automatique : valider le dépôt physique préalable"
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
    </div>
  );
};
