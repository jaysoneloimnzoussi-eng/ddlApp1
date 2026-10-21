import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertTriangle,
  X,
  Printer,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';
import { Establishment } from '../../types';

interface IssueConvocationModalProps {
  establishment: Establishment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const IssueConvocationModal: React.FC<IssueConvocationModalProps> = ({
  establishment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { issueConvocation, openPrintModal, showNotification, theme } = useApp();
  const isLight = theme === 'light';

  // Calcul d'une date par défaut (+8 jours)
  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const [dateComparution, setDateComparution] = useState<string>(defaultDate);
  const [heureComparution, setHeureComparution] = useState<string>('09:00');
  const [lieuComparution, setLieuComparution] = useState<string>(
    'Direction Départementale des Loisirs (Bâtiment de la Préfecture, Centre-Ville, en face du Trésor Public, au rez-de-chaussée)'
  );
  const [montantForfait, setMontantForfait] = useState<number>(50000);
  const [observations, setObservations] = useState<string>(
    "Délivrée in situ lors de la tournée de repérage de la brigade mobile SAA"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !establishment) return null;

  const setPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    setDateComparution(`${y}-${m}-${day}`);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateComparution) {
      showNotification('error', 'Veuillez définir une date de comparution.');
      return;
    }

    setIsSubmitting(true);
    try {
      const conv = await issueConvocation(establishment.id, {
        dateComparution,
        heureComparution,
        lieuComparution,
        montantForfait,
        observations,
      });

      // Ouvrir immédiatement le gabarit A4 officiel avec QR code
      openPrintModal('a4_convocation', {
        ...establishment,
        referenceConvocation: conv.referenceConvocation,
        dateEmission: conv.dateEmission,
        dateComparution: conv.dateComparution,
        heureComparution: conv.heureComparution,
        lieuComparution: conv.lieuComparution,
        montantForfaitNotifie: conv.montantForfaitNotifie,
        motifConvocation: conv.motifConvocation,
        piecesRequises: conv.piecesRequises,
        inspecteurNom: conv.inspecteurNom,
        inspecteurMatricule: conv.inspecteurMatricule,
        observations: conv.observations,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showNotification('error', `Échec d'émission de la convocation : ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Convocation Officielle</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold">
                  Forfait 50 000 FCFA
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Procédure de régularisation du tenancier repéré in situ (Loi 21-2019)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirm} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Établissement Cible */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {establishment.nomCommercial}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Promoteur : {establishment.promoteurNom} • {establishment.arrondissement} ({establishment.quartier})
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dossier</span>
              <span className="font-mono text-xs font-bold text-amber-500">{establishment.codeDossier}</span>
            </div>
          </div>

          {/* Montant Forfaitaire Initial */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Montant Forfaitaire Notifié au Promoteur
              </span>
              <span className="text-emerald-500 font-mono font-black">{formatCfa(montantForfait)}</span>
            </label>
            <input
              type="number"
              value={montantForfait}
              onChange={(e) => setMontantForfait(Number(e.target.value) || 0)}
              className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold transition ${
                isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            />
            <p className="text-[11px] text-slate-500">
              * Forfait standard réglementaire pour établissement informel avant toute négociation à la Direction.
            </p>
          </div>

          {/* Date & Raccourcis de Comparution */}
          <div className="space-y-2">
            <label className="font-bold text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Date Limite de Comparution
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPresetDays(3)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition font-medium"
              >
                +3 jours (Urgence)
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(8)}
                className="px-2.5 py-1 text-xs rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-500 font-bold transition"
              >
                +8 jours (Standard)
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(15)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition font-medium"
              >
                +15 jours (Délai légal)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Date</label>
                <input
                  type="date"
                  required
                  value={dateComparution}
                  onChange={(e) => setDateComparution(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-mono transition ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Heure</label>
                <input
                  type="time"
                  value={heureComparution}
                  onChange={(e) => setHeureComparution(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-mono transition ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Lieu de Comparution */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Lieu de Convocation
            </label>
            <select
              value={lieuComparution}
              onChange={(e) => setLieuComparution(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm transition ${
                isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            >
              <option value="Direction Départementale des Loisirs (Bâtiment de la Préfecture, Centre-Ville, en face du Trésor Public, au rez-de-chaussée)">
                Direction Départementale des Loisirs (Bâtiment de la Préfecture, Centre-Ville, en face du Trésor Public, au rez-de-chaussée)
              </option>
              <option value="Bureau de Brigade SAA - Tié-Tié">Bureau de Brigade SAA - Tié-Tié</option>
              <option value="Bureau de Brigade SAA - Mvou-Mvou">Bureau de Brigade SAA - Mvou-Mvou</option>
              <option value="Bureau de Brigade SAA - Loandjili">Bureau de Brigade SAA - Loandjili</option>
              <option value="Bureau de Brigade SAA - Ngoyo">Bureau de Brigade SAA - Ngoyo</option>
            </select>
          </div>

          {/* Observations / Motif */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs">Observations de l'Agent lors du Repérage</label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Établissement en pleine activité commerciale nocturne sans autorisation préalable..."
              className={`w-full px-3 py-2 rounded-xl border text-xs transition ${
                isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            />
          </div>

          {/* Pièces requises rappelées */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              📄 Pièces administratives à exiger du tenancier :
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[10px]">
              <li>Pièce d'identité du promoteur / gérant (CNI ou Passeport)</li>
              <li>Contrat de bail ou titre d'occupation du local</li>
              <li>Registre du commerce (RCCM) ou déclaration d'activité</li>
              <li>Quittances antérieures de versement éventuelles</li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold shadow-lg shadow-amber-900/30 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Émission...' : 'Délivrer & Imprimer A4 (QR Code)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
