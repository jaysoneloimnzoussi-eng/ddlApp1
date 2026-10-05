import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileCheck2,
  Receipt,
  Download,
  Printer,
  Search,
  Plus,
  Building,
  CheckCircle2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';
import { generateAttestationDocx } from '../../services/docxGenerator';
import { Establishment, CashReceipt } from '../../types';

export const TitlesAndReceiptsModule: React.FC = () => {
  const {
    establishments,
    receipts,
    addReceipt,
    updateEstablishment,
    openPrintModal,
    showNotification,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEst, setSelectedEst] = useState<Establishment>(establishments[0] || null);

  // Formulaire d'encaissement rapide
  const [montantVerse, setMontantVerse] = useState<number>(50000);
  const [modePaiement, setModePaiement] = useState<CashReceipt['modePaiement']>('especes');
  const [referenceTransaction, setReferenceTransaction] = useState('');
  const [natureRecette, setNatureRecette] = useState<CashReceipt['natureRecette']>('Forfait Informel SAA');
  const [isCashingIn, setIsCashingIn] = useState(false);

  // Filter establishments
  const filteredEstablishments = establishments.filter((est) => {
    return (
      est.nomCommercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.promoteurNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.codeDossier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSelectEst = (est: Establishment) => {
    setSelectedEst(est);
    setMontantVerse(est.soldeRestantDu > 0 ? est.soldeRestantDu : 50000);
  };

  // Quick issuance of Quittance
  const handleIssueReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEst) return;

    setIsCashingIn(true);
    try {
      const reste = Math.max(0, selectedEst.soldeRestantDu - montantVerse);
      const newRec = await addReceipt({
        datePaiement: new Date().toISOString().replace('T', ' ').substring(0, 16),
        etablissementId: selectedEst.id,
        etablissementNom: selectedEst.nomCommercial,
        promoteurNom: selectedEst.promoteurNom,
        arrondissement: selectedEst.arrondissement,
        montantVerse: Number(montantVerse),
        resteAPayer: reste,
        modePaiement,
        referenceTransaction: referenceTransaction || `GUICHET-${Date.now().toString().slice(-4)}`,
        inspecteurOuCaissier: 'Sylvain Kimbembe (Caissier Principal SAF)',
        brigadeCode: 'SAF-GUICHET-CENTRAL',
        natureRecette,
      });

      // Update attestation number if first time
      if (!selectedEst.numeroAttestation) {
        const attNum = `${selectedEst.id.slice(-3)}/2026`;
        await updateEstablishment(selectedEst.id, {
          numeroAttestation: attNum,
          dateDelivranceAttestation: new Date().toISOString().substring(0, 10),
        });
      }

      // Automatically open POS receipt preview
      openPrintModal('pos_receipt', newRec);
    } catch (err: any) {
      showNotification('error', `Erreur d'encaissement: ${err.message}`);
    } finally {
      setIsCashingIn(false);
    }
  };

  // Download DOCX
  const handleDownloadDocx = async (est: Establishment) => {
    try {
      await generateAttestationDocx(est);
      showNotification('success', `Attestation de dépôt pour ${est.nomCommercial} téléchargée en format Word (.docx) !`);
    } catch (err: any) {
      showNotification('error', `Erreur de génération DOCX : ${err.message}`);
    }
  };

  return (
    <div className={`p-4 md:p-6 space-y-6 max-w-7xl mx-auto transition-colors duration-200 ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`}>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              MOD-11
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Guichet Unique, Titres & Quittances
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Délivrance de l'Attestation Provisoire de Dépôt conforme (A4 / Word .docx) et encaissements avec Quittance POS 58mm
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Recherche & Sélection d'établissement (5 colonnes) */}
        <div className={`lg:col-span-5 border rounded-xl p-4 space-y-3 shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, promoteur, dossier..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-emerald-500'
              }`}
            />
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredEstablishments.map((est) => {
              const isSelected = selectedEst?.id === est.id;
              return (
                <button
                  key={est.id}
                  onClick={() => handleSelectEst(est)}
                  className={`w-full text-left p-3 rounded-lg border transition space-y-1.5 ${
                    isSelected
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/60'
                      : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs truncate max-w-[200px] text-slate-900 dark:text-slate-100">
                      {est.nomCommercial}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                        est.statut === 'en_regle'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : est.statut === 'attestation_provisoire'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}
                    >
                      {est.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {est.promoteurNom} • {est.arrondissement}
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                    <span>Encaissé: {formatCfa(est.montantEncaisse)}</span>
                    <span className="text-amber-400 font-bold">Solde: {formatCfa(est.soldeRestantDu)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Colonne Droite : Guichet Express & Titres Officiels (7 colonnes) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedEst ? (
            <>
              {/* Carte Établissement Sélectionné & Actions Titres */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-emerald-400">
                      DOSSIER N° {selectedEst.codeDossier}
                    </span>
                    <h2 className="text-lg font-bold text-slate-100">{selectedEst.nomCommercial}</h2>
                    <p className="text-xs text-slate-400">
                      Promoteur: <span className="text-slate-200 font-semibold">{selectedEst.promoteurNom}</span> ({selectedEst.promoteurTelephone})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadDocx(selectedEst)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Télécharger Word (.docx)
                    </button>
                    <button
                      onClick={() => openPrintModal('a4_attestation', selectedEst)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Attestation A4
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Arrondissement:</span>
                    <span className="font-bold text-slate-200">{selectedEst.arrondissement}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Catégorie:</span>
                    <span className="font-semibold text-slate-200 truncate block">{selectedEst.categorie}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Redevance Annuelle:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCfa(selectedEst.montantRedevanceAnnuelle)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Solde Restant Dû:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {formatCfa(selectedEst.soldeRestantDu)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulaire d'Encaissement Express au Guichet */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Émission Immédiate de Quittance (Feuille A4 ou Reçu POS 58mm)</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Caisse SAF
                  </span>
                </div>

                <form onSubmit={handleIssueReceipt} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Montant à Encaisser (FCFA) *</label>
                      <input
                        type="number"
                        required
                        value={montantVerse}
                        onChange={(e) => setMontantVerse(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-base font-bold text-emerald-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Mode de Règlement *</label>
                      <select
                        value={modePaiement}
                        onChange={(e) => setModePaiement(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                      >
                        <option value="especes">Espèces (Caisse)</option>
                        <option value="momo_mtn">MTN Mobile Money</option>
                        <option value="airtel_money">Airtel Money</option>
                        <option value="cheque_tresor">Chèque Trésor Public</option>
                        <option value="virement">Virement Bancaire</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Nature de la Recette</label>
                      <select
                        value={natureRecette}
                        onChange={(e) => setNatureRecette(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                      >
                        <option value="Forfait Informel SAA">Forfait Informel SAA (50 000 FCFA)</option>
                        <option value="Redevance Proportionnelle">Redevance Proportionnelle (Surface)</option>
                        <option value="Taxe d'agrément provisoire">Taxe d'agrément provisoire</option>
                        <option value="Pénalité de retard">Pénalité de retard</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Référence / Numéro Reçu</label>
                      <input
                        type="text"
                        value={referenceTransaction}
                        onChange={(e) => setReferenceTransaction(e.target.value)}
                        placeholder="Ex: ESP-0482 ou MoMo ID"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCashingIn}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 mt-2"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>{isCashingIn ? 'Encaissement...' : 'Valider l\'Encaissement & Générer la Quittance POS 58mm'}</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
              Sélectionnez un établissement pour délivrer l'attestation ou encaisser des droits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
