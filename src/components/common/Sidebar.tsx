import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  MapPinPlus,
  CalendarCheck,
  CloudCog,
  Scale,
  FileSpreadsheet,
  Map,
  Award,
  Send,
  Coins,
  FileCheck2,
  BookOpen,
  Target,
  Users,
  Lock,
  Building,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface ModuleItem {
  code: string;
  nomCourt: string;
  nomComplet: string;
  icon: React.ElementType;
  badge?: string;
  section: string;
}

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule, offlineQueueCount, isOnline, theme } = useApp();

  const MODULES: ModuleItem[] = [
    // 1. Pilotage & Stratégie
    {
      code: 'MOD-01',
      nomCourt: 'Cockpit Stratégique',
      nomComplet: 'Dashboard & Indicateurs 2026',
      icon: LayoutDashboard,
      section: 'Pilotage & Stratégie',
    },
    {
      code: 'MOD-13',
      nomCourt: 'Suivi PTA 2026',
      nomComplet: 'Plan de Travail Annuel',
      icon: Target,
      section: 'Pilotage & Stratégie',
    },
    {
      code: 'MOD-06',
      nomCourt: 'Rapports Trimestriels',
      nomComplet: 'Bilans DGL Brazzaville',
      icon: FileSpreadsheet,
      section: 'Pilotage & Stratégie',
    },
    {
      code: 'MOD-09',
      nomCourt: 'Soit-Transmis DGL',
      nomComplet: 'Liaison Brazzaville Agréments',
      icon: Send,
      section: 'Pilotage & Stratégie',
    },

    // 2. Opérations de Terrain & Cartographie
    {
      code: 'MOD-02',
      nomCourt: 'Recensement Terrain',
      nomComplet: 'Brigade Mobile SAA (GPS & PWA)',
      icon: MapPinPlus,
      badge: !isOnline || offlineQueueCount > 0 ? `${offlineQueueCount} PWA` : undefined,
      section: 'Opérations de Terrain & SIG',
    },
    {
      code: 'MOD-07',
      nomCourt: 'SIG & Heatmap Décibels',
      nomComplet: 'Cartographie des 6 Arrondissements',
      icon: Map,
      section: 'Opérations de Terrain & SIG',
    },
    {
      code: 'MOD-03',
      nomCourt: 'Planning & Tournées',
      nomComplet: 'Tournées Brigades SAA & RDV',
      icon: CalendarCheck,
      section: 'Opérations de Terrain & SIG',
    },
    {
      code: 'MOD-16',
      nomCourt: 'Contrôle Conjoint',
      nomComplet: 'Commission Mixte Inter-services',
      icon: Building,
      section: 'Opérations de Terrain & SIG',
    },

    // 3. Finances, Titres & Régie SAF
    {
      code: 'MOD-11',
      nomCourt: 'Titres & Quittances',
      nomComplet: 'Attestations A4 & Reçus POS 58mm',
      icon: FileCheck2,
      section: 'Régie Financière & Titres',
    },
    {
      code: 'MOD-10',
      nomCourt: 'Régie des Recettes',
      nomComplet: 'Livre de Caisse SAF & Trésor',
      icon: Coins,
      section: 'Régie Financière & Titres',
    },
    {
      code: 'MOD-17',
      nomCourt: 'Portail Télépaiement',
      nomComplet: 'Espace Promoteur & MoMo/Airtel',
      icon: Smartphone,
      section: 'Régie Financière & Titres',
    },

    // 4. Police Administrative & Droit
    {
      code: 'MOD-05',
      nomCourt: 'Police Administrative',
      nomComplet: 'Mises en Demeure & Arrêtés',
      icon: Scale,
      section: 'Police Administrative & Droit',
    },
    {
      code: 'MOD-12',
      nomCourt: 'Législation & Barèmes',
      nomComplet: 'Loi 21-2019 & Simulateur Taxes',
      icon: BookOpen,
      section: 'Police Administrative & Droit',
    },
    {
      code: 'MOD-08',
      nomCourt: 'Promotion SPA',
      nomComplet: 'Loisirs Sains & Diplômes d\'Honneur',
      icon: Award,
      section: 'Promotion & Label',
    },

    // 5. Interconnexions, RH & Archivage
    {
      code: 'MOD-04',
      nomCourt: 'Google Workspace',
      nomComplet: 'Passerelle Calendar, Gmail & Docs',
      icon: CloudCog,
      section: 'Administration & Système',
    },
    {
      code: 'MOD-14',
      nomCourt: 'Personnel & Badges',
      nomComplet: 'Inspecteurs SAA & Cartes Pro',
      icon: Users,
      section: 'Administration & Système',
    },
    {
      code: 'MOD-15',
      nomCourt: 'Coffre-Fort Numérique',
      nomComplet: 'Archivage SHA-256 & Audit Trail',
      icon: Lock,
      section: 'Administration & Système',
    },
  ];

  // Group by section
  const sections = Array.from(new Set(MODULES.map((m) => m.section)));

  return (
    <aside className={`w-72 border-r flex flex-col h-[calc(100vh-4.5rem)] shrink-0 select-none overflow-y-auto transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-white border-slate-200 text-slate-800'
        : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      <div className="p-3">
        <div className={`text-[11px] font-semibold uppercase tracking-wider px-3 mb-2 ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          17 Modules Métier Intégrés
        </div>
        <div className="space-y-4">
          {sections.map((sectionName) => (
            <div key={sectionName} className="space-y-1">
              <div className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border-l-2 ${
                theme === 'light'
                  ? 'bg-slate-100 text-slate-700 border-emerald-600'
                  : 'bg-slate-950/40 text-slate-300 border-emerald-500/60'
              }`}>
                {sectionName}
              </div>
              <div className="space-y-0.5 pt-1">
                {MODULES.filter((m) => m.section === sectionName).map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.code;
                  return (
                    <button
                      key={mod.code}
                      onClick={() => setActiveModule(mod.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? theme === 'light'
                            ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300 shadow-sm'
                            : 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                          : theme === 'light'
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'
                              : theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-xs truncate font-medium flex items-center gap-1.5">
                            <span className={`font-mono text-[10px] ${
                              theme === 'light' ? 'text-slate-400' : 'text-slate-300 opacity-90'
                            }`}>
                              {mod.code}
                            </span>
                            <span className="truncate">{mod.nomCourt}</span>
                          </div>
                          <div className={`text-[10px] truncate ${
                            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {mod.nomComplet}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {mod.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            theme === 'light'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {mod.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive
                              ? theme === 'light' ? 'text-emerald-700 translate-x-0.5' : 'text-emerald-400 translate-x-0.5'
                              : theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
