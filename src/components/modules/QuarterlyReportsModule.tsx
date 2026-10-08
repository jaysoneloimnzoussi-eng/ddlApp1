import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  BarChart3,
  TrendingUp,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { generateQuarterlyReportDocx } from '../../services/docxGenerator';
import { formatCfa } from '../../services/crypto';
import { Arrondissement } from '../../types';

export const QuarterlyReportsModule: React.FC = () => {
  const { establishments, receipts, legalActs, ptaMilestones, showNotification } = useApp();

  const [trimestre, setTrimestre] = useState<'T1' | 'T2' | 'T3' | 'T4'>('T1');
  const annee = 2026;

  const totalRecettes = receipts.reduce((sum, r) => sum + r.montantVerse, 0);
  const totalEtablissements = establishments.length;
  const totalMisesEnDemeure = legalActs.filter((a) => a.type === 'mise_en_demeure').length;
  const totalInfractions = legalActs.length;

  const arrondissements: Arrondissement[] = [
    'Lumumba',
    'Mvou-Mvou',
    'Tié-Tié',
    'Loandjili',
    'Mongo-Mpoukou',
    'Ngoyo',
  ];

  const repartitionArrondissements = arrondissements.map((nom) => {
    const etabs = establishments.filter((e) => e.arrondissement === nom);
    const recs = receipts.filter((r) => r.arrondissement === nom);
    return {
      nom,
      nombre: etabs.length,
      montant: recs.reduce((s, r) => s + r.montantVerse, 0),
    };
  });

  const actionsPta = ptaMilestones.map(
    (p) => `${p.activite} (${p.serviceResponsable}) : ${p.tauxExecutionPhysique}% réalisé.`
  );

  const handleExportDocx = async () => {
    try {
      await generateQuarterlyReportDocx({
        trimestre,
        annee,
        totalRecettes,
        totalEtablissements,
        totalInfractions,
        totalMisesEnDemeure,
        repartitionArrondissements,
        actionsPta,
      });
      showNotification('success', `Rapport Trimestriel ${trimestre} ${annee} exporté en format Word (.docx) avec succès !`);
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'exportation Word : ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-06
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Rapports Trimestriels d'Activité DGL
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Production automatisée des bilans institutionnels destinés à la Direction Générale à Brazzaville
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportDocx}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Télécharger Word (.docx)
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimer Rapport A4
          </button>
        </div>
      </div>

      {/* Quarter Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Exercice Budgétaire :</span>
          <span className="font-mono text-xs font-bold text-slate-100">{annee}</span>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['T1', 'T2', 'T3', 'T4'] as const).map((q) => (
            <button
              key={q}
              onClick={() => setTrimestre(q)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                trimestre === q
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trimestre {q}
            </button>
          ))}
        </div>
      </div>

      {/* Document A4 Preview in Frame */}
      <div className="bg-white text-slate-950 p-4 sm:p-8 md:p-12 rounded-xl shadow-2xl max-w-4xl mx-auto border border-slate-300 font-serif leading-relaxed text-xs overflow-hidden">
        {/* State Banner */}
        <div className="text-center space-y-1 mb-8">
          <p className="font-bold text-sm uppercase">RÉPUBLIQUE DU CONGO</p>
          <p className="italic text-[11px] text-slate-700">Unité - Travail - Progrès</p>
          <p className="text-[10px]">------------------------------------</p>
          <p className="text-xs font-semibold">MINISTÈRE DE LA CULTURE, DES ARTS, DU TOURISME ET DES LOISIRS</p>
          <p className="text-xs font-semibold">DIRECTION GÉNÉRALE DES LOISIRS</p>
          <p className="font-cinzel text-sm font-black uppercase text-slate-950">
            DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
          </p>
        </div>

        {/* Title */}
        <div className="text-center my-6 py-2 border-y-2 border-slate-900 bg-slate-50">
          <h2 className="font-cinzel text-base md:text-lg font-black uppercase tracking-wider">
            RAPPORT GÉNÉRAL D'ACTIVITÉ TRIMESTRIEL - {trimestre} {annee}
          </h2>
          <p className="font-sans text-[11px] text-slate-600 mt-0.5">
            Liaison hiérarchique officielle DDL-PN / DGL Brazzaville
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-3 my-6 font-sans">
          <h3 className="font-serif text-sm font-bold border-b border-slate-300 pb-1 text-slate-900">
            I. SYNTHÈSE DES OPÉRATIONS & RÉSULTATS CHIFFRÉS
          </h3>
          <p className="text-justify leading-5 text-slate-800">
            Au cours du {trimestre} {annee}, les services techniques (SAA, SAF, SPA et SSID) ont intensifié leurs opérations sur le territoire de Pointe-Noire sous l'égide de la Loi N° 21-2019 :
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
            <div className="p-3 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="block text-[10px] text-slate-600 font-semibold uppercase">Recettes Encaissées</span>
              <span className="font-mono text-sm font-bold text-emerald-700">{formatCfa(totalRecettes)}</span>
            </div>
            <div className="p-3 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="block text-[10px] text-slate-600 font-semibold uppercase">Établissements</span>
              <span className="font-mono text-sm font-bold text-slate-900">{totalEtablissements}</span>
            </div>
            <div className="p-3 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="block text-[10px] text-slate-600 font-semibold uppercase">Mises en Demeure</span>
              <span className="font-mono text-sm font-bold text-amber-700">{totalMisesEnDemeure}</span>
            </div>
            <div className="p-3 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="block text-[10px] text-slate-600 font-semibold uppercase">Infractions Notifiées</span>
              <span className="font-mono text-sm font-bold text-red-700">{totalInfractions}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Table */}
        <div className="space-y-3 my-6 font-sans">
          <h3 className="font-serif text-sm font-bold border-b border-slate-300 pb-1 text-slate-900">
            II. ÉTAT DES RECOUVREMENTS PAR ARRONDISSEMENT
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-left text-xs min-w-[500px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 font-bold">Arrondissement</th>
                  <th className="border border-slate-300 p-2 font-bold text-center">Établissements Recensés</th>
                  <th className="border border-slate-300 p-2 font-bold text-right">Recettes SAF Recouvrées</th>
                </tr>
              </thead>
              <tbody>
                {repartitionArrondissements.map((arr) => (
                  <tr key={arr.nom} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-semibold">{arr.nom}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{arr.nombre}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {formatCfa(arr.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: PTA Actions */}
        <div className="space-y-3 my-6 font-sans">
          <h3 className="font-serif text-sm font-bold border-b border-slate-300 pb-1 text-slate-900">
            III. PLAN DE TRAVAIL ANNUEL (PTA 2026) - ÉTAT D'AVANCEMENT
          </h3>
          <ul className="space-y-1.5 list-disc list-inside text-slate-800">
            {actionsPta.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end pt-8 mt-8 border-t border-slate-300 font-serif">
          <div className="text-left text-xs">
            <p className="font-bold">Pour ampliation :</p>
            <p className="text-[11px] text-slate-600">- Monsieur le Préfet du Département de Pointe-Noire</p>
            <p className="text-[11px] text-slate-600">- Monsieur le Député-Maire de la Ville</p>
            <p className="text-[11px] text-slate-600">- Archives & Documentation SAA</p>
          </div>

          <div className="text-right text-xs">
            <p className="italic">Fait à Pointe-Noire, le {new Date().toLocaleDateString('fr-FR')}</p>
            <p className="font-bold uppercase mt-1">Le Directeur Départemental des Loisirs</p>
            <div className="h-14" />
            <p className="font-bold underline">Commandement Territorial DDL-PN</p>
          </div>
        </div>
      </div>
    </div>
  );
};
