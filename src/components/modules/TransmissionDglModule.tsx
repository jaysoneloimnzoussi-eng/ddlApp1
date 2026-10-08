import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  FileCheck,
  Building,
  Printer,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { SoitTransmisDgl } from '../../types';
import { formatCfa } from '../../services/crypto';

export const TransmissionDglModule: React.FC = () => {
  const { soitTransmis, createSoitTransmis, establishments, showNotification } = useApp();

  const [selectedBordereau, setSelectedBordereau] = useState<SoitTransmisDgl>(
    soitTransmis[0] || null
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEstIds, setSelectedEstIds] = useState<string[]>([]);
  const [observations, setObservations] = useState(
    'Dossiers entièrement régularisés au niveau départemental avec quittances SAF et contrôles acoustiques conformes.'
  );

  // Eligible establishments (with status 'en_regle' or 'attestation_provisoire')
  const eligibleEsts = establishments.filter(
    (e) => e.statut === 'en_regle' || e.statut === 'attestation_provisoire'
  );

  const handleToggleEst = (id: string) => {
    setSelectedEstIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateBordereau = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEstIds.length === 0) {
      showNotification('warning', 'Veuillez sélectionner au moins un dossier d\'établissement.');
      return;
    }

    const items = selectedEstIds.map((id) => {
      const e = establishments.find((x) => x.id === id)!;
      return {
        etablissementNom: e.nomCommercial,
        promoteurNom: e.promoteurNom,
        arrondissement: e.arrondissement,
        montantRegieAcquitte: e.montantEncaisse,
        referenceDossier: e.codeDossier,
      };
    });

    const newBT = await createSoitTransmis({
      dateTransmission: new Date().toISOString().substring(0, 10),
      nombreDossiers: items.length,
      listeEtablissements: items,
      statut: 'prepare',
      signataireDepartemental: 'Directeur Départemental des Loisirs',
      observations,
    });

    setSelectedBordereau(newBT);
    setIsModalOpen(false);
    setSelectedEstIds([]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-09
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Bordereaux de Soit-Transmis DGL Brazzaville
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Liaison hiérarchique officielle entre Pointe-Noire et la Direction Générale des Loisirs à Brazzaville pour agrément définitif
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Nouveau Bordereau Soit-Transmis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste des Bordereaux (4 colonnes) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Historique des Envois ({soitTransmis.length})</span>
          </h2>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {soitTransmis.map((bt) => {
              const isSelected = selectedBordereau?.id === bt.id;
              return (
                <button
                  key={bt.id}
                  onClick={() => setSelectedBordereau(bt)}
                  className={`w-full text-left p-3 rounded-lg border transition space-y-1.5 ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {bt.numeroBordereau}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                        bt.statut === 'agrement_signe'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : bt.statut === 'recu_brazzaville'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {bt.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-medium">
                    {bt.nombreDossiers} dossiers transmis
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                    <span>Date: {bt.dateTransmission}</span>
                    <span>Signé: DDL-PN</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Détail du Bordereau sélectionné (8 colonnes) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          {selectedBordereau ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {selectedBordereau.numeroBordereau}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Transmis le {selectedBordereau.dateTransmission} à la DGL Brazzaville
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  Imprimer le Soit-Transmis A4
                </button>
              </div>

              {/* Status progression bar */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-200">1. Transmis de Pointe-Noire</span>
                </div>
                <span className="text-slate-500">&rarr;</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedBordereau.statut === 'recu_brazzaville' || selectedBordereau.statut === 'agrement_signe' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className="font-semibold text-slate-200">2. Réceptionné à Brazzaville</span>
                </div>
                <span className="text-slate-500">&rarr;</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedBordereau.statut === 'agrement_signe' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className="font-semibold text-slate-200">3. Agrément Ministériel Délivré</span>
                </div>
              </div>

              {/* Tableau des établissements inclus */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Dossiers Inclus dans ce Bordereau ({selectedBordereau.listeEtablissements.length})
                </h4>
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[550px]">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Réf. Dossier</th>
                          <th className="p-2.5">Établissement</th>
                          <th className="p-2.5">Promoteur</th>
                          <th className="p-2.5">Arrondissement</th>
                          <th className="p-2.5 text-right">Recette Acquittée</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedBordereau.listeEtablissements.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 text-slate-200">
                            <td className="p-2.5 font-mono text-[11px] text-slate-400">{item.referenceDossier}</td>
                            <td className="p-2.5 font-bold">{item.etablissementNom}</td>
                            <td className="p-2.5">{item.promoteurNom}</td>
                            <td className="p-2.5">{item.arrondissement}</td>
                            <td className="p-2.5 text-right font-mono text-emerald-400 font-semibold">
                              {formatCfa(item.montantRegieAcquitte)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {selectedBordereau.observations && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                  <span className="font-semibold text-slate-400 block">Notes administratives :</span>
                  <p className="text-slate-300 italic">{selectedBordereau.observations}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">
              Sélectionnez un bordereau pour afficher les détails.
            </p>
          )}
        </div>
      </div>

      {/* Modal Nouveau Bordereau */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-cinzel">
              <Send className="w-5 h-5 text-emerald-400" />
              Créer un Bordereau Soit-Transmis vers Brazzaville
            </h2>

            <form onSubmit={handleCreateBordereau} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-2">
                  Sélectionner les dossiers régularisés à expédier ({selectedEstIds.length} sélectionnés)
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950">
                  {eligibleEsts.map((est) => (
                    <label
                      key={est.id}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEstIds.includes(est.id)}
                        onChange={() => handleToggleEst(est.id)}
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                      />
                      <div className="flex-1 text-slate-200">
                        <span className="font-bold">{est.nomCommercial}</span> ({est.arrondissement}) —{' '}
                        <span className="font-mono text-emerald-400">{formatCfa(est.montantEncaisse)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Observations d'accompagnement</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow"
                >
                  Générer le Bordereau Officiel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
