import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Target,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Users,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';

export const PtaTrackerModule: React.FC = () => {
  const { ptaMilestones, showNotification } = useApp();

  const totalBudgetPrevu = ptaMilestones.reduce((s, p) => s + p.budgetPrevu, 0);
  const totalBudgetEngage = ptaMilestones.reduce((s, p) => s + p.budgetEngage, 0);
  const moyennePhysique = Math.round(
    ptaMilestones.reduce((s, p) => s + p.tauxExecutionPhysique, 0) / ptaMilestones.length
  );
  const moyenneFinanciere = Math.round((totalBudgetEngage / totalBudgetPrevu) * 100);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-13
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Suivi d'Exécution du PTA 2026
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pilotage stratégique du Plan de Travail Annuel 2026 validé par le Ministère de tutelle
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">Taux d'Exécution Physique</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{moyennePhysique} %</p>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${moyennePhysique}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">Taux d'Exécution Financière</span>
          <p className="text-2xl font-bold text-blue-400 font-mono">{moyenneFinanciere} %</p>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${moyenneFinanciere}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">Budget Prévu PTA 2026</span>
          <p className="text-xl font-bold text-slate-100 font-mono">{formatCfa(totalBudgetPrevu)}</p>
          <span className="text-[11px] text-slate-400">Dotation de fonctionnement</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">Budget Engagé / Consommé</span>
          <p className="text-xl font-bold text-purple-400 font-mono">{formatCfa(totalBudgetEngage)}</p>
          <span className="text-[11px] text-slate-400">Dépenses régaliennes justifiées</span>
        </div>
      </div>

      {/* Detail Cards of PTA Axes */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
          Avancement Détaillé par Axe Prioritaire
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ptaMilestones.map((m) => (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {m.serviceResponsable} • {m.axeStrategique}
                </span>
                <span
                  className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                    m.statut === 'atteint'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  {m.statut.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">{m.activite}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Responsable : <span className="text-slate-200 font-semibold">{m.responsableNom}</span>
                </p>
              </div>

              {/* Physical progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Avancement Physique :</span>
                  <span className="font-mono text-emerald-400">{m.tauxExecutionPhysique} %</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${m.tauxExecutionPhysique}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Réalisé : {m.realisationActuelle} {m.unite}</span>
                  <span>Cible : {m.cibleAnnuelle} {m.unite}</span>
                </div>
              </div>

              {/* Financial Progress */}
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Exécution Budgétaire :</span>
                  <span className="font-mono text-blue-400">{m.tauxExecutionFinanciere} %</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${m.tauxExecutionFinanciere}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Engagé : {formatCfa(m.budgetEngage)}</span>
                  <span>Prévu : {formatCfa(m.budgetPrevu)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
