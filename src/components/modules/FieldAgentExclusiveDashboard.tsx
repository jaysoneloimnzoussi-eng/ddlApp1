import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Building2,
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  AlertTriangle,
  Coins,
  Receipt,
  Search,
  Plus,
  ArrowRight,
  UserCheck,
  CalendarCheck,
  FileText,
  CreditCard,
  X,
  Check,
  MapPin,
  TrendingUp,
  Sparkles,
  Scale,
  Ban,
} from 'lucide-react';
import { Establishment, CashReceipt } from '../../types';
import { formatCfa } from '../../services/crypto';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const FieldAgentExclusiveDashboard: React.FC = () => {
  const {
    visibleEstablishments,
    receipts,
    schedules,
    currentAgent,
    authenticatedUser,
    recordPaymentAndScheduleNext,
    reportEstablishmentClosed,
    setActiveModule,
    theme,
    showNotification,
  } = useApp();

  const isLight = theme === 'light';
  const agent = currentAgent || authenticatedUser;

  // Active sub-tab in Agent Dashboard
  const [activeTab, setActiveTab] = useState<'convoques' | 'payes' | 'avances' | 'rdv' | 'tous'>('convoques');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal for Recording Payment / Advance and Scheduling Next Appointment
  const [selectedEstForPayment, setSelectedEstForPayment] = useState<Establishment | null>(null);
  const [montantAcompte, setMontantAcompte] = useState<number>(50000);
  const [modePaiement, setModePaiement] = useState<CashReceipt['modePaiement']>('especes');
  const [nextRdvDate, setNextRdvDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [nextRdvHeure, setNextRdvHeure] = useState<string>('10:30');
  const [nextRdvMotif, setNextRdvMotif] = useState<string>('Versement de la tranche suivante de redevance');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reporting closed / extinct establishment modal state
  const [reportingClosedEst, setReportingClosedEst] = useState<Establishment | null>(null);
  const [closedMotif, setClosedMotif] = useState<string>('Cessation d\'activité définitive / Rideau baissé');
  const [closedObservations, setClosedObservations] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState<boolean>(false);

  // Upcoming RDV count
  const upcomingAgentRdvCount = useMemo(() => {
    return schedules.filter(
      (s) => s.statut === 'planifie' && (s.agentId === agent?.id || (agent?.nomComplet && s.inspecteurChef?.toLowerCase().includes(agent.nomComplet.toLowerCase())))
    ).length;
  }, [schedules, agent]);

  // 1. ÉTABLISSEMENTS CONVOQUÉS / SOUS MISE EN DEMEURE / EN CONTENTIEUX
  const etablissementsConvoques = useMemo(() => {
    return visibleEstablishments.filter((e) => {
      const isMiseEnDemeure = e.statut === 'mise_en_demeure' || e.statut === 'ferme_contentieux';
      const hasConvocMotif = e.prochainRdvMotif?.toLowerCase().includes('convoqu') ||
                             e.prochainRdvMotif?.toLowerCase().includes('infraction') ||
                             e.prochainRdvMotif?.toLowerCase().includes('demeure');
      const hasMiseEnDemeureDate = Boolean(e.miseEnDemeureDate);
      return isMiseEnDemeure || hasConvocMotif || hasMiseEnDemeureDate;
    });
  }, [visibleEstablishments]);

  // 2. CEUX QUI ONT PAYÉ (SOLDÉS / EN RÈGLE)
  const etablissementsPayes = useMemo(() => {
    return visibleEstablishments.filter((e) => {
      const isEnRegle = e.statut === 'en_regle';
      const isSoldeZero = e.soldeRestantDu === 0 && e.montantEncaisse > 0;
      const isFullyPaid = e.montantRedevanceAnnuelle > 0 && e.montantEncaisse >= e.montantRedevanceAnnuelle;
      return isEnRegle || isSoldeZero || isFullyPaid;
    });
  }, [visibleEstablishments]);

  // 3. CEUX QUI ONT DONNÉ DES AVANCES (ACOMPTES PARTIELS)
  const etablissementsAvances = useMemo(() => {
    return visibleEstablishments.filter((e) => {
      // Has paid something, but still has a remaining balance
      const hasPartialPayment = e.montantEncaisse > 0 && e.soldeRestantDu > 0;
      const hasHistory = (e.historiquePaiements && e.historiquePaiements.length > 0) && e.soldeRestantDu > 0;
      return hasPartialPayment || hasHistory;
    });
  }, [visibleEstablishments]);

  // 4. PROCHAINS RENDEZ-VOUS CONVENUS
  const prochainsRdvList = useMemo(() => {
    // Gather all establishments with an upcoming appointment date
    const withDates = visibleEstablishments
      .filter((e) => Boolean(e.prochainRdvDate))
      .map((e) => ({
        etablissement: e,
        date: e.prochainRdvDate!,
        heure: e.prochainRdvHeure || '10:00',
        motif: e.prochainRdvMotif || 'Visite de conformité et recouvrement',
        isPast: new Date(`${e.prochainRdvDate}T${e.prochainRdvHeure || '10:00'}`) < new Date(),
      }));

    // Sort chronologically (closest first)
    return withDates.sort((a, b) => new Date(`${a.date}T${a.heure}`).getTime() - new Date(`${b.date}T${b.heure}`).getTime());
  }, [visibleEstablishments]);

  // Total finances exclusively for this agent
  const totalRecouvreAgent = useMemo(() => {
    return visibleEstablishments.reduce((sum, e) => sum + (e.montantEncaisse || 0), 0);
  }, [visibleEstablishments]);

  const totalResteARecouvrer = useMemo(() => {
    return visibleEstablishments.reduce((sum, e) => sum + (e.soldeRestantDu || 0), 0);
  }, [visibleEstablishments]);

  // Filtered dataset for active tab based on search query
  const displayedItems = useMemo(() => {
    let sourceList: Establishment[] = [];
    if (activeTab === 'convoques') sourceList = etablissementsConvoques;
    else if (activeTab === 'payes') sourceList = etablissementsPayes;
    else if (activeTab === 'avances') sourceList = etablissementsAvances;
    else if (activeTab === 'tous') sourceList = visibleEstablishments;

    if (!searchQuery.trim()) return sourceList;

    const query = searchQuery.toLowerCase().trim();
    return sourceList.filter(
      (e) =>
        e.nomCommercial.toLowerCase().includes(query) ||
        e.promoteurNom.toLowerCase().includes(query) ||
        e.arrondissement.toLowerCase().includes(query) ||
        e.codeDossier.toLowerCase().includes(query)
    );
  }, [activeTab, searchQuery, etablissementsConvoques, etablissementsPayes, etablissementsAvances, visibleEstablishments]);

  // Open Payment & RDV modal
  const handleOpenPaymentModal = (est: Establishment) => {
    setSelectedEstForPayment(est);
    setMontantAcompte(Math.min(est.soldeRestantDu || 50000, 50000));
    setNextRdvMotif(`Paiement tranche suivante (${est.nomCommercial})`);
  };

  // Submit payment & schedule next
  const handleSavePaymentAndRdv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstForPayment) return;

    if (montantAcompte <= 0) {
      showNotification('error', 'Le montant du versement doit être supérieur à zéro.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPaymentAndScheduleNext({
        establishmentId: selectedEstForPayment.id,
        montantVerse: Number(montantAcompte),
        modePaiement,
        nextRdvDate,
        nextRdvHeure,
        nextRdvMotif,
      });

      showNotification(
        'success',
        `Acompte de ${formatCfa(montantAcompte)} enregistré pour ${selectedEstForPayment.nomCommercial}. Prochain RDV fixé au ${nextRdvDate} à ${nextRdvHeure}.`
      );
      setSelectedEstForPayment(null);
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'enregistrement : ${err.message || 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`p-4 md:p-6 space-y-6 max-w-7xl mx-auto transition-colors duration-200 ${
        isLight ? 'text-slate-800' : 'text-slate-100'
      }`}
    >
      {/* 1. AGENT IDENTITY & SOVEREIGN HEADER */}
      <div
        className={`rounded-2xl border p-5 md:p-6 shadow-xl relative overflow-hidden transition ${
          isLight
            ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white border-emerald-700'
            : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-slate-100 border-emerald-800/40'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {agent?.photoUrl ? (
              <img
                src={agent.photoUrl}
                alt={agent.nomComplet}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold border-2 border-emerald-400 shadow-md shrink-0">
                {agent?.nomComplet?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'AG'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Espace Personnel Agent de Terrain
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20">
                  {agent?.matricule || 'DDL-PN-000'}
                </span>
                <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Assermenté TGI Pointe-Noire
                </span>
              </div>

              <h1 className="font-cinzel text-xl md:text-2xl font-black text-white mt-1">
                {agent?.nomComplet || 'Officier de Terrain'}
              </h1>

              <p className="text-xs text-emerald-100/90 mt-0.5">
                {agent?.fonction || 'Contrôleur Qualités & Conformité'} • Brigade SAA • Tél:{' '}
                {agent?.telephone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <PWAInstallButton variant="header" />
            <button
              onClick={() => setActiveModule('MOD-02')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Nouveau Recensement Terrain</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Congolese flag subtle tri-color bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-yellow-400" />
          <div className="flex-1 bg-red-600" />
        </div>
      </div>

      {/* Google Agenda & RDV 2026 Direct Access Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md transition ${
        isLight
          ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border-blue-200 text-slate-800'
          : 'bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border-blue-900/60 text-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center font-bold shadow-md shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Mon Google Agenda de Terrain (MOD-03)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/30">
                {upcomingAgentRdvCount} RDV Programmés
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consultez vos tournées de recouvrement, importez des événements depuis Google Agenda et synchronisez vos acomptes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveModule('MOD-03')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Ouvrir mon Google Agenda 2026</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Strict Isolation Notice */}
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
          isLight
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Cloisonnement Strict :</strong> Vous visualisez exclusivement vos{' '}
            <strong>{visibleEstablishments.length} établissements recensés</strong>, vos
            convocations, vos paiements et vos prochains rendez-vous. Aucune donnée de vos collègues n'apparaît.
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
          Portefeuille Personnel
        </span>
      </div>

      {/* 2. TOP 4 DYNAMIC METRICS CARDS (EXCLUSIVES TO THIS AGENT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Établissements Convoqués */}
        <div
          onClick={() => setActiveTab('convoques')}
          className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
            activeTab === 'convoques'
              ? 'ring-2 ring-amber-500 border-amber-500'
              : ''
          } ${
            isLight
              ? 'bg-white border-slate-200 hover:border-amber-400'
              : 'bg-slate-900 border-slate-800 hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Convoqués / Relances
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {etablissementsConvoques.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Mises en demeure & relances en cours
          </p>
        </div>

        {/* Card 2: Ceux qui ont Payé (Soldés) */}
        <div
          onClick={() => setActiveTab('payes')}
          className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
            activeTab === 'payes'
              ? 'ring-2 ring-emerald-500 border-emerald-500'
              : ''
          } ${
            isLight
              ? 'bg-white border-slate-200 hover:border-emerald-400'
              : 'bg-slate-900 border-slate-800 hover:border-emerald-500/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Ceux qui ont Payé
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
              100% Soldés
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {etablissementsPayes.length}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {formatCfa(totalRecouvreAgent)} encaissés
          </p>
        </div>

        {/* Card 3: Ceux qui ont Donné des Avances */}
        <div
          onClick={() => setActiveTab('avances')}
          className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
            activeTab === 'avances'
              ? 'ring-2 ring-blue-500 border-blue-500'
              : ''
          } ${
            isLight
              ? 'bg-white border-slate-200 hover:border-blue-400'
              : 'bg-slate-900 border-slate-800 hover:border-blue-500/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-blue-500" />
              Avances & Acomptes
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
              Partiels
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {etablissementsAvances.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Reste à recouvrer : {formatCfa(totalResteARecouvrer)}
          </p>
        </div>

        {/* Card 4: Prochains Rendez-vous Convenus */}
        <div
          onClick={() => setActiveTab('rdv')}
          className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
            activeTab === 'rdv'
              ? 'ring-2 ring-purple-500 border-purple-500'
              : ''
          } ${
            isLight
              ? 'bg-white border-slate-200 hover:border-purple-400'
              : 'bg-slate-900 border-slate-800 hover:border-purple-500/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-purple-500" />
              Prochains RDV
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold">
              Agenda
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {prochainsRdvList.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Dates programmées avec promoteurs
          </p>
        </div>
      </div>

      {/* 3. TABS NAVIGATION & SEARCH TOOLBAR */}
      <div
        className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          {/* Main 4 Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('convoques')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'convoques'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Convoqués & Relances ({etablissementsConvoques.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payes')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'payes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Ceux qui ont Payé ({etablissementsPayes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('avances')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'avances'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Avances & Acomptes ({etablissementsAvances.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rdv')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'rdv'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Prochains RDV ({prochainsRdvList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tous')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'tous'
                  ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Tous mes Dossiers ({visibleEstablishments.length})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer mes dossiers..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            />
          </div>
        </div>

        {/* 4. TAB CONTENTS */}

        {/* TAB 1: CONVOQUÉS & RELANCES */}
        {activeTab === 'convoques' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Établissements sous convocation, mise en demeure ou délai de conformité (Portefeuille {agent?.nomComplet})
              </span>
              <span className="font-bold text-amber-600">
                {displayedItems.length} dossier(s) en relance
              </span>
            </div>

            {displayedItems.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold">Aucune convocation ni mise en demeure en attente</p>
                <p className="text-xs text-slate-500">
                  Tous vos établissements recensés sont soit régularisés, soit sans contentieux actif.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedItems.map((est) => (
                  <div
                    key={est.id}
                    className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                        : 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          {est.codeDossier}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {est.nomCommercial}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                          {est.statut === 'ferme_contentieux'
                            ? 'Fermeture Contentieuse'
                            : 'Mise en Demeure / Relance'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {est.arrondissement} ({est.quartier})
                        </span>
                        <span>Promoteur : <strong>{est.promoteurNom}</strong></span>
                        <a
                          href={`tel:${est.promoteurTelephone}`}
                          className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {est.promoteurTelephone}
                        </a>
                      </div>

                      <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                        Motif : {est.prochainRdvMotif || 'Défaut de paiement de redevance et régularisation d’agrément'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          setReportingClosedEst(est);
                          setClosedMotif("Cessation d'activité / Rideau de fer baissé");
                          setClosedObservations("Constaté in situ lors de la convocation/tournée");
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 cursor-pointer"
                        title="Signaler cet établissement comme fermé ou éteint"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Signaler Fermé</span>
                      </button>
                      <button
                        onClick={() => handleOpenPaymentModal(est)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Encaisser ou Fixer RDV</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CEUX QUI ONT PAYÉ (SOLDÉS / EN RÈGLE) */}
        {activeTab === 'payes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Établissements ayant acquitté 100% de leur redevance annuelle auprès de vous</span>
              <span className="font-bold text-emerald-600">
                {displayedItems.length} dossier(s) en règle
              </span>
            </div>

            {displayedItems.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                <Coins className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold">Aucun établissement intégralement soldé pour le moment</p>
                <p className="text-xs text-slate-500">
                  Enregistrez les versements pour vos établissements recensés pour les solder.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedItems.map((est) => (
                  <div
                    key={est.id}
                    className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                        : 'bg-emerald-950/10 border-emerald-500/30 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          {est.codeDossier}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {est.nomCommercial}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono">
                          Soldé • Conforme
                        </span>
                        {est.estEteintOuFerme && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Éteint / Fermé
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                        <span>Arrondissement : <strong>{est.arrondissement}</strong></span>
                        <span>Promoteur : <strong>{est.promoteurNom}</strong></span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          Total Réglé : {formatCfa(est.montantEncaisse)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          setReportingClosedEst(est);
                          setClosedMotif("Cessation d'activité / Local abandonné");
                          setClosedObservations("Constaté in situ : bien que soldé, l'établissement a cessé son activité");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer"
                        title="Signaler la fermeture définitive"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Signaler Fermé</span>
                      </button>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Renouvellement Exercice N+1 :</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          {est.renouvellementAnnuelDate || 'Janvier 2027'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CEUX QUI ONT DONNÉ DES AVANCES (ACOMPTES) */}
        {activeTab === 'avances' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Établissements ayant versé des acomptes avec solde restant dû (Suivi régulier)
              </span>
              <span className="font-bold text-blue-600">
                {displayedItems.length} dossier(s) avec acomptes
              </span>
            </div>

            {displayedItems.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold">Aucun acompte partiel enregistré</p>
                <p className="text-xs text-slate-500">
                  Cliquez sur "Tous mes Dossiers" pour enregistrer un premier acompte sur vos fiches.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedItems.map((est) => {
                  const percent = est.montantRedevanceAnnuelle > 0
                    ? Math.min(100, Math.round((est.montantEncaisse / est.montantRedevanceAnnuelle) * 100))
                    : 0;

                  return (
                    <div
                      key={est.id}
                      className={`p-4 rounded-xl border transition space-y-3 ${
                        isLight
                          ? 'bg-blue-50/30 border-blue-200 hover:border-blue-300'
                          : 'bg-blue-950/10 border-blue-500/30 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">
                              {est.codeDossier}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {est.nomCommercial}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Promoteur : <strong>{est.promoteurNom}</strong> • {est.arrondissement} • Tél:{' '}
                            <a href={`tel:${est.promoteurTelephone}`} className="font-mono text-blue-600 hover:underline">
                              {est.promoteurTelephone}
                            </a>
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenPaymentModal(est)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Encaisser Tranche Suivante</span>
                        </button>
                      </div>

                      {/* Progress Bar of Payments */}
                      <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>
                            Avance Versée : <strong className="text-emerald-600">{formatCfa(est.montantEncaisse)}</strong>
                          </span>
                          <span>
                            Reste à Payer : <strong className="text-rose-600 font-mono">{formatCfa(est.soldeRestantDu)}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Total redevance : {formatCfa(est.montantRedevanceAnnuelle)}</span>
                          <span className="font-bold text-blue-600">{percent}% acquitté</span>
                        </div>
                      </div>

                      {/* Prochain RDV Convenu */}
                      {est.prochainRdvDate && (
                        <div className="p-2.5 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                            <span>
                              <strong>Prochain RDV Convenu :</strong> Le {est.prochainRdvDate} à{' '}
                              {est.prochainRdvHeure || '10:00'} ({est.prochainRdvMotif || 'Versement solde'})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                        <button
                          onClick={() => {
                            setReportingClosedEst(est);
                            setClosedMotif("Cessation d'activité / Local fermé");
                            setClosedObservations("Constaté in situ lors du suivi d'acompte : portes closes, inoccupé.");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Signaler Fermé</span>
                        </button>
                        <button
                          onClick={() => handleOpenPaymentModal(est)}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Encaisser Tranche Suivante</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CALENDRIER & PROCHAINS RENDEZ-VOUS */}
        {activeTab === 'rdv' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Calendrier chronologique des visites et encaissements programmés</span>
              <span className="font-bold text-purple-600">
                {prochainsRdvList.length} RDV programmé(s)
              </span>
            </div>

            {prochainsRdvList.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold">Aucun rendez-vous futur programmé</p>
                <p className="text-xs text-slate-500">
                  Fixez des dates de passage et de versement lors de vos recensements ou paiements d'avances.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {prochainsRdvList.map(({ etablissement: est, date, heure, motif, isPast }, idx) => (
                  <div
                    key={`${est.id}-${idx}`}
                    className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isPast
                        ? isLight
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-rose-950/20 border-rose-500/30'
                        : isLight
                        ? 'bg-purple-50/40 border-purple-200 hover:border-purple-300'
                        : 'bg-purple-950/10 border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-mono text-xs font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {date} à {heure}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {est.nomCommercial}
                        </h3>
                        {isPast && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                            RDV Échu à régulariser
                          </span>
                        )}
                        {est.estEteintOuFerme && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Éteint / Fermé
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                        <span>Promoteur : <strong>{est.promoteurNom}</strong></span>
                        <a href={`tel:${est.promoteurTelephone}`} className="font-mono text-purple-600 hover:underline">
                          Tél : {est.promoteurTelephone}
                        </a>
                        <span>Arrondissement : {est.arrondissement}</span>
                      </div>

                      <div className="text-xs text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-1.5 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        <span>Motif : {motif}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          setReportingClosedEst(est);
                          setClosedMotif("Établissement constaté fermé au rendez-vous");
                          setClosedObservations(`Visite du ${date} à ${heure} : local éteint/rideau de fer baissé`);
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer"
                        title="Signaler la fermeture constatée lors du rendez-vous"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Signaler Fermé</span>
                      </button>
                      <button
                        onClick={() => handleOpenPaymentModal(est)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Encaisser sur RDV</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TOUS MES DOSSIERS */}
        {activeTab === 'tous' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Registre exhaustif de vos dossiers recensés</span>
              <span className="font-bold text-emerald-600">
                {displayedItems.length} dossier(s) au total
              </span>
            </div>

            {displayedItems.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold">Aucun établissement dans votre portefeuille</p>
                <p className="text-xs text-slate-500">
                  Rendez-vous dans le module Recensement de Terrain pour enregistrer vos premières fiches in situ.
                </p>
                <button
                  onClick={() => setActiveModule('MOD-02')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow transition inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer mon 1er établissement</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedItems.map((est) => (
                  <div
                    key={est.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {est.codeDossier}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {est.nomCommercial}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          est.statut === 'en_regle'
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : est.statut === 'mise_en_demeure'
                            ? 'bg-amber-500/20 text-amber-600'
                            : est.statut === 'ferme_contentieux'
                            ? 'bg-rose-500/20 text-rose-600'
                            : 'bg-blue-500/20 text-blue-600'
                        }`}>
                          {est.statut.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>{est.arrondissement} ({est.quartier})</span>
                        <span>Promoteur : <strong>{est.promoteurNom}</strong></span>
                        <span>Redevance : <strong>{formatCfa(est.montantRedevanceAnnuelle)}</strong></span>
                        <span className="text-emerald-600 font-bold font-mono">
                          Encaissé : {formatCfa(est.montantEncaisse)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          setReportingClosedEst(est);
                          setClosedMotif("Cessation d'activité définitive / Rideau baissé");
                          setClosedObservations("Constaté in situ : établissement inactif");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer"
                        title="Signaler la fermeture définitive"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Signaler Fermé</span>
                      </button>
                      <button
                        onClick={() => handleOpenPaymentModal(est)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Encaisser / RDV</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. MODAL INTERACTIVE D'ENCAISSEMENT D'ACOMPTE & FIXATION DU PROCHAIN RDV */}
      {selectedEstForPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative space-y-5 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  Encaisser un Versement & Fixer Prochain RDV
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedEstForPayment.nomCommercial} ({selectedEstForPayment.codeDossier})
                </p>
              </div>
              <button
                onClick={() => setSelectedEstForPayment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentAndRdv} className="space-y-4">
              {/* Récapitulatif Financier Actuel */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Redevance :</span>
                  <span className="font-bold">{formatCfa(selectedEstForPayment.montantRedevanceAnnuelle)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Déjà Encaissé :</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {formatCfa(selectedEstForPayment.montantEncaisse)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Reste à Payer :</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {formatCfa(selectedEstForPayment.soldeRestantDu)}
                  </span>
                </div>
              </div>

              {/* Montant Versé Aujourd'hui */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Montant de l'Acompte / Versement (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={montantAcompte}
                  onChange={(e) => setMontantAcompte(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              {/* Mode de Paiement */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Mode d'Encaissement *
                </label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                  }`}
                >
                  <option value="especes">Espèces (Reçu Main Propre)</option>
                  <option value="momo_mtn">MTN Mobile Money (MoMo)</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="cheque_tresor">Chèque Trésor Public</option>
                  <option value="virement">Virement Bancaire</option>
                </select>
              </div>

              {/* Fixer la Date et l'Heure du Prochain RDV */}
              <div className="p-3.5 rounded-xl border border-purple-300 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Prochain Rendez-vous de Suivi Convenu avec le Promoteur</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Date Convenue *
                    </label>
                    <input
                      type="date"
                      required
                      value={nextRdvDate}
                      onChange={(e) => setNextRdvDate(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Heure de Passage
                    </label>
                    <input
                      type="time"
                      value={nextRdvHeure}
                      onChange={(e) => setNextRdvHeure(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Motif / Échéance du RDV
                  </label>
                  <input
                    type="text"
                    value={nextRdvMotif}
                    onChange={(e) => setNextRdvMotif(e.target.value)}
                    placeholder="Ex: Versement 2ème acompte, contrôle limiteur sonore"
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                      isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEstForPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Valider Versement & RDV</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: SIGNALEMENT ÉTABLISSEMENT FERMÉ / ÉTEINT */}
      {reportingClosedEst && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Constat : Établissement Fermé / Éteint
                  </h3>
                  <p className="text-xs text-slate-500">{reportingClosedEst.nomCommercial}</p>
                </div>
              </div>
              <button
                onClick={() => setReportingClosedEst(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <span className="font-bold">Actualisation Statistique Instantanée :</span>
              <p className="text-[11px] leading-relaxed">
                Le signalement reclassera ce dossier en contentieux/fermé, mettra à jour les diagrammes d'exploitation du cockpit et retirera la créance du prévisionnel actif.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Motif de la fermeture :</label>
                <select
                  value={closedMotif}
                  onChange={(e) => setClosedMotif(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-medium ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                  }`}
                >
                  <option value="Cessation d'activité définitive / Rideau baissé">Cessation d'activité définitive / Rideau baissé</option>
                  <option value="Établissement éteint / Local inoccupé ou abandonné">Établissement éteint / Local inoccupé ou abandonné</option>
                  <option value="Faillite ou insolvabilité du promoteur">Faillite ou insolvabilité du promoteur</option>
                  <option value="Changement d'activité (hors secteur loisirs)">Changement d'activité (hors secteur loisirs)</option>
                  <option value="Fermeture administrative par arrêté de police">Fermeture administrative par arrêté de police</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Observations terrain de l'agent :</label>
                <textarea
                  value={closedObservations}
                  onChange={(e) => setClosedObservations(e.target.value)}
                  placeholder="Ex : Constaté in situ : enseigne déposée, local fermé, cadenas posé..."
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportingClosedEst(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSubmittingClose}
                  onClick={async () => {
                    if (!reportingClosedEst) return;
                    setIsSubmittingClose(true);
                    try {
                      await reportEstablishmentClosed({
                        establishmentId: reportingClosedEst.id,
                        motif: closedMotif,
                        observations: closedObservations,
                      });
                      setReportingClosedEst(null);
                    } catch (err: any) {
                      showNotification('error', `Erreur: ${err.message}`);
                    } finally {
                      setIsSubmittingClose(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingClose ? 'Enregistrement...' : 'Confirmer Signalement (Fermé)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
