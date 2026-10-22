import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  PieChart,
  Printer,
  Download,
  Search,
  Building2,
  User,
  MapPin,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  Phone,
  FileText,
  Eye,
  X,
  Compass,
  Scale,
  ArrowUpDown,
  FilterX,
  Grid,
  FileCheck,
} from 'lucide-react';
import { printHtmlElement } from '../../services/printService';
import {
  Arrondissement,
  EstablishmentCategory,
  ComplianceStatus,
  Establishment,
  QUARTIERS_PAR_ARRONDISSEMENT,
} from '../../types';

const ARRONDISSEMENTS_LIST: Arrondissement[] = [
  'Lumumba',
  'Mvou-Mvou',
  'Tié-Tié',
  'Loandjili',
  'Mongo-Mpoukou',
  'Ngoyo',
];

const CATEGORIES_LIST: EstablishmentCategory[] = [
  'Discothèque / Night-club',
  'Bar Dancing / Cabaret',
  'Lounge Bar & Terrasse',
  'Espace Récréatif & Salle Polyvalente',
  'Snack-Bar Sonorisé',
  'Complexe de Loisirs & Piscine',
  'Autre établissement de loisirs',
];

const ARRONDISSEMENT_COLORS: Record<Arrondissement, { bg: string; text: string; fill: string; border: string }> = {
  Lumumba: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', fill: '#10b981', border: 'border-emerald-500/30' },
  'Mvou-Mvou': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', fill: '#3b82f6', border: 'border-blue-500/30' },
  'Tié-Tié': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', fill: '#f59e0b', border: 'border-amber-500/30' },
  Loandjili: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', fill: '#8b5cf6', border: 'border-purple-500/30' },
  'Mongo-Mpoukou': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', fill: '#f43f5e', border: 'border-rose-500/30' },
  Ngoyo: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', fill: '#14b8a6', border: 'border-teal-500/30' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Discothèque / Night-club': '#6366f1',
  'Bar Dancing / Cabaret': '#ec4899',
  'Lounge Bar & Terrasse': '#06b6d4',
  'Espace Récréatif & Salle Polyvalente': '#10b981',
  'Snack-Bar Sonorisé': '#f59e0b',
  'Complexe de Loisirs & Piscine': '#8b5cf6',
  'Autre établissement de loisirs': '#64748b',
};

const STATUT_LABELS: Record<ComplianceStatus, { label: string; badgeClass: string; printBadge: string }> = {
  en_regle: {
    label: 'En règle (Soldé)',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    printBadge: 'CONFORME',
  },
  attestation_provisoire: {
    label: 'Attestation délivrée',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    printBadge: 'ATTESTATION',
  },
  convocation_delivree: {
    label: 'Convoqué',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    printBadge: 'CONVOCATION',
  },
  acompte_verse: {
    label: 'Acompte versé',
    badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    printBadge: 'EN COURS',
  },
  negociation_en_cours: {
    label: 'Négociation',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    printBadge: 'NÉGOCIATION',
  },
  mise_en_demeure: {
    label: 'Mise en demeure',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    printBadge: 'MISE EN DEMEURE',
  },
  ferme_contentieux: {
    label: 'Fermé / Contentieux',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    printBadge: 'CONTENTIEUX',
  },
};

