import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  Sparkles,
  Printer,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  QrCode,
  Plus,
} from 'lucide-react';

export const SpaPromotionModule: React.FC = () => {
  const { establishments, openPrintModal, showNotification } = useApp();

  const [selectedEstId, setSelectedEstId] = useState(establishments[0]?.id || '');
  const [activeEvents, setActiveEvents] = useState([
    {
      id: 'evt-01',
      titre: 'Nuit des Loisirs Sains & Acoustique Douce',
      lieu: 'Le Palmier VIP Lounge & Club (Lumumba)',
      date: '2026-04-18',
      label: 'Certifié Conforme DDL-PN',
      decibelsMax: 70,
    },
    {
      id: 'evt-02',
      titre: 'Festival Départemental des Terrasses Vivantes',
      lieu: 'Complexe Récréatif La Baie des Anges (Loandjili)',
      date: '2026-05-01',
      label: 'Label Éco-Acoustique 2026',
      decibelsMax: 65,
    },
  ]);

  const [newEvtTitre, setNewEvtTitre] = useState('');
  const [newEvtLieu, setNewEvtLieu] = useState('');
  const [newEvtDate, setNewEvtDate] = useState('2026-05-15');

  const selectedEst = establishments.find((e) => e.id === selectedEstId) || establishments[0];

  const handlePrintDiploma = () => {
    if (!selectedEst) return;
    openPrintModal('spa_diploma', selectedEst);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvtTitre) return;
    setActiveEvents((prev) => [
      ...prev,
      {
        id: 'evt-' + Date.now(),
        titre: newEvtTitre,
        lieu: newEvtLieu || selectedEst.nomCommercial,
        date: newEvtDate,
        label: 'Label Conforme DDL-PN',
        decibelsMax: 68,
      },
    ]);
    setNewEvtTitre('');
    showNotification('success', 'Événement culturel labellisé enregistré au registre SPA !');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-08
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Service Promotion des Loisirs Sains (SPA)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Animation, labellisation éco-responsable, Diplômes d'Honneur et macarons officiels de vitrine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 1 : Générateur de Diplôme & Macaron (7 colonnes) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Attribution du Diplôme d'Honneur Départemental</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              Charte Acoustique
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Choisir l'établissement exemplaire</label>
              <select
                value={selectedEstId}
                onChange={(e) => setSelectedEstId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold"
              >
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nomCommercial} — {est.arrondissement} (Limiteur : {est.limiteurInstalle ? 'OUI' : 'NON'})
                  </option>
                ))}
              </select>
            </div>

            {/* Diploma Preview Card */}
            {selectedEst && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-emerald-950/40 border-2 border-amber-500/40 text-center space-y-3 relative overflow-hidden shadow-2xl">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                    RÉPUBLIQUE DU CONGO • DDL-PN
                  </p>
                  <h3 className="font-cinzel text-lg md:text-xl font-black text-amber-200 uppercase">
                    DIPLÔME D'HONNEUR DE CITOYENNETÉ & LOISIRS SAINS
                  </h3>
                  <p className="text-xs text-slate-300">
                    Décerné à l'établissement d'excellence :
                  </p>
                  <p className="text-base font-bold font-cinzel text-white uppercase tracking-wider">
                    « {selectedEst.nomCommercial} »
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Arrondissement de {selectedEst.arrondissement} • Promoteur : {selectedEst.promoteurNom}
                  </p>
                </div>

                <p className="text-[11px] text-slate-300 italic max-w-md mx-auto leading-relaxed">
                  En reconnaissance de son exemplarité en matière de tranquillité publique, du strict respect des seuils sonores réglementaires et de son adhésion à la Charte Départementale des Loisirs Sains.
                </p>

                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 font-mono">
                  <span>Code Label: DDL-SPA-2026/{selectedEst.id.slice(-4)}</span>
                  <span>Limiteur homologué : {selectedEst.limiteurInstalle ? 'Conforme' : 'Exigé'}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handlePrintDiploma}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimer le Diplôme & Macaron Vitrine
              </button>
            </div>
          </div>
        </div>

        {/* Section 2 : Registre des Événements Festifs Labellisés (5 colonnes) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Événements Labellisés « Loisirs Sains »</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              Registre Annuel
            </span>
          </div>

          <div className="space-y-3">
            {activeEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs"
              >
                <div className="flex justify-between items-start font-bold">
                  <span className="text-slate-100">{evt.titre}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    {evt.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{evt.lieu}</p>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                  <span>Date : {evt.date}</span>
                  <span className="text-emerald-400">Plafond : {evt.decibelsMax} dB(A)</span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddEvent} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2 text-xs">
            <p className="font-semibold text-slate-200 text-xs">Ajouter un Événement au Registre</p>
            <input
              type="text"
              required
              value={newEvtTitre}
              onChange={(e) => setNewEvtTitre(e.target.value)}
              placeholder="Nom de l'événement culturel..."
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newEvtDate}
                onChange={(e) => setNewEvtDate(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
              />
              <button
                type="submit"
                className="py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Labelliser
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
