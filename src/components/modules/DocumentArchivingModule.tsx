import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Shield,
  Search,
  CheckCircle2,
  FileText,
  Clock,
  Key,
  ShieldAlert,
  Hash,
} from 'lucide-react';
import { computeSha256 } from '../../services/crypto';

export const DocumentArchivingModule: React.FC = () => {
  const { auditLogs, receipts, legalActs, establishments, showNotification } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const filteredLogs = auditLogs.filter((log) => {
    return (
      log.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.agentNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleVerifyHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;

    // Search across receipts, legalActs and audit logs
    const foundReceipt = receipts.find((r) => r.numeroQuittance === verifyInput || r.quittanceHash === verifyInput);
    const foundAct = legalActs.find((a) => a.referenceNumero === verifyInput || a.documentHash === verifyInput);
    const foundLog = auditLogs.find((l) => l.referenceId === verifyInput || l.hashSha256 === verifyInput);

    if (foundReceipt) {
      setVerifyResult({
        type: 'QUITTANCE_SAF',
        valid: true,
        reference: foundReceipt.numeroQuittance,
        nom: foundReceipt.etablissementNom,
        date: foundReceipt.datePaiement,
        hash: foundReceipt.quittanceHash,
      });
      showNotification('success', `Empreinte cryptographique certifiée conforme pour la Quittance ${foundReceipt.numeroQuittance} !`);
    } else if (foundAct) {
      setVerifyResult({
        type: 'ACTE_POLICE_SAA',
        valid: true,
        reference: foundAct.referenceNumero,
        nom: foundAct.etablissementNom,
        date: foundAct.dateEmission,
        hash: foundAct.documentHash,
      });
      showNotification('success', `Intégrité de l'acte ${foundAct.referenceNumero} vérifiée avec succès !`);
    } else if (foundLog) {
      setVerifyResult({
        type: 'JOURNAL_AUDIT',
        valid: true,
        reference: foundLog.referenceId,
        nom: foundLog.agentNom,
        date: foundLog.timestamp,
        hash: foundLog.hashSha256,
      });
      showNotification('success', `Trace d'audit authentique trouvée dans le coffre-fort !`);
    } else {
      setVerifyResult({ valid: false, input: verifyInput });
      showNotification('error', `Aucun acte ni quittance correspondant à cette empreinte dans le registre.`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-15
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Coffre-Fort Numérique & Horodatage
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conservation souveraine des actes, scellement cryptographique SHA-256 et piste d'audit immuable
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vérificateur d'Intégrité (4 colonnes) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Vérification Cryptographique</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              SHA-256
            </span>
          </div>

          <form onSubmit={handleVerifyHash} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">
                Saisir Référence d'Acte ou Empreinte Hash
              </label>
              <input
                type="text"
                required
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Ex: QUIT-2026-00341 ou hash..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Contrôler l'Intégrité de l'Acte</span>
            </button>
          </form>

          {verifyResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                verifyResult.valid
                  ? 'bg-emerald-950/40 border-emerald-800 text-slate-100'
                  : 'bg-rose-950/40 border-rose-800 text-rose-200'
              }`}
            >
              {verifyResult.valid ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Acte Certifié Authentique</span>
                  </div>
                  <div className="font-mono text-[11px] space-y-1 pt-1 border-t border-slate-800">
                    <p>Type: {verifyResult.type}</p>
                    <p>Référence: {verifyResult.reference}</p>
                    <p>Entité: {verifyResult.nom}</p>
                    <p>Date Scellement: {verifyResult.date}</p>
                    <p className="text-[9px] text-slate-400 truncate">
                      SHA-256: {verifyResult.hash}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Empreinte introuvable ou document altéré</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Piste d'Audit Immuable (8 colonnes) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Piste d'Audit Immuable (Audit Trail Temps Réel)</span>
            </h2>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer les actions..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {log.typeEntite}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {log.timestamp}
                  </span>
                </div>

                <p className="text-slate-200 text-xs leading-relaxed font-medium">
                  {log.details}
                </p>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80">
                  <span>Agent: {log.agentNom} ({log.agentMatricule})</span>
                  <span className="truncate max-w-[200px] text-slate-500">
                    Hash: {log.hashSha256}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
