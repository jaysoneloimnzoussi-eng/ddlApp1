import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  MapPinPlus,
  CalendarCheck,
  Map,
  Menu,
  Coins,
  FileCheck2,
  FileSpreadsheet,
  Award,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    toggleMobileMenu,
    isMobileMenuOpen,
    theme,
    offlineQueueCount,
    isOnline,
    currentUserRole,
    authorizations,
  } = useApp();

  const isLight = theme === 'light';

  const navItems = useMemo(() => {
    if (currentUserRole === 'caissier_saf') {
      return [
        {
          id: 'MOD-10',
          label: 'Régie SAF',
          icon: Coins,
          action: () => setActiveModule('MOD-10'),
          isActive: activeModule === 'MOD-10' && !isMobileMenuOpen,
        },
        {
          id: 'MOD-11',
          label: 'Quittances',
          icon: FileCheck2,
          action: () => setActiveModule('MOD-11'),
          isActive: activeModule === 'MOD-11' && !isMobileMenuOpen,
        },
        {
          id: 'MOD-02',
          label: 'Dossiers',
          icon: MapPinPlus,
          action: () => setActiveModule('MOD-02'),
          isActive: activeModule === 'MOD-02' && !isMobileMenuOpen,
        },
        {
          id: 'MOD-01',
          label: 'Cockpit',
          icon: LayoutDashboard,
          action: () => setActiveModule('MOD-01'),
          isActive: activeModule === 'MOD-01' && !isMobileMenuOpen,
        },
        {
          id: 'MENU',
          label: 'Menu',
          icon: Menu,
          action: () => toggleMobileMenu(),
          isActive: isMobileMenuOpen,
        },
      ];
    }

    if (currentUserRole !== 'directeur' && currentUserRole !== 'administrateur') {
      // Agent SAA de terrain
      return [
        {
          id: 'MOD-02',
          label: 'Terrain',
          icon: MapPinPlus,
          badge: !isOnline || offlineQueueCount > 0 ? `${offlineQueueCount}` : undefined,
          action: () => setActiveModule('MOD-02'),
          isActive: activeModule === 'MOD-02' && !isMobileMenuOpen,
        },
        {
          id: 'MOD-03',
          label: 'Agenda',
          icon: CalendarCheck,
          action: () => setActiveModule('MOD-03'),
          isActive: activeModule === 'MOD-03' && !isMobileMenuOpen,
        },
        {
          id: 'MOD-07',
          label: 'SIG/Sono',
          icon: Map,
          action: () => setActiveModule('MOD-07'),
          isActive: activeModule === 'MOD-07' && !isMobileMenuOpen,
        },
        {
          id: 'MOD-11',
          label: 'Reçus POS',
          icon: FileCheck2,
          action: () => setActiveModule('MOD-11'),
          isActive: activeModule === 'MOD-11' && !isMobileMenuOpen,
        },
        {
          id: 'MENU',
          label: 'Modules',
          icon: Menu,
          action: () => toggleMobileMenu(),
          isActive: isMobileMenuOpen,
        },
      ];
    }

    // Direction & Administrateur
    return [
      {
        id: 'MOD-01',
        label: 'Cockpit',
        icon: LayoutDashboard,
        action: () => setActiveModule('MOD-01'),
        isActive: activeModule === 'MOD-01' && !isMobileMenuOpen,
      },
      {
        id: 'MOD-02',
        label: 'Terrain',
        icon: MapPinPlus,
        badge: !isOnline || offlineQueueCount > 0 ? `${offlineQueueCount}` : undefined,
        action: () => setActiveModule('MOD-02'),
        isActive: activeModule === 'MOD-02' && !isMobileMenuOpen,
      },
      {
        id: 'MOD-03',
        label: 'Agenda',
        icon: CalendarCheck,
        action: () => setActiveModule('MOD-03'),
        isActive: activeModule === 'MOD-03' && !isMobileMenuOpen,
      },
      {
        id: 'MOD-20',
        label: 'Autorisation',
        icon: Award,
        badge:
          authorizations.filter((a) => !a.signatureDirecteur.signe).length > 0
            ? `${authorizations.filter((a) => !a.signatureDirecteur.signe).length}`
            : undefined,
        action: () => setActiveModule('MOD-20'),
        isActive: activeModule === 'MOD-20' && !isMobileMenuOpen,
      },
      {
        id: 'MENU',
        label: 'Modules',
        icon: Menu,
        action: () => toggleMobileMenu(),
        isActive: isMobileMenuOpen,
      },
    ];
  }, [currentUserRole, activeModule, isMobileMenuOpen, isOnline, offlineQueueCount, setActiveModule, toggleMobileMenu, authorizations]);

  return (
    <nav
      aria-label="Navigation mobile principale"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md transition-colors select-none ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-700 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]'
          : 'bg-slate-900/95 border-slate-800 text-slate-300 shadow-[0_-4px_16px_rgba(0,0,0,0.4)]'
      }`}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
    >
      <div className="grid grid-cols-5 h-15 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl transition-all duration-150 active:scale-95 relative cursor-pointer ${
                active
                  ? isLight
                    ? 'text-emerald-700 font-bold'
                    : 'text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    active ? 'scale-110' : 'scale-100 opacity-80'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-1 truncate max-w-[62px] leading-none ${
                active ? 'font-bold' : 'font-medium'
              }`}>
                {item.label}
              </span>

              {/* Active subtle pill dot */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
