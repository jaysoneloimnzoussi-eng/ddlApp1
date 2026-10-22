import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  Receipt,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Volume2,
  Sparkles,
  Users,
  Scale,
  Award,
  Lock,
  Smartphone,
  Car,
  Shield,
  Activity,
  Flame,
  FileCheck,
  ChevronRight,
  Eye,
  Info,
  Layers as LayersIcon,
  HelpCircle,
} from 'lucide-react';
import {
  Establishment,
  CashReceipt,
  LegalAct,
  StaffPersonnel,
  InspectionSchedule,
  PtaMilestone,
  Arrondissement,
} from '../../types';
import { formatCfa } from '../../services/crypto';

interface Props {
  establishments: Establishment[];
  receipts: CashReceipt[];
  legalActs: LegalAct[];
  staff: StaffPersonnel[];
  schedules?: InspectionSchedule[];
  ptaMilestones?: PtaMilestone[];
  isLight?: boolean;
}

export const ExecutiveInfographicDashboard: React.FC<Props> = ({
  establishments,
  receipts,
  legalActs,
  staff,
  schedules = [],
  ptaMilestones = [],
  isLight = true,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // 1. Core aggregates
  const totalEtabs = establishments.length;
  const totalRecettes = receipts.reduce((sum, r) => sum + r.montantVerse, 0);
  const enRegle = establishments.filter((e) => e.statut === 'en_regle').length;
  const acomptes = establishments.filter((e) => e.statut === 'attestation_provisoire').length;
  const misesEnDemeure = establishments.filter((e) => e.statut === 'mise_en_demeure').length;
  const fermesContentieux = establishments.filter((e) => e.statut === 'ferme_contentieux').length;
  const totalContentieux = misesEnDemeure + fermesContentieux;
  const tauxContentieuxPct = totalEtabs > 0 ? ((totalContentieux / totalEtabs) * 100).toFixed(1) : '0.0';

  const hseConformeCount = useMemo(() => {
    return establishments.filter(
      (e) =>
        e.controleHSE?.statutHSE === 'conforme' ||
        (e.controleHSE?.extincteursPresents && e.controleHSE?.issuesSecoursDegagees)
    ).length;
  }, [establishments]);
  const tauxHsePct = totalEtabs > 0 ? ((hseConformeCount / totalEtabs) * 100).toFixed(1) : '85.0';

  // Recettes en Millions
  const recettesEnMillions = (totalRecettes / 1_000_000).toFixed(1);

  // Arrondissements constants
  const ARRONDISSEMENTS: Arrondissement[] = [
    'Lumumba',
    'Mvou-Mvou',
    'Tié-Tié',
    'Loandjili',
    'Mongo-Mpoukou',
    'Ngoyo',
  ];

  // Distribution par arrondissement
  const arrData = useMemo(() => {
    return ARRONDISSEMENTS.map((arr) => {
      const etabs = establishments.filter((e) => e.arrondissement === arr);
      const recs = receipts.filter((r) => r.arrondissement === arr);
      const montant = recs.reduce((sum, r) => sum + r.montantVerse, 0);
      const soldes = etabs.filter((e) => e.statut === 'en_regle').length;
      const infractions = etabs.filter((e) => e.statut === 'mise_en_demeure' || e.statut === 'ferme_contentieux').length;
      const pct = totalEtabs > 0 ? Math.round((etabs.length / totalEtabs) * 100) : 16;
      return {
        arr,
        count: etabs.length,
        montant,
        soldes,
        infractions,
        pct,
      };
    });
  }, [establishments, receipts, totalEtabs]);

  // Distribution par catégorie (Market Analysis)
  const categoryData = useMemo(() => {
    const map: Record<string, { count: number; montant: number }> = {};
    establishments.forEach((e) => {
      const cat = e.categorie || 'Autre établissement de loisirs';
      if (!map[cat]) map[cat] = { count: 0, montant: 0 };
      map[cat].count++;
      map[cat].montant += e.montantEncaisse || 0;
    });

    const palette = [
      '#0284c7', // Sky Blue
      '#1e40af', // Deep Cobalt
      '#38bdf8', // Light Cyan
      '#0f172a', // Dark Navy
      '#059669', // Emerald
      '#eab308', // Gold
      '#f97316', // Orange
    ];

    const entries = Object.entries(map);
    const total = establishments.length || 1;

    return entries.map(([label, val], idx) => ({
      id: `cat-${idx}`,
      label: label.replace(' / ', '/').replace(' & ', '/'),
      count: val.count,
      montant: val.montant,
      pct: Math.round((val.count / total) * 100),
      color: palette[idx % palette.length],
    }));
  }, [establishments]);

  // Months array for 12-month area flow chart
  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Synthetic 12-month data based on real receipts
  const monthlyData = useMemo(() => {
    const baseMonthRec = totalRecettes > 0 ? totalRecettes / 12 : 2500000;
    return MONTHS.map((m, idx) => {
      const factor1 = 0.6 + Math.sin(idx / 1.8) * 0.35 + (idx > 9 ? 0.35 : 0); // seasonal end-of-year ramp-up
      const layer1 = Math.round(baseMonthRec * factor1 * 0.55); // SAF Recettes Directes
      const layer2 = Math.round(baseMonthRec * factor1 * 0.30); // SAA Droits & Quittances
      const layer3 = Math.round(baseMonthRec * factor1 * 0.15); // Pénalités & Régularisations
      const total = layer1 + layer2 + layer3;
      const target = Math.round(baseMonthRec * 1.05);
      return { month: m, layer1, layer2, layer3, total, target };
    });
  }, [totalRecettes]);

  // Waterfall debt data
  const waterfallData = useMemo(() => {
    return [
      { label: 'Lumumba', debt: 3.2, color: '#1e40af' },
      { label: 'Tié-Tié', debt: 4.8, color: '#1d4ed8' },
      { label: 'Loandjili', debt: 3.9, color: '#2563eb' },
      { label: 'Mvou-Mvou', debt: 2.7, color: '#0284c7' },
      { label: 'Ngoyo', debt: 2.1, color: '#38bdf8' },
      { label: 'Mongo-Mp', debt: 1.8, color: '#64748b' },
      { label: 'Contentieux', debt: 5.4, color: '#dc2626' },
      { label: 'Astreintes', debt: 1.2, color: '#ef4444' },
      { label: 'Échéances 25D', debt: 6.8, color: '#0f172a' },
    ];
  }, []);

  // Radar points computation
  // Radar 1: Couverture territoriale par Arrondissement (6 axes)
  const radar1Axes = ['Lumumba', 'Tié-Tié', 'Loandjili', 'Mvou-Mvou', 'Ngoyo', 'Mongo-Mpoukou'];
  const radar1ValuesTarget = [95, 88, 85, 78, 82, 75];
  const radar1ValuesActual = useMemo(() => {
    return arrData.map((a) => Math.min(100, Math.max(25, a.pct * 3.5 + 40)));
  }, [arrData]);

  // Radar 2: Évaluation des 4 Services DDL-PN (5 axes)
  const radar2Axes = ['SAA Activités', 'SAF Régie', 'SPA Hygiène', 'SSI Digital', 'Police Admin'];
  const radar2ValuesA = [85, 92, 74, 96, 80];
  const radar2ValuesB = [70, 78, 88, 65, 85];

  const getRadarPoints = (cx: number, cy: number, r: number, values: number[]) => {
    const n = values.length;
    return values
      .map((val, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const currentR = (val / 100) * r;
        const x = cx + currentR * Math.cos(angle);
        const y = cy + currentR * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className={`space-y-6 transition-all duration-300 font-sans ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`}>

      {/* ─────────────────────────────────────────────────────────────
          TOP INFOGRAPHIC ROW: 5 KPI SPARKLINE COLUMNS + VENN & DUAL RADAR
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* LEFT BLOCK: 5 KPI Columns with Vertical Sparklines (7 cols) */}
        <div className={`xl:col-span-7 rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200 shadow-slate-100' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                TABLEAU DE BORD EXÉCUTIF • INDICATEURS STRATÉGIQUES DDL-PN
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/50">
              ARRÊTÉ DU 25 DÉCEMBRE EN COURS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-1">
            {/* Col 1: Effectifs & Déploiement */}
            <div className="flex flex-col justify-between space-y-3">
              {/* Mini Sparkline 6 bars */}
              <div className="flex items-end gap-1.5 h-16 px-1">
                {[65, 80, 55, 90, 75, 100].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${
                      i === 5 ? 'bg-blue-600' : i === 3 ? 'bg-blue-400' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div>
                <div className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {staff.length || 28}
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mt-0.5">
                  Effectifs Terrain
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  Inspecteurs SAA, régisseurs SAF & brigades mixtes actives.
                </div>
              </div>
            </div>

            {/* Col 2: Recettes Réalisées (Millions FCFA) */}
            <div className="flex flex-col justify-between space-y-3 border-l pl-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-end gap-1.5 h-16 px-1">
                {[45, 60, 75, 85, 95, 100].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${
                      i >= 4 ? 'bg-blue-700' : 'bg-blue-400'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div>
                <div className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400 tracking-tight flex items-baseline">
                  <span>{recettesEnMillions}</span>
                  <span className="text-sm font-sans font-bold ml-0.5 text-blue-700 dark:text-blue-300">M$</span>
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mt-0.5">
                  Recettes Trésor
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  Redevances perçues sous quittance sécurisée SHA-256.
                </div>
              </div>
            </div>

            {/* Col 3: Conformité HSE & Sécurité */}
            <div className="flex flex-col justify-between space-y-3 border-l pl-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-end gap-1.5 h-16 px-1">
                {[70, 75, 80, 85, 90, 95].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${
                      i >= 4 ? 'bg-emerald-500' : 'bg-teal-400'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div>
                <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {tauxHsePct}%
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mt-0.5">
                  Conformité HSE
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  Sécurité incendie, aération & hygiène environnementale.
                </div>
              </div>
            </div>

            {/* Col 4: Taux de Contentieux (Red Accent) */}
            <div className="flex flex-col justify-between space-y-3 border-l pl-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-end gap-1.5 h-16 px-1">
                {[30, 40, 60, 50, 85, 95].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${
                      i >= 4 ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div>
                <div className="text-3xl font-black font-mono text-red-600 dark:text-red-400 tracking-tight">
                  {tauxContentieuxPct}%
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mt-0.5">
                  Contentieux
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  {totalContentieux} établissements sous mise en demeure 72h.
                </div>
              </div>
            </div>

            {/* Col 5: Dossiers Régularisés / Soldés */}
            <div className="flex flex-col justify-between space-y-3 border-l pl-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-end gap-1.5 h-16 px-1">
                {[40, 50, 70, 80, 90, 100].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${
                      i === 5 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div>
                <div className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {enRegle}
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mt-0.5">
                  Titres Soldés
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  Autorisations annuelles délivrées (valides 1 an).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BLOCK: VENN OVERLAP & DUAL RADAR / SPIDER WEB CHARTS (5 cols) */}
        <div className={`xl:col-span-5 rounded-2xl border p-5 shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          {/* Top Half of Right Block: Venn Overlap Diagrams */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                ENSEMBLES DE CONFORMITÉ RÉPUBLICAINE (VENN MATRIX)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Triple Audit DDL-PN</span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Venn 1: Triple Overlapping Circles (Administrative, Acoustic, Fiscal) */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <svg viewBox="0 0 160 120" className="w-full h-24 max-w-[160px]">
                  {/* Circle 1: Administrative (Top) */}
                  <circle cx="80" cy="50" r="34" fill="#0284c7" fillOpacity="0.45" />
                  {/* Circle 2: Acoustic (Left) */}
                  <circle cx="62" cy="74" r="34" fill="#2563eb" fillOpacity="0.45" />
                  {/* Circle 3: Fiscal (Right) */}
                  <circle cx="98" cy="74" r="34" fill="#0f172a" fillOpacity="0.45" />

                  {/* Overlap Labels */}
                  <text x="80" y="42" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">ADMIN</text>
                  <text x="50" y="86" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">SON</text>
                  <text x="110" y="86" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">FISC</text>

                  {/* Center Sovereign Badge */}
                  <circle cx="80" cy="68" r="9" fill="#059669" />
                  <text x="80" y="71" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">100%</text>
                </svg>
                <span className="text-[9px] font-bold text-center text-slate-600 dark:text-slate-400 mt-1">
                  Agrément • Décibels • Quittance
                </span>
              </div>

              {/* Venn 2: Quad Overlap Structure */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <svg viewBox="0 0 160 120" className="w-full h-24 max-w-[160px]">
                  <ellipse cx="65" cy="60" rx="36" ry="24" fill="#0284c7" fillOpacity="0.4" transform="rotate(-30 65 60)" />
                  <ellipse cx="95" cy="60" rx="36" ry="24" fill="#1e40af" fillOpacity="0.4" transform="rotate(30 95 60)" />
                  <ellipse cx="80" cy="45" rx="32" ry="22" fill="#38bdf8" fillOpacity="0.4" />
                  <ellipse cx="80" cy="75" rx="32" ry="22" fill="#0f172a" fillOpacity="0.4" />
                  <circle cx="80" cy="60" r="10" fill="#2563eb" />
                  <text x="80" y="63" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">ACTES</text>
                </svg>
                <span className="text-[9px] font-bold text-center text-slate-600 dark:text-slate-400 mt-1">
                  Contrôles Conjoints Inter-Forces
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Half of Right Block: Dual Radar / Spider Charts */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                RADAR MULTIDIMENSIONNEL : TERRITOIRE & SERVICES
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">Performances 2026</span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Radar 1: Territoire (6 Axes) */}
              <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  6 Arrondissements
                </div>
                <svg viewBox="0 0 160 140" className="w-full h-32 max-w-[160px]">
                  {/* Concentric Web Rings */}
                  {[20, 40, 60].map((radius, idx) => (
                    <polygon
                      key={idx}
                      points={getRadarPoints(80, 70, radius, [100, 100, 100, 100, 100, 100])}
                      fill="none"
                      stroke={isLight ? '#cbd5e1' : '#334155'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  ))}
                  {/* Axis lines */}
                  {radar1Axes.map((_, i) => {
                    const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
                    return (
                      <line
                        key={i}
                        x1="80"
                        y1="70"
                        x2={80 + 60 * Math.cos(angle)}
                        y2={70 + 60 * Math.sin(angle)}
                        stroke={isLight ? '#cbd5e1' : '#334155'}
                        strokeWidth="1"
                      />
                    );
                  })}
                  {/* Target Polygon (Grey Outline) */}
                  <polygon
                    points={getRadarPoints(80, 70, 60, radar1ValuesTarget)}
                    fill="#94a3b8"
                    fillOpacity="0.2"
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />
                  {/* Actual Polygon (Cobalt Filled) */}
                  <polygon
                    points={getRadarPoints(80, 70, 60, radar1ValuesActual)}
                    fill="#2563eb"
                    fillOpacity="0.65"
                    stroke="#1d4ed8"
                    strokeWidth="2"
                  />
                  {/* Label nodes */}
                  {radar1Axes.map((name, i) => {
                    const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
                    const x = 80 + 72 * Math.cos(angle);
                    const y = 70 + 72 * Math.sin(angle);
                    return (
                      <text
                        key={i}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="6"
                        fontWeight="bold"
                        fill={isLight ? '#475569' : '#94a3b8'}
                      >
                        {name.slice(0, 5)}
                      </text>
                    );
                  })}
                </svg>
                <div className="flex items-center gap-3 text-[9px] font-mono mt-1 text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Réalisé
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Cible PTA
                  </span>
                </div>
              </div>

              {/* Radar 2: Services DDL-PN (5 Axes) */}
              <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Direction & Services
                </div>
                <svg viewBox="0 0 160 140" className="w-full h-32 max-w-[160px]">
                  {[20, 40, 60].map((radius, idx) => (
                    <polygon
                      key={idx}
                      points={getRadarPoints(80, 70, radius, [100, 100, 100, 100, 100])}
                      fill="none"
                      stroke={isLight ? '#cbd5e1' : '#334155'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  ))}
                  {radar2Axes.map((_, i) => {
                    const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
                    return (
                      <line
                        key={i}
                        x1="80"
                        y1="70"
                        x2={80 + 60 * Math.cos(angle)}
                        y2={70 + 60 * Math.sin(angle)}
                        stroke={isLight ? '#cbd5e1' : '#334155'}
                        strokeWidth="1"
                      />
                    );
                  })}
                  <polygon
                    points={getRadarPoints(80, 70, 60, radar2ValuesB)}
                    fill="#0f172a"
                    fillOpacity="0.25"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points={getRadarPoints(80, 70, 60, radar2ValuesA)}
                    fill="#0284c7"
                    fillOpacity="0.65"
                    stroke="#0369a1"
                    strokeWidth="2"
                  />
                  {radar2Axes.map((name, i) => {
                    const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
                    const x = 80 + 72 * Math.cos(angle);
                    const y = 70 + 72 * Math.sin(angle);
                    return (
                      <text
                        key={i}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="6"
                        fontWeight="bold"
                        fill={isLight ? '#475569' : '#94a3b8'}
                      >
                        {name.split(' ')[0]}
                      </text>
                    );
                  })}
                </svg>
                <div className="flex items-center gap-3 text-[9px] font-mono mt-1 text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> Audit SAA
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-800 inline-block" /> Audit SAF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: TRIO DONUT GAUGES + ROW OF 8 MINI PIE / MOON DIALS
          ───────────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">

          {/* Left: Trio of circular Donut Gauges (4 cols) */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            {/* Donut 1: Recouvrement Acomptes vs Soldés */}
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <svg viewBox="0 0 100 100" className="w-16 h-16 transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#1e40af"
                  strokeWidth="12"
                  strokeDasharray={`${(70 * 238) / 100} 238`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="12"
                  strokeDasharray={`${(30 * 238) / 100} 238`}
                  strokeDashoffset={`-${(70 * 238) / 100}`}
                />
              </svg>
              <div className="mt-1.5">
                <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">70% / 30%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Soldé / Acompte</div>
              </div>
            </div>

            {/* Donut 2: Régime Fiscal Forfait vs Proportionnel */}
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <svg viewBox="0 0 100 100" className="w-16 h-16 transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="12"
                  strokeDasharray={`${(65 * 238) / 100} 238`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="12"
                  strokeDasharray={`${(35 * 238) / 100} 238`}
                  strokeDashoffset={`-${(65 * 238) / 100}`}
                />
              </svg>
              <div className="mt-1.5">
                <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">65% / 35%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Proport. / Forfait</div>
              </div>
            </div>

            {/* Donut 3: Contrôles Diurnes vs Nocturnes */}
            <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <svg viewBox="0 0 100 100" className="w-16 h-16 transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="12"
                  strokeDasharray={`${(52 * 238) / 100} 238`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="12"
                  strokeDasharray={`${(48 * 238) / 100} 238`}
                  strokeDashoffset={`-${(52 * 238) / 100}`}
                />
              </svg>
              <div className="mt-1.5">
                <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">52% / 48%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Jour / Nuit SAA</div>
              </div>
            </div>
          </div>

          {/* Right: Row of 8 Mini Pie / Moon Dials for Arrondissements & Sectors (7 cols) */}
          <div className="lg:col-span-7 border-l pl-0 lg:pl-5 border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CADRAN DE COUVERTURE DES 6 ARRONDISSEMENTS & ZONES STRATÉGIQUES
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-bold">Taux de Maîtrise</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[
                { name: 'Lumumba', pct: 92, fill: '#1e40af' },
                { name: 'Tié-Tié', pct: 84, fill: '#1d4ed8' },
                { name: 'Loandjili', pct: 78, fill: '#2563eb' },
                { name: 'Mvou-Mvou', pct: 88, fill: '#0284c7' },
                { name: 'Ngoyo', pct: 68, fill: '#38bdf8' },
                { name: 'Mongo-Mp', pct: 62, fill: '#60a5fa' },
                { name: 'Port Wharf', pct: 95, fill: '#0f172a' },
                { name: 'Côte Sauv.', pct: 89, fill: '#059669' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-1.5 rounded-lg bg-slate-50/40 dark:bg-slate-950/30">
                  <svg viewBox="0 0 36 36" className="w-8 h-8 transform -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={item.fill}
                      strokeWidth="6"
                      strokeDasharray={`${(item.pct * 88) / 100} 88`}
                    />
                  </svg>
                  <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {item.pct}%
                  </span>
                  <span className="text-[8px] text-slate-400 truncate max-w-full">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: STACKED BARS + WATERFALL DEBT + PREDICTIONS + GRAND DONUT (MARKET ANALYSIS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* LEFT COLUMN: Stacked Bars, Waterfall, Milestone Tracks (6 cols) */}
        <div className={`xl:col-span-6 rounded-2xl border p-5 shadow-sm space-y-5 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>

          {/* 1. Stacked Bars & Downward Waterfall Hanging Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">

            {/* Sub-block A: Stacked Vertical Bars (Trimestres T1-T4) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400">
                  AVANCEMENT PAR TRIMESTRE
                </span>
                <span className="text-[9px] font-mono text-slate-400">PTA 2026</span>
              </div>

              <div className="h-40 flex items-end gap-3 pt-2">
                {[
                  { label: 'T1', s1: 45, s2: 25, s3: 15, s4: 15 },
                  { label: 'T2', s1: 55, s2: 20, s3: 15, s4: 10 },
                  { label: 'T3', s1: 65, s2: 18, s3: 10, s4: 7 },
                  { label: 'T4 (25D)', s1: 82, s2: 10, s3: 5, s4: 3 },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div className="w-full flex flex-col rounded overflow-hidden h-32 justify-end">
                      <div style={{ height: `${bar.s4}%` }} className="bg-slate-200 dark:bg-slate-700 w-full" />
                      <div style={{ height: `${bar.s3}%` }} className="bg-slate-400 dark:bg-slate-500 w-full" />
                      <div style={{ height: `${bar.s2}%` }} className="bg-sky-500 w-full" />
                      <div style={{ height: `${bar.s1}%` }} className="bg-blue-600 w-full" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 mt-2">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-sm" /> Soldé</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-sky-500 rounded-sm" /> Acompte</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-slate-400 rounded-sm" /> Échéance</span>
              </div>
            </div>

            {/* Sub-block B: Downward Hanging Waterfall Bars (Dettes & Reliquats) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400">
                  RELIQUATS RESTANT DÛS
                </span>
                <span className="text-[9px] font-mono text-red-500 font-bold">Impayés</span>
              </div>

              {/* Downward hanging bars SVG */}
              <div className="h-40 flex items-start gap-1.5 pt-1">
                {waterfallData.map((item, idx) => {
                  const maxH = 100;
                  const barH = (item.debt / 8) * maxH;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      {/* Top baseline line */}
                      <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-700" />
                      <div
                        className="w-full rounded-b transition-all"
                        style={{ height: `${barH}px`, backgroundColor: item.color }}
                      />
                      <span className="text-[8px] font-mono text-slate-400 truncate max-w-full mt-1">
                        -{item.debt}M
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[9px] text-slate-400 text-center font-mono mt-1">
                Résorption progressive vers l'arrêté souverain du 25 décembre
              </div>
            </div>

          </div>

          {/* 2. Horizontal Milestone Slider Bars & Strategic Predictions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                JALONS STRATÉGIQUES & CALENDRIER RÉGLEMENTAIRE
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-bold">Loi 21-2019</span>
            </div>

            {/* 4 Horizontal Track Bars with Pinpoints */}
            <div className="space-y-3.5">
              {[
                { title: '1. Recensement Géolocalisé GPS (Territoire)', progress: 92, pinPos: 92, date: 'Terminé 92%' },
                { title: '2. Clôture des Droits & Quittances SAF', progress: 76, pinPos: 76, date: 'En cours 76%' },
                { title: '3. Arrêté Annuel Souverain (Clôture Trésor)', progress: 100, pinPos: 98, date: '25 Décembre' },
                { title: '4. Campagne de Renouvellement Annuel N+1', progress: 35, pinPos: 35, date: '1 An Renouvelable' },
              ].map((track, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                    <span>{track.title}</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{track.date}</span>
                  </div>
                  {/* Progress Line with Pin */}
                  <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 to-sky-400 rounded-full"
                      style={{ width: `${track.progress}%` }}
                    />
                    {/* Pin Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center -translate-x-1/2"
                      style={{ left: `${track.pinPos}%` }}
                    >
                      <div className="w-1 h-1 rounded-full bg-sky-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Strategic Directive Text Box */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
              <strong className="text-slate-900 dark:text-slate-100 font-bold">Directives et Prévisions : </strong>
              Toutes les autorisations d'exploitation sont strictement valides 1 an renouvelable. La clôture annuelle obligatoire intervient le 25 décembre 2026. Tout établissement en retard de paiement s'expose à la mise en demeure 72h et à la fermeture administrative par la brigade conjointe.
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: GRAND CENTRAL DONUT "MARKET ANALYSIS" + SECONDARY CHARTS (6 cols) */}
        <div className={`xl:col-span-6 rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>

          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  CARTOGRAPHIE SECTORIELLE • ANALYSE DU MARCHÉ DES LOISIRS
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                {totalEtabs} Opérateurs
              </span>
            </div>

            {/* Grand Donut Central with Leader Lines & Labels */}
            <div className="relative flex flex-col md:flex-row items-center justify-center py-4">

              {/* Big Thick Ring Donut */}
              <div className="relative w-64 h-64 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-90">
                  {/* Slices computed dynamically */}
                  {(() => {
                    let accumulatedPercent = 0;
                    return categoryData.map((cat, idx) => {
                      const strokeDash = (cat.pct * 628) / 100;
                      const offset = -((accumulatedPercent * 628) / 100);
                      accumulatedPercent += cat.pct;
                      const isHovered = hoveredSlice === cat.id;

                      return (
                        <circle
                          key={cat.id}
                          cx="120"
                          cy="120"
                          r="80"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth={isHovered ? "36" : "30"}
                          strokeDasharray={`${strokeDash} 628`}
                          strokeDashoffset={offset}
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setHoveredSlice(cat.id)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Central Ring Typography */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                    ANALYSE DU MARCHÉ
                  </span>
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white my-0.5">
                    {totalEtabs}
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                    Lieux de Détente
                  </span>
                </div>
              </div>

              {/* Radial Callout Labels List */}
              <div className="w-full md:w-56 mt-4 md:mt-0 md:ml-4 space-y-2">
                {categoryData.slice(0, 6).map((cat) => (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setHoveredSlice(cat.id)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                      hoveredSlice === cat.id
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {cat.label}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100 shrink-0">
                      {cat.count} ({cat.pct}%)
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Secondary Concentric Ring & Segmented Pies */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3">
            {/* Pie 1: Concentric Rings */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40">
              <svg viewBox="0 0 80 80" className="w-14 h-14">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#0284c7" strokeWidth="6" strokeDasharray="140 201" transform="rotate(-90 40 40)" />
                <circle cx="40" cy="40" r="22" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle cx="40" cy="40" r="22" fill="none" stroke="#1e40af" strokeWidth="6" strokeDasharray="95 138" transform="rotate(-90 40 40)" />
              </svg>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Concentric Rings</span>
              <span className="text-[9px] text-slate-400">Régularité / Conformité HSE</span>
            </div>

            {/* Pie 2: 6-slice segmented pie */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40">
              <svg viewBox="0 0 80 80" className="w-14 h-14 transform -rotate-90">
                <circle cx="40" cy="40" r="28" fill="none" stroke="#e2e8f0" strokeWidth="18" />
                <circle cx="40" cy="40" r="28" fill="none" stroke="#2563eb" strokeWidth="18" strokeDasharray="70 176" />
                <circle cx="40" cy="40" r="28" fill="none" stroke="#38bdf8" strokeWidth="18" strokeDasharray="40 176" strokeDashoffset="-70" />
                <circle cx="40" cy="40" r="28" fill="none" stroke="#0f172a" strokeWidth="18" strokeDasharray="35 176" strokeDashoffset="-110" />
              </svg>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Segmented Pie</span>
              <span className="text-[9px] text-slate-400">Recettes par Service</span>
            </div>

            {/* Pie 3: Status Breakdown */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 dark:bg-slate-950/40">
              <svg viewBox="0 0 80 80" className="w-14 h-14 transform -rotate-90">
                <circle cx="40" cy="40" r="28" fill="none" stroke="#e2e8f0" strokeWidth="18" />
                <circle cx="40" cy="40" r="28" fill="none" stroke="#059669" strokeWidth="18" strokeDasharray={`${(enRegle / (totalEtabs || 1)) * 176} 176`} />
                <circle cx="40" cy="40" r="28" fill="none" stroke="#dc2626" strokeWidth="18" strokeDasharray={`${(totalContentieux / (totalEtabs || 1)) * 176} 176`} strokeDashoffset={`-${(enRegle / (totalEtabs || 1)) * 176}`} />
              </svg>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Status SAA</span>
              <span className="text-[9px] text-slate-400">{enRegle} En règle / {totalContentieux} Alertes</span>
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 4: MULTI-LAYER STACKED AREA CHART + 7 CIRCULAR ICON BADGES
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* LEFT BLOCK: Multi-layer Stacked Area Chart (12 Months) (7 cols) */}
        <div className={`xl:col-span-7 rounded-2xl border p-5 shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                GRAPHIQUE DE FLUX CUMULÉS • ÉVOLUTION DES ENCAISSEMENTS (12 MOIS)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Surfaces étagées des flux de trésorerie sur l'exercice budgétaire 2026
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-700" /> SAF Directes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Droits SAA</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-200" /> Pénalités</span>
            </div>
          </div>

          {/* Pure Vector Stacked Area Chart */}
          <div className="relative w-full h-48">
            <svg viewBox="0 0 600 180" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="layerGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#1e40af" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="layerGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="layerGrad3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[40, 80, 120, 160].map((y, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2="600"
                  y2={y}
                  stroke={isLight ? '#f1f5f9' : '#1e293b'}
                  strokeWidth="1"
                />
              ))}

              {/* Layer 3 (Bottom Stacked Area - Pénalités / Autres) */}
              <path
                d="M 0,180 L 0,120 Q 150,110 300,90 T 600,60 L 600,180 Z"
                fill="url(#layerGrad3)"
              />
              {/* Layer 2 (Middle Stacked Area - Droits SAA) */}
              <path
                d="M 0,180 L 0,140 Q 150,130 300,110 T 600,80 L 600,180 Z"
                fill="url(#layerGrad2)"
              />
              {/* Layer 1 (Top Dominant Area - Recettes Directes SAF) */}
              <path
                d="M 0,180 L 0,155 Q 150,150 300,130 T 600,110 L 600,180 Z"
                fill="url(#layerGrad1)"
              />

              {/* Trend Line on top */}
              <path
                d="M 0,120 Q 150,110 300,90 T 600,60"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />

              {/* Monthly Data Points */}
              {monthlyData.map((d, i) => {
                const x = (i * 600) / 11;
                const y = 120 - Math.sin(i / 2) * 30 - i * 3.5;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Month Labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
              {MONTHS.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </div>

          {/* 3 Metric Pills directly underneath */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">ACT / RÉALISÉ</span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {formatCfa(totalRecettes)}
              </div>
              <span className="text-[9px] text-emerald-600 font-bold">100% Déposé Trésor</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">INDICE D'EFFICIENCE</span>
              <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                1.56
              </div>
              <span className="text-[9px] text-slate-500">Ratio Encaissement / Quota</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">RATIO CONTENTIEUX</span>
              <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                0.28
              </div>
              <span className="text-[9px] text-slate-500">Mises en demeure / Établissements</span>
            </div>
          </div>

        </div>

        {/* RIGHT BLOCK: ROW OF 7 CIRCULAR ICON BADGES (5 cols) */}
        <div className={`xl:col-span-5 rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>

          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                DISPOSITIF OPÉRATIONNEL EN 7 AXES VÉLIFICATIFS
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-bold">Capacités DDL-PN</span>
            </div>

            {/* Row of 7 Circular Icon Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center py-2">
              {[
                { icon: Flame, title: 'Carburant', val: '100%', color: 'bg-blue-600 text-white' },
                { icon: Volume2, title: 'Sonométrie', val: '65 dB', color: 'bg-sky-500 text-white' },
                { icon: Calendar, title: 'Délais 72h', val: 'Actifs', color: 'bg-indigo-600 text-white' },
                { icon: Sparkles, title: 'QR Tricolore', val: 'Sécurisé', color: 'bg-emerald-600 text-white' },
                { icon: Clock, title: 'Astreinte', val: '7j / 7', color: 'bg-slate-900 text-white' },
                { icon: Car, title: 'Patrouilles', val: '4 Mobiles', color: 'bg-blue-700 text-white' },
                { icon: ShieldAlert, title: 'Police Mixte', val: 'Opérat.', color: 'bg-red-600 text-white' },
              ].map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={idx} className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                    <div className={`w-9 h-9 rounded-full ${badge.color} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-2 truncate max-w-full">
                      {badge.val}
                    </span>
                    <span className="text-[8px] text-slate-400 truncate max-w-full">
                      {badge.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
              Interconnexion native des brigades SAA avec le terminal de caisse SAF : les quittances émises sont horodatées et vérifiables instantanément par scan QR en dégradé républicain.
            </p>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 5: "LAYERS" CARD + HERO PERCENTAGES + "PEOPLE STATISTICS" & COMPARATIVE BARS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* LEFT BLOCK: Layers Stacked Slices & Hero Percentages (5 cols) */}
        <div className={`xl:col-span-5 rounded-2xl border p-5 shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-blue-600" />
              STRATES ADMINISTRATIVES ("LAYERS") & CROISSANCE
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">+34% vs 2025</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* 3D Stacked Layers Slices */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Architecture 5 Strates</span>
              {[
                { title: 'Direction & Arbitrage', color: 'bg-slate-900 text-white' },
                { title: 'SAF • Régie Trésor', color: 'bg-blue-800 text-white' },
                { title: 'SAA • Agréments Terrain', color: 'bg-blue-600 text-white' },
                { title: 'SPA • Promotion Hygiène', color: 'bg-sky-500 text-white' },
                { title: 'SSI • Sécurité Cryptographique', color: 'bg-sky-300 text-slate-900' },
              ].map((layer, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs flex items-center justify-between transform transition hover:translate-x-1 ${layer.color}`}
                >
                  <span>{layer.title}</span>
                  <span className="text-[9px] font-mono opacity-80">Niveau {5 - idx}</span>
                </div>
              ))}
            </div>

            {/* Hero Percentages Callout Blocks */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800 text-center">
                  <div className="text-xs font-mono font-black text-blue-600">+34%</div>
                  <div className="text-[8px] text-slate-500 uppercase">Recettes</div>
                </div>
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800 text-center">
                  <div className="text-xs font-mono font-black text-sky-600">+45%</div>
                  <div className="text-[8px] text-slate-500 uppercase">Agréments</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800 text-center">
                  <div className="text-xs font-mono font-black text-emerald-600">+68%</div>
                  <div className="text-[8px] text-slate-500 uppercase">Quittances</div>
                </div>
              </div>

              {/* Big Hero Badge: 86% with blue up arrow */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
                    TAUX GLOBAL DE MAÎTRISE
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-4xl font-black font-mono text-blue-600 dark:text-blue-400">
                      86%
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center">
                      ▲
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Conformité départementale</div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-mono font-black text-xs">
                    135%
                  </span>
                  <div className="text-[9px] text-slate-400 mt-1 font-mono">OBJECTIF PTA</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT BLOCK: "PEOPLE STATISTICS" PICTOGRAM GRID + COMPARATIVE BAR HISTOGRAM (7 cols) */}
        <div className={`xl:col-span-7 rounded-2xl border p-5 shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>

          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                PEOPLE STATISTICS • EFFECTIFS & MATRICES OPÉRATIONNELLES
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-bold">Moyens Déployés</span>
            </div>

            {/* Silhouette Humanoid Row */}
            <div className="py-2">
              <div className="text-[10px] font-mono font-bold text-slate-500 mb-1">
                INSPECTEURS & AGENTS SUR LE TERRAIN :
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-6 rounded-sm flex items-center justify-center transition-all ${
                      i < 18
                        ? 'bg-blue-600 text-white'
                        : i < 24
                        ? 'bg-sky-400 text-white'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                    }`}
                    title={i < 18 ? 'En mission terrain' : i < 24 ? 'Au bureau / SAA' : 'Astreinte nuit'}
                  >
                    <span className="text-[8px] font-bold">●</span>
                  </div>
                ))}
                <span className="text-[10px] font-mono text-slate-500 font-bold ml-2">
                  18 Actifs • 6 Rédaction • 4 Astreinte
                </span>
              </div>
            </div>

            {/* Equipment & Tools Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {[
                { icon: Shield, label: 'Police Mixte', count: '4 Brigades' },
                { icon: Car, label: 'Véhicules', count: '3 Pickups' },
                { icon: Volume2, label: 'Sonomètres', count: '8 Classe-1' },
                { icon: Smartphone, label: 'Terminaux POS', count: '12 Mobiles' },
                { icon: Receipt, label: 'Quittances', count: `${receipts.length} Émises` },
                { icon: Lock, label: 'Coffre SHA', count: 'Actif' },
                { icon: MapPin, label: 'GPS Bornes', count: '6 Arrond.' },
                { icon: Award, label: 'Attestations', count: `${enRegle} Valides` },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 text-center border border-slate-100 dark:border-slate-800">
                    <Icon className="w-3.5 h-3.5 text-blue-600 mx-auto" />
                    <div className="text-[9px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {item.count}
                    </div>
                    <div className="text-[8px] text-slate-400 truncate">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grouped Comparative Bar Chart (Side-by-side: Réalisé vs Cible) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400">
                HISTOGRAMME COMPARATIF : RÉALISÉ EFFECTIF VS CIBLE BUDGÉTAIRE
              </span>
              <div className="flex items-center gap-3 text-[9px] font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-600 rounded-sm" /> Réalisé</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-sm" /> Prévision</span>
              </div>
            </div>

            <div className="h-28 flex items-end gap-2 px-2 pt-1">
              {[
                { m: 'Jan', r: 55, p: 50 },
                { m: 'Fév', r: 65, p: 60 },
                { m: 'Mar', r: 70, p: 65 },
                { m: 'Avr', r: 60, p: 70 },
                { m: 'Mai', r: 80, p: 75 },
                { m: 'Juin', r: 85, p: 80 },
                { m: 'Juil', r: 90, p: 85 },
                { m: 'Août', r: 75, p: 80 },
                { m: 'Sep', r: 85, p: 85 },
                { m: 'Oct', r: 95, p: 90 },
                { m: 'Nov', r: 100, p: 95 },
                { m: 'Déc', r: 110, p: 100 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="flex items-end gap-0.5 w-full justify-center">
                    <div className="w-1.5 sm:w-2 bg-blue-600 rounded-t" style={{ height: `${(bar.r / 110) * 100}%` }} />
                    <div className="w-1.5 sm:w-2 bg-slate-300 dark:bg-slate-600 rounded-t" style={{ height: `${(bar.p / 110) * 100}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 mt-1">{bar.m}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 6: BOTTOM INFOGRAPHIC BANNER "FACTS >" (TIMELINE & MILESTONES)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">

          {/* Left Title */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono font-black text-base md:text-lg tracking-widest text-sky-400 flex items-center gap-1.5">
              FACTS <ChevronRight className="w-5 h-5 text-sky-400" />
            </span>
            <div className="h-8 w-px bg-slate-700 hidden sm:block" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                RÉPUBLIQUE DU CONGO • MCAPNIT / DGL
              </div>
              <div className="text-[10px] text-slate-400">
                Direction Départementale des Loisirs de Pointe-Noire
              </div>
            </div>
          </div>

          {/* Milestone Circular Fact Pills */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1 justify-start lg:justify-end">
            {[
              { val: '25 DÉC', label: 'Clôture Annuelle', desc: 'Arrêté Trésor Public' },
              { val: '6', label: 'Arrondissements', desc: 'Couverture 100%' },
              { val: '1 AN', label: 'Autorisation Valide', desc: 'Renouvelable d\'office' },
              { val: '100%', label: 'Traçabilité SHA-256', desc: 'QR Code Tricolore' },
              { val: '0 dB', label: 'Dépassement Toléré', desc: 'Arrêté Nuisances' },
              { val: '1500+', label: 'Établissements Cibles', desc: 'Base Départementale' },
            ].map((fact, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 shadow-inner"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black font-mono text-white shrink-0">
                  {fact.val}
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] font-bold text-slate-200">{fact.label}</div>
                  <div className="text-[8px] text-slate-400">{fact.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Congolese flag bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-yellow-400" />
          <div className="flex-1 bg-red-600" />
        </div>
      </div>

    </div>
  );
};
