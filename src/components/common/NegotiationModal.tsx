import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Percent,
  DollarSign,
  TrendingDown,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';
import { Establishment } from '../../types';

interface NegotiationModalProps {
  establishment: Establishment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onProceedToPayment?: (nouveauSolde: number) => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  establishment,
  isOpen,
  onClose,
  onSuccess,
  onProceedToPayment,
}) => {
  const { negotiateFee, showNotification, theme } = useApp();
  const isLight = theme === 'light';

  const montantInitial = establishment?.montantRedevanceAnnuelle || 50000;
  const montantEncaisse = establishment?.montantEncaisse || 0;

  const [nouveauMontant, setNouveauMontant] = useState<number>(() => {
    // Proposition initiale à 35 000 FCFA si c'est au forfait 50 000 FCFA
    return montantInitial === 50000 ? 35000 : montantInitial;
  });

  const [motif, setMotif] = useState<string>(
    "Faible capacité d'accueil constatée in situ et début d'exploitation commerciale"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !establishment) return null;

  const nouveauSolde = Math.max(0, nouveauMontant - montantEncaisse);
  const reduction = montantInitial - nouveauMontant;
  const reductionPct = montantInitial > 0 ? Math.round((reduction / montantInitial) * 100) : 0;

  const presets = [
    { label: '30 000 FCFA (-40%)', val: 30000 },
    { label: '35 000 FCFA (-30%)', val: 35000 },
    { label: '40 000 FCFA (-20%)', val: 40000 },
    { label: '45 000 FCFA (-10%)', val: 45000 },
  ];

  const presetMotifs = [
    "Faible capacité d'accueil / Petite buvette de quartier",
    "Activité saisonnière / Début d'exploitation",
    "Difficultés économiques justifiées après entretien Direction",
    "Régularisation spontanée avec engagement d'insonorisation",
    "Ajustement suite au constat de la brigade de contrôle",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nouveauMontant <= 0) {
      showNotification('error', 'Le montant négocié doit être supérieur à 0.');
      return;
    }
    if (!motif.trim()) {
      showNotification('error', 'Veuillez saisir un motif obligatoire pour justifier la révision financière.');
      return;
    }

    setIsSubmitting(true);
    try {
      await negotiateFee(establishment.id, nouveauMontant, motif.trim());

      if (onSuccess) onSuccess();
      if (onProceedToPayment) {
        onProceedToPayment(nouveauSolde);
      }
      onClose();
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'enregistrement de la négociation : ${err.message}`);
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
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Négociation & Révision Tarifaire</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
                  Tracé & Audité
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajustement motivé de la redevance d'exploitation annuelle
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Établissement Cible */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-800/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {establishment.nomCommercial}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Promoteur : {establishment.promoteurNom} • {establishment.arrondissement}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dossier</span>
              <span className="font-mono text-xs font-bold text-purple-400">{establishment.codeDossier}</span>
            </div>
          </div>

          {/* Comparatif Ancien vs Nouveau */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Forfait Initial Notifié</span>
              <span className="text-base font-black font-mono line-through text-slate-500">
                {formatCfa(montantInitial)}
              </span>
              <p className="text-[10px] text-slate-400">Mentionné sur la convocation</p>
            </div>

            <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-500/10 space-y-1">
              <span className="text-[10px] text-purple-400 uppercase font-bold block">Montant Négocié / Convenu</span>
              <span className="text-base font-black font-mono text-purple-400">
                {formatCfa(nouveauMontant)}
              </span>
              {reduction > 0 ? (
                <p className="text-[10px] text-emerald-500 font-bold">
                  ↓ Minoration de {formatCfa(reduction)} (-{reductionPct}%)
                </p>
              ) : (
                <p className="text-[10px] text-slate-400">Pas de minoration</p>
              )}
            </div>
          </div>

          {/* Saisie Nouveau Montant & Presets */}
          <div className="space-y-2">
            <label className="font-bold text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                Ajuster le Montant Convenu (FCFA)
              </span>
              <span className="text-purple-400 font-mono font-bold">{formatCfa(nouveauMontant)}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setNouveauMontant(p.val)}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                    nouveauMontant === p.val
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400 font-bold'
                      : 'border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              step="1000"
              required
              value={nouveauMontant}
              onChange={(e) => setNouveauMontant(Math.max(0, Number(e.target.value) || 0))}
              className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold transition ${
                isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            />
          </div>

          {/* Impact sur le solde restant */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Déjà Encaissé</span>
              <span className="font-mono text-xs font-bold text-emerald-500">{formatCfa(montantEncaisse)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">Nouveau Solde Restant Dû</span>
              <span className="font-mono text-sm font-black text-rose-500">{formatCfa(nouveauSolde)}</span>
            </div>
          </div>

          {/* Motif Obligatoire de la Négociation */}
          <div className="space-y-1.5">
            <label className="font-bold text-xs flex items-center justify-between">
              <span>Motif Officiel de la Révision (Obligatoire) *</span>
              <span className="text-[10px] text-slate-400 font-normal">Archivé dans le journal d'audit</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {presetMotifs.map((pm, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMotif(pm)}
                  className={`text-[10px] px-2 py-1 rounded-md border text-left transition ${
                    motif === pm
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={2}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Établissement de quartier à modeste chiffre d'affaires, accord de la Direction sous réserve du respect des horaires..."
              className={`w-full px-3 py-2 rounded-xl border text-xs transition ${
                isLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            />
          </div>

          {/* Avertissement Traçabilité */}
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Toute révision tarifaire est nominativement enregistrée avec l'identifiant de l'agent et le motif au Journal d'Audit SHA-256 de la Direction Départementale.
            </p>
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
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold shadow-lg shadow-purple-900/30 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Validation...' : 'Valider le Montant Négocié'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
