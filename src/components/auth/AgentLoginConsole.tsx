import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from '../common/DdlLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  AlertCircle,
  Building2,
  ShieldCheck,
  Wifi,
  WifiOff,
  Users,
  CheckCircle2,
  KeyRound,
  X,
} from 'lucide-react';

export const AgentLoginConsole: React.FC = () => {
  const {
    loginWithPhoneAndPin,
    theme,
    toggleTheme,
    showNotification,
    isOnline,
    lastAuthenticatedUser,
    quickUnlockSession,
    staff,
  } = useApp();

  const [identifier, setIdentifier] = useState(() => {
    return lastAuthenticatedUser?.matricule || lastAuthenticatedUser?.telephone || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [quickPin, setQuickPin] = useState('');
  const [isQuickUnlocking, setIsQuickUnlocking] = useState(false);

  const isLight = theme === 'light';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Veuillez renseigner votre identifiant, matricule ou sélectionner un profil.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Veuillez saisir votre mot de passe ou code PIN (ex: 2026).');
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
    }, 200);
  };

  const handleQuickUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const pinToUse = quickPin.trim();
    if (!pinToUse) {
      setErrorMessage('Veuillez renseigner votre code PIN pour reprendre votre session.');
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
          `Session reprise avec succès pour ${result.user?.nomComplet} (Mode Hors-Ligne).`
        );
      }
    }, 200);
  };

  const selectAgentProfile = (agentMatricule: string) => {
    setIdentifier(agentMatricule);
    setShowAgentPicker(false);
    setErrorMessage(null);
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

        <div className="flex items-center gap-2">
          {/* Network connectivity pill */}
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
                <span className="hidden md:inline">En Ligne (Réseau Central)</span>
                <span className="md:hidden">En Ligne</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden md:inline">Mode Hors-Ligne (100% Autonome)</span>
                <span className="md:hidden">Hors-Ligne</span>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Theme switch */}
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Prominent PWA & Android Native Install Banner */}
        <div className="w-full mb-4">
          <PWAInstallButton variant="banner" />
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Left Column: Official Context */}
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
                {/* Offline Guarantee Card */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Fonctionnement 100% Hors-Ligne</span>
                  </div>
                  <p className="text-[11px] text-slate-200/90 leading-relaxed">
                    Vous pouvez vous connecter et utiliser l'intégralité des modules de terrain (recensement, encaissement, cartographie) même sans réseau Internet.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>Code PIN & Identifiants Officiels</span>
                  </div>
                  <p className="text-[11px] text-slate-200/90 leading-relaxed">
                    Code PIN officiel de déverrouillage : <strong>2026</strong>. Valable sur tous les profils agents et administrateurs.
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

          {/* Right Column: Clean Login Form */}
          <div
            className={`order-1 lg:order-2 lg:col-span-7 rounded-2xl p-4 sm:p-6 md:p-8 border shadow-xl flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              {/* Header */}
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800 mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold font-cinzel text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Connexion Souveraine
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Authentification locale ou centrale DDL-PN
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAgentPicker(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Choisir votre profil dans l'annuaire officiel des 12 agents"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Choisir mon profil</span>
                  <span className="sm:hidden">Profils</span>
                </button>
              </div>

              {/* Fast-track quick unlock if a previous session exists on this device */}
              {lastAuthenticatedUser && (
                <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">
                        {lastAuthenticatedUser.nomComplet.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {lastAuthenticatedUser.nomComplet}
                        </p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                          {lastAuthenticatedUser.matricule} • {lastAuthenticatedUser.fonction}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                      Session Mémorisée
                    </span>
                  </div>

                  <form onSubmit={handleQuickUnlock} className="flex gap-2 items-center">
                    <input
                      type="password"
                      value={quickPin}
                      onChange={(e) => setQuickPin(e.target.value)}
                      placeholder="Code PIN (ex: 2026)"
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono focus:outline-none focus:ring-2 ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-500/30'
                          : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-emerald-500/30'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isQuickUnlocking}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
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

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Champ 1 : Identifiant */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Identifiant, Matricule ou Nom
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Ex: matoko.j, DDL-PN-001, Jacques MATOKO, 053028383
                    </span>
                  </div>
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
                      placeholder="Votre nom, matricule ou téléphone officiel"
                      autoComplete="username"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500/30 focus:border-emerald-600'
                          : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-emerald-500/30 focus:border-emerald-500'
                      }`}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Champ 2 : Mot de passe / Code PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mot de Passe ou Code PIN
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      PIN par défaut : 2026
                    </span>
                  </div>
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
                      placeholder="•••••••••••• (ou code PIN 2026)"
                      autoComplete="current-password"
                      className={`w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition ${
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
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span className="font-medium leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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

            {/* Bottom Disclaimer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center space-y-1 mt-4">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mode Hors-Ligne natif : vos données sont persistées sur votre terminal et synchronisées dès que la connexion est rétablie.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Agent Selector Modal */}
      {showAgentPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[85vh] ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm font-cinzel">Sélection Rapide du Profil Agent</h3>
              </div>
              <button
                onClick={() => setShowAgentPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 my-2">
              Cliquez sur votre profil pour pré-remplir instantanément la console de connexion :
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {staff.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => selectAgentProfile(agent.matricule)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300'
                      : 'bg-slate-950/60 hover:bg-emerald-950/30 border-slate-800 hover:border-emerald-700'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: agent.calendarColor || '#059669' }}
                    >
                      {agent.nomComplet.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{agent.nomComplet}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {agent.matricule} • {agent.telephone}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    Sélectionner
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-3 flex justify-end">
              <button
                onClick={() => setShowAgentPicker(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`px-4 py-3 border-t text-center text-xs text-slate-500 dark:text-slate-400 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        République du Congo • MCAPNIT • DGL • Direction Départementale des Loisirs de Pointe-Noire (DDL-PN Sovereign v3.0)
      </footer>
    </div>
  );
};
