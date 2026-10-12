import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, ArrowRight, Building, Calendar, Receipt, FileText } from 'lucide-react';
import { DdlLogo } from './DdlLogo';
import { formatCfa } from '../../services/crypto';

interface PublicDocumentVerificationProps {
  onGoToLogin: () => void;
}

export const PublicDocumentVerification: React.FC<PublicDocumentVerificationProps> = ({ onGoToLogin }) => {
  const { receipts, legalActs, establishments } = useApp();

  // Parse query params from current URL
  const searchParams = new URLSearchParams(window.location.search);
  const verifyType = searchParams.get('verify') || (searchParams.get('num') ? 'receipt' : searchParams.get('ref') ? 'act' : null);
  const num = searchParams.get('num') || '';
  const ref = searchParams.get('ref') || '';

  // Look up document
  const foundReceipt = num ? receipts.find((r) => r.numeroQuittance.toLowerCase() === num.toLowerCase() || (r.quittanceHash && r.quittanceHash === num)) : null;
  const foundAct = ref ? legalActs.find((a) => a.referenceNumero.toLowerCase() === ref.toLowerCase() || (a.documentHash && a.documentHash === ref)) : null;
  const relatedEst = foundReceipt ? establishments.find((e) => e.id === foundReceipt.etablissementId) : foundAct ? establishments.find((e) => e.id === foundAct.etablissementId) : null;

  const isVerified = Boolean(foundReceipt || foundAct);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Top National Ribbon */}
      <div className="fixed top-0 left-0 right-0 h-1.5 flex z-50">
        <div className="flex-1 bg-[#009543]" />
        <div className="flex-1 bg-[#fbde4a]" />
        <div className="flex-1 bg-[#dc241f]" />
      </div>

      <div className="max-w-xl w-full mx-auto my-auto space-y-6 pt-4">
        {/* Header Institutionnel */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <DdlLogo size="md" rounded="xl" bordered={true} className="w-16 h-16 shadow-xl" />
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">RÉPUBLIQUE DU CONGO</p>
          <p className="text-[11px] italic text-slate-500 font-serif">Unité • Travail • Progrès</p>
          <h1 className="font-cinzel text-lg md:text-xl font-bold text-slate-100 leading-tight">
            Direction Départementale des Loisirs de Pointe-Noire
          </h1>
          <p className="text-xs text-emerald-400 font-medium">
            Portail Public Officiel de Vérification d&apos;Authenticité
          </p>
        </div>

        {/* Certificate Card */}
        {isVerified ? (
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Document Officiel Certifié Conforme
                </span>
                <h2 className="text-base font-bold text-slate-100 mt-1">
                  {foundReceipt ? 'Quittance de Caisse SAF Authentique' : 'Acte de Police Administrative Homologué'}
                </h2>
              </div>
            </div>

            {/* Document Details */}
            {foundReceipt && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>N° DE QUITTANCE</span>
                    <span className="font-mono text-slate-400">{foundReceipt.datePaiement}</span>
                  </div>
                  <p className="font-mono text-base font-bold text-emerald-400">{foundReceipt.numeroQuittance}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Établissement</span>
                    <p className="font-bold text-slate-100 truncate text-sm mt-0.5">{foundReceipt.etablissementNom}</p>
                    <span className="text-[11px] text-slate-400 truncate block">Promoteur : {foundReceipt.promoteurNom}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Localisation</span>
                    <p className="font-bold text-slate-200 text-sm mt-0.5">{foundReceipt.arrondissement}</p>
                    <span className="text-[11px] text-slate-400 truncate block">Pointe-Noire, Congo</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-300 font-medium">Montant Encaissé :</span>
                    <span className="font-mono font-bold text-base text-emerald-300">{formatCfa(foundReceipt.montantVerse)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Mode de paiement :</span>
                    <span className="font-mono uppercase font-semibold text-slate-300">{foundReceipt.modePaiement}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-500/20">
                    <span className="text-slate-400">Solde restant dû :</span>
                    <span className={`font-mono font-bold ${foundReceipt.resteAPayer === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {foundReceipt.resteAPayer === 0 ? '0 FCFA (Situation fiscale en règle)' : formatCfa(foundReceipt.resteAPayer)}
                    </span>
                  </div>
                </div>

                {/* Validité 1 AN renouvelable */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Autorisation d&apos;Exploitation : 1 AN Renouvelable</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Conformément à la Loi N° 21-2019, la redevance départementale est annuelle. Le prochain renouvellement est fixé au jour anniversaire du premier versement ({relatedEst?.renouvellementAnnuelDate || relatedEst?.prochainRdvDate || 'Exercice N+1'}).
                  </p>
                </div>

                <div className="text-[10px] font-mono text-slate-500 truncate pt-2 border-t border-slate-800">
                  Empreinte SHA-256 : {foundReceipt.quittanceHash || 'SEAL-VALIDATED'}
                </div>
              </div>
            )}

            {/* Legal Act Details */}
            {foundAct && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>RÉFÉRENCE DE L&apos;ACTE</span>
                    <span className="font-mono text-slate-400">{foundAct.dateEmission}</span>
                  </div>
                  <p className="font-mono text-base font-bold text-amber-400">{foundAct.referenceNumero}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Établissement concerné</span>
                  <p className="font-bold text-slate-100 text-sm">{foundAct.etablissementNom}</p>
                  <p className="text-slate-300 text-[11px] mt-1">{foundAct.motifs}</p>
                </div>

                <div className="text-[10px] font-mono text-slate-500 truncate pt-2 border-t border-slate-800">
                  Empreinte SHA-256 : {foundAct.documentHash}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-300">Document Non Répertorié ou Inconnu</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Le document scanné ({num || ref || 'inconnu'}) ne correspond à aucune quittance ni acte homologué dans le registre central de la Direction Départementale des Loisirs de Pointe-Noire.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200">
              Veuillez vérifier l&apos;authenticité de votre reçu auprès des guichets de la Régie Financière DDL-PN.
            </div>
          </div>
        )}

        {/* Footer / Bouton d'accès agent interne */}
        <div className="text-center pt-4">
          <button
            onClick={onGoToLogin}
            className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
          >
            <span>Accès sécurisé réservé aux agents DDL-PN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-600 font-mono py-2">
        DDL-PN • Système d&apos;Immatriculation et de Quittancement des Loisirs
      </div>
    </div>
  );
};
