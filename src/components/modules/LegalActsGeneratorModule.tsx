import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scale,
  AlertTriangle,
  Clock,
  Shield,
  FileCheck2,
  Plus,
  Volume2,
  Printer,
  Calendar,
  Lock,
  Radio,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { LegalAct, Arrondissement } from '../../types';
import { CountdownTimer72h } from '../common/CountdownTimer72h';
import { SonometerTool } from '../common/SonometerTool';

export const LegalActsGeneratorModule: React.FC = () => {
  const {
    legalActs,
    issueLegalAct,
    establishments,
    openPrintModal,
    showNotification,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedActType, setSelectedActType] = useState<LegalAct['type']>('mise_en_demeure');
  const [selectedEstId, setSelectedEstId] = useState(establishments[0]?.id || '');
  const [motifs, setMotifs] = useState(
    'Dépassement anormal des seuils sonores autorisés de nuit (mesure sonométrique supérieure à 85 dB(A)) et défaut d\'installation du limiteur homologué.'
  );
  const [delaiHeures, setDelaiHeures] = useState<number>(72);
  const [decibelsMesures, setDecibelsMesures] = useState<number>(88);
  const [showSonometer, setShowSonometer] = useState<boolean>(false);
  const [inspecteur1, setInspecteur1] = useState('Gildas Ambetos (Inspecteur Chef SAA)');
  const [inspecteur2, setInspecteur2] = useState('Patrice Bitemo (Inspecteur SAA)');

  const handleCreateAct = async (e: React.FormEvent) => {
    e.preventDefault();
    const est = establishments.find((e) => e.id === selectedEstId);
    if (!est) return;

    const now = new Date();
    const expireDate = new Date(now.getTime() + delaiHeures * 3600 * 1000);

    const newAct = await issueLegalAct({
      type: selectedActType,
      dateEmission: now.toISOString().substring(0, 10),
      etablissementId: est.id,
      etablissementNom: est.nomCommercial,
      promoteurNom: est.promoteurNom,
      arrondissement: est.arrondissement,
      motifs,
      delaiHeures: selectedActType === 'mise_en_demeure' ? delaiHeures : undefined,
      expireAt: selectedActType === 'mise_en_demeure' ? expireDate.toISOString() : undefined,
      decibelsMesures: Number(decibelsMesures),
      inspecteursAssermentes: [inspecteur1, inspecteur2].filter(Boolean),
      statutExecution: 'actif',
    });

    setIsModalOpen(false);
    openPrintModal('a4_legal_act', newAct);
  };

  const handleTransmitPolice = (act: LegalAct) => {
    showNotification(
      'warning',
      `Réquisition N° REQ-${act.referenceNumero} transmise au Commissariat Central de Pointe-Noire pour pose de scellés !`
    );
  };

  const filteredActs = legalActs.filter((a) => {
    return filterType === 'all' || a.type === filterType;
  });

  return (
    <div className={`p-4 md:p-6 space-y-6 max-w-7xl mx-auto transition-colors duration-200 ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`}>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              MOD-05
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Police Administrative des Loisirs & Contentieux
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mises en demeure 72h avec compte à rebours interactif, arrêtés de fermeture immédiate, PV de sonométrie & ordres de mission SAA
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Générer un Acte Solennel
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Tous les Actes' },
          { id: 'mise_en_demeure', label: 'Mises en Demeure (72h)' },
          { id: 'arrete_fermeture', label: 'Arrêtés de Fermeture' },
          { id: 'pv_sonometrie', label: 'PV Sonométrie (Décibels)' },
          { id: 'ordre_mission', label: 'Ordres de Mission SAA' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filterType === tab.id
                ? isLight
                  ? 'bg-slate-200 text-slate-900 border border-slate-300'
                  : 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Legal Acts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActs.map((act) => {
          const isMD = act.type === 'mise_en_demeure';
          const isFerm = act.type === 'arrete_fermeture';

          return (
            <div
              key={act.id}
              className={`p-4 rounded-xl border space-y-3 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                isFerm
                  ? isLight ? 'bg-red-50/70 border-red-200 text-red-950' : 'bg-red-950/20 border-red-800/60'
                  : isMD
                  ? isLight ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-800/60'
                  : isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {act.referenceNumero}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                      isFerm
                        ? 'bg-red-600 text-white'
                        : isMD
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {act.type.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100">{act.etablissementNom}</h3>
                  <p className="text-xs text-slate-400">
                    Promoteur: <span className="text-slate-200 font-semibold">{act.promoteurNom}</span> ({act.arrondissement})
                  </p>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-300 leading-relaxed text-[11px] line-clamp-3">
                    {act.motifs}
                  </p>
                  {act.decibelsMesures && (
                    <div className="flex items-center gap-1.5 font-mono text-red-400 font-bold text-xs pt-1 border-t border-slate-800">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Relevé Sonométrique : {act.decibelsMesures} dB(A)</span>
                    </div>
                  )}
                </div>

                {/* 72H Countdown component if active */}
                {isMD && (
                  <div className="pt-1">
                    <CountdownTimer72h expireAt={act.expireAt} />
                  </div>
                )}
              </div>

              {/* Actions Strip */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                {isMD && (
                  <button
                    onClick={() => handleTransmitPolice(act)}
                    className="px-2 py-1 rounded bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 font-semibold flex items-center gap-1 transition"
                  >
                    <Building className="w-3 h-3 text-red-400" />
                    <span>Réquisitionner Force Publique</span>
                  </button>
                )}

                <button
                  onClick={() => openPrintModal('a4_legal_act', act)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 transition ml-auto"
                >
                  <Printer className="w-3 h-3 text-emerald-400" />
                  Imprimer Acte A4
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Legal Act */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-cinzel">
              <Scale className="w-5 h-5 text-red-400" />
              Rédaction d'un Acte de Police Administrative
            </h2>

            <form onSubmit={handleCreateAct} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nature de l'Acte Solennel</label>
                <select
                  value={selectedActType}
                  onChange={(e) => setSelectedActType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                >
                  <option value="mise_en_demeure">Mise en Demeure sous 72 heures</option>
                  <option value="arrete_fermeture">Arrêté de Fermeture Administrative Immédiate</option>
                  <option value="pv_sonometrie">Procès-Verbal de Constat Sonométrique Contradictoire</option>
                  <option value="ordre_mission">Ordre de Mission Officiel SAA</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Établissement Visé</label>
                <select
                  value={selectedEstId}
                  onChange={(e) => setSelectedEstId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nomCommercial} — {est.arrondissement} (Promoteur: {est.promoteurNom})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Motifs Détaillés & Constats SAA</label>
                <textarea
                  rows={3}
                  required
                  value={motifs}
                  onChange={(e) => setMotifs(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              {/* Sonomètre Tool */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">
                    Mesure Sonométrique : <span className="font-mono text-red-400 font-bold">{decibelsMesures} dB(A)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSonometer(!showSonometer)}
                    className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1"
                  >
                    <Radio className="w-3 h-3" />
                    <span>{showSonometer ? 'Masquer' : 'Ajuster avec Sonomètre'}</span>
                  </button>
                </div>

                {showSonometer && (
                  <SonometerTool
                    initialDb={decibelsMesures}
                    onCaptureDecibels={(db) => {
                      setDecibelsMesures(db);
                      setShowSonometer(false);
                    }}
                  />
                )}
              </div>

              {selectedActType === 'mise_en_demeure' && (
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Délai d'Injonction (Heures)</label>
                  <input
                    type="number"
                    value={delaiHeures}
                    onChange={(e) => setDelaiHeures(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-amber-300 font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Inspecteur Assermenté 1</label>
                  <input
                    type="text"
                    value={inspecteur1}
                    onChange={(e) => setInspecteur1(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Inspecteur Assermenté 2</label>
                  <input
                    type="text"
                    value={inspecteur2}
                    onChange={(e) => setInspecteur2(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
                >
                  Émettre et Signer l'Acte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
