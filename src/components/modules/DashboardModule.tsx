import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from '../common/DdlLogo';
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  Receipt,
  MapPin,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  FileText,
  Volume2,
  Sparkles,
  Filter,
  Users,
  Search,
  Scale,
  Send,
  CloudCog,
  Coins,
  FileCheck2,
  BookOpen,
  Target,
  Award,
  Lock,
  Smartphone,
  CheckCircle2,
  CalendarCheck,
  RefreshCw,
  SlidersHorizontal,
  Database,
  UserCheck,
  Crown,
  FileSignature,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';
import { Arrondissement, ComplianceStatus, QUARTIERS_PAR_ARRONDISSEMENT } from '../../types';
import { D3ArrondissementChart } from '../dashboard/D3ArrondissementChart';
import { AdvancedAdminAnalytics } from '../dashboard/AdvancedAdminAnalytics';
import { CountdownTimer72h } from '../common/CountdownTimer72h';
import { FieldAgentExclusiveDashboard } from './FieldAgentExclusiveDashboard';

export const DashboardModule: React.FC = () => {
  const {
    establishments,
    visibleEstablishments,
    receipts,
    legalActs,
    schedules,
    ptaMilestones,
    staff,
    soitTransmis,
    setActiveModule,
    currentAgentId,
    setCurrentAgentId,
    currentUserRole,
    authenticatedUser,
    theme,
  } = useApp();

  const isFieldAgent = currentUserRole !== 'directeur' && currentUserRole !== 'administrateur';
  const baseEstablishments = isFieldAgent ? visibleEstablishments : establishments;

  // Filters for dynamic diagrams
  const [selectedArrondissement, setSelectedArrondissement] = useState<string>('all');
  const [selectedQuartier, setSelectedQuartier] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');

  const isLight = theme === 'light';

  // Centralized filtered establishments based on dynamic toolbar
  const filteredEstablishments = useMemo(() => {
    return baseEstablishments.filter((est) => {
      const matchArr = selectedArrondissement === 'all' || est.arrondissement === selectedArrondissement;
      const matchQuartier =
        selectedQuartier === 'all' ||
        (est.quartier && est.quartier.toLowerCase().includes(selectedQuartier.toLowerCase()));
      const matchAgent = selectedAgent === 'all' || est.agentAssigneId === selectedAgent;
      const matchStatut = selectedStatut === 'all' || est.statut === selectedStatut;
      return matchArr && matchQuartier && matchAgent && matchStatut;
    });
  }, [baseEstablishments, selectedArrondissement, selectedQuartier, selectedAgent, selectedStatut]);

  // Centralized filtered receipts
  const filteredReceipts = useMemo(() => {
    const baseReceipts = isFieldAgent
      ? receipts.filter(
          (r) =>
            r.agentId === currentAgentId ||
            (authenticatedUser?.nomComplet && r.inspecteurOuCaissier?.toLowerCase().includes(authenticatedUser.nomComplet.toLowerCase()))
        )
      : receipts;

    return baseReceipts.filter((rec) => {
      const matchArr = selectedArrondissement === 'all' || rec.arrondissement === selectedArrondissement;
      const matchAgent = selectedAgent === 'all' || rec.agentId === selectedAgent;
      // Filter by quartier if establishment is linked
      let matchQuartier = true;
      if (selectedQuartier !== 'all') {
        const est = baseEstablishments.find((e) => e.id === rec.etablissementId);
        matchQuartier = !!(est?.quartier && est.quartier.toLowerCase().includes(selectedQuartier.toLowerCase()));
      }
      return matchArr && matchQuartier && matchAgent;
    });
  }, [receipts, selectedArrondissement, selectedQuartier, selectedAgent, isFieldAgent, currentAgentId, authenticatedUser, baseEstablishments]);

  // Dynamic Metrics
  const totalRecettes = filteredReceipts.reduce((acc, r) => acc + r.montantVerse, 0);
  const globalRecettes = receipts.reduce((acc, r) => acc + r.montantVerse, 0);
  const totalEtablissements = filteredEstablishments.length;
  const enRegleCount = filteredEstablishments.filter((e) => e.statut === 'en_regle').length;
  const attestationProvCount = filteredEstablishments.filter((e) => e.statut === 'attestation_provisoire').length;
  const misesEnDemeureCount = filteredEstablishments.filter((e) => e.statut === 'mise_en_demeure').length;
  const fermesCount = filteredEstablishments.filter((e) => e.statut === 'ferme_contentieux').length;

  // PTA Global Completion
  const ptaMoyenne = Math.round(
    ptaMilestones.reduce((acc, p) => acc + p.tauxExecutionPhysique, 0) / (ptaMilestones.length || 1)
  );

  // 1. Recettes par arrondissement pour D3.js
  const arrondissements: Arrondissement[] = [
    'Lumumba',
    'Mvou-Mvou',
    'Tié-Tié',
    'Loandjili',
    'Mongo-Mpoukou',
    'Ngoyo',
  ];

  // Statistiques locales détaillées par quartier
  const statsParQuartier = useMemo(() => {
    const listQuartiers =
      selectedArrondissement !== 'all'
        ? QUARTIERS_PAR_ARRONDISSEMENT[selectedArrondissement as Arrondissement] || []
        : Array.from(new Set(establishments.map((e) => e.quartier).filter(Boolean)));

    return listQuartiers
      .map((q) => {
        const etabs = establishments.filter((e) => {
          const matchArr = selectedArrondissement === 'all' || e.arrondissement === selectedArrondissement;
          const matchQ = e.quartier && e.quartier.toLowerCase().includes(q.toLowerCase());
          return matchArr && matchQ;
        });
        const enRegle = etabs.filter((e) => e.statut === 'en_regle').length;
        const infractions = etabs.filter(
          (e) => e.statut === 'mise_en_demeure' || e.statut === 'ferme_contentieux'
        ).length;
        const totalRecettesQuartier = receipts
          .filter((r) => {
            const matchedEst = establishments.find((e) => e.id === r.etablissementId);
            return matchedEst && matchedEst.quartier && matchedEst.quartier.toLowerCase().includes(q.toLowerCase());
          })
          .reduce((sum, r) => sum + r.montantVerse, 0);

        return {
          nom: q,
          nombreEtabs: etabs.length,
          enRegle,
          infractions,
          totalRecettesQuartier,
        };
      })
      .filter((q) => q.nombreEtabs > 0 || selectedArrondissement !== 'all')
      .sort((a, b) => b.nombreEtabs - a.nombreEtabs);
  }, [establishments, receipts, selectedArrondissement]);

  const statsParArrondissement = arrondissements.map((arr) => {
    const etabs = establishments.filter((e) => e.arrondissement === arr);
    const recs = receipts.filter((r) => r.arrondissement === arr);
    const montant = recs.reduce((sum, r) => sum + r.montantVerse, 0);
    const infractions = etabs.filter(
      (e) => e.statut === 'mise_en_demeure' || e.statut === 'ferme_contentieux'
    ).length;
    return {
      nom: arr,
      nombreEtabs: etabs.length,
      montantRecettes: montant,
      infractions,
    };
  });

  // 2. Diagramme de Recouvrement par Agent Responsable
  const statsParAgent = useMemo(() => {
    const fieldAgents = staff.filter((s) => s.service === 'SAA' || s.service === 'Direction');
    return fieldAgents.map((ag) => {
      const assigned = establishments.filter((e) => e.agentAssigneId === ag.id);
      const totalAttendu = assigned.reduce((sum, e) => sum + e.montantRedevanceAnnuelle, 0);
      const totalEncaisse = assigned.reduce((sum, e) => sum + e.montantEncaisse, 0);
      const taux = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;
      return {
        agentId: ag.id,
        nom: ag.nomComplet,
        brigade: ag.brigadeAffectee || ag.fonction,
        countAssigned: assigned.length,
        totalAttendu,
        totalEncaisse,
        taux,
      };
    });
  }, [staff, establishments]);

  // 3. Diagramme de Répartition par Catégorie
  const statsParCategorie = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEstablishments.forEach((e) => {
      counts[e.categorie] = (counts[e.categorie] || 0) + 1;
    });
    return Object.entries(counts).map(([cat, count]) => ({
      categorie: cat,
      count,
      pct: totalEtablissements > 0 ? Math.round((count / totalEtablissements) * 100) : 0,
    }));
  }, [filteredEstablishments, totalEtablissements]);

  // 4. Reconductions Annuelles N+1 & Échéancier
  const prochainesEcheances = useMemo(() => {
    return schedules
      .filter((s) => s.statut === 'planifie')
      .sort((a, b) => a.dateTournee.localeCompare(b.dateTournee))
      .slice(0, 5);
  }, [schedules]);

  // Établissements en alerte
  const etablissementsEnAlerte = establishments.filter(
    (e) => e.statut === 'mise_en_demeure' || e.statut === 'ferme_contentieux'
  );

  // All 17 Modules Definition for Quick Launchpad
  const ALL_MODULES = [
    { code: 'MOD-01', title: 'Cockpit Décisionnel', count: `${establishments.length} Etabs`, icon: TrendingUp, color: 'text-emerald-500' },
    { code: 'MOD-02', title: 'Recensement Terrain GPS', count: 'Mode PWA', icon: Building2, color: 'text-blue-500' },
    { code: 'MOD-03', title: 'Agenda de Terrain SAA', count: `${schedules.filter(s => s.statut === 'planifie').length} RDV`, icon: CalendarCheck, color: 'text-indigo-500' },
    { code: 'MOD-04', title: 'Google Workspace', count: 'Passerelle Cloud', icon: CloudCog, color: 'text-sky-500' },
    { code: 'MOD-05', title: 'Police Administrative', count: `${legalActs.length} Actes`, icon: Scale, color: 'text-rose-500' },
    { code: 'MOD-06', title: 'Rapports Trimestriels', count: 'Bilans DGL', icon: FileText, color: 'text-teal-500' },
    { code: 'MOD-07', title: 'SIG & Heatmap Décibels', count: '6 Arrond.', icon: MapPin, color: 'text-cyan-500' },
    { code: 'MOD-08', title: 'Promotion SPA', count: 'Diplômes', icon: Award, color: 'text-amber-500' },
    { code: 'MOD-09', title: 'Soit-Transmis DGL', count: `${soitTransmis.length} Bordereaux`, icon: Send, color: 'text-purple-500' },
    { code: 'MOD-10', title: 'Régie des Recettes', count: `${formatCfa(globalRecettes)}`, icon: Coins, color: 'text-emerald-600' },
    { code: 'MOD-11', title: 'Titres & Quittances', count: `${receipts.length} Titres`, icon: FileCheck2, color: 'text-green-600' },
    { code: 'MOD-12', title: 'Législation & Barèmes', count: 'Loi 21-2019', icon: BookOpen, color: 'text-orange-500' },
    { code: 'MOD-13', title: 'Suivi PTA 2026', count: `${ptaMoyenne}% Exéc.`, icon: Target, color: 'text-fuchsia-500' },
    { code: 'MOD-14', title: 'Personnel & Badges', count: `${staff.length} Agents`, icon: Users, color: 'text-blue-600' },
    { code: 'MOD-15', title: 'Coffre SHA-256', count: 'Audit Trail', icon: Lock, color: 'text-slate-500' },
    { code: 'MOD-16', title: 'Contrôle Conjoint', count: 'Mixte Inter-services', icon: ShieldAlert, color: 'text-yellow-500' },
    { code: 'MOD-17', title: 'Portail Télépaiement', count: 'MoMo / Airtel', icon: Smartphone, color: 'text-emerald-500' },
    { code: 'MOD-18', title: 'Import Supabase', count: 'Migration Cloud', icon: Database, color: 'text-teal-500' },
    { code: 'MOD-19', title: 'Canva Rédaction Admin', count: 'Garamond 13 & Docx', icon: FileSignature, color: 'text-amber-500' },
  ];

  // STRICT USER CONSTRAINT:
  // If the active user is a Field Agent, they ONLY see their dedicated personal dashboard:
  // - Establishments they summoned / put under notice
  // - Those who paid
  // - Those who gave advances
  // - Their next appointment dates
  // - And strictly NOTHING from other agents!
  if (isFieldAgent) {
    return <FieldAgentExclusiveDashboard />;
  }

  return (
    <div className={`p-4 md:p-6 space-y-6 max-w-7xl mx-auto transition-colors duration-200 ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`}>
      {/* 1. SOVEREIGN HEADER BANNER (MCAPNIT / DGL - Pointe-Noire) */}
      <div className={`rounded-2xl border p-5 md:p-6 shadow-xl relative overflow-hidden transition ${
        isLight
          ? 'bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white border-emerald-700'
          : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-slate-100 border-emerald-800/40'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start md:items-center gap-4">
            <DdlLogo size="lg" rounded="2xl" bordered={true} className="shrink-0 shadow-lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  MOD-01 • COCKPIT DÉCISIONNEL STRATÉGIQUE
                </span>
                <span className="text-[11px] font-mono text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  République du Congo • MCAPNIT / DGL
                </span>
              </div>
              <h1 className="font-cinzel text-xl md:text-2xl lg:text-3xl font-black text-white mt-1.5 tracking-wide">
                Direction Départementale des Loisirs de Pointe-Noire
              </h1>
              <p className="text-xs md:text-sm text-emerald-100/90 mt-1 max-w-3xl leading-relaxed">
                Base de données centralisée de souveraineté : supervision en direct des 6 arrondissements, pilotage du recouvrement par agent exclusif, gestion des alertes d'infractions et interconnexion de tous les modules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => setActiveModule('MOD-03')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Agenda de Terrain (Google UI)</span>
            </button>
            <button
              onClick={() => setActiveModule('MOD-02')}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" />
              <span>Nouveau Recensement GPS</span>
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

      {/* Role Detection & Establishments Scope Notification Banner */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
        isFieldAgent
          ? isLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          : isLight
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
      }`}>
        <div className="flex items-center gap-2.5">
          {isFieldAgent ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
          )}
          <div>
            <p className="font-bold">
              {isFieldAgent
                ? `Session Agent de Terrain : ${authenticatedUser?.nomComplet || 'Agent SAA'} (${authenticatedUser?.matricule || 'DDL-PN'})`
                : `Supervision Souveraine : ${authenticatedUser?.nomComplet || 'Direction Générale'} (Vue Globale)`}
            </p>
            <p className="text-[11px] opacity-90">
              {isFieldAgent
                ? `Filtrage strict actif : Vous ne visualisez que les ${visibleEstablishments.length} établissements que vous avez collectés et recensés sur le terrain.`
                : `Accès administrateur complet : L'ensemble des ${establishments.length} établissements du département de Pointe-Noire est affiché.`}
            </p>
          </div>
        </div>

        {isFieldAgent ? (
          <button
            onClick={() => setActiveModule('MOD-02')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0 transition"
          >
            Nouveau Recensement (+1)
          </button>
        ) : (
          <span className="font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
            6 Arrondissements
          </span>
        )}
      </div>

      {/* Zero Data Alert & Supabase Import Call-to-Action */}
      {establishments.length === 0 && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Données de démonstration purgées</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Votre base Firestore est prête pour vos données réelles. Vous pouvez importer vos tables Supabase directement.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveModule('MOD-18')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <span>Passerelle d'Import Supabase</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. RACCOURCI DE TOUS LES MODULES (MODULES HUB / QUICK LAUNCHPAD) */}
      <div className={`rounded-xl border p-4 shadow-sm transition ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Raccourci Intégré de Tous les 18 Modules (Communication Inter-Modules)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Accès instantané 1-clic
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {ALL_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.code}
                onClick={() => setActiveModule(mod.code)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between group hover:scale-[1.02] ${
                  isLight
                    ? 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-300'
                    : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isLight ? 'bg-white border border-slate-200 text-slate-600' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {mod.code}
                  </span>
                  <Icon className={`w-4 h-4 ${mod.color} group-hover:scale-110 transition`} />
                </div>
                <div>
                  <div className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {mod.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                    {mod.count}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DYNAMIC INTERACTIVE FILTER TOOLBAR */}
      <div className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Filtres Dynamiques de la Base de Données :
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 max-w-4xl">
          {/* Arrondissement */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 shrink-0 font-medium">Arrondissement :</label>
            <select
              value={selectedArrondissement}
              onChange={(e) => {
                const nextArr = e.target.value;
                setSelectedArrondissement(nextArr);
                setSelectedQuartier('all');
              }}
              className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-200 focus:border-emerald-400'
              }`}
            >
              <option value="all">Tous les 6 arrondissements</option>
              {arrondissements.map((arr) => (
                <option key={arr} value={arr}>{arr}</option>
              ))}
            </select>
          </div>

          {/* Quartier (Liste déroulante statistique) */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 shrink-0 font-medium">Quartier :</label>
            <select
              value={selectedQuartier}
              onChange={(e) => setSelectedQuartier(e.target.value)}
              className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-200 focus:border-emerald-400'
              }`}
            >
              <option value="all">
                {selectedArrondissement === 'all' ? 'Tous les quartiers' : `Tous les quartiers (${selectedArrondissement})`}
              </option>
              {(selectedArrondissement !== 'all'
                ? QUARTIERS_PAR_ARRONDISSEMENT[selectedArrondissement as Arrondissement] || []
                : Array.from(new Set(Object.values(QUARTIERS_PAR_ARRONDISSEMENT).flat()))
              ).map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          {/* Agent Responsable */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 shrink-0 font-medium">Agent :</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-200 focus:border-emerald-400'
              }`}
            >
              <option value="all">Toutes les brigades</option>
              {staff.filter(s => s.service === 'SAA' || s.service === 'Direction').map((s) => (
                <option key={s.id} value={s.id}>{s.nomComplet}</option>
              ))}
            </select>
          </div>

          {/* Statut Fiscal */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 shrink-0 font-medium">Statut :</label>
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-200 focus:border-emerald-400'
              }`}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_regle">En règle (Soldé)</option>
              <option value="attestation_provisoire">Attestation provisoire (Dépôt validé)</option>
              <option value="mise_en_demeure">Sous mise en demeure (72h)</option>
              <option value="ferme_contentieux">Fermeture administrative</option>
            </select>
          </div>
        </div>

        {(selectedArrondissement !== 'all' || selectedQuartier !== 'all' || selectedAgent !== 'all' || selectedStatut !== 'all') && (
          <button
            onClick={() => {
              setSelectedArrondissement('all');
              setSelectedQuartier('all');
              setSelectedAgent('all');
              setSelectedStatut('all');
            }}
            className="text-xs text-rose-500 hover:text-rose-600 font-bold shrink-0 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* 4. TOP 4 DYNAMIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recettes Encaissées */}
        <div className={`border rounded-xl p-4 relative overflow-hidden shadow-sm transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Recettes Recouvrées SAF
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {formatCfa(totalRecettes)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Régie Trésor Public
            </span>
            <span className="font-mono">Global: {formatCfa(globalRecettes)}</span>
          </div>
        </div>

        {/* Établissements Recensés */}
        <div className={`border rounded-xl p-4 relative overflow-hidden shadow-sm transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Établissements en Suivi
            </span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {totalEtablissements}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{enRegleCount} soldés</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{attestationProvCount} acomptes</span>
          </div>
        </div>

        {/* Contentieux & Décibels */}
        <div className={`border rounded-xl p-4 relative overflow-hidden shadow-sm transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Contentieux & Infractions
            </span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-300 mt-2 font-mono">
            {misesEnDemeureCount + fermesCount}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
            <span className="text-amber-600 font-bold">{misesEnDemeureCount} mises en demeure</span>
            <span>•</span>
            <span className="text-rose-600 font-bold">{fermesCount} fermés</span>
          </div>
        </div>

        {/* Plan de Travail Annuel (PTA) */}
        <div className={`border rounded-xl p-4 relative overflow-hidden shadow-sm transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Exécution PTA 2026
            </span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-300 mt-2 font-mono">
            {ptaMoyenne} %
          </p>
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${
            isLight ? 'bg-slate-100' : 'bg-slate-800'
          }`}>
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${ptaMoyenne}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">4 axes stratégiques sous contrôle</div>
        </div>
      </div>

      {/* 4.B VISUALISATION ANALYTIQUE 3D DYNAMIQUE & DIAGRAMMES COMPLEXES */}
      <AdvancedAdminAnalytics establishments={filteredEstablishments} receipts={filteredReceipts} />

      {/* 5. DIAGRAMMES DIVERS ET VARIABLES (LIGNE 1 : D3 ARRONDISSEMENTS + SUIVI PAR AGENT EXCLUSIF) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Diagramme 1: Recettes par Arrondissement avec Graphique D3 animé (7 colonnes) */}
        <div className={`lg:col-span-7 border rounded-xl p-5 shadow-sm space-y-3 transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                1. Recettes Recouvrées par Arrondissement (Graphique Animé D3.js)
              </h2>
            </div>
            <button
              onClick={() => setActiveModule('MOD-07')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Voir Carte SIG</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <D3ArrondissementChart data={statsParArrondissement} />
          <p className="text-[10px] text-slate-400 text-center font-mono">
            Montants ventilés en temps réel dans les 6 arrondissements de Pointe-Noire (Trésor Public)
          </p>
        </div>

        {/* Diagramme 2: Performance de Recouvrement par Agent Responsable (5 colonnes) */}
        <div className={`lg:col-span-5 border rounded-xl p-5 shadow-sm flex flex-col justify-between transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  2. Performance par Agent Exclusif
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                ISOLATION STRICTE
              </span>
            </div>

            <div className="space-y-3.5">
              {statsParAgent.map((ag) => (
                <div key={ag.agentId} className={`p-3 rounded-lg border text-xs space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{ag.nom}</span>
                      <p className="text-[10px] text-slate-500">{ag.brigade}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {ag.taux}% recouvré
                    </span>
                  </div>

                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    isLight ? 'bg-slate-200' : 'bg-slate-800'
                  }`}>
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, ag.taux)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>{ag.countAssigned} établissements assignés</span>
                    <span>{formatCfa(ag.totalEncaisse)} / {formatCfa(ag.totalAttendu)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveModule('MOD-03')}
              className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-xs text-center transition flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Ouvrir l'Agenda Terrain de l'agent en cours &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. DIAGRAMMES DIVERS ET VARIABLES (LIGNE 2 : RÉPARTITION CATÉGORIES + CALENDRIER PRÉVISIONNEL N+1 + ALERTES 72H) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Diagramme 3: Répartition par Catégories d'activités */}
        <div className={`border rounded-xl p-5 shadow-sm space-y-3 transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              3. Catégories de Loisirs
            </h3>
          </div>

          <div className="space-y-2.5">
            {statsParCategorie.map((item) => (
              <div key={item.categorie} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="truncate max-w-[200px] font-medium text-slate-700 dark:text-slate-300">
                    {item.categorie}
                  </span>
                  <span className="font-mono text-slate-500 font-bold">{item.count} ({item.pct}%)</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                  isLight ? 'bg-slate-100' : 'bg-slate-800'
                }`}>
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagramme 4: Échéancier des Prochains RDV & Reconductions N+1 */}
        <div className={`border rounded-xl p-5 shadow-sm space-y-3 transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                4. Échéances & Reconductions N+1
              </h3>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">
              {prochainesEcheances.length} PRÉVUS
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[220px]">
            {prochainesEcheances.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucune descente planifiée.</p>
            ) : (
              prochainesEcheances.map((sch) => (
                <div
                  key={sch.id}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                    sch.typeMission === 'Renouvellement Annuel N+1'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start font-bold">
                    <span className="truncate pr-1">{sch.etablissementNom}</span>
                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 shrink-0">
                      {sch.dateTournee} à {sch.heure}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{sch.typeMission}</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {sch.montantAcompteAttendu ? formatCfa(sch.montantAcompteAttendu) : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Diagramme 5: Alertes Immédiates & Compte à Rebours 72h */}
        <div className={`border rounded-xl p-5 shadow-sm space-y-3 transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                5. Police Administrative (72h)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
              {etablissementsEnAlerte.length} ACTIFS
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px]">
            {etablissementsEnAlerte.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucune infraction en cours.</p>
            ) : (
              etablissementsEnAlerte.map((est) => (
                <div
                  key={est.id}
                  className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                    est.statut === 'ferme_contentieux'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex justify-between items-start font-bold">
                    <span className="truncate pr-1">{est.nomCommercial}</span>
                    <span className="text-[9px] uppercase font-mono px-1 rounded bg-white/80 dark:bg-slate-900">
                      {est.statut === 'ferme_contentieux' ? 'Fermé' : '72h'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span>{est.arrondissement}</span>
                    <span className="font-mono font-bold text-rose-600 flex items-center gap-0.5">
                      <Volume2 className="w-3 h-3" />
                      {est.niveauDecibelsMoyen} dB(A)
                    </span>
                  </div>

                  {est.statut === 'mise_en_demeure' && (
                    <CountdownTimer72h expireAt={est.miseEnDemeureExpireAt} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7. TABLEAU STATISTIQUE DES QUARTIERS DE LA VILLE */}
      <div className={`border rounded-xl p-5 shadow-sm space-y-4 transition ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              6. Ventilation Statistique par Quartier {selectedArrondissement !== 'all' ? `(${selectedArrondissement})` : '(Vue Globale Pointe-Noire)'}
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
            {statsParQuartier.length} Quartier(s) Répertorié(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {statsParQuartier.map((q) => (
            <div
              key={q.nom}
              onClick={() => setSelectedQuartier(q.nom)}
              className={`p-3 rounded-lg border text-xs space-y-1.5 cursor-pointer transition ${
                selectedQuartier === q.nom
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-1">
                  {q.nom}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  {q.nombreEtabs} étab.
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{q.enRegle} régularisés</span>
                {q.infractions > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{q.infractions} alertes</span>
                )}
              </div>

              <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-between">
                <span>Recettes :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCfa(q.totalRecettesQuartier)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
