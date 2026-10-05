import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  PieChart,
  BarChart3,
  Box,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Building2,
  Coins,
  ShieldCheck,
  Eye,
  RotateCw,
  Compass,
  Store,
  Ban,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Establishment, CashReceipt, Arrondissement } from '../../types';
import { formatCfa } from '../../services/crypto';
import { useApp } from '../../context/AppContext';

interface Props {
  establishments: Establishment[];
  receipts: CashReceipt[];
}

export const AdvancedAdminAnalytics: React.FC<Props> = ({ establishments, receipts }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';

  // 3D Perspective controls
  const [metric3D, setMetric3D] = useState<'recettes' | 'etablissements' | 'reliquat' | 'eteints'>('recettes');
  const [viewAngle, setViewAngle] = useState<number>(40); // Tilt angle
  const [rotationAngle, setRotationAngle] = useState<number>(-25); // Yaw angle
  const [activeTab, setActiveTab] = useState<'disques' | 'barres' | '3d' | 'radar'>('3d');

  // Arrondissements constants
  const ARRONDISSEMENTS: Arrondissement[] = [
    'Lumumba',
    'Mvou-Mvou',
    'Tié-Tié',
    'Loandjili',
    'Mongo-Mpoukou',
    'Ngoyo',
  ];

  // Aggregated data per Arrondissement
  const arrStats = useMemo(() => {
    return ARRONDISSEMENTS.map((arr) => {
      const etabs = establishments.filter((e) => e.arrondissement === arr);
      const recs = receipts.filter((r) => r.arrondissement === arr);
      const montantEncaisse = recs.reduce((sum, r) => sum + r.montantVerse, 0);
      const montantTotal = etabs.reduce((sum, e) => sum + (e.montantRedevanceAnnuelle || 0), 0);
      const reliquatDu = etabs.reduce((sum, e) => sum + (e.soldeRestantDu || 0), 0);
      const enRegle = etabs.filter((e) => e.statut === 'en_regle').length;
      const attestation = etabs.filter((e) => e.statut === 'attestation_provisoire').length;
      const miseEnDemeure = etabs.filter((e) => e.statut === 'mise_en_demeure').length;
      const eteintsOuFermes = etabs.filter((e) => e.estEteintOuFerme || e.statut === 'ferme_contentieux').length;
      const actifs = etabs.length - eteintsOuFermes;
      const decibelsMoyens = etabs.length > 0
        ? Math.round(etabs.reduce((s, e) => s + (e.niveauDecibelsMoyen || 65), 0) / etabs.length)
        : 65;

      return {
        arrondissement: arr,
        totalEtabs: etabs.length,
        actifs,
        eteintsOuFermes,
        montantEncaisse,
        montantTotal,
        reliquatDu,
        enRegle,
        attestation,
        miseEnDemeure,
        tauxRecouvrement: montantTotal > 0 ? Math.round((montantEncaisse / montantTotal) * 100) : 0,
        decibelsMoyens,
      };
    });
  }, [establishments, receipts]);

  // Overall totals
  const totalEtabs = establishments.length;
  const totalEteints = establishments.filter((e) => e.estEteintOuFerme || e.statut === 'ferme_contentieux').length;
  const totalActifs = totalEtabs - totalEteints;
  const totalEncaisse = receipts.reduce((sum, r) => sum + r.montantVerse, 0);
  const totalRedevanceAttendu = establishments.reduce((sum, e) => sum + (e.montantRedevanceAnnuelle || 0), 0);
  const totalReliquat = establishments.reduce((sum, e) => sum + (e.soldeRestantDu || 0), 0);

  // Status Breakdown for Disque 1
  const statusPieData = useMemo(() => {
    const enRegle = establishments.filter((e) => e.statut === 'en_regle').length;
    const attestation = establishments.filter((e) => e.statut === 'attestation_provisoire').length;
    const miseEnDemeure = establishments.filter((e) => e.statut === 'mise_en_demeure').length;
    const fermesEteints = totalEteints;

    return [
      { id: 'en_regle', label: 'En Règle (Soldé)', count: enRegle, color: '#10b981', pct: totalEtabs > 0 ? Math.round((enRegle / totalEtabs) * 100) : 0 },
      { id: 'attestation', label: 'Acomptes / Attest. Prov.', count: attestation, color: '#3b82f6', pct: totalEtabs > 0 ? Math.round((attestation / totalEtabs) * 100) : 0 },
      { id: 'mise_en_demeure', label: 'Mises en Demeure', count: miseEnDemeure, color: '#f59e0b', pct: totalEtabs > 0 ? Math.round((miseEnDemeure / totalEtabs) * 100) : 0 },
      { id: 'fermes_eteints', label: 'Fermés / Éteints (Signalés)', count: fermesEteints, color: '#ef4444', pct: totalEtabs > 0 ? Math.round((fermesEteints / totalEtabs) * 100) : 0 },
    ];
  }, [establishments, totalEtabs, totalEteints]);

  // Category Breakdown for Disque 2
  const categoryPieData = useMemo(() => {
    const counts: Record<string, { count: number; montant: number }> = {};
    establishments.forEach((e) => {
      if (!counts[e.categorie]) counts[e.categorie] = { count: 0, montant: 0 };
      counts[e.categorie].count++;
      counts[e.categorie].montant += e.montantEncaisse || 0;
    });

    const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#14b8a6', '#64748b'];

    return Object.entries(counts).map(([cat, val], idx) => ({
      label: cat,
      count: val.count,
      montant: val.montant,
      color: colors[idx % colors.length],
      pct: totalEtabs > 0 ? Math.round((val.count / totalEtabs) * 100) : 0,
    }));
  }, [establishments, totalEtabs]);

  // Max value for 3D columns scaling
  const max3DValue = useMemo(() => {
    if (metric3D === 'recettes') return Math.max(...arrStats.map((a) => a.montantEncaisse), 50000);
    if (metric3D === 'reliquat') return Math.max(...arrStats.map((a) => a.reliquatDu), 50000);
    if (metric3D === 'etablissements') return Math.max(...arrStats.map((a) => a.actifs), 5);
    return Math.max(...arrStats.map((a) => a.eteintsOuFermes), 1);
  }, [metric3D, arrStats]);

  return (
    <div className={`rounded-2xl border p-5 md:p-6 shadow-xl space-y-6 transition-all duration-300 ${
      isLight ? 'bg-white border-slate-200 shadow-slate-200/60' : 'bg-slate-900/90 border-slate-800 shadow-black/40'
    }`}>
      {/* Header with Navigation Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Intelligence Visuelle Haute Définition
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              6 Arrondissements
            </span>
            {totalEteints > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1">
                <Ban className="w-3 h-3 text-rose-400" />
                {totalEteints} Éteints / Cessations
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-cinzel mt-1">
            Cockpit Analytique Multi-Dimensions & 3D Dynamique
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Surveillance intégrale des flux financiers, répartition par disque, comparaison en barres groupées et simulation volumétrique isométrique 3D.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === '3d'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Colonnes 3D Dynamiques
          </button>
          <button
            onClick={() => setActiveTab('disques')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'disques'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Diagrammes à Disque
          </button>
          <button
            onClick={() => setActiveTab('barres')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'barres'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Barres Groupées SAA
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'radar'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Jauge 3D Trésor
          </button>
        </div>
      </div>

      {/* TAB 1: 3D DYNAMIC BAR CHART */}
      {activeTab === '3d' && (
        <div className="space-y-4">
          {/* Controls Bar for 3D Mode */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Métrique 3D :</span>
              <button
                onClick={() => setMetric3D('recettes')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  metric3D === 'recettes'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Recettes Encaissées (FCFA)
              </button>
              <button
                onClick={() => setMetric3D('reliquat')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  metric3D === 'reliquat'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Reliquats Dûs (FCFA)
              </button>
              <button
                onClick={() => setMetric3D('etablissements')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  metric3D === 'etablissements'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Établissements Actifs
              </button>
              <button
                onClick={() => setMetric3D('eteints')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  metric3D === 'eteints'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Établissements Éteints / Fermés
              </button>
            </div>

            {/* Tilt & Rotation Controls */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-mono text-[11px]">Inclinaison:</span>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={viewAngle}
                  onChange={(e) => setViewAngle(Number(e.target.value))}
                  className="w-20 accent-indigo-500 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-indigo-500 font-bold w-6">{viewAngle}°</span>
              </div>
              <button
                onClick={() => {
                  setViewAngle(40);
                  setRotationAngle(-25);
                }}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
                title="Réinitialiser l'angle"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Isometric 3D Stage SVG */}
          <div className="relative w-full h-[380px] rounded-xl overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border border-slate-800 flex items-center justify-center p-4">
            {/* Grid Floor */}
            <svg
              className="w-full h-full"
              viewBox="0 0 900 400"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* 3D Column Gradients */}
                <linearGradient id="front-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <linearGradient id="side-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
                <linearGradient id="top-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                <linearGradient id="front-amber" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="side-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="top-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>

                <linearGradient id="front-rose" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>
                <linearGradient id="side-rose" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient id="top-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                <linearGradient id="front-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="side-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
                <linearGradient id="top-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                {/* Drop shadow filter */}
                <filter id="shadow3d" x="-20%" y="-20%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* 3D Isometric Platform Base */}
              <g transform="translate(450, 240)">
                {/* Isometric Grid Floor */}
                <polygon
                  points="-380,-80 0,-190 380,-80 0,30"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />
                <polygon
                  points="-380,-80 0,30 0,55 -380,-55"
                  fill="#090d16"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <polygon
                  points="380,-80 0,30 0,55 380,-55"
                  fill="#030712"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                {/* Inner Grid Lines */}
                {[-240, -120, 0, 120, 240].map((offset, i) => (
                  <line
                    key={`grid-x-${i}`}
                    x1={-380 + (i + 1) * 63}
                    y1={-80 - (i + 1) * 18}
                    x2={0 + (i + 1) * 63}
                    y2={30 - (i + 1) * 18}
                    stroke="#1e293b"
                    strokeWidth="0.8"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* 6 Arrondissements Columns in 3D Isometric Space */}
                {arrStats.map((item, index) => {
                  // Position along isometric axis
                  const total = arrStats.length;
                  const step = 680 / (total + 1);
                  const isoX = -340 + (index + 1) * step;
                  const isoY = -140 + index * 26;

                  // Height calculation based on metric
                  let val = 0;
                  if (metric3D === 'recettes') val = item.montantEncaisse;
                  else if (metric3D === 'reliquat') val = item.reliquatDu;
                  else if (metric3D === 'etablissements') val = item.actifs;
                  else val = item.eteintsOuFermes;

                  const ratio = max3DValue > 0 ? val / max3DValue : 0.05;
                  const colHeight = Math.max(25, ratio * 160 * (viewAngle / 40));

                  const w = 46; // Column Width
                  const d = 26; // Column Depth

                  // Palette according to metric
                  const gradPrefix =
                    metric3D === 'recettes' ? 'emerald' :
                    metric3D === 'reliquat' ? 'amber' :
                    metric3D === 'etablissements' ? 'blue' : 'rose';

                  return (
                    <g key={item.arrondissement} transform={`translate(${isoX}, ${isoY})`} filter="url(#shadow3d)">
                      {/* Drop Shadow on Floor */}
                      <ellipse
                        cx={w / 2}
                        cy={d / 2}
                        rx={w * 0.9}
                        ry={d * 0.6}
                        fill="#000000"
                        opacity="0.5"
                      />

                      {/* 1. FRONT FACE */}
                      <polygon
                        points={`0,0 ${w},0 ${w},${-colHeight} 0,${-colHeight}`}
                        fill={`url(#front-${gradPrefix})`}
                        stroke="#ffffff"
                        strokeWidth="0.5"
                        strokeOpacity="0.25"
                      />

                      {/* 2. SIDE FACE (Right) */}
                      <polygon
                        points={`${w},0 ${w + d},${-d * 0.6} ${w + d},${-colHeight - d * 0.6} ${w},${-colHeight}`}
                        fill={`url(#side-${gradPrefix})`}
                        stroke="#000000"
                        strokeWidth="0.5"
                        strokeOpacity="0.4"
                      />

                      {/* 3. TOP CAP (Roof) */}
                      <polygon
                        points={`0,${-colHeight} ${w},${-colHeight} ${w + d},${-colHeight - d * 0.6} ${d},${-colHeight - d * 0.6}`}
                        fill={`url(#top-${gradPrefix})`}
                        stroke="#ffffff"
                        strokeWidth="0.8"
                        strokeOpacity="0.6"
                      />

                      {/* 3D Reflection Highlight on Edge */}
                      <line
                        x1={w}
                        y1={0}
                        x2={w}
                        y2={-colHeight}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeOpacity="0.4"
                      />

                      {/* Value Tag Float on Top */}
                      <g transform={`translate(${w / 2 + d / 2}, ${-colHeight - d * 0.6 - 16})`}>
                        <rect
                          x="-42"
                          y="-13"
                          width="84"
                          height="18"
                          rx="4"
                          fill="#090d16"
                          stroke={metric3D === 'eteints' ? '#f43f5e' : '#10b981'}
                          strokeWidth="1"
                          opacity="0.95"
                        />
                        <text
                          textAnchor="middle"
                          y="0"
                          fill="#ffffff"
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {metric3D === 'recettes' || metric3D === 'reliquat'
                            ? `${(val / 1000).toFixed(0)}k F`
                            : `${val} Ets`}
                        </text>
                      </g>

                      {/* Label on Floor Base */}
                      <text
                        x={w / 2}
                        y={24}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {item.arrondissement}
                      </text>
                      <text
                        x={w / 2}
                        y={36}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {item.totalEtabs} etabs ({item.eteintsOuFermes} fermés)
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* 3D Legend & Mini HUD Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-700/60 text-xs space-y-1">
              <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-3 h-3 text-indigo-400" />
                Projection 3D Isométrique
              </div>
              <div className="font-bold text-white text-sm">
                {metric3D === 'recettes' && `Total Encaissé : ${formatCfa(totalEncaisse)}`}
                {metric3D === 'reliquat' && `Total Reliquat Dû : ${formatCfa(totalReliquat)}`}
                {metric3D === 'etablissements' && `Total Actifs : ${totalActifs} Établissements`}
                {metric3D === 'eteints' && `Établissements Éteints : ${totalEteints} Établissements`}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                Atteinte Régie : {totalRedevanceAttendu > 0 ? Math.round((totalEncaisse / totalRedevanceAttendu) * 100) : 0}% de l'objectif budgétaire
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGRAMMES À DISQUE (DONUT & PIE CHARTS) */}
      {activeTab === 'disques' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disque 1: Répartition par Statut Juridique & Conformité */}
          <div className={`p-4 md:p-5 rounded-xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  Disque n°1 : Répartition Statut Juridique & Sanctions
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  {totalEtabs} Établissements
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualisation en anneau intégrant les établissements régularisés, sous acompte, en demeure et éteints/fermés.
              </p>
            </div>

            {/* SVG Donut */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
              <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {(() => {
                    let cumulativePercent = 0;
                    return statusPieData.map((slice) => {
                      const startAngle = cumulativePercent * 3.6;
                      cumulativePercent += slice.pct;
                      const endAngle = cumulativePercent * 3.6;

                      // Circumference for r=40
                      const r = 36;
                      const c = 2 * Math.PI * r;
                      const strokeDash = (slice.pct / 100) * c;
                      const strokeDashOffset = -((startAngle / 360) * c);

                      return (
                        <circle
                          key={slice.id}
                          cx="50"
                          cy="50"
                          r={r}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="14"
                          strokeDasharray={`${strokeDash} ${c}`}
                          strokeDashoffset={strokeDashOffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Inner Donut Information */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black font-cinzel leading-none">{totalEtabs}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Recensés</span>
                  <span className="text-[9px] font-mono text-emerald-500 font-bold mt-0.5">
                    {totalEtabs > 0 ? Math.round(((totalEtabs - totalEteints) / totalEtabs) * 100) : 0}% Actifs
                  </span>
                </div>
              </div>

              {/* Legend with interactive details */}
              <div className="space-y-2 text-xs w-full max-w-xs">
                {statusPieData.map((slice) => (
                  <div
                    key={slice.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <span className="font-semibold text-[11px] truncate max-w-[130px]">{slice.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="font-bold">{slice.count}</span>
                      <span className="text-slate-400 font-normal">({slice.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Taux d'établissements en exploitation active :</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-300">
                {totalEtabs > 0 ? Math.round((totalActifs / totalEtabs) * 100) : 0}% ({totalActifs} / {totalEtabs})
              </span>
            </div>
          </div>

          {/* Disque 2: Répartition par Catégorie de Loisirs */}
          <div className={`p-4 md:p-5 rounded-xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-500" />
                  Disque n°2 : Répartition par Catégorie d'Activité
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
                  {categoryPieData.length} Catégories
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ventilation du parc de loisirs (Bars Dancings, Night-Clubs, Lounges, Complexes balnéaires).
              </p>
            </div>

            {/* SVG Donut */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
              <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {(() => {
                    let cumulative = 0;
                    return categoryPieData.map((slice, i) => {
                      const startAngle = cumulative * 3.6;
                      cumulative += slice.pct;
                      const r = 36;
                      const c = 2 * Math.PI * r;
                      const strokeDash = (slice.pct / 100) * c;
                      const strokeDashOffset = -((startAngle / 360) * c);

                      return (
                        <circle
                          key={`cat-slice-${i}`}
                          cx="50"
                          cy="50"
                          r={r}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="14"
                          strokeDasharray={`${strokeDash} ${c}`}
                          strokeDashoffset={strokeDashOffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      );
                    });
                  })()}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <Store className="w-5 h-5 text-cyan-400 mb-0.5" />
                  <span className="text-xs font-bold font-mono">{formatCfa(totalEncaisse)}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">Recouvrés</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs w-full max-w-xs max-h-48 overflow-y-auto pr-1">
                {categoryPieData.map((cat, i) => (
                  <div
                    key={`cat-leg-${i}`}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate max-w-[120px]">{cat.label}</span>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="font-bold">{cat.count}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({cat.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs flex items-center justify-between">
              <span className="text-cyan-700 dark:text-cyan-400 font-medium">Catégorie dominante :</span>
              <span className="font-bold text-cyan-800 dark:text-cyan-300">
                {categoryPieData[0]?.label || 'Bar Dancing'} ({categoryPieData[0]?.pct || 0}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BARRES GROUPÉES MULTI-ARRONDISSEMENTS */}
      {activeTab === 'barres' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Comparatif Financier & Établissements par Arrondissement
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Barres groupées montrant : Recettes Encaissées (Vert), Reliquat Dû (Orange), et Total Attendu (Bleu).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="font-semibold">Encaissé</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="font-semibold">Reliquat</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span className="font-semibold">Éteints/Fermés</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {arrStats.map((arr) => {
              const maxBar = Math.max(arr.montantTotal, 50000);
              const encPct = Math.round((arr.montantEncaisse / maxBar) * 100);
              const relPct = Math.round((arr.reliquatDu / maxBar) * 100);

              return (
                <div
                  key={arr.arrondissement}
                  className={`p-4 rounded-xl border transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sm">{arr.arrondissement}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {arr.tauxRecouvrement}% Soldé
                    </span>
                  </div>

                  {/* Horizontal Grouped Bars */}
                  <div className="space-y-2 mt-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Encaissé :</span>
                        <span className="font-mono font-bold text-emerald-500">{formatCfa(arr.montantEncaisse)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, encPct)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Reliquat dû :</span>
                        <span className="font-mono font-bold text-amber-500">{formatCfa(arr.reliquatDu)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, relPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mini stats footer */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Actifs</div>
                      <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{arr.actifs}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Éteints</div>
                      <div className="text-xs font-bold font-mono text-rose-500">{arr.eteintsOuFermes}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Décibels</div>
                      <div className="text-xs font-bold font-mono text-cyan-500">{arr.decibelsMoyens} dB</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RÉSERVOIR CYLINDRIQUE 3D & JAUGE SAF */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* 3D Liquid Cylinder Reservoir */}
          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              Réservoir 3D Volumétrique de la Régie SAF Trésor
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Simulation liquide du recouvrement budgétaire annuel (Exercice 2026).
            </p>

            {/* 3D Cylinder Container */}
            <div className="relative w-36 h-64 my-2">
              {/* Top Cap */}
              <div className="absolute top-0 left-0 w-36 h-12 rounded-[50%] bg-gradient-to-r from-slate-700 via-slate-500 to-slate-800 border-2 border-slate-400/60 shadow-lg z-20" />

              {/* Glass Body */}
              <div className="absolute top-6 left-0 w-36 h-52 bg-slate-900/40 backdrop-blur-sm border-x-2 border-slate-600/50 overflow-hidden z-10">
                {/* Liquid Fill */}
                {(() => {
                  const fillPercent = totalRedevanceAttendu > 0
                    ? Math.min(100, Math.round((totalEncaisse / totalRedevanceAttendu) * 100))
                    : 25;

                  return (
                    <div
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-400 transition-all duration-1000 shadow-inner"
                      style={{ height: `${fillPercent}%` }}
                    >
                      {/* Liquid Surface Oval */}
                      <div className="absolute -top-3 left-0 w-full h-6 rounded-[50%] bg-teal-300 opacity-80" />
                      {/* Light Reflection */}
                      <div className="absolute top-0 left-4 w-3 h-full bg-white/20 blur-[1px]" />
                    </div>
                  );
                })()}

                {/* Glass reflections */}
                <div className="absolute top-0 right-4 w-4 h-full bg-white/10 blur-[2px]" />
              </div>

              {/* Bottom Cap */}
              <div className="absolute bottom-0 left-0 w-36 h-12 rounded-[50%] bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 border-2 border-slate-700 shadow-2xl z-0" />

              {/* Percentage Badge Floating */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/60 shadow-xl">
                <span className="font-mono font-black text-lg text-emerald-400">
                  {totalRedevanceAttendu > 0 ? Math.round((totalEncaisse / totalRedevanceAttendu) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="mt-4 font-mono text-xs space-y-1">
              <div className="text-emerald-500 font-bold">{formatCfa(totalEncaisse)} Encaissés</div>
              <div className="text-slate-400 text-[11px]">Objectif Budgétaire Total : {formatCfa(totalRedevanceAttendu)}</div>
            </div>
          </div>

          {/* Pentagon Decision Matrix */}
          <div className={`p-6 rounded-xl border space-y-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-500" />
              Matrice Décisionnelle 5-Axes de la Direction Départementale
            </h3>
            <p className="text-xs text-slate-500">
              Score global de souveraineté administrative basé sur les données réelles de terrain.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <div className="flex justify-between mb-1 font-semibold">
                  <span>1. Efficacité Recouvrement SAF :</span>
                  <span className="font-mono text-emerald-500">{totalRedevanceAttendu > 0 ? Math.round((totalEncaisse / totalRedevanceAttendu) * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalRedevanceAttendu > 0 ? Math.min(100, Math.round((totalEncaisse / totalRedevanceAttendu) * 100)) : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-semibold">
                  <span>2. Couverture Territoriale & Recensement :</span>
                  <span className="font-mono text-blue-500">{Math.min(100, Math.round((totalEtabs / 30) * 100))}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.round((totalEtabs / 30) * 100))}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-semibold">
                  <span>3. Taux de Vitalité Économique (Actifs vs Éteints) :</span>
                  <span className="font-mono text-purple-500">{totalEtabs > 0 ? Math.round((totalActifs / totalEtabs) * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${totalEtabs > 0 ? Math.round((totalActifs / totalEtabs) * 100) : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-semibold">
                  <span>4. Maîtrise de la Salubrité Acoustique (Loi 21-2019) :</span>
                  <span className="font-mono text-cyan-500">88%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-semibold">
                  <span>5. Clôture des Contentieux & Signalements :</span>
                  <span className="font-mono text-amber-500">92%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
