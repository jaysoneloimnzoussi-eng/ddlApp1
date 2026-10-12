import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  TrendingUp,
  Receipt,
  Download,
  Printer,
  Calendar,
  CreditCard,
  Lock,
  CheckCircle2,
  Filter,
  CheckSquare,
  FileSpreadsheet,
  Building,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';
import { printHtmlElement } from '../../services/printService';
import { openWhatsAppReceipt } from '../../services/whatsappService';
import { CashReceipt } from '../../types';

export const SafRegieRecettesModule: React.FC = () => {
  const { receipts, establishments, legalActs, openPrintModal, showNotification, theme } = useApp();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'journal' | 'rapprochement' | 'cloture' | 'bilan_annuel'>('journal');
  const [dateFilter, setDateFilter] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [isClotureDone, setIsClotureDone] = useState(false);

  // Bank reconciliation mock items
  const [bankReconciled, setBankReconciled] = useState<Record<string, boolean>>({
    'rec-001': true,
    'rec-002': true,
    'rec-003': true,
    'rec-004': false,
  });

  const totalRecettes = receipts.reduce((sum, r) => sum + r.montantVerse, 0);

  // Group by payment mode
  const modeStats = {
    especes: receipts.filter((r) => r.modePaiement === 'especes').reduce((s, r) => s + r.montantVerse, 0),
    momo_mtn: receipts.filter((r) => r.modePaiement === 'momo_mtn').reduce((s, r) => s + r.montantVerse, 0),
    airtel_money: receipts.filter((r) => r.modePaiement === 'airtel_money').reduce((s, r) => s + r.montantVerse, 0),
    cheque_tresor: receipts.filter((r) => r.modePaiement === 'cheque_tresor').reduce((s, r) => s + r.montantVerse, 0),
    virement: receipts.filter((r) => r.modePaiement === 'virement').reduce((s, r) => s + r.montantVerse, 0),
  };

  // Grand Bilan Annuel d'Exercice (Clôture et Arrêté au 25 Décembre)
  const totalResteDu = establishments.reduce((sum, e) => sum + (e.soldeRestantDu || 0), 0);
  const totalPotentielAnnuel = totalRecettes + totalResteDu;
  const tauxRecouvrementGlobal = totalPotentielAnnuel > 0
    ? ((totalRecettes / totalPotentielAnnuel) * 100).toFixed(1)
    : '100';

  const arrList: ('Lumumba' | 'Mvou-Mvou' | 'Tié-Tié' | 'Loandjili' | 'Mongo-Mpoukou' | 'Ngoyo')[] = [
    'Lumumba',
    'Mvou-Mvou',
    'Tié-Tié',
    'Loandjili',
    'Mongo-Mpoukou',
    'Ngoyo',
  ];

  const bilanArrondissements = arrList.map((arr) => {
    const etabs = establishments.filter((e) => e.arrondissement === arr);
    const recs = receipts.filter((r) => r.arrondissement === arr);
    const encaisse = recs.reduce((s, r) => s + r.montantVerse, 0);
    const reste = etabs.reduce((s, e) => s + (e.soldeRestantDu || 0), 0);
    const total = encaisse + reste;
    const taux = total > 0 ? Math.round((encaisse / total) * 100) : 100;
    return {
      arrondissement: arr,
      totalEtabs: etabs.length,
      enRegle: etabs.filter((e) => e.statut === 'en_regle').length,
      misesEnDemeure: etabs.filter((e) => e.statut === 'mise_en_demeure').length,
      encaisse,
      reste,
      taux,
    };
  });

  const totalActesPolice = legalActs.length;
  const totalMisesEnDemeure = legalActs.filter((a) => a.type === 'mise_en_demeure').length;
  const totalArretesFermeture = legalActs.filter((a) => a.type === 'arrete_fermeture').length;

  const filteredReceipts = receipts.filter((r) => {
    const matchMode = modeFilter === 'all' || r.modePaiement === modeFilter;
    const matchDate = !dateFilter || r.datePaiement.includes(dateFilter);
    return matchMode && matchDate;
  });

  // Export CSV / Excel
  const handleExportCsv = () => {
    const headers = [
      'Numero Quittance',
      'Date Paiement',
      'Etablissement',
      'Promoteur',
      'Arrondissement',
      'Nature Recette',
      'Mode Paiement',
      'Reference Transaction',
      'Montant Verse (FCFA)',
      'Reste A Payer (FCFA)',
      'Agent Caissier',
      'Empreinte SHA256',
    ];

    const rows = receipts.map((r) => [
      `"${r.numeroQuittance}"`,
      `"${r.datePaiement}"`,
      `"${r.etablissementNom}"`,
      `"${r.promoteurNom}"`,
      `"${r.arrondissement}"`,
      `"${r.natureRecette}"`,
      `"${r.modePaiement}"`,
      `"${r.referenceTransaction || ''}"`,
      r.montantVerse,
      r.resteAPayer,
      `"${r.inspecteurOuCaissier}"`,
      `"${r.quittanceHash || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Livre_Journal_Caisse_SAF_DDL_PN_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', 'Livre-journal exporté au format CSV / Excel avec succès !');
  };

  const handleToggleReconcile = (id: string) => {
    setBankReconciled((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    showNotification('info', 'Statut de rapprochement bancaire actualisé.');
  };

  const handleClotureCaisse = () => {
    setIsClotureDone(true);
    showNotification('success', 'Clôture journalière certifiée conforme aux normes du Trésor Public !');
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
              MOD-10
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Régie des Recettes & Gestion Financière SAF
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Livre-journal de caisse en temps réel conforme Trésor Public, rapprochement bancaire et clôture journalière certifiée
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exporter Excel / CSV</span>
          </button>
          <button
            onClick={handleClotureCaisse}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 ${
              isClotureDone
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isClotureDone ? 'Caisse Clôturée' : 'Clôturer la Caisse'}</span>
          </button>
          <button
            onClick={() => printHtmlElement('saf-recettes-content', 'Journal_Caisse_SAF_Recettes_DDL_PN')}
            className="px-3.5 py-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Imprimer l'état des recettes et le journal de caisse"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      <div id="saf-recettes-content" className="space-y-6">
      {/* KPI Cards: Répartition des flux de paiement */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`p-3 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Recettes</span>
          <p className="font-mono text-base font-bold text-emerald-600">{formatCfa(totalRecettes)}</p>
        </div>

        <div className={`p-3 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Espèces POS</span>
          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatCfa(modeStats.especes)}</p>
        </div>

        <div className={`p-3 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] text-amber-600 uppercase font-semibold">MTN MoMo</span>
          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatCfa(modeStats.momo_mtn)}</p>
        </div>

        <div className={`p-3 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] text-red-600 uppercase font-semibold">Airtel Money</span>
          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatCfa(modeStats.airtel_money)}</p>
        </div>

        <div className={`p-3 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] text-blue-600 uppercase font-semibold">Chèques Trésor</span>
          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatCfa(modeStats.cheque_tresor)}</p>
        </div>

        <div className={`p-3 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[10px] text-purple-600 uppercase font-semibold">Virements UBA/BGFI</span>
          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{formatCfa(modeStats.virement)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'journal'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Livre-Journal de Caisse</span>
        </button>

        <button
          onClick={() => setActiveTab('rapprochement')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'rapprochement'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Rapprochement Bancaire Trésor</span>
        </button>

        <button
          onClick={() => setActiveTab('cloture')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'cloture'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Procès-Verbal de Clôture Journalière</span>
        </button>

        <button
          onClick={() => setActiveTab('bilan_annuel')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'bilan_annuel'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Bilan Annuel & Arrêté au 25 Décembre</span>
        </button>
      </div>

      {/* TAB 1: JOURNAL DE CAISSE */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Mode d'encaissement :</span>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="all">Tous les modes</option>
                  <option value="especes">Espèces</option>
                  <option value="momo_mtn">MTN Mobile Money</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="cheque_tresor">Chèque Trésor</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Date :</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <span className="text-slate-400 font-mono text-[11px]">
              {filteredReceipts.length} quittances enregistrées
            </span>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[640px]">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">N° Quittance</th>
                  <th className="p-3">Date / Heure</th>
                  <th className="p-3">Établissement & Promoteur</th>
                  <th className="p-3">Arrondissement</th>
                  <th className="p-3">Nature Recette</th>
                  <th className="p-3">Mode & Réf.</th>
                  <th className="p-3 text-right">Montant Versé</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 text-slate-200">
                    <td className="p-3 font-mono font-bold text-emerald-400">{rec.numeroQuittance}</td>
                    <td className="p-3 font-mono text-slate-400">{rec.datePaiement}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-100">{rec.etablissementNom}</p>
                      <p className="text-[11px] text-slate-400">{rec.promoteurNom}</p>
                    </td>
                    <td className="p-3">{rec.arrondissement}</td>
                    <td className="p-3 text-[11px] text-slate-300">{rec.natureRecette}</td>
                    <td className="p-3">
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {rec.modePaiement}
                      </span>
                      {rec.referenceTransaction && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.referenceTransaction}</p>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCfa(rec.montantVerse)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openPrintModal('pos_receipt', rec)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 cursor-pointer"
                          title="Imprimer Reçu POS 58mm"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const est = establishments.find((e) => e.id === rec.etablissementId);
                            const phone = est?.promoteurTelephone || '';
                            if (!phone) {
                              showNotification('warning', 'Numéro de téléphone du promoteur non renseigné.');
                              return;
                            }
                            openWhatsAppReceipt({
                              phone,
                              etablissementNom: rec.etablissementNom,
                              promoteurNom: rec.promoteurNom,
                              numeroQuittance: rec.numeroQuittance,
                              montantVerse: rec.montantVerse,
                              resteAPayer: rec.resteAPayer,
                              datePaiement: rec.datePaiement,
                              modePaiement: rec.modePaiement,
                              referenceTransaction: rec.referenceTransaction,
                            });
                          }}
                          className="p-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 cursor-pointer"
                          title="Envoyer la quittance par WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RAPPROCHEMENT BANCAIRE */}
      {activeTab === 'rapprochement' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Rapprochement Bancaire : Quittances Émises vs Extraits Trésor & Comptes Dépositaires
              </h3>
              <p className="text-slate-400 text-[11px]">
                Validation contradictoire des versements au compte DDL-PN
              </p>
            </div>
            <span className="font-mono text-emerald-400 font-bold">
              {Object.values(bankReconciled).filter(Boolean).length} / {receipts.length} Lettrés
            </span>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[640px]">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Quittance</th>
                  <th className="p-3">Établissement</th>
                  <th className="p-3">Mode & Référence Transaction</th>
                  <th className="p-3 text-right">Montant (FCFA)</th>
                  <th className="p-3 text-center">Statut Rapprochement</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {receipts.map((rec) => {
                  const isReconciled = bankReconciled[rec.id];
                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 text-slate-200">
                      <td className="p-3 font-mono font-bold text-emerald-400">{rec.numeroQuittance}</td>
                      <td className="p-3 font-semibold">{rec.etablissementNom}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {rec.modePaiement} — {rec.referenceTransaction}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {formatCfa(rec.montantVerse)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isReconciled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isReconciled ? '✓ Lettré & Rapproché' : 'En attente relevé'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleReconcile(rec.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                        >
                          {isReconciled ? 'Annuler' : 'Valider'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILAN DE CLÔTURE JOURNALIÈRE */}
      {activeTab === 'cloture' && (
        <div className="bg-white text-slate-950 p-8 rounded-xl shadow-2xl max-w-3xl mx-auto border border-slate-300 font-serif leading-relaxed text-xs">
          <div className="text-center space-y-1 mb-6 border-b pb-4 border-slate-800">
            <p className="font-bold text-sm uppercase">RÉPUBLIQUE DU CONGO</p>
            <p className="italic text-[11px] text-slate-700">Unité - Travail - Progrès</p>
            <p className="text-xs font-semibold">DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</p>
            <p className="font-bold uppercase text-emerald-800">RÉGIE DES RECETTES SAF — ÉTAT DE CLÔTURE JOURNALIÈRE</p>
          </div>

          <div className="space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center bg-slate-100 p-3 rounded border border-slate-300 font-mono">
              <span>Date d'arrêté de caisse : {new Date().toLocaleDateString('fr-FR')}</span>
              <span>Exercice Budgétaire : 2026</span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase">1. Synthèse des Encaissements du Jour</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 border rounded">
                  <span className="text-slate-500 block text-[10px]">Nombre de quittances émises :</span>
                  <span className="font-bold text-slate-900 font-mono">{receipts.length} quittances</span>
                </div>
                <div className="p-2.5 bg-slate-50 border rounded">
                  <span className="text-slate-500 block text-[10px]">Montant total liquidé :</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">{formatCfa(totalRecettes)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase">2. Ventilation des Moyens de Paiement</h4>
              <ul className="space-y-1 text-slate-700 font-mono text-xs">
                <li className="flex justify-between border-b py-1">
                  <span>Espèces en coffre :</span> <strong>{formatCfa(modeStats.especes)}</strong>
                </li>
                <li className="flex justify-between border-b py-1">
                  <span>Paiements mobiles MTN MoMo :</span> <strong>{formatCfa(modeStats.momo_mtn)}</strong>
                </li>
                <li className="flex justify-between border-b py-1">
                  <span>Paiements mobiles Airtel Money :</span> <strong>{formatCfa(modeStats.airtel_money)}</strong>
                </li>
                <li className="flex justify-between border-b py-1">
                  <span>Chèques Trésor Public :</span> <strong>{formatCfa(modeStats.cheque_tresor)}</strong>
                </li>
                <li className="flex justify-between py-1">
                  <span>Virements bancaires :</span> <strong>{formatCfa(modeStats.virement)}</strong>
                </li>
              </ul>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end pt-8 mt-6 border-t font-serif">
              <div className="text-center w-52">
                <p className="font-bold text-xs uppercase mb-12">Le Caissier Régisseur Principal</p>
                <p className="font-bold text-xs">Sylvain KIMBEMBE</p>
                <p className="text-[10px] text-slate-600">Régie Financière SAF</p>
              </div>

              <div className="text-center w-52">
                <p className="font-bold text-xs uppercase mb-12">Vu et vérifié, Le Directeur Départemental</p>
                <p className="font-bold text-xs">Pour le Trésor Public</p>
                <p className="text-[10px] text-slate-600">Direction Départementale</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GRAND BILAN ANNUEL & ARRÊTÉ AU 25 DÉCEMBRE */}
      {activeTab === 'bilan_annuel' && (
        <div className="space-y-6">
          {/* Top National Ribbon & Title */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="h-1.5 w-full -mt-6 -mx-6 mb-6 flex overflow-hidden">
              <div className="flex-1 bg-[#009543]" />
              <div className="flex-1 bg-[#fbde4a]" />
              <div className="flex-1 bg-[#dc241f]" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ARRÊTÉ DU 25 DÉCEMBRE
                  </span>
                  <h2 className="font-cinzel text-lg md:text-xl font-bold text-slate-100">
                    Grand Bilan Annuel d'Exercice & Chiffre d'Affaires DDL-PN
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Clôture officielle de l'exercice au 25 décembre 2026 • Chiffre d'affaires, créances, ventilation territoriale et conformité républicaine
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => printHtmlElement('bilan-annuel-officiel-pv', 'PV_Arrete_Annuel_25_Decembre_DDL_PN_2026')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le PV Officiel A4</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter Données Annuelles (CSV)</span>
                </button>
              </div>
            </div>

            {/* 4 Grand KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Chiffre d'Affaires Recouvré</span>
                <p className="font-mono text-xl font-black text-emerald-400">{formatCfa(totalRecettes)}</p>
                <p className="text-[10px] text-slate-500">{receipts.length} quittances émises</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Créances Restantes (Reste Dû)</span>
                <p className="font-mono text-xl font-black text-amber-400">{formatCfa(totalResteDu)}</p>
                <p className="text-[10px] text-slate-500">Solde à recouvrer pour 2026</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Potentiel Budgétaire Annuel</span>
                <p className="font-mono text-xl font-black text-blue-400">{formatCfa(totalPotentielAnnuel)}</p>
                <p className="text-[10px] text-slate-500">Assiette fiscale départementale</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Taux d'Efficacité Recouvrement</span>
                <p className="font-mono text-xl font-black text-purple-400">{tauxRecouvrementGlobal}%</p>
                <p className="text-[10px] text-slate-500">Performance financière globale</p>
              </div>
            </div>
          </div>

          {/* Tableaux Statistiques Annuels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. Répartition par Arrondissement (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span>Statistiques & Recettes par Arrondissement</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Pointe-Noire</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Arrondissement</th>
                      <th className="p-2.5 text-center">Établissements</th>
                      <th className="p-2.5 text-right">Recouvert</th>
                      <th className="p-2.5 text-right">Reste Dû</th>
                      <th className="p-2.5 text-center">Taux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bilanArrondissements.map((row) => (
                      <tr key={row.arrondissement} className="hover:bg-slate-800/40 text-slate-200">
                        <td className="p-2.5 font-bold text-slate-100">{row.arrondissement}</td>
                        <td className="p-2.5 text-center">
                          <span className="font-mono font-semibold">{row.totalEtabs}</span>
                          <span className="text-[10px] text-emerald-400 ml-1">({row.enRegle} soldés)</span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-400 font-bold">{formatCfa(row.encaisse)}</td>
                        <td className="p-2.5 text-right font-mono text-amber-400">{formatCfa(row.reste)}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                            {row.taux}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Ventilation par Moyen de Paiement & Police (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Moyens de paiement */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Répartition des Canaux d'Encaissement</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Espèces (Guichet Caisse SAF)</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCfa(modeStats.especes)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Mobile Money (MTN MoMo)</span>
                    <span className="font-mono font-bold text-amber-400">{formatCfa(modeStats.momo_mtn)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Airtel Money</span>
                    <span className="font-mono font-bold text-rose-400">{formatCfa(modeStats.airtel_money)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Chèques Trésor Public</span>
                    <span className="font-mono font-bold text-blue-400">{formatCfa(modeStats.cheque_tresor)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Virements Bancaires</span>
                    <span className="font-mono font-bold text-purple-400">{formatCfa(modeStats.virement)}</span>
                  </div>
                </div>
              </div>

              {/* Police administrative & contentieux */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Actes de Police Administrative Émis</span>
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Actes</span>
                    <span className="font-mono font-bold text-base text-slate-100">{totalActesPolice}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-amber-400 block">Mises en demeure</span>
                    <span className="font-mono font-bold text-base text-amber-300">{totalMisesEnDemeure}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-rose-400 block">Fermetures</span>
                    <span className="font-mono font-bold text-base text-rose-300">{totalArretesFermeture}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENT IMPRIMABLE A4 : PV OFFICIEL D'ARRÊTÉ AU 25 DÉCEMBRE */}
          <div id="bilan-annuel-officiel-pv" className="bg-white text-slate-950 p-8 md:p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto border border-slate-300 font-serif leading-relaxed text-xs space-y-6">
            <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <p className="font-bold text-sm uppercase tracking-wide">RÉPUBLIQUE DU CONGO</p>
              <p className="italic text-[11px] text-slate-700">Unité • Travail • Progrès</p>
              <p className="text-xs font-semibold text-slate-800">MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DU TOURISME</p>
              <p className="text-xs font-semibold text-slate-800">DIRECTION GÉNÉRALE DES LOISIRS • DÉPARTEMENT DE POINTE-NOIRE</p>
              <p className="font-bold text-sm uppercase text-emerald-900 pt-2 tracking-tight">
                DIRECTION DÉPARTEMENTALE DES LOISIRS — RÉGIE DES RECETTES SAF
              </p>
              <p className="font-bold text-xs uppercase bg-slate-100 py-1 rounded font-sans border border-slate-300">
                PROCÈS-VERBAL D'ARRÊTÉ ANNUEL DES COMPTES AU 25 DÉCEMBRE 2026
              </p>
            </div>

            <div className="font-sans text-xs space-y-4">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]">
                <span>Exercice Budgétaire : 2026</span>
                <span>Date d'Arrêté Officiel : 25 Décembre 2026</span>
                <span>Département : Pointe-Noire</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-900 text-xs">1. Synthèse du Chiffre d'Affaires et des Recettes Liquidées</h4>
                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 bg-slate-50 border rounded">
                    <span className="text-[10px] text-slate-500 block uppercase">Chiffre d'Affaires Encaissé</span>
                    <span className="font-bold text-emerald-800 text-sm">{formatCfa(totalRecettes)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded">
                    <span className="text-[10px] text-slate-500 block uppercase">Créances Restantes Dues</span>
                    <span className="font-bold text-amber-800 text-sm">{formatCfa(totalResteDu)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded">
                    <span className="text-[10px] text-slate-500 block uppercase">Taux Global d'Efficacité</span>
                    <span className="font-bold text-purple-800 text-sm">{tauxRecouvrementGlobal}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-900 text-xs">2. Résultats Détaillés par Arrondissement au 25 Décembre</h4>
                <table className="w-full text-xs text-left border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2">Arrondissement</th>
                      <th className="p-2 text-center">Établissements</th>
                      <th className="p-2 text-right">Recouvert (FCFA)</th>
                      <th className="p-2 text-right">Solde Dû (FCFA)</th>
                      <th className="p-2 text-center">Taux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {bilanArrondissements.map((b) => (
                      <tr key={b.arrondissement}>
                        <td className="p-2 font-sans font-semibold">{b.arrondissement}</td>
                        <td className="p-2 text-center">{b.totalEtabs}</td>
                        <td className="p-2 text-right font-bold text-emerald-800">{formatCfa(b.encaisse)}</td>
                        <td className="p-2 text-right text-slate-700">{formatCfa(b.reste)}</td>
                        <td className="p-2 text-center">{b.taux}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase text-slate-900 text-xs">3. Clôture des Titres et Renouvellement Annuel N+1</h4>
                <p className="text-[11px] text-slate-700 text-justify leading-relaxed">
                  Conformément aux dispositions de la Loi N° 21-2019, toutes les autorisations d'exploitation et attestations délivrées sont strictement valables pour une durée d'un (01) an renouvelable. Pour l'exercice 2027 (N+1), chaque établissement s'acquittera de sa redevance d'exploitation au jour anniversaire de son premier paiement ou solde.
                </p>
              </div>

              {/* Visas et Paraphes */}
              <div className="flex justify-between items-end pt-8 mt-6 border-t-2 border-slate-900 font-serif">
                <div className="text-center w-56">
                  <p className="font-bold text-xs uppercase mb-12">Le Caissier Régisseur Principal</p>
                  <p className="font-bold text-xs">Sylvain KIMBEMBE</p>
                  <p className="text-[10px] text-slate-600">Régie Financière SAF • DDL-PN</p>
                </div>

                <div className="text-center w-64">
                  <p className="font-bold text-xs uppercase mb-12">Le Directeur Départemental des Loisirs</p>
                  <p className="font-bold text-xs">Jean Richard NTSEKE NGOUAKA</p>
                  <p className="text-[10px] text-slate-600">Pour le Trésor Public & la Direction Générale</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