export const StatisticalServiceModule: React.FC = () => {
  const { establishments, theme, showNotification } = useApp();
  const isLight = theme === 'light';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'charts' | 'table' | 'matrix' | 'note'>('charts');

  // Search & Filter state (Strictly non-financial)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArrondissement, setSelectedArrondissement] = useState<string>('all');
  const [selectedQuartier, setSelectedQuartier] = useState<string>('all');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedLimiteur, setSelectedLimiteur] = useState<'all' | 'avec' | 'sans'>('all');
  const [selectedSoundRange, setSelectedSoundRange] = useState<string>('all');
  const [selectedSurfaceRange, setSelectedSurfaceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nom' | 'arrondissement' | 'quartier' | 'surface' | 'decibels' | 'date'>('nom');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal inspection of individual establishment (NO financial info)
  const [inspectModalEst, setInspectModalEst] = useState<Establishment | null>(null);

  // Print configuration
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printScope, setPrintScope] = useState<'filtered' | 'total'>('filtered');
  const [includeStatsSummaryInPrint] = useState(true);

  // Columns visibility for printing
  const [printColumns, setPrintColumns] = useState({
    numOrdre: true,
    codeDossier: true,
    nomCommercial: true,
    promoteurNom: true,
    arrondissement: true,
    quartier: true,
    adresseExacte: true,
    categorie: true,
    surfaceM2: true,
    niveauDecibels: true,
    limiteurInstalle: true,
    statut: true,
    regimeFiscal: true,
    telephone: true,
    recensePar: false,
    dateRecensement: false,
  });

  // Available quartiers based on selected arrondissement
  const availableQuartiers = useMemo(() => {
    if (selectedArrondissement === 'all' || !selectedArrondissement) {
      const allQ: string[] = [];
      Object.values(QUARTIERS_PAR_ARRONDISSEMENT).forEach((qList) => {
        allQ.push(...qList);
      });
      return Array.from(new Set(allQ)).sort();
    }
    return QUARTIERS_PAR_ARRONDISSEMENT[selectedArrondissement as Arrondissement] || [];
  }, [selectedArrondissement]);

  // Clean raw establishments
  const allEstablishments = useMemo(() => {
    return (establishments || []).filter((e) => Boolean(e && e.nomCommercial));
  }, [establishments]);

  // Filtered establishments list (Pure demographic & technical data)
  const filteredEstablishments = useMemo(() => {
    return allEstablishments.filter((est) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const nom = (est.nomCommercial || '').toLowerCase();
        const prom = (est.promoteurNom || '').toLowerCase();
        const adr = (est.adresseExacte || '').toLowerCase();
        const qtr = (est.quartier || '').toLowerCase();
        const code = (est.codeDossier || '').toLowerCase();
        if (
          !nom.includes(query) &&
          !prom.includes(query) &&
          !adr.includes(query) &&
          !qtr.includes(query) &&
          !code.includes(query)
        ) {
          return false;
        }
      }

      // Arrondissement
      if (selectedArrondissement !== 'all' && est.arrondissement !== selectedArrondissement) {
        return false;
      }

      // Quartier
      if (selectedQuartier !== 'all' && est.quartier !== selectedQuartier) {
        return false;
      }

      // Categorie
      if (selectedCategorie !== 'all' && est.categorie !== selectedCategorie) {
        return false;
      }

      // Statut
      if (selectedStatut !== 'all' && est.statut !== selectedStatut) {
        return false;
      }

      // Limiteur
      if (selectedLimiteur === 'avec' && !est.limiteurInstalle) return false;
      if (selectedLimiteur === 'sans' && est.limiteurInstalle) return false;

      // Sound range
      if (selectedSoundRange !== 'all') {
        const db = est.niveauDecibelsMoyen || 0;
        if (selectedSoundRange === 'calme' && db >= 70) return false;
        if (selectedSoundRange === 'modere' && (db < 70 || db > 80)) return false;
        if (selectedSoundRange === 'eleve' && (db < 80 || db > 85)) return false;
        if (selectedSoundRange === 'critique' && db <= 85) return false;
      }

      // Surface range
      if (selectedSurfaceRange !== 'all') {
        const s = est.surfaceM2 || 0;
        if (selectedSurfaceRange === 'micro' && s >= 50) return false;
        if (selectedSurfaceRange === 'moyen' && (s < 50 || s > 150)) return false;
        if (selectedSurfaceRange === 'grand' && (s < 150 || s > 300)) return false;
        if (selectedSurfaceRange === 'mega' && s <= 300) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nom') {
        comparison = (a.nomCommercial || '').localeCompare(b.nomCommercial || '');
      } else if (sortBy === 'arrondissement') {
        comparison = (a.arrondissement || '').localeCompare(b.arrondissement || '');
      } else if (sortBy === 'quartier') {
        comparison = (a.quartier || '').localeCompare(b.quartier || '');
      } else if (sortBy === 'surface') {
        comparison = (a.surfaceM2 || 0) - (b.surfaceM2 || 0);
      } else if (sortBy === 'decibels') {
        comparison = (a.niveauDecibelsMoyen || 0) - (b.niveauDecibelsMoyen || 0);
      } else if (sortBy === 'date') {
        comparison = (a.dateRecensement || '').localeCompare(b.dateRecensement || '');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    allEstablishments,
    searchTerm,
    selectedArrondissement,
    selectedQuartier,
    selectedCategorie,
    selectedStatut,
    selectedLimiteur,
    selectedSoundRange,
    selectedSurfaceRange,
    sortBy,
    sortDirection,
  ]);

  // Establishments to print
  const establishmentsToPrint = useMemo(() => {
    return printScope === 'total' ? allEstablishments : filteredEstablishments;
  }, [printScope, allEstablishments, filteredEstablishments]);

  // STATISTICAL AGGREGATIONS (Non-Financial)
  const stats = useMemo(() => {
    const list = filteredEstablishments;
    const totalCount = list.length;
    const allCount = allEstablishments.length;

    // 1. Arrondissements distribution
    const byArrondissement: Record<Arrondissement, number> = {
      Lumumba: 0,
      'Mvou-Mvou': 0,
      'Tié-Tié': 0,
      Loandjili: 0,
      'Mongo-Mpoukou': 0,
      Ngoyo: 0,
    };
    list.forEach((e) => {
      if (e.arrondissement && byArrondissement[e.arrondissement] !== undefined) {
        byArrondissement[e.arrondissement]++;
      }
    });

    // 2. Categories distribution
    const byCategory: Record<string, number> = {};
    CATEGORIES_LIST.forEach((c) => (byCategory[c] = 0));
    list.forEach((e) => {
      const cat = e.categorie || 'Autre établissement de loisirs';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    // 3. Sound level analysis
    let totalDb = 0;
    let countWithDb = 0;
    let soundCalme = 0;
    let soundModere = 0;
    let soundEleve = 0;
    let soundCritique = 0;
    let limiteursCount = 0;

    list.forEach((e) => {
      const db = e.niveauDecibelsMoyen;
      if (typeof db === 'number' && db > 0) {
        totalDb += db;
        countWithDb++;
        if (db < 70) soundCalme++;
        else if (db <= 80) soundModere++;
        else if (db <= 85) soundEleve++;
        else soundCritique++;
      }
      if (e.limiteurInstalle) {
        limiteursCount++;
      }
    });

    const avgDb = countWithDb > 0 ? Math.round((totalDb / countWithDb) * 10) / 10 : 0;
    const limiteurRate = totalCount > 0 ? Math.round((limiteursCount / totalCount) * 100) : 0;

    // 4. Surface analysis (m²)
    let totalSurface = 0;
    let surfaceMicro = 0;
    let surfaceMoyen = 0;
    let surfaceGrand = 0;
    let surfaceMega = 0;

    list.forEach((e) => {
      const s = e.surfaceM2 || 0;
      totalSurface += s;
      if (s < 50) surfaceMicro++;
      else if (s <= 150) surfaceMoyen++;
      else if (s <= 300) surfaceGrand++;
      else surfaceMega++;
    });

    const avgSurface = totalCount > 0 ? Math.round(totalSurface / totalCount) : 0;

    // 5. Compliance Status
    const byStatus: Record<string, number> = {};
    list.forEach((e) => {
      const st = e.statut || 'convocation_delivree';
      byStatus[st] = (byStatus[st] || 0) + 1;
    });

    const compliantCount = (byStatus['en_regle'] || 0) + (byStatus['attestation_provisoire'] || 0);
    const complianceRate = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;

    // 6. Top Quartiers
    const byQuartier: Record<string, { count: number; arrondissement: Arrondissement }> = {};
    list.forEach((e) => {
      const q = e.quartier || 'Non spécifié';
      if (!byQuartier[q]) {
        byQuartier[q] = { count: 0, arrondissement: e.arrondissement };
      }
      byQuartier[q].count++;
    });

    const topQuartiers = Object.entries(byQuartier)
      .map(([quartier, val]) => ({ quartier, count: val.count, arrondissement: val.arrondissement }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 7. Fiscal regime
    let informelCount = 0;
    let formelCount = 0;
    list.forEach((e) => {
      if (e.regimeFiscal === 'formel_proportionnel') formelCount++;
      else informelCount++;
    });

    // 8. Unique agents
    const byAgent: Record<string, number> = {};
    list.forEach((e) => {
      const agent = e.agentAssigneNom || e.recensePar || 'Non assigné';
      byAgent[agent] = (byAgent[agent] || 0) + 1;
    });
    const topAgents = Object.entries(byAgent)
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count);

    // 9. Matrix Arrondissement x Category
    const matrix: Record<Arrondissement, Record<string, number>> = {
      Lumumba: {},
      'Mvou-Mvou': {},
      'Tié-Tié': {},
      Loandjili: {},
      'Mongo-Mpoukou': {},
      Ngoyo: {},
    };
    ARRONDISSEMENTS_LIST.forEach((arr) => {
      CATEGORIES_LIST.forEach((cat) => {
        matrix[arr][cat] = 0;
      });
    });
    list.forEach((e) => {
      if (e.arrondissement && matrix[e.arrondissement]) {
        const cat = e.categorie || 'Autre établissement de loisirs';
        matrix[e.arrondissement][cat] = (matrix[e.arrondissement][cat] || 0) + 1;
      }
    });

    return {
      totalCount,
      allCount,
      byArrondissement,
      byCategory,
      avgDb,
      limiteursCount,
      limiteurRate,
      soundDistribution: {
        calme: soundCalme,
        modere: soundModere,
        eleve: soundEleve,
        critique: soundCritique,
      },
      totalSurface,
      avgSurface,
      surfaceDistribution: {
        micro: surfaceMicro,
        moyen: surfaceMoyen,
        grand: surfaceGrand,
        mega: surfaceMega,
      },
      byStatus,
      complianceRate,
      topQuartiers,
      informelCount,
      formelCount,
      topAgents,
      matrix,
      quartiersCount: Object.keys(byQuartier).length,
    };
  }, [filteredEstablishments, allEstablishments]);

  // Handle printing main repertoire table
  const handleTriggerPrint = () => {
    printHtmlElement('ddl-print-statistical-repertoire', 'Repertoire_Statistique_DDL_PN_2026', {
      orientation: printOrientation,
    });
  };

  // Handle printing individual establishment statistical card A4
  const handlePrintIndividualCard = () => {
    if (!inspectModalEst) return;
    printHtmlElement('ddl-print-individual-establishment', `Fiche_Statistique_${inspectModalEst.codeDossier || 'Ets'}`, {
      orientation: 'portrait',
    });
  };

  // Handle printing periodic executive note A4
  const handlePrintExecutiveNote = () => {
    printHtmlElement('ddl-print-statistical-summary-note', 'Note_Synthese_Statistique_DDL_PN_2026', {
      orientation: 'portrait',
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    const list = printScope === 'total' ? allEstablishments : filteredEstablishments;
    if (list.length === 0) {
      showNotification('warning', 'Aucun établissement à exporter.');
      return;
    }

    const headers = [
      'N° Ordre',
      'Code Dossier',
      'Nom Commercial',
      'Gérant / Promoteur',
      'Arrondissement',
      'Quartier',
      'Adresse Exacte',
      'Catégorie de Loisirs',
      'Surface (m²)',
      'Niveau Décibels (dBA)',
      'Limiteur Installé',
      'Statut Régularisation',
      'Régime Juridique',
      'Téléphone Contact',
      'Agent Assigné',
      'Date Recensement',
      'Latitude GPS',
      'Longitude GPS',
    ];

    const rows = list.map((est, idx) => [
      (idx + 1).toString(),
      `"${est.codeDossier || ''}"`,
      `"${(est.nomCommercial || '').replace(/"/g, '""')}"`,
      `"${(est.promoteurNom || '').replace(/"/g, '""')}"`,
      `"${est.arrondissement || ''}"`,
      `"${(est.quartier || '').replace(/"/g, '""')}"`,
      `"${(est.adresseExacte || '').replace(/"/g, '""')}"`,
      `"${est.categorie || ''}"`,
      est.surfaceM2 || 0,
      est.niveauDecibelsMoyen || 0,
      est.limiteurInstalle ? 'OUI' : 'NON',
      `"${STATUT_LABELS[est.statut]?.label || est.statut || ''}"`,
      est.regimeFiscal === 'formel_proportionnel' ? 'Formel Proportionnel' : 'Informel Forfaitaire',
      `"${est.promoteurTelephone || ''}"`,
      `"${(est.agentAssigneNom || est.recensePar || '').replace(/"/g, '""')}"`,
      `"${est.dateRecensement || ''}"`,
      est.latitude || '',
      est.longitude || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Repertoire_Statistique_DDL_PN_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', `Export de ${list.length} établissements généré avec succès en CSV !`);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedArrondissement('all');
    setSelectedQuartier('all');
    setSelectedCategorie('all');
    setSelectedStatut('all');
    setSelectedLimiteur('all');
    setSelectedSoundRange('all');
    setSelectedSurfaceRange('all');
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* 1. MODULE BANNER & HEADER */}
      <div className={`p-6 rounded-3xl border shadow-sm transition-all ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <BarChart3 className="w-3.5 h-3.5" />
                Service Statistique (SSEP) • MOD-22
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <Scale className="w-3 h-3" />
                Loi N° 21-2019 • République du Congo
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-3 h-3" />
                Strictement Non-Financier
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-cinzel tracking-tight text-slate-900 dark:text-white">
              Service Statistique & Répertoire Démographique
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Observatoire territorial, cartographique et acoustique de la Direction Départementale des Loisirs de Pointe-Noire.
              Regroupe toutes les caractéristiques physiques, géographiques et administratives des établissements recensés, avec génération et impression du Répertoire Officiel A4.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              onClick={handleTriggerPrint}
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-colors cursor-pointer"
              title="Lancer l'impression officielle du répertoire"
            >
              <Printer className="w-4 h-4" />
              Imprimer Répertoire A4
            </button>

            <button
              onClick={handlePrintExecutiveNote}
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
              title="Imprimer la Note de Synthèse Statistique Départementale"
            >
              <FileText className="w-4 h-4" />
              Note de Synthèse A4
            </button>

            <button
              onClick={handleExportCsv}
              className={`flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border shadow-xs transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="Exporter les données statistiques au format CSV / Excel"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('charts')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'charts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Tableau de Bord & 10 Graphiques
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'table'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Répertoire & Impression Officielle ({filteredEstablishments.length})
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'matrix'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            Matrice Territoriale Arrondissement × Typologie
          </button>

          <button
            onClick={() => setActiveTab('note')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'note'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Note d&apos;Analyse Trimestrielle A4
          </button>
        </div>
      </div>

      {/* 2. STATISTICAL KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Établissements</span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white">
            {stats.totalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sur {stats.allCount} répertoriés
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Arrondissements</span>
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white">
            6 / 6
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.quartiersCount} quartiers touchés
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Superficie Totale</span>
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white">
            {stats.totalSurface.toLocaleString('fr-FR')} <span className="text-xs font-sans font-normal">m²</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Moyenne: {stats.avgSurface} m² / ét.
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Niveau Sonore</span>
            <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white">
            {stats.avgDb} <span className="text-xs font-sans font-normal">dB(A)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.soundDistribution.critique} &gt; 85 dB (Critique)
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Limiteurs de Son</span>
            <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white">
            {stats.limiteurRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.limiteursCount} établissements équipés
          </p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Régularité Admin</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white">
            {stats.complianceRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            En règle ou attestation
          </p>
        </div>
      </div>

      {/* 3. MULTI-CRITERIA STATISTICAL FILTER BAR */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Filtres & Tri Statistique
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredEstablishments.length} sélectionnés
            </span>
          </div>

          {(searchTerm ||
            selectedArrondissement !== 'all' ||
            selectedQuartier !== 'all' ||
            selectedCategorie !== 'all' ||
            selectedStatut !== 'all' ||
            selectedLimiteur !== 'all' ||
            selectedSoundRange !== 'all' ||
            selectedSurfaceRange !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              Réinitialiser les filtres
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher nom, gérant, adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 focus:bg-slate-800 text-slate-100'
              }`}
            />
          </div>

          {/* Arrondissement */}
          <div>
            <select
              value={selectedArrondissement}
              onChange={(e) => {
                setSelectedArrondissement(e.target.value);
                setSelectedQuartier('all');
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-slate-100'
              }`}
            >
              <option value="all">Tous les Arrondissements (6)</option>
              {ARRONDISSEMENTS_LIST.map((arr) => (
                <option key={arr} value={arr}>
                  {arr} ({stats.byArrondissement[arr] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Quartier */}
          <div>
            <select
              value={selectedQuartier}
              onChange={(e) => setSelectedQuartier(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-slate-100'
              }`}
            >
              <option value="all">Tous les Quartiers</option>
              {availableQuartiers.map((qtr) => (
                <option key={qtr} value={qtr}>
                  {qtr}
                </option>
              ))}
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <select
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-slate-100'
              }`}
            >
              <option value="all">Toutes les Catégories</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({stats.byCategory[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Statut Administratif */}
          <div>
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-slate-100'
              }`}
            >
              <option value="all">Tous les Statuts Administratifs</option>
              {Object.entries(STATUT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} ({stats.byStatus[k] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Limiteur de Son */}
          <div>
            <select
              value={selectedLimiteur}
              onChange={(e) => setSelectedLimiteur(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-slate-100'
              }`}
            >
              <option value="all">Limiteur Acoustique (Tous)</option>
              <option value="avec">Avec Limiteur de Son ({stats.limiteursCount})</option>
              <option value="sans">Sans Limiteur ({stats.totalCount - stats.limiteursCount})</option>
            </select>
          </div>

          {/* Tranche Sonore */}
          <div>
            <select
              value={selectedSoundRange}
              onChange={(e) => setSelectedSoundRange(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-slate-100'
              }`}
            >
              <option value="all">Niveau Sonore (Tous)</option>
              <option value="calme">&lt; 70 dB(A) - Calme ({stats.soundDistribution.calme})</option>
              <option value="modere">70 à 80 dB(A) - Modéré ({stats.soundDistribution.modere})</option>
              <option value="eleve">80 à 85 dB(A) - Élevé ({stats.soundDistribution.eleve})</option>
              <option value="critique">&gt; 85 dB(A) - Alerte ({stats.soundDistribution.critique})</option>
            </select>
          </div>

          {/* Tri par */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900'
                  : 'bg-slate-800/80 border-slate-700 focus:border-emerald-500 text-slate-100'
              }`}
            >
              <option value="nom">Trier par Nom</option>
              <option value="arrondissement">Trier par Arrondissement</option>
              <option value="quartier">Trier par Quartier</option>
              <option value="surface">Trier par Superficie</option>
              <option value="decibels">Trier par Décibels</option>
              <option value="date">Trier par Date de Recensement</option>
            </select>

            <button
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={sortDirection === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. TAB 1: 10 STATISTICAL CHARTS */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Row 1: Arrondissements & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Répartition par Arrondissement */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Répartition par Arrondissement
                    </h3>
                    <p className="text-xs text-slate-500">
                      Poids territorial des 6 circonscriptions de Pointe-Noire
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {stats.totalCount} établissements
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {ARRONDISSEMENTS_LIST.map((arr) => {
                  const count = stats.byArrondissement[arr] || 0;
                  const pct = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;
                  const color = ARRONDISSEMENT_COLORS[arr];

                  return (
                    <div
                      key={arr}
                      className="group cursor-pointer"
                      onClick={() => {
                        setSelectedArrondissement(arr === selectedArrondissement ? 'all' : arr);
                        setActiveTab('table');
                      }}
                      title={`Filtrer la table sur ${arr}`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {arr}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {count} ét.
                          </span>
                          <span className="text-slate-400 font-mono w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color.fill,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Typologie & Catégories de Loisirs */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      2. Typologie & Nature des Loisirs
                    </h3>
                    <p className="text-xs text-slate-500">
                      Distribution sectorielle selon la nomenclature officielle
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {CATEGORIES_LIST.map((cat) => {
                  const count = stats.byCategory[cat] || 0;
                  const pct = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;
                  const color = CATEGORY_COLORS[cat] || '#64748b';

                  return (
                    <div
                      key={cat}
                      className="group cursor-pointer"
                      onClick={() => {
                        setSelectedCategorie(cat === selectedCategorie ? 'all' : cat);
                        setActiveTab('table');
                      }}
                      title={`Filtrer sur ${cat}`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {cat}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {count}
                          </span>
                          <span className="text-slate-400 font-mono w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Acoustique & Surfaces */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3 & 4: Acoustique & Limiteurs */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      3 & 4. Profil Acoustique & Limiteurs
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mesures sonomètres dB(A) & Taux d&apos;équipement technique
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Moyenne: {stats.avgDb} dB(A)
                </span>
              </div>

              {/* Sound distribution histogram */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    &lt; 70 dB(A)
                  </span>
                  <div className="text-lg font-bold font-cinzel text-slate-900 dark:text-white mt-1">
                    {stats.soundDistribution.calme}
                  </div>
                  <span className="text-[10px] text-slate-500">Calme</span>
                </div>

                <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                    70 - 80 dB
                  </span>
                  <div className="text-lg font-bold font-cinzel text-slate-900 dark:text-white mt-1">
                    {stats.soundDistribution.modere}
                  </div>
                  <span className="text-[10px] text-slate-500">Modéré</span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                    80 - 85 dB
                  </span>
                  <div className="text-lg font-bold font-cinzel text-slate-900 dark:text-white mt-1">
                    {stats.soundDistribution.eleve}
                  </div>
                  <span className="text-[10px] text-slate-500">Élevé</span>
                </div>

                <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                    &gt; 85 dB
                  </span>
                  <div className="text-lg font-bold font-cinzel text-slate-900 dark:text-white mt-1">
                    {stats.soundDistribution.critique}
                  </div>
                  <span className="text-[10px] text-rose-500 font-medium">Alerte</span>
                </div>
              </div>

              {/* Limiteur acoustique progress */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Taux d&apos;Équipement en Limiteurs de Son (Obligation Loi 21-2019)
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {stats.limiteurRate}% ({stats.limiteursCount} / {stats.totalCount})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${stats.limiteurRate}%` }}
                    title={`Avec limiteur: ${stats.limiteursCount}`}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${100 - stats.limiteurRate}%` }}
                    title={`Sans limiteur: ${stats.totalCount - stats.limiteursCount}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Conforme avec limiteur
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Non équipé (À régulariser)
                  </span>
                </div>
              </div>
            </div>

            {/* Chart 5: Tranches de Superficie */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      5. Profil des Superficies (m²)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Capacité d&apos;accueil et taille physique des établissements
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Total: {stats.totalSurface.toLocaleString('fr-FR')} m²
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'Micros établissements (< 50 m²)', count: stats.surfaceDistribution.micro, color: '#06b6d4', desc: 'Buvettes de quartier & débits modestes' },
                  { label: 'Moyens établissements (50 à 150 m²)', count: stats.surfaceDistribution.moyen, color: '#3b82f6', desc: 'Snack-bars & terrasses aménagées' },
                  { label: 'Grands établissements (150 à 300 m²)', count: stats.surfaceDistribution.grand, color: '#8b5cf6', desc: 'Bars dancings & cabarets' },
                  { label: 'Méga-espaces (> 300 m²)', count: stats.surfaceDistribution.mega, color: '#ec4899', desc: 'Discothèques VIP, parcs & piscines' },
                ].map((item) => {
                  const pct = stats.totalCount > 0 ? Math.round((item.count / stats.totalCount) * 100) : 0;
                  return (
                    <div key={item.label} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.label}
                          </span>
                          <span className="hidden sm:inline text-[11px] text-slate-400 ml-2">
                            ({item.desc})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.count}
                          </span>
                          <span className="text-slate-400 font-mono w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Superficie moyenne départementale :</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {stats.avgSurface} m² par établissement
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Statut de Conformité & Top Quartiers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 6: Statuts de Régularisation */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      6. Statut de Conformité Administrative
                    </h3>
                    <p className="text-xs text-slate-500">
                      Degré d&apos;accomplissement de la procédure administrative
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {Object.entries(STATUT_LABELS).map(([k, meta]) => {
                  const count = stats.byStatus[k] || 0;
                  const pct = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;

                  return (
                    <div
                      key={k}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-xs ${meta.badgeClass}`}
                      onClick={() => {
                        setSelectedStatut(k === selectedStatut ? 'all' : k);
                        setActiveTab('table');
                      }}
                      title={`Filtrer par statut: ${meta.label}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate pr-1">
                          {meta.label}
                        </span>
                        <span className="text-base font-bold font-cinzel">
                          {count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] opacity-80 mt-1">
                        <span>Poids statistique</span>
                        <span className="font-mono font-bold">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 7: Top Quartiers par Densité */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      7. Top Quartiers à Forte Densité
                    </h3>
                    <p className="text-xs text-slate-500">
                      Concentration urbaine des lieux récréatifs
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {stats.quartiersCount} quartiers
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {stats.topQuartiers.map((q, idx) => {
                  const maxCount = stats.topQuartiers[0]?.count || 1;
                  const relativePct = Math.round((q.count / maxCount) * 100);

                  return (
                    <div
                      key={q.quartier}
                      className="group cursor-pointer"
                      onClick={() => {
                        setSelectedQuartier(q.quartier === selectedQuartier ? 'all' : q.quartier);
                        setActiveTab('table');
                      }}
                      title={`Filtrer sur ${q.quartier}`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-slate-400 w-4">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {q.quartier}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {q.arrondissement}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white shrink-0">
                          {q.count} ét.
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500 transition-all duration-500"
                          style={{ width: `${relativePct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Régimes Juridiques & Couverture Opérationnelle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 8 & 9: Régimes Juridiques */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      8 & 9. Régimes Juridiques & Structuration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Typologie administrative (Informel Forfaitaire vs Formel Proportionnel)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 pt-2">
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Informel Forfaitaire
                  </span>
                  <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white mt-1">
                    {stats.informelCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {stats.totalCount > 0 ? Math.round((stats.informelCount / stats.totalCount) * 100) : 0}% du parc recensé
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Formel Proportionnel
                  </span>
                  <div className="text-2xl font-bold font-cinzel text-slate-900 dark:text-white mt-1">
                    {stats.formelCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {stats.totalCount > 0 ? Math.round((stats.formelCount / stats.totalCount) * 100) : 0}% du parc recensé
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Note d&apos;orientation statistique :
                </p>
                <p>
                  Le secteur des loisirs de Pointe-Noire est à forte dominante d&apos;exploitation artisanale et de proximité (Régime Forfaitaire SAA). Les structures formelles représentent les discothèques de premier rang et complexes hôteliers.
                </p>
              </div>
            </div>

            {/* Chart 10: Répartition Opérationnelle par Agent SAA */}
            <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      10. Répartition Opérationnelle par Inspecteur
                    </h3>
                    <p className="text-xs text-slate-500">
                      Charge d&apos;encadrement territorial par agent de la Brigade SAA
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {stats.topAgents.slice(0, 5).map((ag) => {
                  const pct = stats.totalCount > 0 ? Math.round((ag.count / stats.totalCount) * 100) : 0;
                  return (
                    <div key={ag.nom}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {ag.nom}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {ag.count} dossiers
                          </span>
                          <span className="text-slate-400 font-mono w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: DETAILED TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold font-cinzel text-slate-900 dark:text-white">
                  Répertoire Officiel pour Impression & Exportation
                </h3>
                <p className="text-xs text-slate-500">
                  Affichage des informations démographiques, physiques et administratives (Strictement sans finances)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    onClick={() => setPrintScope('filtered')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      printScope === 'filtered'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Liste Filtrée ({filteredEstablishments.length})
                  </button>
                  <button
                    onClick={() => setPrintScope('total')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      printScope === 'total'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Liste Totale ({allEstablishments.length})
                  </button>
                </div>

                <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    onClick={() => setPrintOrientation('landscape')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      printOrientation === 'landscape'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Paysage (Recommandé)
                  </button>
                  <button
                    onClick={() => setPrintOrientation('portrait')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      printOrientation === 'portrait'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Portrait
                  </button>
                </div>

                <button
                  onClick={handleTriggerPrint}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer Maintenant
                </button>
              </div>
            </div>

            {/* Toggle Columns */}
            <div className="mt-4 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Colonnes visibles & imprimées :
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { key: 'codeDossier', label: 'Code Dossier' },
                  { key: 'nomCommercial', label: 'Établissement' },
                  { key: 'promoteurNom', label: 'Gérant / Promoteur' },
                  { key: 'arrondissement', label: 'Arrondissement' },
                  { key: 'quartier', label: 'Quartier' },
                  { key: 'adresseExacte', label: 'Adresse' },
                  { key: 'categorie', label: 'Catégorie' },
                  { key: 'surfaceM2', label: 'Surface (m²)' },
                  { key: 'niveauDecibels', label: 'Décibels (dB)' },
                  { key: 'limiteurInstalle', label: 'Limiteur' },
                  { key: 'statut', label: 'Statut Admin' },
                  { key: 'telephone', label: 'Téléphone' },
                  { key: 'recensePar', label: 'Agent Recenseur' },
                ].map((col) => {
                  const isActive = (printColumns as any)[col.key];
                  return (
                    <button
                      key={col.key}
                      onClick={() =>
                        setPrintColumns((prev) => ({
                          ...prev,
                          [col.key]: !isActive,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isActive ? '✓ ' : '+ '}
                      {col.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Screen Table */}
          <div className={`rounded-3xl border overflow-hidden shadow-xs transition-all ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-cinzel ${
                    isLight ? 'bg-slate-50/80 text-slate-700 border-slate-200' : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}>
                    <th className="py-3 px-3.5 font-bold w-12 text-center">N°</th>
                    {printColumns.codeDossier && <th className="py-3 px-3.5 font-bold">Code Dossier</th>}
                    {printColumns.nomCommercial && <th className="py-3 px-3.5 font-bold">Établissement</th>}
                    {printColumns.promoteurNom && <th className="py-3 px-3.5 font-bold">Gérant / Promoteur</th>}
                    {printColumns.arrondissement && <th className="py-3 px-3.5 font-bold">Arrondissement</th>}
                    {printColumns.quartier && <th className="py-3 px-3.5 font-bold">Quartier</th>}
                    {printColumns.adresseExacte && <th className="py-3 px-3.5 font-bold">Adresse</th>}
                    {printColumns.categorie && <th className="py-3 px-3.5 font-bold">Catégorie</th>}
                    {printColumns.surfaceM2 && <th className="py-3 px-3.5 font-bold text-right">Surface</th>}
                    {printColumns.niveauDecibels && <th className="py-3 px-3.5 font-bold text-center">Contrôle HSE</th>}
                    {printColumns.limiteurInstalle && <th className="py-3 px-3.5 font-bold text-center">Sécurité Incendie</th>}
                    {printColumns.statut && <th className="py-3 px-3.5 font-bold">Statut</th>}
                    {printColumns.telephone && <th className="py-3 px-3.5 font-bold">Contact</th>}
                    <th className="py-3 px-3.5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {filteredEstablishments.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-slate-400">
                        Aucun établissement ne correspond aux filtres sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredEstablishments.map((est, idx) => {
                      const statutMeta = STATUT_LABELS[est.statut] || STATUT_LABELS.convocation_delivree;
                      const arrColor = ARRONDISSEMENT_COLORS[est.arrondissement] || ARRONDISSEMENT_COLORS.Lumumba;

                      return (
                        <tr
                          key={est.id || idx}
                          className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40`}
                        >
                          <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>

                          {printColumns.codeDossier && (
                            <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {est.codeDossier || `DDL-PN-${idx + 1}`}
                            </td>
                          )}

                          {printColumns.nomCommercial && (
                            <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                              {est.nomCommercial}
                            </td>
                          )}

                          {printColumns.promoteurNom && (
                            <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                              {est.promoteurNom || '—'}
                            </td>
                          )}

                          {printColumns.arrondissement && (
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${arrColor.bg} ${arrColor.text}`}>
                                {est.arrondissement}
                              </span>
                            </td>
                          )}

                          {printColumns.quartier && (
                            <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                              {est.quartier || '—'}
                            </td>
                          )}

                          {printColumns.adresseExacte && (
                            <td className="py-3 px-3.5 text-slate-500 max-w-xs truncate" title={est.adresseExacte}>
                              {est.adresseExacte || '—'}
                            </td>
                          )}

                          {printColumns.categorie && (
                            <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {est.categorie || 'Autre'}
                            </td>
                          )}

                          {printColumns.surfaceM2 && (
                            <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {est.surfaceM2 || 0} m²
                            </td>
                          )}

                          {printColumns.niveauDecibels && (
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                est.controleHSE?.statutHSE === 'conforme'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : est.controleHSE?.statutHSE === 'reserves_mineures'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {est.controleHSE?.statutHSE === 'conforme' ? '✓ Conforme HSE' : est.controleHSE?.statutHSE === 'reserves_mineures' ? '⚠ Réserves' : '✓ Conforme'}
                              </span>
                            </td>
                          )}

                          {printColumns.limiteurInstalle && (
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {est.controleHSE?.extincteursPresents ?? true ? '✓ Extincteurs OK' : '✕ Défaut'}
                              </span>
                            </td>
                          )}

                          {printColumns.statut && (
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statutMeta.badgeClass}`}>
                                {statutMeta.label}
                              </span>
                            </td>
                          )}

                          {printColumns.telephone && (
                            <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {est.promoteurTelephone || '—'}
                            </td>
                          )}

                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => setInspectModalEst(est)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              title="Voir la fiche statistique complète"
                            >
                              <Eye className="w-3.5 h-3.5" /> Fiche
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table pagination & footer */}
            <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 ${
              isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/30 border-slate-800'
            }`}>
              <span>
                Affichage de <strong>{filteredEstablishments.length}</strong> sur <strong>{allEstablishments.length}</strong> établissements recensés
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer cette liste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: MATRIX */}
      {activeTab === 'matrix' && (
        <div className={`p-6 rounded-3xl border shadow-xs transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-cinzel text-slate-900 dark:text-white">
                Matrice Territoriale Croisée : Arrondissement × Typologie de Loisirs
              </h3>
              <p className="text-xs text-slate-500">
                Croisement statistique exhaustif des 6 arrondissements avec les 7 catégories officielles
              </p>
            </div>
            <button
              onClick={handleTriggerPrint}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer le Bilan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-700">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-800 font-cinzel' : 'bg-slate-800 text-slate-200 font-cinzel'}>
                  <th className="p-3 border border-slate-200 dark:border-slate-700 font-bold">
                    Arrondissement
                  </th>
                  {CATEGORIES_LIST.map((cat) => (
                    <th
                      key={cat}
                      className="p-3 border border-slate-200 dark:border-slate-700 text-center font-bold text-[11px] max-w-[130px]"
                    >
                      {cat}
                    </th>
                  ))}
                  <th className="p-3 border border-slate-200 dark:border-slate-700 text-center font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {ARRONDISSEMENTS_LIST.map((arr) => {
                  const arrTotal = stats.byArrondissement[arr] || 0;
                  const color = ARRONDISSEMENT_COLORS[arr];

                  return (
                    <tr key={arr} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 border border-slate-200 dark:border-slate-700 font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${color.bg} ${color.text}`}>
                          {arr}
                        </span>
                      </td>

                      {CATEGORIES_LIST.map((cat) => {
                        const count = stats.matrix[arr]?.[cat] || 0;
                        return (
                          <td
                            key={cat}
                            className={`p-3 border border-slate-200 dark:border-slate-700 text-center font-mono font-medium ${
                              count > 0
                                ? 'text-slate-900 dark:text-white font-bold bg-emerald-500/5'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          >
                            {count}
                          </td>
                        );
                      })}

                      <td className="p-3 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        {arrTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={isLight ? 'bg-slate-100 font-bold' : 'bg-slate-800 font-bold'}>
                  <td className="p-3 border border-slate-200 dark:border-slate-700 font-bold uppercase">
                    Total Général
                  </td>
                  {CATEGORIES_LIST.map((cat) => (
                    <td
                      key={cat}
                      className="p-3 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-slate-900 dark:text-white"
                    >
                      {stats.byCategory[cat] || 0}
                    </td>
                  ))}
                  <td className="p-3 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-base bg-emerald-600 text-white">
                    {stats.totalCount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB 4: NOTE D'ANALYSE */}
      {activeTab === 'note' && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xs transition-all space-y-6 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Service Statistique, Études et Planification (SSEP)
              </span>
              <h3 className="text-lg font-bold font-cinzel text-slate-900 dark:text-white mt-1">
                Note de Synthèse & Analyse Démographique Départementale
              </h3>
              <p className="text-xs text-slate-500">
                Document d&apos;orientation stratégique pour la Direction Générale des Loisirs et la Préfecture de Pointe-Noire
              </p>
            </div>

            <button
              onClick={handlePrintExecutiveNote}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer cette Note A4
            </button>
          </div>

          <div className="space-y-4 max-w-4xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Parc Recensé</span>
                <span className="text-xl font-bold font-cinzel text-slate-900 dark:text-white">{stats.totalCount} ét.</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Surface Totale</span>
                <span className="text-xl font-bold font-cinzel text-slate-900 dark:text-white">{stats.totalSurface.toLocaleString('fr-FR')} m²</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Moyenne dB(A)</span>
                <span className="text-xl font-bold font-cinzel text-slate-900 dark:text-white">{stats.avgDb} dB</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Taux de Limiteurs</span>
                <span className="text-xl font-bold font-cinzel text-slate-900 dark:text-white">{stats.limiteurRate}%</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
                I. Répartition Géographique & Dynamique Territoriale
              </h4>
              <p>
                L&apos;enquête de recensement in situ révèle une forte concentration des établissements de loisirs dans les arrondissements <strong>Lumumba</strong> ({stats.byArrondissement.Lumumba} établissements) et <strong>Tié-Tié</strong> ({stats.byArrondissement['Tié-Tié']} établissements). Les quartiers les plus actifs restent le Centre-Ville, la Côte Sauvage, et les axes marchands de Tié-Tié et Loandjili.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
                II. Diagnostic Acoustique & Tranquillité Publique
              </h4>
              <p>
                Le niveau sonore moyen constaté au sonomètre s&apos;établit à <strong>{stats.avgDb} dB(A)</strong>. Si {stats.soundDistribution.calme + stats.soundDistribution.modere} structures respectent un seuil acceptable inférieur à 80 dB, <strong>{stats.soundDistribution.critique} établissements</strong> dépassent la limite critique de 85 dB(A), constituant une zone d&apos;attention pour la Brigade de Police Administrative. Le taux d&apos;équipement en limiteurs acoustiques agréés atteint <strong>{stats.limiteurRate}%</strong>, un progrès notable qu&apos;il convient de consolider.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
                III. Préconisations Stratégiques de la DDL-PN
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>Poursuivre les tournées conjointes avec les chefs de quartier pour les débits informels.</li>
                <li>Rendre obligatoire l&apos;installation des limiteurs acoustiques pour tout renouvellement annuel.</li>
                <li>Favoriser l&apos;octroi d&apos;Attestations Provisoires pour stabiliser les gérants en cours de régularisation.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL INDIVIDUELLE */}
      {inspectModalEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-cinzel">
                    {inspectModalEst.nomCommercial}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {inspectModalEst.codeDossier || 'DDL-PN-2026'} • Fiche Statistique d&apos;Établissement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectModalEst(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Gérant / Promoteur</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {inspectModalEst.promoteurNom || 'Non renseigné'}
                  </p>
                  <p className="text-slate-500 flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {inspectModalEst.promoteurTelephone || 'Pas de numéro'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Localisation Territoriale</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {inspectModalEst.arrondissement}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Quartier : {inspectModalEst.quartier || '—'}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    {inspectModalEst.adresseExacte}
                  </p>
                </div>
              </div>

              {/* Physical & Technical Specs */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="font-bold text-xs font-cinzel text-slate-900 dark:text-white uppercase tracking-wider">
                  Caractéristiques Physiques & Environnement Acoustique
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Superficie</span>
                    <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                      {inspectModalEst.surfaceM2 || 0} m²
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Niveau Sonore</span>
                    <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                      {inspectModalEst.niveauDecibelsMoyen || 0} dB(A)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Limiteur de Son</span>
                    <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {inspectModalEst.limiteurInstalle ? 'OUI' : 'NON'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="font-bold text-xs font-cinzel text-slate-900 dark:text-white uppercase tracking-wider">
                  Situation Administrative
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Statut de Régularisation :</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {STATUT_LABELS[inspectModalEst.statut]?.label || inspectModalEst.statut}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Régime Juridique :</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {inspectModalEst.regimeFiscal === 'formel_proportionnel'
                        ? 'Formel Proportionnel'
                        : 'Informel Forfaitaire (SAA)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Date de Recensement :</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {inspectModalEst.dateRecensement || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Agent Inspecteur Assigné :</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {inspectModalEst.agentAssigneNom || inspectModalEst.recensePar || 'Brigade SAA'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] leading-relaxed">
                <strong>Rappel institutionnel :</strong> Conformément aux règles du Service Statistique, les montants financiers, redevances, quittances et versements monétaires ne sont pas accessibles dans ce module pour garantir la confidentialité et la neutralité des études démographiques.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handlePrintIndividualCard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer la Fiche Individuelle A4
              </button>

              <button
                onClick={() => setInspectModalEst(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. PRINT TEMPLATE: REPERTOIRE A4 */}
      <div id="ddl-print-statistical-repertoire" className="hidden">
        <div className={`p-8 bg-white text-black font-garamond text-slate-950 ${
          printOrientation === 'landscape' ? 'page-a4-landscape' : 'page-a4'
        }`} style={{ minHeight: '100%', width: '100%' }}>
          
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div className="w-[55%] text-center text-[10pt] leading-tight flex flex-col items-center">
                <p className="font-bold tracking-tight uppercase">RÉPUBLIQUE DU CONGO</p>
                <p className="text-[8.5pt] italic font-serif">Unité - Travail - Progrès</p>
                <p className="text-[9pt] my-0.5">———</p>
                <p className="font-bold uppercase text-[9.5pt]">
                  MINISTÈRE DE LA CULTURE, DES ARTS,
                  <br />
                  DU PATRIMOINE NATIONAL ET DE
                  <br />
                  L&apos;INDUSTRIE TOURISTIQUE
                </p>
                <p className="text-[9pt] my-0.5">———</p>
                <p className="font-bold uppercase text-[9pt]">DIRECTION GÉNÉRALE DES LOISIRS</p>
                <p className="text-[9pt] my-0.5">———</p>
                <p className="font-bold uppercase text-[9pt]">DÉPARTEMENT DE POINTE-NOIRE</p>
                <p className="text-[9pt] my-0.5">———</p>
                <p className="font-bold uppercase text-[9.5pt]">
                  DIRECTION DÉPARTEMENTALE DES LOISIRS
                </p>
                <p className="font-bold text-[9pt] text-slate-800 uppercase tracking-wide">
                  SERVICE STATISTIQUE, ÉTUDES ET PLANIFICATION (SSEP)
                </p>
              </div>

              <div className="w-[40%] text-right text-[10pt] leading-snug">
                <p className="italic font-serif">Pointe-Noire, le {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</p>
                <p className="font-bold font-mono text-[9pt] mt-2">
                  RÉF : DDL-PN/SSEP/STAT-LISTE/{new Date().getFullYear()}-001
                </p>
                <p className="text-[8.5pt] text-slate-600 mt-1 font-sans">
                  Application Loi N° 21-2019 du 13 juin 2019
                  <br />
                  Bâtiment de la Préfecture (RDC)
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-300 text-center">
              <h2 className="text-xl font-bold font-cinzel uppercase tracking-wider text-black">
                RÉPERTOIRE STATISTIQUE DÉPARTEMENTAL DES ÉTABLISSEMENTS DE LOISIRS
              </h2>
              <p className="text-xs italic text-slate-700 mt-1">
                Recensement officiel in situ • Périmètre : {printScope === 'total' ? 'Ensemble du Département de Pointe-Noire' : 'Sélection filtrée du Service Statistique'} • Données Administratives Pures (Sans Informations Financières)
              </p>
            </div>
          </div>

          {/* Statistical Summary Box */}
          {includeStatsSummaryInPrint && (
            <div className="mb-5 p-3 rounded-lg border border-black bg-slate-50 text-[9.5pt]">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="font-bold block uppercase text-[8pt] text-slate-600">Total Établissements</span>
                  <span className="text-base font-bold font-cinzel">{establishmentsToPrint.length}</span>
                </div>
                <div>
                  <span className="font-bold block uppercase text-[8pt] text-slate-600">Arrondissements</span>
                  <span className="text-base font-bold font-cinzel">6 / 6 Circonscriptions</span>
                </div>
                <div>
                  <span className="font-bold block uppercase text-[8pt] text-slate-600">Superficie Totale</span>
                  <span className="text-base font-bold font-cinzel">
                    {establishmentsToPrint.reduce((acc, e) => acc + (e.surfaceM2 || 0), 0).toLocaleString('fr-FR')} m²
                  </span>
                </div>
                <div>
                  <span className="font-bold block uppercase text-[8pt] text-slate-600">Décibels Moyens</span>
                  <span className="text-base font-bold font-cinzel">
                    {stats.avgDb} dB(A) ({stats.limiteurRate}% avec limiteur)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Table Data */}
          <table className="w-full text-left text-[8pt] border-collapse border border-black">
            <thead>
              <tr className="bg-slate-200 border-b border-black text-black font-bold">
                <th className="p-1.5 border border-black text-center w-8">N°</th>
                {printColumns.codeDossier && <th className="p-1.5 border border-black">Code Dossier</th>}
                {printColumns.nomCommercial && <th className="p-1.5 border border-black">Établissement</th>}
                {printColumns.promoteurNom && <th className="p-1.5 border border-black">Gérant / Promoteur</th>}
                {printColumns.arrondissement && <th className="p-1.5 border border-black">Arrondissement</th>}
                {printColumns.quartier && <th className="p-1.5 border border-black">Quartier</th>}
                {printColumns.adresseExacte && <th className="p-1.5 border border-black">Adresse</th>}
                {printColumns.categorie && <th className="p-1.5 border border-black">Catégorie</th>}
                {printColumns.surfaceM2 && <th className="p-1.5 border border-black text-right">Surface</th>}
                {printColumns.niveauDecibels && <th className="p-1.5 border border-black text-center">dB(A)</th>}
                {printColumns.limiteurInstalle && <th className="p-1.5 border border-black text-center">Limiteur</th>}
                {printColumns.statut && <th className="p-1.5 border border-black text-center">Statut Admin</th>}
                {printColumns.telephone && <th className="p-1.5 border border-black">Téléphone</th>}
              </tr>
            </thead>
            <tbody>
              {establishmentsToPrint.map((est, idx) => (
                <tr key={est.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="p-1 border border-black text-center font-mono">{idx + 1}</td>
                  {printColumns.codeDossier && <td className="p-1 border border-black font-mono text-[7.5pt]">{est.codeDossier || '—'}</td>}
                  {printColumns.nomCommercial && <td className="p-1 border border-black font-bold">{est.nomCommercial}</td>}
                  {printColumns.promoteurNom && <td className="p-1 border border-black">{est.promoteurNom || '—'}</td>}
                  {printColumns.arrondissement && <td className="p-1 border border-black">{est.arrondissement}</td>}
                  {printColumns.quartier && <td className="p-1 border border-black">{est.quartier || '—'}</td>}
                  {printColumns.adresseExacte && <td className="p-1 border border-black">{est.adresseExacte || '—'}</td>}
                  {printColumns.categorie && <td className="p-1 border border-black">{est.categorie || '—'}</td>}
                  {printColumns.surfaceM2 && <td className="p-1 border border-black text-right font-mono">{est.surfaceM2 || 0} m²</td>}
                  {printColumns.niveauDecibels && <td className="p-1 border border-black text-center font-mono">{est.niveauDecibelsMoyen || 0}</td>}
                  {printColumns.limiteurInstalle && <td className="p-1 border border-black text-center">{est.limiteurInstalle ? 'OUI' : 'NON'}</td>}
                  {printColumns.statut && (
                    <td className="p-1 border border-black text-center font-semibold text-[7.5pt]">
                      {STATUT_LABELS[est.statut]?.printBadge || est.statut}
                    </td>
                  )}
                  {printColumns.telephone && <td className="p-1 border border-black font-mono text-[7.5pt]">{est.promoteurTelephone || '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-black text-[9pt] leading-snug">
            <p className="text-center italic mb-4">
              « Le présent répertoire statistique certifie l&apos;état officiel du parc des établissements de loisirs de Pointe-Noire conformément aux recensements et contrôles in situ menés par la Direction Départementale. »
            </p>

            <div className="grid grid-cols-3 gap-6 text-center mt-6">
              <div>
                <p className="font-bold underline uppercase">Le Chef de Brigade SAA</p>
                <p className="text-[8pt] text-slate-600 mt-0.5">Contrôles & Recensement In Situ</p>
                <div className="h-14 flex items-center justify-center italic text-slate-400 text-[8pt]">
                  (Paraphe & Visa)
                </div>
                <p className="font-semibold text-[8.5pt]">Gildas AMBETOS</p>
              </div>

              <div>
                <p className="font-bold underline uppercase">Le Chef de Service Statistique</p>
                <p className="text-[8pt] text-slate-600 mt-0.5">SSEP / DDL-PN</p>
                <div className="h-14 flex items-center justify-center italic text-slate-400 text-[8pt]">
                  (Sceau Officiel SSEP)
                </div>
                <p className="font-semibold text-[8.5pt]">Service Statistique & Études</p>
              </div>

              <div>
                <p className="font-bold underline uppercase">Le Directeur Départemental</p>
                <p className="text-[8pt] text-slate-600 mt-0.5">Des Loisirs de Pointe-Noire</p>
                <div className="h-14 flex items-center justify-center italic text-slate-400 text-[8pt]">
                  (Signature & Sceau Républicain)
                </div>
                <p className="font-bold text-[8.5pt]">Jean Richard NTSEKE NGOUAKA</p>
              </div>
            </div>

            <div className="mt-8 text-center text-[7.5pt] text-slate-500 font-sans border-t border-slate-300 pt-2">
              Direction Départementale des Loisirs de Pointe-Noire (DDL-PN) • Bâtiment de la Préfecture, Centre-Ville, face au Trésor Public (RDC) • Téléphone : +242 06 186 4275
            </div>
          </div>
        </div>
      </div>

      {/* 10. PRINT TEMPLATE: FICHE INDIVIDUELLE A4 */}
      {inspectModalEst && (
        <div id="ddl-print-individual-establishment" className="hidden">
          <div className="p-10 bg-white text-black font-garamond text-slate-950 page-a4" style={{ minHeight: '100%', width: '100%' }}>
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
              <div className="w-[60%] text-center text-[10pt] leading-tight flex flex-col items-center">
                <p className="font-bold uppercase">RÉPUBLIQUE DU CONGO</p>
                <p className="text-[8.5pt] italic">Unité - Travail - Progrès</p>
                <p className="my-0.5">———</p>
                <p className="font-bold uppercase text-[9pt]">
                  MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DU TOURISME
                </p>
                <p className="my-0.5">———</p>
                <p className="font-bold uppercase text-[9pt]">DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</p>
                <p className="font-bold text-[8.5pt] text-slate-700 uppercase">SERVICE STATISTIQUE, ÉTUDES ET PLANIFICATION (SSEP)</p>
              </div>
              <div className="w-[35%] text-right text-[9.5pt]">
                <p className="italic">Pointe-Noire, le {new Date().toLocaleDateString('fr-FR')}</p>
                <p className="font-bold font-mono text-[9pt] mt-2">DOSSIER : {inspectModalEst.codeDossier || 'DDL-PN-2026'}</p>
                <p className="text-[8pt] text-slate-600 mt-1">Loi N° 21-2019 du 13 juin 2019</p>
              </div>
            </div>

            <div className="text-center my-6">
              <h2 className="text-2xl font-bold font-cinzel uppercase tracking-wider text-black">
                FICHE STATISTIQUE D&apos;IDENTIFICATION D&apos;ÉTABLISSEMENT
              </h2>
              <p className="text-xs italic text-slate-600 mt-1">
                Fiche technique d&apos;exploitation et de salubrité sonore (Exclusivité Données Non Financières)
              </p>
            </div>

            <div className="space-y-6 text-[11pt] leading-relaxed">
              <div className="border border-black p-4 rounded-lg bg-slate-50">
                <h3 className="font-bold uppercase text-[10pt] mb-2 border-b border-black pb-1">
                  1. Identification & Responsabilité d&apos;Exploitation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Nom Commercial :</strong> {inspectModalEst.nomCommercial}</div>
                  <div><strong>Gérant / Promoteur :</strong> {inspectModalEst.promoteurNom || 'Non renseigné'}</div>
                  <div><strong>Catégorie Récréative :</strong> {inspectModalEst.categorie}</div>
                  <div><strong>Téléphone de Contact :</strong> {inspectModalEst.promoteurTelephone || '—'}</div>
                </div>
              </div>

              <div className="border border-black p-4 rounded-lg bg-slate-50">
                <h3 className="font-bold uppercase text-[10pt] mb-2 border-b border-black pb-1">
                  2. Localisation Géographique & Implantation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Arrondissement :</strong> {inspectModalEst.arrondissement}</div>
                  <div><strong>Quartier :</strong> {inspectModalEst.quartier || '—'}</div>
                  <div className="col-span-2"><strong>Adresse Précise :</strong> {inspectModalEst.adresseExacte}</div>
                </div>
              </div>

              <div className="border border-black p-4 rounded-lg bg-slate-50">
                <h3 className="font-bold uppercase text-[10pt] mb-2 border-b border-black pb-1">
                  3. Caractéristiques Techniques & Salubrité Acoustique
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 border border-slate-300 rounded bg-white">
                    <span className="block text-[9pt] uppercase font-bold text-slate-600">Superficie Déclarée</span>
                    <span className="text-xl font-bold font-mono">{inspectModalEst.surfaceM2 || 0} m²</span>
                  </div>
                  <div className="p-3 border border-slate-300 rounded bg-white">
                    <span className="block text-[9pt] uppercase font-bold text-slate-600">Niveau Sonore Sonomètre</span>
                    <span className="text-xl font-bold font-mono">{inspectModalEst.niveauDecibelsMoyen || 0} dB(A)</span>
                  </div>
                  <div className="p-3 border border-slate-300 rounded bg-white">
                    <span className="block text-[9pt] uppercase font-bold text-slate-600">Limiteur Acoustique</span>
                    <span className="text-xl font-bold font-mono">{inspectModalEst.limiteurInstalle ? 'INSTALLÉ' : 'NON ÉQUIPÉ'}</span>
                  </div>
                </div>
              </div>

              <div className="border border-black p-4 rounded-lg bg-slate-50">
                <h3 className="font-bold uppercase text-[10pt] mb-2 border-b border-black pb-1">
                  4. Situation Administrative & Recensement In Situ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Statut Administratif :</strong> {STATUT_LABELS[inspectModalEst.statut]?.label || inspectModalEst.statut}</div>
                  <div><strong>Régime Juridique :</strong> {inspectModalEst.regimeFiscal === 'formel_proportionnel' ? 'Formel Proportionnel' : 'Informel Forfaitaire SAA'}</div>
                  <div><strong>Date d&apos;Enregistrement :</strong> {inspectModalEst.dateRecensement || '—'}</div>
                  <div><strong>Inspecteur Responsable :</strong> {inspectModalEst.agentAssigneNom || inspectModalEst.recensePar || 'Brigade SAA'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-center mt-12 pt-6 border-t-2 border-black text-[10pt]">
              <div>
                <p className="font-bold uppercase underline">Le Chef de Service Statistique</p>
                <div className="h-16 flex items-center justify-center italic text-slate-400 text-[9pt]">
                  (Sceau officiel SSEP)
                </div>
                <p className="font-semibold">Service Statistique, Études et Planification</p>
              </div>

              <div>
                <p className="font-bold uppercase underline">Pour le Directeur Départemental</p>
                <div className="h-16 flex items-center justify-center italic text-slate-400 text-[9pt]">
                  (Visa & Signature)
                </div>
                <p className="font-bold">Jean Richard NTSEKE NGOUAKA</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. PRINT TEMPLATE: NOTE DE SYNTHESE A4 */}
      <div id="ddl-print-statistical-summary-note" className="hidden">
        <div className="p-10 bg-white text-black font-garamond text-slate-950 page-a4" style={{ minHeight: '100%', width: '100%' }}>
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div className="w-[60%] text-center text-[10pt] leading-tight flex flex-col items-center">
              <p className="font-bold uppercase">RÉPUBLIQUE DU CONGO</p>
              <p className="text-[8.5pt] italic">Unité - Travail - Progrès</p>
              <p className="my-0.5">———</p>
              <p className="font-bold uppercase text-[9pt]">
                MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DU TOURISME
              </p>
              <p className="my-0.5">———</p>
              <p className="font-bold uppercase text-[9pt]">DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</p>
              <p className="font-bold text-[8.5pt] text-slate-700 uppercase">SERVICE STATISTIQUE, ÉTUDES ET PLANIFICATION (SSEP)</p>
            </div>
            <div className="w-[35%] text-right text-[9.5pt]">
              <p className="italic">Pointe-Noire, le {new Date().toLocaleDateString('fr-FR')}</p>
              <p className="font-bold font-mono text-[9pt] mt-2">NOTE N° {new Date().getFullYear()}/DDL-PN/SSEP/001</p>
              <p className="text-[8pt] text-slate-600 mt-1">Diffusion Officielle</p>
            </div>
          </div>

          <div className="text-center my-6">
            <h2 className="text-2xl font-bold font-cinzel uppercase tracking-wider text-black">
              NOTE DE SYNTHÈSE STATISTIQUE DÉPARTEMENTALE
            </h2>
            <p className="text-xs italic text-slate-600 mt-1">
              Bilan démographique, spatial et acoustique du parc des loisirs de Pointe-Noire
            </p>
          </div>

          <div className="space-y-6 text-[11pt] leading-relaxed text-justify">
            <div className="p-4 rounded border border-black bg-slate-50 text-[10pt]">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <strong className="block text-[8pt] uppercase">Établissements</strong>
                  <span className="text-base font-bold font-cinzel">{stats.totalCount}</span>
                </div>
                <div>
                  <strong className="block text-[8pt] uppercase">Superficie</strong>
                  <span className="text-base font-bold font-cinzel">{stats.totalSurface.toLocaleString('fr-FR')} m²</span>
                </div>
                <div>
                  <strong className="block text-[8pt] uppercase">Moyenne dB(A)</strong>
                  <span className="text-base font-bold font-cinzel">{stats.avgDb} dB</span>
                </div>
                <div>
                  <strong className="block text-[8pt] uppercase">Limiteurs</strong>
                  <span className="text-base font-bold font-cinzel">{stats.limiteurRate}%</span>
                </div>
              </div>
            </div>

            <p>
              <strong>1. Analyse de l&apos;implantation urbaine :</strong> Le parc des établissements de loisirs de la ville de Pointe-Noire compte à ce jour <strong>{stats.totalCount} établissements recensés</strong> sur les 6 arrondissements départementaux. Les arrondissements de <strong>Lumumba</strong> ({stats.byArrondissement.Lumumba} ét.) et <strong>Tié-Tié</strong> ({stats.byArrondissement['Tié-Tié']} ét.) concentrent à eux seuls la majorité des activités récréatives nocturnes et diurnes.
            </p>

            <p>
              <strong>2. Diagnostic acoustique et salubrité publique :</strong> La moyenne des relevés sonométriques in situ s&apos;élève à <strong>{stats.avgDb} dB(A)</strong>. Le Service Statistique note que <strong>{stats.soundDistribution.critique} établissements</strong> franchissent régulièrement le seuil d&apos;alerte de 85 dB(A). À cet égard, le déploiement des limiteurs de son obligatoires progresse pour atteindre un taux de <strong>{stats.limiteurRate}%</strong>, marquant une amélioration sensible de la tranquillité du voisinage.
            </p>

            <p>
              <strong>3. Orientations administratives :</strong> Le Service Statistique recommande d&apos;intensifier les descentes de terrain dans les zones périurbaines en forte expansion (Mongo-Mpoukou et Ngoyo) et d&apos;accélérer la délivrance des attestations provisoires de régularisation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center mt-12 pt-6 border-t-2 border-black text-[10pt]">
            <div>
              <p className="font-bold uppercase underline">Le Chef de Service Statistique</p>
              <div className="h-16 flex items-center justify-center italic text-slate-400 text-[9pt]">
                (Sceau officiel SSEP)
              </div>
              <p className="font-semibold">Service Statistique & Planification</p>
            </div>

            <div>
              <p className="font-bold uppercase underline">Le Directeur Départemental des Loisirs</p>
              <div className="h-16 flex items-center justify-center italic text-slate-400 text-[9pt]">
                (Signature & Sceau Républicain)
              </div>
              <p className="font-bold">Jean Richard NTSEKE NGOUAKA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StatisticalServiceModule;
