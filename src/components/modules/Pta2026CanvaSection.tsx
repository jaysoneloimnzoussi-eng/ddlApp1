import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  FileSpreadsheet,
  Target,
  Wallet,
  Users,
  CheckCircle2,
  Printer,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Send,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';
import { generatePta2026Docx } from '../../services/docxGenerator';
import { printHtmlElement } from '../../services/printService';
import { PtaTableSection, PtaActivityItem, PtaBudgetItem, PtaBudgetSection } from '../../data/officialPtaData';

export const Pta2026CanvaEditor: React.FC = () => {
  const { officialPtaData, updateOfficialPtaData, resetPtaToOfficialModel, showNotification, setActiveModule } = useApp();

  const [activeTab, setActiveTab] = useState<'presentation' | 'tableaux' | 'chronogramme' | 'budget' | 'recommandations'>('presentation');
  const [selectedTableauIdx, setSelectedTableauIdx] = useState<number>(0);

  const handleUpdatePtaField = <K extends keyof typeof officialPtaData>(key: K, val: (typeof officialPtaData)[K]) => {
    updateOfficialPtaData((prev) => ({ ...prev, [key]: val }));
  };

  const handleUpdateActivity = (tableIdx: number, actIdx: number, updates: Partial<PtaActivityItem>) => {
    updateOfficialPtaData((prev) => {
      const nextTabs = [...prev.tableauxActivites];
      const targetTab = { ...nextTabs[tableIdx] };
      const nextActs = [...targetTab.activites];
      nextActs[actIdx] = { ...nextActs[actIdx], ...updates };
      targetTab.activites = nextActs;
      nextTabs[tableIdx] = targetTab;
      return { ...prev, tableauxActivites: nextTabs };
    });
  };

  const handleAddActivity = (tableIdx: number) => {
    updateOfficialPtaData((prev) => {
      const nextTabs = [...prev.tableauxActivites];
      const targetTab = { ...nextTabs[tableIdx] };
      const newAct: PtaActivityItem = {
        id: `act-${Date.now()}`,
        activite: 'Nouvelle activité administrative',
        objectifs: 'Objectif de conformité ou de promotion',
        resultatsAttendus: 'Résultats mesurables attendus',
        actionsRequises: 'Actions concrètes de terrain',
        indicateursResultats: '1 indicateur quantifiable',
        sourcesVerification: 'Rapports, PV, Registres',
        responsables: 'DDL, Chefs de services',
        periodes: { t1: true, t2: true, t3: true, t4: true },
      };
      targetTab.activites = [...targetTab.activites, newAct];
      nextTabs[tableIdx] = targetTab;
      return { ...prev, tableauxActivites: nextTabs };
    });
    showNotification('success', 'Nouvelle activité ajoutée au tableau.');
  };

  const handleRemoveActivity = (tableIdx: number, actIdx: number) => {
    updateOfficialPtaData((prev) => {
      const nextTabs = [...prev.tableauxActivites];
      const targetTab = { ...nextTabs[tableIdx] };
      targetTab.activites = targetTab.activites.filter((_, idx) => idx !== actIdx);
      nextTabs[tableIdx] = targetTab;
      return { ...prev, tableauxActivites: nextTabs };
    });
  };

  const handleUpdateBudgetLine = (secIdx: number, lineIdx: number, updates: Partial<PtaBudgetItem>) => {
    updateOfficialPtaData((prev) => {
      const nextSections = [...prev.budgetSections];
      const targetSec = { ...nextSections[secIdx] };
      const nextLines = [...targetSec.lignes];
      const updatedLine = { ...nextLines[lineIdx], ...updates };
      nextLines[lineIdx] = updatedLine;
      targetSec.lignes = nextLines;
      targetSec.sousTotalCfa = nextLines.reduce((sum, l) => sum + (Number(l.totalCfa) || 0), 0);
      nextSections[secIdx] = targetSec;

      const totalGen = nextSections.reduce((s, sec) => s + sec.sousTotalCfa, 0);
      return { ...prev, budgetSections: nextSections, totalGeneralBudgetCfa: totalGen };
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Top Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-100">PTA {officialPtaData.annee} Officiel</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {formatCfa(officialPtaData.totalGeneralBudgetCfa)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetPtaToOfficialModel}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            title="Restaurer le texte officiel intégral conforme à la version validée par la DGL"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Restaurer Modèle</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('MOD-06')}
            className="px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            title="Basculer vers les Rapports Trimestriels pour évaluer ce PTA"
          >
            <Target className="w-3 h-3 text-indigo-300" />
            <span>Évaluer (MOD-06)</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto text-[11px]">
        {[
          { id: 'presentation', label: '1. Présentation & Piliers', icon: BookOpen },
          { id: 'tableaux', label: '2. 7 Tableaux d’Activités', icon: FileSpreadsheet },
          { id: 'chronogramme', label: '3. Chronogramme (T1-T4)', icon: Calendar },
          { id: 'budget', label: '4. Budget Minimal', icon: Wallet },
          { id: 'recommandations', label: '5. Recommandations', icon: ShieldAlert },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1 : NOTE DE PRÉSENTATION & PILIERS */}
      {activeTab === 'presentation' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Objectif Global du Secteur des Loisirs
            </label>
            <textarea
              rows={3}
              value={officialPtaData.notePresentation.objectifGlobal}
              onChange={(e) =>
                updateOfficialPtaData((prev) => ({
                  ...prev,
                  notePresentation: { ...prev.notePresentation, objectifGlobal: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs italic"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Les 4 Piliers Stratégiques 2026
            </label>
            <div className="space-y-2">
              {officialPtaData.notePresentation.orientationsStrategiques4Piliers.map((pilier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={pilier}
                    onChange={(e) => {
                      const updated = [...officialPtaData.notePresentation.orientationsStrategiques4Piliers];
                      updated[idx] = e.target.value;
                      updateOfficialPtaData((prev) => ({
                        ...prev,
                        notePresentation: { ...prev.notePresentation, orientationsStrategiques4Piliers: updated },
                      }));
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-medium"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Contexte et Leçons de 2025
            </label>
            <div className="space-y-1.5">
              {officialPtaData.notePresentation.contexteLecons2025.map((lecon, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={lecon}
                  onChange={(e) => {
                    const updated = [...officialPtaData.notePresentation.contexteLecons2025];
                    updated[idx] = e.target.value;
                    updateOfficialPtaData((prev) => ({
                      ...prev,
                      notePresentation: { ...prev.notePresentation, contexteLecons2025: updated },
                    }));
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Partenaires Stratégiques Confirmés
            </label>
            <input
              type="text"
              value={officialPtaData.notePresentation.partenaires2025.join(' ; ')}
              onChange={(e) =>
                updateOfficialPtaData((prev) => ({
                  ...prev,
                  notePresentation: {
                    ...prev.notePresentation,
                    partenaires2025: e.target.value.split(';').map((s) => s.trim()).filter(Boolean),
                  },
                }))
              }
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* TAB 2 : LES 7 TABLEAUX D'ACTIVITÉS */}
      {activeTab === 'tableaux' && (
        <div className="space-y-4">
          {/* Table selector pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800">
            {officialPtaData.tableauxActivites.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTableauIdx(idx)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  selectedTableauIdx === idx
                    ? 'bg-emerald-600 text-slate-950 shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>Tab {tab.numero}</span>
                <span className="text-[9px] opacity-75">({tab.service.split(' ')[0]})</span>
              </button>
            ))}
          </div>

          {/* Current Table Header */}
          {(() => {
            const currentTab = officialPtaData.tableauxActivites[selectedTableauIdx];
            if (!currentTab) return null;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-400">
                      TABLEAU {currentTab.numero} : {currentTab.titre}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {currentTab.activites.length} activité(s) régalienne(s)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddActivity(selectedTableauIdx)}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter activité</span>
                  </button>
                </div>

                {/* List of activities in current table */}
                <div className="space-y-3">
                  {currentTab.activites.map((act, actIdx) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          Activité #{actIdx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Quarter checkboxes */}
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            {(['t1', 't2', 't3', 't4'] as const).map((q) => (
                              <label
                                key={q}
                                className={`px-1.5 py-0.5 rounded cursor-pointer border ${
                                  act.periodes[q]
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                    : 'bg-slate-900 text-slate-500 border-slate-800'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={act.periodes[q]}
                                  onChange={(e) =>
                                    handleUpdateActivity(selectedTableauIdx, actIdx, {
                                      periodes: { ...act.periodes, [q]: e.target.checked },
                                    })
                                  }
                                />
                                {q.toUpperCase()}
                              </label>
                            ))}
                          </div>

                          {currentTab.activites.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveActivity(selectedTableauIdx, actIdx)}
                              className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                              title="Supprimer cette activité"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Libellé de l&apos;Activité</label>
                        <input
                          type="text"
                          value={act.activite}
                          onChange={(e) =>
                            handleUpdateActivity(selectedTableauIdx, actIdx, { activite: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Objectifs</label>
                          <textarea
                            rows={2}
                            value={act.objectifs}
                            onChange={(e) =>
                              handleUpdateActivity(selectedTableauIdx, actIdx, { objectifs: e.target.value })
                            }
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Résultats Attendus</label>
                          <textarea
                            rows={2}
                            value={act.resultatsAttendus}
                            onChange={(e) =>
                              handleUpdateActivity(selectedTableauIdx, actIdx, { resultatsAttendus: e.target.value })
                            }
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Actions Requises</label>
                        <input
                          type="text"
                          value={act.actionsRequises}
                          onChange={(e) =>
                            handleUpdateActivity(selectedTableauIdx, actIdx, { actionsRequises: e.target.value })
                          }
                          className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Indicateurs de Résultats</label>
                          <input
                            type="text"
                            value={act.indicateursResultats}
                            onChange={(e) =>
                              handleUpdateActivity(selectedTableauIdx, actIdx, { indicateursResultats: e.target.value })
                            }
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px] font-mono text-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Responsables</label>
                          <input
                            type="text"
                            value={act.responsables}
                            onChange={(e) =>
                              handleUpdateActivity(selectedTableauIdx, actIdx, { responsables: e.target.value })
                            }
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3 : CHRONOGRAMME RÉCAPITULATIF DES 13 ACTIONS PRIORITAIRES */}
      {activeTab === 'chronogramme' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Chronogramme d&apos;exécution séquencé par trimestre (T1, T2, T3, T4) pour le suivi contradictoire.
          </p>

          <div className="space-y-2">
            {officialPtaData.chronogrammePrioritaire.map((prio, pIdx) => (
              <div
                key={prio.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    {prio.numero}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-100 truncate">{prio.activite}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Resp: {prio.responsable} • Cible: {prio.cibleAnnuelle}
                    </p>
                  </div>
                </div>

                {/* Period checkboxes */}
                <div className="flex items-center gap-1 text-[10px] font-mono shrink-0">
                  {(['t1', 't2', 't3', 't4'] as const).map((q) => (
                    <label
                      key={q}
                      className={`px-2 py-0.5 rounded cursor-pointer border ${
                        prio.periodes[q]
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={prio.periodes[q]}
                        onChange={(e) => {
                          const updated = [...officialPtaData.chronogrammePrioritaire];
                          updated[pIdx] = {
                            ...updated[pIdx],
                            periodes: { ...updated[pIdx].periodes, [q]: e.target.checked },
                          };
                          updateOfficialPtaData((prev) => ({ ...prev, chronogrammePrioritaire: updated }));
                        }}
                      />
                      {q.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4 : BUDGET PRÉVISIONNEL MINIMAL (3 696 000 FCFA) */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">
                Enveloppe Minimale Requise 2026
              </span>
              <p className="text-lg font-bold font-mono text-slate-100">
                {formatCfa(officialPtaData.totalGeneralBudgetCfa)}
              </p>
            </div>
            <span className="text-xs text-slate-400 italic">5 Sections A à E</span>
          </div>

          <div className="space-y-4">
            {officialPtaData.budgetSections.map((sec, sIdx) => (
              <div key={sec.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200">
                    {sec.lettre}. {sec.titre}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatCfa(sec.sousTotalCfa)}
                  </span>
                </div>

                <div className="space-y-2">
                  {sec.lignes.map((line, lIdx) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={line.poste}
                          onChange={(e) => handleUpdateBudgetLine(sIdx, lIdx, { poste: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-medium"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={line.detail}
                          onChange={(e) => handleUpdateBudgetLine(sIdx, lIdx, { detail: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px]"
                        />
                      </div>
                      <div className="col-span-4 flex items-center gap-1">
                        <input
                          type="number"
                          value={line.totalCfa}
                          onChange={(e) => handleUpdateBudgetLine(sIdx, lIdx, { totalCfa: Number(e.target.value) || 0 })}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-right"
                        />
                        <span className="text-[10px] text-slate-500">F</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5 : RECOMMANDATIONS & RISQUES */}
      {activeTab === 'recommandations' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2">
              Recommandations Prioritaires à la Hiérarchie
            </h4>
            <div className="space-y-2.5">
              {officialPtaData.recommandationsHierarchie.map((rec) => (
                <div key={rec.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">
                      {rec.numero}. {rec.titre}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        rec.priorite === 'CRITIQUE'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : rec.priorite === 'HAUTE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {rec.priorite}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{rec.points.join(' ; ')}</p>
                  <p className="text-[10px] text-slate-500 italic">Justif: {rec.justification}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300 mb-1">Signataire Officiel</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={officialPtaData.signataireNom}
                onChange={(e) => handleUpdatePtaField('signataireNom', e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-bold text-xs"
              />
              <input
                type="text"
                value={officialPtaData.signataireTitre}
                onChange={(e) => handleUpdatePtaField('signataireTitre', e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Pta2026CanvaPreview: React.FC = () => {
  const { officialPtaData, resetPtaToOfficialModel, showNotification } = useApp();

  const handleDownloadDocx = async () => {
    try {
      await generatePta2026Docx(officialPtaData);
      showNotification('success', 'Plan de Travail Annuel (PTA 2026) exporté en format Word (.docx) avec succès !');
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'exportation Word : ${err.message}`);
    }
  };

  const handlePrint = () => {
    printHtmlElement('canva-printable-pta-2026', 'Plan_de_Travail_Annuel_PTA_2026_DDL_PN');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Preview Action Bar */}
      <div className="no-print w-full max-w-[210mm] flex items-center justify-between pb-2 mb-2 text-xs text-slate-400 border-b border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Aperçu Document Officiel (Police Garamond 13pt • Format Républicain A4)</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadDocx}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow transition flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Télécharger Word (.docx)</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] shadow transition flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            <span>Imprimer PTA A4</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT OFFICIEL A4 PRINTABLE (CONFORME AU MODÈLE DU DIRECTEUR DÉPARTEMENTAL) */}
      <div
        id="canva-printable-pta-2026"
        className="page-a4 bg-white text-slate-900 rounded-xl shadow-2xl max-w-[210mm] w-full border border-slate-300 font-garamond p-8 sm:p-10 text-[11.5pt] leading-relaxed select-text space-y-6"
        style={{
          paddingLeft: '2.5cm',
          paddingRight: '2.0cm',
          paddingTop: '2.0cm',
          paddingBottom: '2.0cm',
        }}
      >
        {/* En-tête républicain 2 colonnes */}
        <div className="flex justify-between items-start gap-4 border-b border-slate-900 pb-4">
          <div className="text-left space-y-0.5 max-w-[60%]">
            <p className="font-bold uppercase text-[9.5pt] tracking-wider text-slate-950 leading-tight">
              {officialPtaData.ministere}
            </p>
            <p className="text-[8pt] text-slate-600">--------------------</p>
            <p className="font-bold text-[9pt] text-slate-950 uppercase tracking-wide leading-tight">
              {officialPtaData.directionGenerale}
            </p>
            <p className="text-[8pt] text-slate-600">--------------------</p>
            <p className="font-bold text-[9pt] text-slate-950 uppercase tracking-wide leading-tight">
              {officialPtaData.directionDepartementale}
            </p>
          </div>

          <div className="text-right space-y-0.5 shrink-0">
            <p className="font-bold uppercase text-[10pt] tracking-wider text-slate-950">
              {officialPtaData.republique}
            </p>
            <p className="italic text-[9pt] text-slate-700">
              {officialPtaData.devise}
            </p>
            <p className="text-[8pt] text-slate-600">--------------------</p>
            <p className="text-[9pt] text-slate-800">
              {officialPtaData.lieuSignature}, {officialPtaData.dateSignature}
            </p>
          </div>
        </div>

        {/* Titre Principal */}
        <div className="text-center my-6 py-3 border-y-2 border-slate-900 bg-slate-50/60">
          <h1 className="font-bold text-[16pt] uppercase tracking-wider text-slate-950">
            {officialPtaData.titre}
          </h1>
          <p className="font-bold text-[11pt] uppercase tracking-wide text-slate-800 mt-1">
            {officialPtaData.directionDepartementale}
          </p>
        </div>

        {/* NOTE DE PRÉSENTATION */}
        <div className="space-y-3">
          <h2 className="font-bold text-[13pt] uppercase text-slate-950 border-b border-slate-400 pb-1">
            Note de Présentation
          </h2>
          <p className="text-[11.5pt] text-justify leading-relaxed">
            Le Plan de Travail Annuel 2026 de la Direction Départementale des Loisirs de Pointe-Noire s&apos;inscrit dans la continuité de l&apos;exercice 2025 tout en tirant les enseignements des difficultés rencontrées et des opportunités identifiées.
          </p>

          <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
            <p className="font-bold text-[11pt] text-slate-950">Contexte et Leçons de 2025 :</p>
            {officialPtaData.notePresentation.contexteLecons2025.map((l, i) => (
              <p key={i} className="text-[11pt] pl-3">• {l}</p>
            ))}
            <p className="text-[10.5pt] italic text-slate-700 pt-1">
              Partenaires stratégiques identifiés : {officialPtaData.notePresentation.partenaires2025.join(', ')}.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-[11pt] text-slate-950">Orientations Stratégiques 2026 (Les 4 Piliers) :</p>
            {officialPtaData.notePresentation.orientationsStrategiques4Piliers.map((p, i) => (
              <p key={i} className="text-[11pt] pl-3">
                <strong>{i + 1}.</strong> {p}
              </p>
            ))}
          </div>

          <p className="text-[11pt] text-justify font-semibold">
            {officialPtaData.notePresentation.ambitionRealismeResume}
          </p>

          <p className="text-[11pt] text-justify italic bg-emerald-50/50 p-2.5 rounded border border-emerald-200 text-slate-900">
            {officialPtaData.notePresentation.objectifGlobal}
          </p>
        </div>

        {/* LES 7 TABLEAUX D'ACTIVITÉS */}
        <div className="space-y-6 pt-4">
          <h2 className="font-bold text-[13pt] uppercase text-slate-950 border-b border-slate-400 pb-1">
            Programmation des Activités par Service (Les 7 Tableaux)
          </h2>

          {officialPtaData.tableauxActivites.map((tab) => (
            <div key={tab.id} className="space-y-2">
              <h3 className="font-bold text-[11pt] uppercase text-slate-900 bg-slate-100 p-1.5 border border-slate-300">
                Tableau {tab.numero} : {tab.titre}
              </h3>
              <div className="overflow-x-auto border border-slate-400">
                <table className="w-full text-[10pt] border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center">
                      <th className="p-1.5 border border-slate-700 w-28">Activités</th>
                      <th className="p-1.5 border border-slate-700 w-28">Objectifs</th>
                      <th className="p-1.5 border border-slate-700 w-28">Résultats</th>
                      <th className="p-1.5 border border-slate-700 w-44">Actions requises</th>
                      <th className="p-1.5 border border-slate-700 w-32">Indicateurs</th>
                      <th className="p-1.5 border border-slate-700 w-16">Resp.</th>
                      <th className="p-1.5 border border-slate-700 w-12">Période</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tab.activites.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50">
                        <td className="p-1.5 border border-slate-300 font-bold align-top">{act.activite}</td>
                        <td className="p-1.5 border border-slate-300 align-top">{act.objectifs}</td>
                        <td className="p-1.5 border border-slate-300 align-top">{act.resultatsAttendus}</td>
                        <td className="p-1.5 border border-slate-300 align-top">{act.actionsRequises}</td>
                        <td className="p-1.5 border border-slate-300 align-top font-mono text-[9pt]">{act.indicateursResultats}</td>
                        <td className="p-1.5 border border-slate-300 text-center align-top font-bold text-[9pt]">{act.responsables}</td>
                        <td className="p-1.5 border border-slate-300 text-center align-top font-mono font-bold text-[9pt]">
                          {act.periodes.t1 && 'T1 '}
                          {act.periodes.t2 && 'T2 '}
                          {act.periodes.t3 && 'T3 '}
                          {act.periodes.t4 && 'T4'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* CHRONOGRAMME RÉCAPITULATIF DES 13 ACTIONS PRIORITAIRES */}
        <div className="space-y-3 pt-4">
          <h2 className="font-bold text-[13pt] uppercase text-slate-950 border-b border-slate-400 pb-1">
            Chronogramme Récapitulatif des 13 Activités Prioritaires
          </h2>
          <div className="overflow-x-auto border border-slate-400">
            <table className="w-full text-[10pt] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-center">
                  <th className="p-1.5 border border-slate-700 w-8">N°</th>
                  <th className="p-1.5 border border-slate-700 text-left">Activités</th>
                  <th className="p-1.5 border border-slate-700 w-8">T1</th>
                  <th className="p-1.5 border border-slate-700 w-8">T2</th>
                  <th className="p-1.5 border border-slate-700 w-8">T3</th>
                  <th className="p-1.5 border border-slate-700 w-8">T4</th>
                  <th className="p-1.5 border border-slate-700 w-28">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {officialPtaData.chronogrammePrioritaire.map((prio) => (
                  <tr key={prio.id} className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-bold font-mono">{prio.numero}</td>
                    <td className="p-1.5 border border-slate-300 font-semibold">{prio.activite}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">{prio.periodes.t1 ? '✓' : ''}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">{prio.periodes.t2 ? '✓' : ''}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">{prio.periodes.t3 ? '✓' : ''}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">{prio.periodes.t4 ? '✓' : ''}</td>
                    <td className="p-1.5 border border-slate-300 text-center text-[9pt] font-mono">{prio.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BUDGET PRÉVISIONNEL MINIMAL (3 696 000 FCFA) */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center border-b border-slate-400 pb-1">
            <h2 className="font-bold text-[13pt] uppercase text-slate-950">
              Budget Prévisionnel Minimal 2026
            </h2>
            <span className="font-mono font-bold text-[12pt] text-slate-900">
              Total : {formatCfa(officialPtaData.totalGeneralBudgetCfa)}
            </span>
          </div>

          {officialPtaData.budgetSections.map((sec) => (
            <div key={sec.id} className="space-y-1">
              <p className="font-bold text-[10.5pt] text-slate-900">
                {sec.lettre}. {sec.titre} — Sous-total : {formatCfa(sec.sousTotalCfa)}
              </p>
              <table className="w-full text-[9.5pt] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <th className="p-1 border border-slate-300 text-left">Postes</th>
                    <th className="p-1 border border-slate-300 text-left">Détail</th>
                    <th className="p-1 border border-slate-300 text-left">Coût unitaire</th>
                    <th className="p-1 border border-slate-300 text-center">Quantité</th>
                    <th className="p-1 border border-slate-300 text-right">Total (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.lignes.map((l) => (
                    <tr key={l.id}>
                      <td className="p-1 border border-slate-200">{l.poste}</td>
                      <td className="p-1 border border-slate-200 italic">{l.detail}</td>
                      <td className="p-1 border border-slate-200">{l.coutUnitaire}</td>
                      <td className="p-1 border border-slate-200 text-center">{l.quantite}</td>
                      <td className="p-1 border border-slate-200 text-right font-mono font-bold">{formatCfa(l.totalCfa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* RECOMMANDATIONS PRIORITAIRES & CONCLUSION */}
        <div className="space-y-3 pt-4">
          <h2 className="font-bold text-[13pt] uppercase text-slate-950 border-b border-slate-400 pb-1">
            Recommandations Prioritaires à la Hiérarchie
          </h2>
          <div className="space-y-2">
            {officialPtaData.recommandationsHierarchie.map((r) => (
              <p key={r.id} className="text-[11pt]">
                <strong>{r.numero}. {r.titre} [{r.priorite}] :</strong> {r.points.join(' ; ')}
                <span className="italic text-slate-700"> — {r.justification}</span>
              </p>
            ))}
          </div>

          <h2 className="font-bold text-[13pt] uppercase text-slate-950 border-b border-slate-400 pb-1 pt-3">
            Conclusion
          </h2>
          <p className="text-[11.5pt] text-justify leading-relaxed">
            {officialPtaData.conclusion.paragrapheIntro}
          </p>
          <p className="text-[11.5pt] text-justify font-bold leading-relaxed">
            {officialPtaData.conclusion.transformation2026}
          </p>

          {/* Signature républicaine du Directeur */}
          <div className="pt-8 flex justify-end">
            <div className="text-right space-y-1 min-w-[260px]">
              <p className="text-[11pt] text-slate-800">
                Fait à {officialPtaData.lieuSignature}, le _____ {officialPtaData.dateSignature}
              </p>
              <p className="font-bold text-[11.5pt] text-slate-950">
                {officialPtaData.signataireTitre}
              </p>
              <div className="h-16 flex items-end justify-end">
                <span className="italic text-[10pt] text-slate-400">[Sceau et signature officielle]</span>
              </div>
              <p className="font-bold text-[12pt] uppercase tracking-wider underline text-slate-950 pt-2">
                {officialPtaData.signataireNom}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
