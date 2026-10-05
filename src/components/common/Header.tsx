import React from 'react';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    currentUserRole,
    setCurrentUserRole,
    currentAgentId,
    setCurrentAgentId,
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
    <header className={`app-header h-18 border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md transition-colors ${
      theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Brand & Authority */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 via-yellow-500 to-red-600 p-0.5 shadow-md">
          <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-slate-950'}`}>
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-base md:text-lg font-bold tracking-wider flex items-center gap-1.5">
              DDL-PN
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                v3.0 Souverain
              </span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[280px] md:max-w-md">
            Direction Départementale des Loisirs de Pointe-Noire (MCAPNIT / DGL)
          </p>
        </div>
      </div>

      {/* Center: Agent Silo Selector (Select your field identity) */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs">
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-500 font-medium">Session Agent :</span>
          <select
            value={currentAgentId}
            onChange={(e) => {
              const val = e.target.value;
              setCurrentAgentId(val);
              const found = staff.find((s) => s.id === val);
              showNotification(
                'info',
                val === 'all'
                  ? 'Vue globale administrateur activée (Tous les établissements).'
                  : `Session isolée activée pour l'inspecteur : ${found?.nomComplet}. Seuls ses dossiers assignés sont visibles.`
              );
            }}
            className="font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">Direction / Super-Admin (Tous les dossiers)</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nomComplet} ({s.fonction})
              </option>
            ))}
          </select>
        </div>

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
      </div>

      {/* Right Controls: Theme Switcher (Fond Blanc / Sombre) + Google Workspace Sign-In */}
      <div className="flex items-center gap-3">
        {/* Toggle Fond Blanc / Sombre */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Passer en Mode Sombre' : 'Passer en Version Fond Blanc'}
          className={`p-2 rounded-lg border transition flex items-center gap-1.5 text-xs font-semibold ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
          }`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Mode Sombre</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Fond Blanc</span>
            </>
          )}
        </button>

        {/* Google Workspace Auth */}
        {googleUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                {googleUser.displayName || googleUser.email}
              </p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600 dark:text-emerald-400 font-semibold">
                <Calendar className="w-2.5 h-2.5" />
                <Mail className="w-2.5 h-2.5" />
                <span>Google Agenda Lié</span>
              </div>
            </div>
            {googleUser.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-blue-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {googleUser.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Se déconnecter de Google"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:shadow border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span className="hidden sm:inline">
              {isSigningIn ? 'Liaison...' : 'Lier Google Agenda'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
