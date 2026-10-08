import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from '../common/DdlLogo';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  AlertCircle,
  Building2,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

export const AgentLoginConsole: React.FC = () => {
  const { loginWithPhoneAndPin, theme, toggleTheme, showNotification } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLight = theme === 'light';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Veuillez renseigner votre identifiant ou matricule.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = loginWithPhoneAndPin(cleanId, cleanPass);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message);
      } else {
        const userRole = result.user?.role;
        const isAdmin = userRole === 'administrateur' || userRole === 'directeur';
        showNotification(
          'success',
          isAdmin
            ? `Session Administrateur ouverte. Bienvenue ${result.user?.nomComplet}.`
            : `Session Agent de Terrain ouverte. Bienvenue ${result.user?.nomComplet}.`
        );
      }
    }, 350);
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Sovereign Bar */}
      <header
        className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <DdlLogo size="xs" rounded="lg" bordered={true} className="sm:hidden shrink-0" />
          <DdlLogo size="sm" rounded="xl" bordered={true} className="hidden sm:block shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-cinzel text-sm sm:text-base font-bold tracking-wider truncate">
                DDL-PN
              </span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] uppercase font-mono px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                Portail Officiel
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              RÉPUBLIQUE DU CONGO • MCAPNIT • DGL
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          type="button"
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
          }`}
          title="Basculer le mode clair / sombre"
        >
          {isLight ? (
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Left Column: Official Context (order-2 on mobile so login form is immediately visible) */}
          <div
            className={`order-2 lg:order-1 lg:col-span-5 rounded-2xl p-4 sm:p-6 md:p-8 border flex flex-col justify-between shadow-xl ${
              isLight
                ? 'bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white border-emerald-800'
                : 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 text-slate-100 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <DdlLogo size="md" rounded="xl" bordered={true} className="sm:hidden" />
                <DdlLogo size="lg" rounded="2xl" bordered={true} className="hidden sm:block" />
                <div className="flex flex-col items-end">
                  <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    MCAPNIT / DGL
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300/80 mt-1">
                    République du Congo
                  </span>
                </div>
              </div>

              <h1 className="font-cinzel text-lg sm:text-xl lg:text-2xl font-bold tracking-wide leading-tight mb-1.5 sm:mb-2 text-white">
                Direction Départementale des Loisirs
              </h1>
              <p className="text-xs text-emerald-300 font-semibold mb-4 sm:mb-6">
                Pointe-Noire • Plateforme Souveraine v3.0
              </p>

              <div className="space-y-2.5 sm:space-y-3.5">
                <div className="p-3 sm:p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Accès Professionnel Sécurisé</span>
                  </div>
                  <p className="text-[11px] text-slate-200/90 leading-relaxed">
                    Plateforme dédiée aux officiers assermentés, inspecteurs de terrain et
                    services administratifs de la DDL Pointe-Noire (Loi N° 21-2019).
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Gestion Confidentielle des Identifiants</span>
                  </div>
                  <p className="text-[11px] text-slate-200/90 leading-relaxed">
                    Les identifiants et mots de passe sont attribués nominativement par
                    l'Administrateur Départemental.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 sm:pt-6 border-t border-white/10 mt-4 sm:mt-6 flex items-center justify-between text-[11px] text-slate-300/80">
              <span className="flex items-center gap-1 font-mono">
                <Building2 className="w-3 h-3 text-emerald-400" /> Pointe-Noire (6 Arrondissements)
              </span>
              <span className="font-mono text-emerald-300">Exercice 2026</span>
            </div>
          </div>

          {/* Right Column: Clean Login Form (order-1 on mobile for instant access) */}
          <div
            className={`order-1 lg:order-2 lg:col-span-7 rounded-2xl p-4 sm:p-6 md:p-8 border shadow-xl flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              {/* Header */}
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                <h2 className="text-xl font-bold font-cinzel text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Connexion Sécurisée
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Veuillez renseigner votre identifiant et votre mot de passe officiel.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Champ 1 : Identifiant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Identifiant de Connexion (ou Matricule)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Ex: Votre identifiant ou matricule"
                      autoComplete="username"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500/30 focus:border-emerald-600'
                          : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Champ 2 : Mot de passe */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Mot de Passe Confidentiel
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500/30 focus:border-emerald-600'
                          : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span className="font-medium leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Se connecter à la Plateforme Souveraine</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Confidentiality Disclaimer */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center space-y-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vos identifiants et mots de passe sont délivrés par la Direction Départementale des Loisirs.
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                En cas de perte ou d'oubli, contactez le Service des Systèmes d'Information et Documentation (SSID).
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`px-4 py-3 border-t text-center text-xs text-slate-500 dark:text-slate-400 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        République du Congo • Ministère de l'Économie Forestière, du Tourisme et des Loisirs •
        Direction Départementale des Loisirs de Pointe-Noire (DDL-PN Sovereign v3.0)
      </footer>
    </div>
  );
};
