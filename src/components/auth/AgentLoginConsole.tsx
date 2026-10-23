import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from '../common/DdlLogo';
import {
  Lock,
  User,
  Sun,
  Moon,
  ArrowRight,
  AlertCircle,
  Building2,
  Shield,
  Wifi,
  WifiOff,
  Database,
} from 'lucide-react';
import { FirebaseStatusModal } from '../common/FirebaseStatusModal';

export const AgentLoginConsole: React.FC = () => {
  const {
    theme,
    toggleTheme,
    showNotification,
    isOnline,
    lastAuthenticatedUser,
    quickUnlockSession,
    handleGoogleSignIn,
    isSigningIn,
  } = useApp();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quickPin, setQuickPin] = useState('');
  const [isQuickUnlocking, setIsQuickUnlocking] = useState(false);
  const [showFullLogin, setShowFullLogin] = useState(!lastAuthenticatedUser);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  const isLight = theme === 'light';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await handleGoogleSignIn();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const pinToUse = quickPin.trim();
    if (!pinToUse) {
      setErrorMessage('Veuillez renseigner votre code PIN ou mot de passe.');
      return;
    }

    setIsQuickUnlocking(true);

    setTimeout(() => {
      const result = quickUnlockSession(pinToUse);
      setIsQuickUnlocking(false);

      if (!result.success) {
        setErrorMessage(result.message);
      } else {
        showNotification(
          'success',
          `Session reprise avec succès pour ${result.user?.nomComplet}.`
        );
      }
    }, 150);
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Sovereign Bar */}
      <header
        className={`px-3 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <DdlLogo size="sm" rounded="xl" bordered={false} className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-sm sm:text-base font-bold tracking-wider truncate">
                DDL-PN
              </span>
              <span className="hidden xs:inline-block text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                Portail Officiel
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              RÉPUBLIQUE DU CONGO • MCAPNIT • DGL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connectivity Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">En Ligne</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">Hors-Ligne (Autonome)</span>
              </>
            )}
          </div>

          {/* Firebase Database Live Status Button */}
          <button
            onClick={() => setIsFirebaseModalOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
            title="Vérifier la connexion à la base de données Firebase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Firebase Connecté</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            type="button"
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center transition shrink-0 cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
            }`}
            title="Basculer le mode clair / sombre"
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
          {/* Left Column: Official Institution Emblem & Details */}
          <div
            className={`order-2 lg:order-1 lg:col-span-5 rounded-2xl p-5 sm:p-7 border flex flex-col justify-between shadow-xl ${
              isLight
                ? 'bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white border-emerald-800'
                : 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 text-slate-100 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <DdlLogo size="lg" rounded="2xl" bordered={false} className="shadow-lg" />
                <div className="flex flex-col items-end text-right">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    MCAPNIT / DGL
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-200/90 mt-1">
                    République du Congo
                  </span>
                </div>
              </div>

              <h1 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide leading-tight text-white mb-1.5">
                Direction Départementale des Loisirs
              </h1>
              <p className="text-xs text-emerald-300 font-semibold mb-5">
                Pointe-Noire • Plateforme Souveraine v3.0
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] text-slate-200 leading-relaxed">
                  <p className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Portail Institutionnel Protégé</span>
                  </p>
                  Système souverain de gestion territoriale, recensement des établissements de loisirs et régie des recettes pour le département de Pointe-Noire.
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/20 text-[11px] text-slate-200 leading-relaxed">
                  <p className="font-semibold text-emerald-300 mb-0.5">Accès Sécurisé</p>
                  Connexion réservée aux officiers assermentés et personnels habilités de la DDL-PN.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 mt-5 flex items-center justify-between text-[11px] text-slate-300/80">
              <span className="flex items-center gap-1 font-mono">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Pointe-Noire (6 Arrondissements)
              </span>
              <span className="font-mono text-emerald-300">Exercice 2026</span>
            </div>
          </div>

          {/* Right Column: Clean & Secure Login Form */}
          <div
            className={`order-1 lg:order-2 lg:col-span-7 rounded-2xl p-5 sm:p-7 border shadow-xl flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              {/* Header */}
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                <h2 className="text-xl font-bold font-cinzel text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Connexion
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Veuillez vous authentifier pour accéder à votre espace de travail
                </p>
              </div>

              {/* Quick Unlock (if a session previously existed on this browser) */}
              {lastAuthenticatedUser && !showFullLogin && (
                <div className="mb-5 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
                        {lastAuthenticatedUser.nomComplet.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {lastAuthenticatedUser.nomComplet}
                        </p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                          {lastAuthenticatedUser.matricule}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFullLogin(true)}
                      className="text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 underline font-medium cursor-pointer"
                    >
                      Autre compte
                    </button>
                  </div>

                  <form onSubmit={handleQuickUnlock} className="flex gap-2 items-center">
                    <input
                      type="password"
                      value={quickPin}
                      onChange={(e) => setQuickPin(e.target.value)}
                      placeholder="Code PIN ou mot de passe"
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-500/30'
                          : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-emerald-500/30'
                      }`}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isQuickUnlocking}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {isQuickUnlocking ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Déverrouiller</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Standard Secure Login Form */}
              {(showFullLogin || !lastAuthenticatedUser) && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Firebase Auth only: no local password is accepted. */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Compte Google Workspace
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value="Connexion sécurisée via Firebase Authentication"
                        readOnly
                        aria-label="Connexion sécurisée via Google Workspace"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500/30 focus:border-emerald-600'
                            : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-emerald-500/30 focus:border-emerald-500'
                        }`}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span className="font-medium leading-relaxed">{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || isSigningIn}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continuer avec Google Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Security Note */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center mt-5 space-y-1">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Direction Départementale des Loisirs de Pointe-Noire
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Bâtiment de la Préfecture, sis au Centre-Ville, en face du Trésor Public (RDC)
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Tél : +242 06 186 4275 • Email : ddloisirs_pnr@loisirs.cg
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Sovereign Footer */}
      <footer
        className={`px-4 py-2 border-t text-center text-[10px] text-slate-400 dark:text-slate-500 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        DDL-PN Sovereign Enterprise v3.0 • Système Intégré de Contrôle et Gestion Territoriale • Pointe-Noire
      </footer>

      <FirebaseStatusModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
};
