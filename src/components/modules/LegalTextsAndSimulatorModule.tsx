import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  Search,
  Scale,
  CheckSquare,
  FileText,
  BadgeAlert,
  Percent,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { INITIAL_LEGAL_TEXTS } from '../../data/seedData';
import { formatCfa } from '../../services/crypto';
import {
  OFFICIAL_TARIFFS,
  computeOfficialFees,
  OFFICIAL_DOSSIER_CHECKLIST,
  OFFICIAL_INVESTIGATION_FEE_CFA,
} from '../../data/officialTariffs';

export const LegalTextsAndSimulatorModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawId, setSelectedLawId] = useState(INITIAL_LEGAL_TEXTS[0].id);
  const [activeTab, setActiveTab] = useState<'textes' | 'checklist'>('textes');

  // Simulator states
  const [selectedTariffId, setSelectedTariffId] = useState<string>('tar-bar-dancing');
  const [simSurface, setSimSurface] = useState<number>(120);
  const [includeEnquete, setIncludeEnquete] = useState<boolean>(true);
  const [isPromoteurEtranger, setIsPromoteurEtranger] = useState<boolean>(false);

  // Filter checklist items
  const [checklistFilter, setChecklistFilter] = useState<string>('all');

  // Active tariff item
  const activeTariff = OFFICIAL_TARIFFS.find((t) => t.id === selectedTariffId) || OFFICIAL_TARIFFS[0];

  // Calculation based on official Note 151
  const feeResult = computeOfficialFees(activeTariff.id, simSurface, includeEnquete);

  const activeLaw = INITIAL_LEGAL_TEXTS.find((l) => l.id === selectedLawId) || INITIAL_LEGAL_TEXTS[0];

  const filteredArticles = activeLaw.articles.filter((art) => {
    return (
      art.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.texte.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredChecklist = OFFICIAL_DOSSIER_CHECKLIST.filter((doc) => {
    if (checklistFilter !== 'all' && doc.sousDossier !== checklistFilter) return false;
    if (searchTerm) {
      return (
        doc.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-12
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Bibliothèque Réglementaire & Simulateur Officiel des Redevances
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conforme à la Note N° 151/MTL-CAB (tarifs & 50% étude), Note N° 152/MTL-CAB (4 sous-dossiers & parrainage) et Fiche SAF DDL-PN (frais d'enquête de 30 000 FCFA).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Simulateur de Barèmes Officiels (5 colonnes) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Simulateur Officiel Note N° 151/MTL-CAB</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Norme 2026
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Sélection de Catégorie Réglementaire */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Catégorie d'Établissement ou d'Activité</span>
                <span className="text-[10px] text-slate-400 font-mono">{activeTariff.section}</span>
              </label>
              <select
                value={selectedTariffId}
                onChange={(e) => setSelectedTariffId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <optgroup label="K- Débits de boisson (tarifs au m²)">
                  <option value="tar-night-club-vip">Night-club VIP — 1 500 FCFA / m²</option>
                  <option value="tar-discotheque">Discothèque — 1 500 FCFA / m²</option>
                  <option value="tar-bar-dancing">Bar, bar dancing, cabaret — 1 000 FCFA / m²</option>
                  <option value="tar-cave">Cave — 1 000 FCFA / m²</option>
                  <option value="tar-buvette">Buvette / Snack-bar — 1 000 FCFA / m²</option>
                </optgroup>
                <optgroup label="I- Salles de jeux">
                  <option value="tar-casino">Casino — 5 000 000 FCFA</option>
                  <option value="tar-jackpot">Jackpot — 3 500 000 FCFA</option>
                  <option value="tar-billard">Salle de billard — 500 000 FCFA</option>
                  <option value="tar-bowling">Salle de bowling — 500 000 FCFA</option>
                  <option value="tar-jeux-video">Salle de jeux vidéo — 5 000 FCFA / m²</option>
                </optgroup>
                <optgroup label="J- Salles de cinéma">
                  <option value="tar-cine-grand">Ciné grand écran — 500 000 FCFA</option>
                  <option value="tar-cine-foot">Ciné foot / Vidéo club — 50 000 FCFA</option>
                  <option value="tar-cine-petit">Ciné petit écran — 50 000 FCFA</option>
                </optgroup>
                <optgroup label="L- Sites de loisirs">
                  <option value="tar-complexe-loisirs">Base / Complexe de loisirs & piscine — 100 000 FCFA</option>
                  <option value="tar-maisons-loisirs">Maisons de loisirs — 100 000 FCFA</option>
                  <option value="tar-centre-vacances">Centre de loisirs / vacances — 100 000 FCFA</option>
                  <option value="tar-parc-loisirs">Parc de loisirs — 100 000 FCFA</option>
                  <option value="tar-village-loisirs">Village de loisirs — 100 000 FCFA</option>
                  <option value="tar-base-nautique">Base nautique / Balnéaire — 100 000 FCFA</option>
                  <option value="tar-parc-aquatique">Parc aquatique — 100 000 FCFA</option>
                </optgroup>
                <optgroup label="M- Jeux de hasard">
                  <option value="tar-tombola-pub">Tombola publicitaire — 1 000 000 FCFA</option>
                  <option value="tar-loterie-pub">Loterie publicitaire — 2 000 000 FCFA</option>
                  <option value="tar-loterie-tv">Loterie classique télévisée — 50 000 000 FCFA</option>
                  <option value="tar-paris-sportifs">Paris sportifs physiques — 50 000 000 FCFA</option>
                  <option value="tar-pari-equestre">Pari équestre — 80 000 000 FCFA</option>
                  <option value="tar-jeux-en-ligne">Jeux en ligne — 80 000 000 FCFA</option>
                </optgroup>
                <optgroup label="N, O, P- Événementiel & Forains">
                  <option value="tar-kermesse">Kermesse — 50 000 FCFA</option>
                  <option value="tar-cirque">Cirque — 50 000 FCFA</option>
                  <option value="tar-carnaval">Carnaval — 50 000 FCFA</option>
                  <option value="tar-foire">Foire — 50 000 FCFA</option>
                  <option value="tar-festival">Festivals & événements — 50 000 FCFA</option>
                  <option value="tar-rallye">Rallye — 50 000 FCFA</option>
                </optgroup>
                <optgroup label="Exonérations (Loisirs Sains)">
                  <option value="tar-exo-aires-jeux">Aires de jeux (Exonéré)</option>
                  <option value="tar-exo-ludotheques">Ludothèques (Exonéré)</option>
                  <option value="tar-exo-clubs">Clubs de loisirs (Exonéré)</option>
                  <option value="tar-exo-caritatif">Tombolas caritatives (Exonéré)</option>
                </optgroup>
              </select>
            </div>

            {/* Saisie Surface m² si tarif au m² */}
            {activeTariff.typeTarif === 'par_m2' && (
              <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">Superficie Déclarée (en m²)</label>
                  <span className="font-mono text-emerald-400 font-bold">{simSurface} m²</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={simSurface}
                  onChange={(e) => setSimSurface(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono font-bold text-sm"
                />
                <p className="text-[10px] text-slate-400">
                  Tarif réglementaire : <strong className="text-slate-200">{formatCfa(activeTariff.tarifUnitaireCfa)} / m²</strong>
                </p>
              </div>
            )}

            {/* Frais d'enquête DDL-PN */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Frais d'Enquête Terrain DDL-PN</span>
                <span className="text-[10px] text-slate-400">Fiche Locale SAF Pointe-Noire (obligatoire avant descente)</span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeEnquete(!includeEnquete)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                  includeEnquete
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {includeEnquete ? `+ ${formatCfa(OFFICIAL_INVESTIGATION_FEE_CFA)}` : 'Exclus'}
              </button>
            </div>

            {/* Toggle Promoteur Étranger */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Promoteur de Nationalité Étrangère</span>
                <span className="text-[10px] text-slate-400">Note 152/MTL-CAB : Parrainage congolais obligatoire</span>
              </div>
              <input
                type="checkbox"
                checked={isPromoteurEtranger}
                onChange={(e) => setIsPromoteurEtranger(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 border-slate-700 focus:ring-emerald-500 bg-slate-900"
              />
            </div>

            {isPromoteurEtranger && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] flex items-start gap-2">
                <BadgeAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Alerte Note 152 :</strong> Le promoteur étranger doit fournir la garantie d'un contrat de parrainage avec une personne physique congolaise certifiée par le Ministre chargé des loisirs, ainsi que les contrats de travail du personnel congolais.
                </span>
              </div>
            )}

            {/* Ventilation Récapitulative Détaillée */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ventilation Réglementaire des Fonds</span>
                <span className="text-[10px] text-emerald-400 font-mono">Décret & Note 151</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-sans">Redevance d'Autorisation :</span>
                  <span>{formatCfa(feeResult.montantAutorisation)}</span>
                </div>
                <div className="flex justify-between text-blue-300 pl-3 text-[11px]">
                  <span className="text-slate-400 font-sans">↳ Quote-part Étude Dossier (50% Admin Loisirs) :</span>
                  <span>{formatCfa(feeResult.partAdministrationEtude)}</span>
                </div>
                <div className="flex justify-between text-blue-300 pl-3 text-[11px]">
                  <span className="text-slate-400 font-sans">↳ Quote-part Trésor Public (50%) :</span>
                  <span>{formatCfa(feeResult.partTresorPublic)}</span>
                </div>
                {includeEnquete && (
                  <div className="flex justify-between text-amber-300 pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400 font-sans">Frais d'Enquête Terrain (DDL-PN) :</span>
                    <span>{formatCfa(feeResult.fraisEnqueteTerrain)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Total Exigible au Promoteur</span>
                  <span className="text-[9px] text-slate-400">Payable avant délivrance de l'attestation</span>
                </div>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {formatCfa(feeResult.totalExigible)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Textes Officiels & Checklist des 4 Sous-Dossiers (7 colonnes) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('textes')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'textes'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Textes & Notes Officielles</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'checklist'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>4 Sous-Dossiers (Note 152)</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher article, pièce, quitus..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-56"
              />
            </div>
          </div>

          {activeTab === 'textes' ? (
            <>
              {/* Onglets de sélection du texte */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {INITIAL_LEGAL_TEXTS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedLawId(t.id)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition border whitespace-nowrap shrink-0 ${
                      selectedLawId === t.id
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.id === 'note-151-mtl-cab'
                      ? 'Note 151 (Tarifs)'
                      : t.id === 'note-152-mtl-cab'
                      ? 'Note 152 (Dossiers)'
                      : t.id === 'fiche-saf-ddl-pn'
                      ? 'Fiche SAF (30 000 F)'
                      : t.id === 'loi-21-2019'
                      ? 'Loi 21-2019'
                      : 'Arrêté Bruits'}
                  </button>
                ))}
              </div>

              {/* Fiche active */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-slate-100">{activeLaw.titre}</p>
                <p className="text-[11px] text-emerald-400 font-mono">{activeLaw.chapitre}</p>
              </div>

              {/* Liste des articles / sections */}
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {filteredArticles.map((art, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-slate-200">{art.numero}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px] text-justify whitespace-pre-line">
                      {art.texte}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Filtres par sous-dossier */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setChecklistFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition border whitespace-nowrap shrink-0 ${
                    checklistFilter === 'all'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Tous ({OFFICIAL_DOSSIER_CHECKLIST.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('demande')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition border whitespace-nowrap shrink-0 ${
                    checklistFilter === 'demande'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Demande Écrite
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('technique')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition border whitespace-nowrap shrink-0 ${
                    checklistFilter === 'technique'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Sous-Dossier Technique
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('administratif')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition border whitespace-nowrap shrink-0 ${
                    checklistFilter === 'administratif'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Sous-Dossier Administratif
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('financier')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition border whitespace-nowrap shrink-0 ${
                    checklistFilter === 'financier'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Sous-Dossier Financier
                </button>
              </div>

              {/* Pièces à fournir selon Note 152 */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-start gap-3 hover:border-slate-700 transition"
                  >
                    <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] shrink-0 font-bold">
                      {item.code}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-100">{item.libelle}</span>
                        {item.obligatoire ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                            Obligatoire
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Conditionnel
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500 font-mono">
                        <span>Source : Note {item.noteServiceOrigine}</span>
                        {item.estConditionEtranger && <span className="text-amber-400">· Requis si étranger</span>}
                        {item.estConditionJeuxHasard && <span className="text-blue-400">· Jeux de hasard</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
