import React from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from './DdlLogo';
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
  Database,
  LogOut,
  UserCheck,
  Crown,
  X,
  FileSignature,
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
  const {
    activeModule,
    setActiveModule,
    authenticatedUser,
    logoutAgentSession,
    visibleEstablishments,
    currentUserRole,
    offlineQueueCount,
    isOnline,
    theme,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useApp();

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
    {
      code: 'MOD-19',
      nomCourt: 'Canva Rédaction Admin',
      nomComplet: 'Rapports, TDR, Lettres & Garamond',
      icon: FileSignature,
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
    {
      code: 'MOD-18',
      nomCourt: 'Import Supabase / Données',
      nomComplet: 'Passerelle Cloud & Migration Firestore',
      icon: Database,
      badge: 'Nouveau',
      section: 'Administration & Système',
    },
  ];

  // Group by section
  const isFieldAgent = currentUserRole !== 'directeur' && currentUserRole !== 'administrateur';

  // For Field Agents: Dedicated operational suite with Google Agenda, Recensement, SIG and Workspace
  const visibleModules: ModuleItem[] = isFieldAgent
    ? [
        {
          code: 'MOD-01',
          nomCourt: 'Mon Dashboard Personnel',
          nomComplet: 'Suivi Exclusif de mes Dossiers & RDV',
          icon: LayoutDashboard,
          section: 'Mon Espace Terrain (Agent SAA)',
        },
        {
          code: 'MOD-03',
          nomCourt: 'Google Agenda & Tournées SAA',
          nomComplet: 'Planning, RDV 2026 & Import Google Calendar',
          icon: CalendarCheck,
          badge: 'Google Agenda',
          section: 'Mon Espace Terrain (Agent SAA)',
        },
        {
          code: 'MOD-02',
          nomCourt: 'Recensement de Terrain',
          nomComplet: 'Enregistrement In Situ & Mes Fiches SAA',
          icon: MapPinPlus,
          badge: !isOnline || offlineQueueCount > 0 ? `${offlineQueueCount} PWA` : undefined,
          section: 'Mon Espace Terrain (Agent SAA)',
        },
        {
          code: 'MOD-07',
          nomCourt: 'SIG & Cartographie Terrain',
          nomComplet: 'Cartographie Décibels & Itinéraires',
          icon: Map,
          section: 'Outils Mobiles & Passerelles',
        },
        {
          code: 'MOD-04',
          nomCourt: 'Google Workspace Cloud',
          nomComplet: 'Synchronisation Agenda, Gmail & Docs',
          icon: CloudCog,
          section: 'Outils Mobiles & Passerelles',
        },
        {
          code: 'MOD-11',
          nomCourt: 'Titres & Reçus POS 58mm',
          nomComplet: 'Délivrance Quittances Immédiates',
          icon: FileCheck2,
          section: 'Outils Mobiles & Passerelles',
        },
      ]
    : MODULES;

  const sections = Array.from(new Set(visibleModules.map((m) => m.section)));

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-80 md:w-72 max-w-[85vw]
          transform transition-transform duration-300 ease-in-out md:transform-none
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          border-r flex flex-col h-full md:h-[calc(100vh-4.5rem)] shrink-0 select-none overflow-y-auto
          ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <DdlLogo size="xs" rounded="lg" bordered={true} />
            <div>
              <p className="font-cinzel text-xs font-bold">DDL Pointe-Noire</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">18 Modules Métier</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <div className="p-3">
        {/* Institutional Authority Badge */}
        <div className={`p-2.5 mb-3 rounded-xl border flex items-center gap-2.5 transition ${
          theme === 'light'
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-slate-800'
            : 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-800/40 text-slate-100'
        }`}>
          <DdlLogo size="xs" rounded="lg" bordered={true} className="shrink-0" />
          <div className="min-w-0">
            <p className="font-cinzel text-[11px] font-bold truncate leading-tight">
              DDL Pointe-Noire
            </p>
            <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
              MCAPNIT • DGL Brazzaville
            </p>
          </div>
        </div>

        <div className={`text-[11px] font-semibold uppercase tracking-wider px-3 mb-2 flex items-center justify-between ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <span>
            {isFieldAgent ? 'Modules Opérationnels Terrain' : '18 Modules Métier Intégrés'}
          </span>
          {isFieldAgent && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30">
              Agent SAA
            </span>
          )}
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
                {visibleModules.filter((m) => m.section === sectionName).map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.code;
                  return (
                    <button
                      key={mod.code}
                      onClick={() => {
                        setActiveModule(mod.code);
                        setIsMobileMenuOpen(false);
                      }}
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

      {/* Authenticated User Session Card in Sidebar Footer */}
      {authenticatedUser && (
        <div className={`p-3 mt-auto border-t shrink-0 ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {authenticatedUser.photoUrl ? (
                <img
                  src={authenticatedUser.photoUrl}
                  alt={authenticatedUser.nomComplet || 'Agent'}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-500 shrink-0"
                />
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentUserRole === 'directeur' || currentUserRole === 'administrateur'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {(authenticatedUser.nomComplet || 'DDL').split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('') || 'AG'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  {authenticatedUser.nomComplet || 'Agent DDL-PN'}
                </p>
                <div className="flex items-center gap-1 text-[10px]">
                  {currentUserRole === 'directeur' || currentUserRole === 'administrateur' ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5" /> Super-Admin
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                      <UserCheck className="w-2.5 h-2.5" /> Agent ({visibleEstablishments.length})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logoutAgentSession}
              title="Se déconnecter"
              className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 text-slate-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
    </>
  );
};
