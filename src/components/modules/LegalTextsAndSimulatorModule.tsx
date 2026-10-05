import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Calculator,
  Search,
  Scale,
  CheckCircle,
  HelpCircle,
  FileText,
  Volume2,
} from 'lucide-react';
import { INITIAL_LEGAL_TEXTS } from '../../data/seedData';
import { formatCfa } from '../../services/crypto';
import { EstablishmentCategory } from '../../types';

export const LegalTextsAndSimulatorModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawId, setSelectedLawId] = useState(INITIAL_LEGAL_TEXTS[0].id);

  // Simulator states
  const [simCategorie, setSimCategorie] = useState<EstablishmentCategory>('Bar Dancing / Cabaret');
  const [simSurface, setSimSurface] = useState<number>(100);
  const [simRegime, setSimRegime] = useState<'informel' | 'formel'>('informel');
  const [simAcoustique, setSimAcoustique] = useState<'insonorise' | 'plein_air'>('insonorise');
  const [simForfait, setSimForfait] = useState<number>(50000);

  // Simulation calculation
  let calculatedTax = 0;
  if (simRegime === 'informel') {
    calculatedTax = simForfait;
  } else {
    // Proportional calculation based on official scale
    const baseTarifPerM2: Record<EstablishmentCategory, number> = {
      'Discothèque / Night-club': 1500,
      'Bar Dancing / Cabaret': 1200,
      'Lounge Bar & Terrasse': 1000,
      'Espace Récréatif & Salle Polyvalente': 900,
      'Snack-Bar Sonorisé': 800,
      'Complexe de Loisirs & Piscine': 1100,
      'Autre établissement de loisirs': 800,
    };
    const rate = baseTarifPerM2[simCategorie] || 1000;
    calculatedTax = Math.max(120000, simSurface * rate);
    if (simAcoustique === 'plein_air') {
      calculatedTax *= 1.15; // +15% majoration impact sonore urbain
    }
  }

  const activeLaw = INITIAL_LEGAL_TEXTS.find((l) => l.id === selectedLawId) || INITIAL_LEGAL_TEXTS[0];

  const filteredArticles = activeLaw.articles.filter((art) => {
    return (
      art.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.texte.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-12
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Bibliothèque Juridique & Simulateur de Taxes
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Référentiel intégral de la Loi N° 21-2019, arrêtés préfectoraux et simulateur officiel des redevances
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Simulateur de Barèmes Officiels (5 colonnes) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Simulateur Tarifaire de Redevance</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
              Barème 2026
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Régime d'Imposition Régalien</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimRegime('informel')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                    simRegime === 'informel'
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Informel Forfaitaire
                </button>
                <button
                  type="button"
                  onClick={() => setSimRegime('formel')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                    simRegime === 'formel'
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Formel Proportionnel
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Catégorie d'Activité</label>
              <select
                value={simCategorie}
                onChange={(e) => setSimCategorie(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
              >
                <option value="Discothèque / Night-club">Discothèque / Night-club (1 500 FCFA/m²)</option>
                <option value="Bar Dancing / Cabaret">Bar Dancing / Cabaret (1 200 FCFA/m²)</option>
                <option value="Lounge Bar & Terrasse">Lounge Bar & Terrasse (1 000 FCFA/m²)</option>
                <option value="Espace Récréatif & Salle Polyvalente">Espace Récréatif (900 FCFA/m²)</option>
                <option value="Snack-Bar Sonorisé">Snack-Bar Sonorisé (800 FCFA/m²)</option>
                <option value="Complexe de Loisirs & Piscine">Complexe & Piscine (1 100 FCFA/m²)</option>
              </select>
            </div>

            {simRegime === 'informel' ? (
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Montant Forfaitaire Standard</label>
                <input
                  type="number"
                  value={simForfait}
                  onChange={(e) => setSimForfait(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-emerald-400 font-bold"
                />
                <p className="text-[10px] text-slate-400">
                  Applicable de plein droit aux petits débits de boissons sonorisés du secteur informel.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Superficie Déclarée (m²)</label>
                  <input
                    type="number"
                    value={simSurface}
                    onChange={(e) => setSimSurface(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Configuration Spatiale</label>
                  <select
                    value={simAcoustique}
                    onChange={(e) => setSimAcoustique(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="insonorise">Salle Fermée & Insonorisée (Standard)</option>
                    <option value="plein_air">Terrasse / Plein Air (+15% Majoration Bruit)</option>
                  </select>
                </div>
              </>
            )}

            {/* Résultat Calculé */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-4 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Redevance Annuelle Estimée
              </span>
              <p className="font-mono text-2xl font-bold text-emerald-400">
                {formatCfa(Math.round(calculatedTax))}
              </p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                Valable pour l'exercice 2026 sous réserve de vérification métrologique par les brigades SAA.
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Textes de Loi & Recherche Plein Texte (7 colonnes) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Textes Législatifs & Réglementaires</span>
            </h2>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher article, bruit, agrément..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-52"
              />
            </div>
          </div>

          {/* Choix du Texte */}
          <div className="flex gap-2">
            {INITIAL_LEGAL_TEXTS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedLawId(t.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition border truncate ${
                  selectedLawId === t.id
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t.id === 'loi-21-2019' ? 'Loi N° 21-2019 (Loisirs)' : 'Arrêté Préfectoral Bruits'}
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <p className="font-bold text-slate-200">{activeLaw.titre}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{activeLaw.chapitre}</p>
          </div>

          {/* Articles list */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredArticles.map((art, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-slate-100">{art.numero}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] text-justify">
                  {art.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
