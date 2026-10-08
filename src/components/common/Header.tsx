import React from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from './DdlLogo';
import {
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  UserCheck,
  Building2,
  Calendar,
  Mail,
  FileText,
  Sun,
  Moon,
  Lock,
  Crown,
  LogOut as LogOutIcon,
  Search,
  Menu,
} from 'lucide-react';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    currentUserRole,
    setCurrentUserRole,
    currentAgentId,
    setCurrentAgentId,
    authenticatedUser,
    logoutAgentSession,
    visibleEstablishments,
    establishments,
    staff,
    theme,
    toggleTheme,
    googleUser,
    googleAccessToken,
    handleGoogleSignIn,
    handleLogout,
    isSigningIn,
    isOnline,
    offlineQueueCount,
    syncOfflineQueue,
    showNotification,
    setShowDomainAuthModal,
    toggleCommandPalette,
    toggleMobileMenu,
  } = useApp();

  const roleLabels: Record<UserRole, { title: string; color: string }> = {
    directeur: { title: 'Directeur Général (Admin)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    inspecteur_saa: { title: 'Inspecteur SAA (Terrain)', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    caissier_saf: { title: 'Caissier Régisseur SAF', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    agent_spa: { title: 'Agent Promotion SPA', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    administrateur: { title: 'Administrateur Système', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    promoteur: { title: 'Portail Promoteur', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  };

  return (
    <header className={`app-header h-14 md:h-18 border-b px-2.5 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors max-w-full ${
      theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Left: Hamburger menu (mobile) + Brand & Authority */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className={`md:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
          title="Ouvrir le menu des modules"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </button>

        <DdlLogo size="xs" rounded="lg" bordered={true} className="sm:hidden shrink-0" />
        <DdlLogo size="sm" rounded="xl" bordered={true} className="hidden sm:block shrink-0" />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="font-cinzel text-sm sm:text-base md:text-lg font-bold tracking-wider truncate">
              DDL-PN
            </span>
            <span className="hidden xs:inline-flex text-[9px] md:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
              v3.0
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs lg:max-w-md">
            Direction Départementale des Loisirs de Pointe-Noire (MCAPNIT / DGL)
          </p>
        </div>
      </div>

      {/* Center: Authenticated Session Identity & Siloing (Desktop only) */}
      <div className="hidden lg:flex items-center gap-3">
        {currentUserRole === 'directeur' || currentUserRole === 'administrateur' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-xs">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-700 dark:text-amber-300">
                Super-Admin ({authenticatedUser?.nomComplet || 'Direction'})
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                {establishments.length} dossiers au total
              </span>
            </div>

            {/* Optional Filter for Admin */}
            <select
              value={currentAgentId}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentAgentId(val);
                const found = staff.find((s) => s.id === val);
                showNotification(
                  'info',
                  val === 'all'
                    ? 'Vue globale : Tous les établissements affichés.'
                    : `Filtre actif : Établissements de l'agent ${found?.nomComplet}.`
                );
              }}
              className="ml-2 font-medium text-[11px] text-slate-800 dark:text-slate-200 bg-transparent border-l border-amber-500/30 pl-2 focus:outline-none cursor-pointer"
            >
              <option value="all">Vue globale (Tous les 6 arrondissements)</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  Filtrer : {s.nomComplet} ({s.matricule})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-xs">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                Agent de Terrain : {authenticatedUser?.nomComplet || 'Enquêteur SAA'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold shadow-sm">
                Mes Recensements : {visibleEstablishments.length}
              </span>
            </div>
          </div>
        )}

        {/* Offline Queue Badge */}
        {offlineQueueCount > 0 && isOnline && (
          <button
            onClick={syncOfflineQueue}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow transition"
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            Sync ({offlineQueueCount})
          </button>
        )}

        {/* Quick Logout Button */}
        <button
          onClick={logoutAgentSession}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition"
          title="Fermer la session et retourner à la console d'authentification"
        >
          <LogOutIcon className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Right Controls: Command Palette (Ctrl+K) + Theme Switcher + Google Workspace */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
        {/* Command Palette (Ctrl+K) Trigger */}
        <button
          onClick={toggleCommandPalette}
          title="Ouvrir la palette de commandes (Ctrl+K ou ⌘K)"
          className={`min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 md:px-2.5 md:py-1.5 rounded-xl md:rounded-lg border transition flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer shadow-xs ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          <Search className="w-4 h-4 md:w-3.5 md:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden md:inline">Commandes...</span>
          <kbd className={`hidden lg:inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded border ${
            theme === 'light'
              ? 'bg-white border-slate-300 text-slate-600'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}>
            Ctrl K
          </kbd>
        </button>

        {/* Liaison Vercel & Firebase Button - hidden on small mobile */}
        <button
          onClick={() => setShowDomainAuthModal(true)}
          title="Centre de Liaison Vercel ⚡ Google Firebase & Firestore"
          className="hidden sm:flex min-h-[44px] md:min-h-0 p-2 rounded-xl md:rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold items-center gap-1.5 transition text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm"
        >
          <span className="font-mono text-[11px] font-bold">▲</span>
          <span className="text-xs text-amber-500">🔥</span>
          <span className="hidden xl:inline text-[11px]">Vercel ⚡ Firebase</span>
        </button>

        {/* Toggle Fond Blanc / Sombre */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Passer en Mode Sombre' : 'Passer en Version Fond Blanc'}
          className={`min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 rounded-xl md:rounded-lg border transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
          }`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Mode Sombre</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Fond Blanc</span>
            </>
          )}
        </button>

        {/* Google Workspace Auth */}
        {googleUser ? (
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {googleUser.displayName || googleUser.email}
              </p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600 dark:text-emerald-400 font-semibold">
                <Calendar className="w-2.5 h-2.5" />
                <span>Google Lié</span>
              </div>
            </div>
            {googleUser.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt="Profile"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-blue-500/40"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {googleUser.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Se déconnecter de Google"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="flex items-center gap-1.5 min-h-[44px] md:min-h-0 px-2 sm:px-3 py-1.5 rounded-xl md:rounded-lg bg-white dark:bg-slate-800 hover:shadow border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Lier Google Agenda"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden md:inline">
              {isSigningIn ? 'Liaison...' : 'Lier Google'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
