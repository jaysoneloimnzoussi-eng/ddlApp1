import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building,
  Shield,
  FileCheck2,
  Printer,
  Plus,
  Volume2,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { JointInspectionReport } from '../../types';
import { computeSha256 } from '../../services/crypto';

export const JointInspectionModule: React.FC = () => {
  const { establishments, showNotification } = useApp();

  const [reports, setReports] = useState<JointInspectionReport[]>([
    {
      id: 'rep-001',
      referenceNumero: 'PV-CONJOINT-2026/04/002',
      dateControle: '2026-04-02',
      etablissementNom: 'Le Palmier VIP Lounge & Club',
      arrondissement: 'Lumumba',
      representants: [
        { administration: 'Direction Départementale des Loisirs (DDL-PN)', nomRepresentant: 'Gildas Ambetos', emargement: true },
        { administration: 'Police Nationale (Commissariat Central)', nomRepresentant: 'Capitaine Moungondo', emargement: true },
        { administration: 'Mairie de Pointe-Noire (Direction Hygiène)', nomRepresentant: 'Mme Loufoua', emargement: true },
        { administration: 'Direction Départementale de l\'Environnement', nomRepresentant: 'Inspecteur Mavoungou', emargement: true },
      ],
      conformiteAcoustique: { conforme: true, decibels: 68, observations: 'Limiteur de bruit opérationnel et scellé intact.' },
      conformiteHygiene: { conforme: true, observations: 'Blocs sanitaires salubres et eau courante permanente.' },
      securiteIncendie: { conforme: true, extincteursPresents: true, issueSecoursDegagee: true },
      licenceBoissons: { conforme: true, numeroLicence: 'LIC-2025/PNR-884' },
      decisionCommission: 'Avis Favorable',
      recommandations: 'Maintien des dispositions techniques actuelles.',
      hash: 'e8b7c4a1d0f28849c4a8f90248a318d5',
    },
  ]);

  const [selectedEstId, setSelectedEstId] = useState(establishments[0]?.id || '');
  const [decibels, setDecibels] = useState(72);
  const [hygieneOk, setHygieneOk] = useState(true);
  const [incendieOk, setIncendieOk] = useState(true);
  const [licenceOk, setLicenceOk] = useState(true);
  const [decision, setDecision] = useState<JointInspectionReport['decisionCommission']>('Avis Favorable');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateJointReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const est = establishments.find((x) => x.id === selectedEstId);
    if (!est) return;

    const count = reports.length + 1;
    const ref = `PV-CONJOINT-2026/04/${count.toString().padStart(3, '0')}`;
    const hash = await computeSha256(`${ref}_${est.nomCommercial}_${new Date().toISOString()}`);

    const newRep: JointInspectionReport = {
      id: 'rep-' + Date.now(),
      referenceNumero: ref,
      dateControle: new Date().toISOString().substring(0, 10),
      etablissementNom: est.nomCommercial,
      arrondissement: est.arrondissement,
      representants: [
        { administration: 'DDL-PN (Loisirs)', nomRepresentant: 'Inspecteur SAA Chef', emargement: true },
        { administration: 'Police Nationale', nomRepresentant: 'Officier de Permanence', emargement: true },
        { administration: 'Mairie de Pointe-Noire', nomRepresentant: 'Agent Contrôleur Salubrité', emargement: true },
        { administration: 'Services d\'Incendie & Secours', nomRepresentant: 'Capitaine Sapeur-Pompier', emargement: true },
      ],
      conformiteAcoustique: { conforme: decibels <= 75, decibels, observations: decibels <= 75 ? 'Conforme aux normes' : 'Dépassement nocturne' },
      conformiteHygiene: { conforme: hygieneOk, observations: hygieneOk ? 'Normes sanitaires respectées' : 'Insuffisance sanitaire' },
      securiteIncendie: { conforme: incendieOk, extincteursPresents: incendieOk, issueSecoursDegagee: incendieOk },
      licenceBoissons: { conforme: licenceOk, numeroLicence: licenceOk ? 'LIC-VALIDE' : 'DEFAUT' },
      decisionCommission: decision,
      recommandations: 'Régularisation stricte sous huitaine en cas de réserves.',
      hash,
    };

    setReports((prev) => [newRep, ...prev]);
    setIsModalOpen(false);
    showNotification('success', `Procès-Verbal Conjoint ${ref} enregistré avec succès !`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-16
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Commission Mixte de Contrôle Conjoint
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Opérations coordonnées avec la Police, la Mairie, l'Hygiène Publique et l'Environnement
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Rédiger PV Conjoint
        </button>
      </div>

      <div className="space-y-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">{r.referenceNumero}</span>
                <h3 className="text-base font-bold text-slate-100">{r.etablissementNom}</h3>
                <p className="text-xs text-slate-400">Arrondissement : {r.arrondissement} • Date : {r.dateControle}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase font-mono ${
                    r.decisionCommission === 'Avis Favorable'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {r.decisionCommission}
                </span>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Imprimer PV Conjoint"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Grille 4 volets de contrôle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Acoustique SAA
                </span>
                <p className="font-bold text-slate-200">{r.conformiteAcoustique.decibels} dB(A)</p>
                <p className="text-[11px] text-slate-400">{r.conformiteAcoustique.observations}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Hygiène Municipale
                </span>
                <p className="font-bold text-slate-200">{r.conformiteHygiene.conforme ? 'Conforme' : 'Infraction'}</p>
                <p className="text-[11px] text-slate-400">{r.conformiteHygiene.observations}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Sécurité Incendie
                </span>
                <p className="font-bold text-slate-200">{r.securiteIncendie.conforme ? 'Extincteurs OK' : 'Non-conforme'}</p>
                <p className="text-[11px] text-slate-400">Issues de secours dégagées</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" /> Police / Débit Boissons
                </span>
                <p className="font-bold text-slate-200">{r.licenceBoissons.numeroLicence}</p>
                <p className="text-[11px] text-slate-400">Police Administrative</p>
              </div>
            </div>

            {/* Administrations signataires */}
            <div className="pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold block mb-1.5">Émargement Multipartite :</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {r.representants.map((rep, idx) => (
                  <div key={idx} className="p-2 bg-slate-950/60 rounded border border-slate-800 text-[11px]">
                    <span className="font-bold text-slate-200 block truncate">{rep.nomRepresentant}</span>
                    <span className="text-slate-500 text-[10px] block truncate">{rep.administration}</span>
                    <span className="text-emerald-400 font-mono text-[9px] mt-1 block">✓ Émargé</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nouveau PV Conjoint */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-cinzel">
              <Building className="w-5 h-5 text-emerald-400" />
              Nouveau PV de Contrôle Conjoint
            </h2>

            <form onSubmit={handleCreateJointReport} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Établissement Inspecté *</label>
                <select
                  value={selectedEstId}
                  onChange={(e) => setSelectedEstId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nomCommercial} — {est.arrondissement}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Décibels Mesurés (dB(A))</label>
                  <input
                    type="number"
                    value={decibels}
                    onChange={(e) => setDecibels(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Décision de la Commission</label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="Avis Favorable">Avis Favorable</option>
                    <option value="Avertissement avec Délai">Avertissement avec Délai (72h)</option>
                    <option value="Fermeture Provisoire Proposée">Fermeture Provisoire Proposée</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hygieneOk}
                    onChange={(e) => setHygieneOk(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
                  />
                  <span className="text-slate-300">Conformité Hygiène & Assainissement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incendieOk}
                    onChange={(e) => setIncendieOk(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
                  />
                  <span className="text-slate-300">Conformité Sécurité Incendie & Extincteurs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={licenceOk}
                    onChange={(e) => setLicenceOk(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
                  />
                  <span className="text-slate-300">Licence de Débit de Boissons en Règle</span>
                </label>
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
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow"
                >
                  Signer et Enregistrer le PV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
