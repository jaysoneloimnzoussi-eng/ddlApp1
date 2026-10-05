import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Lock,
  Phone,
  KeyRound,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Building2,
  ChevronRight,
  Sparkles,
  MapPin,
  Flame,
} from 'lucide-react';
import {
  getAllAccounts,
  findAccountByIdentifier,
  AuthAccount,
  SUPER_ADMIN_ACCOUNT,
} from '../../services/authService';

export const LoginConsole: React.FC = () => {
  const { loginWithPhoneAndPin, theme, establishments } = useApp();

  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'keypad' | 'badge_grid'>('keypad');

  const allAccounts = useMemo(() => getAllAccounts(), []);

  // Live Detected Account
  const detectedAccount: AuthAccount | undefined = useMemo(() => {
    return findAccountByIdentifier(identifierInput);
  }, [identifierInput]);

  // Handle PIN Keypad input
  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      setPinInput((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPinInput('');
    } else if (pinInput.length < 6) {
      setPinInput((prev) => prev + val);
    }
  };

  // Submit credentials
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!identifierInput.trim()) {
      setErrorMsg('Veuillez saisir votre numéro de téléphone ou votre matricule.');
      return;
    }

    if (!pinInput.trim()) {
      setErrorMsg('Veuillez saisir votre code PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithPhoneAndPin(identifierInput, pinInput);
      if (!result.success) {
        setErrorMsg(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fast Select Account from Badge List
  const handleSelectAccount = (acc: AuthAccount) => {
    setIdentifierInput(acc.telephone);
    setPinInput('');
    setActiveTab('keypad');
    setErrorMsg(null);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    } selection:bg-emerald-500/30 selection:text-emerald-700`}>
      
      {/* Top Republic Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-yellow-500 to-red-600 h-1.5 w-full shrink-0" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : 'bg-slate-900 border-slate-800'
        }`}>
          
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Column: Official Identity & Siloing Notice */}
            <div className={`lg:col-span-5 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r ${
              theme === 'light'
                ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white border-slate-200'
                : 'bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-900 text-white border-slate-800'
            }`}>
              <div>
                {/* Official Crest */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 p-0.5 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                      République du Congo
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      MCAPNIT / DGL
                    </div>
                  </div>
                </div>

                <h1 className="font-cinzel text-xl md:text-2xl font-bold tracking-wide leading-tight">
                  Direction Départementale des Loisirs de Pointe-Noire
                </h1>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Système Souverain de Gestion Territoriale, Recensement Géolocalisé & Régie des Recettes Publiques.
                </p>

                {/* Strict Siloing Visual Notice */}
                <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 text-xs space-y-2.5">
                  <div className="font-bold text-emerald-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    Règle de Cloisonnement Strict (Siloing)
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Agents de Terrain :</strong> Vous accédez <em>exclusivement</em> aux établissements et quittances que vous avez recensés ou qui vous sont attribués. Les dossiers de vos collègues restent invisibles.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span><strong>Super-Administrateur :</strong> Vue 360° globale sur la totalité des <strong>{establishments.length} établissements</strong> et de la régie départementale.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Accès Rapides Pré-configurés :
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierInput('06 600 00 01');
                      setPinInput('2026');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-mono border border-amber-500/30 transition"
                  >
                    Directeur (PIN: 2026)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierInput('053028383');
                      setPinInput('1234');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 transition"
                  >
                    J. MATOKO (62 Etabs)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifierInput('069338110');
                      setPinInput('1234');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-mono border border-sky-500/30 transition"
                  >
                    R. KIOUNGA (53 Etabs)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Login Console */}
            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-center">
              
              {/* Mode Switcher */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-sm">Console d'Accès Sécurisée</span>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('keypad')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeTab === 'keypad'
                        ? 'bg-white dark:bg-slate-900 font-bold shadow-xs text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    Clavier & PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('badge_grid')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeTab === 'badge_grid'
                        ? 'bg-white dark:bg-slate-900 font-bold shadow-xs text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    Badges Agents ({allAccounts.length})
                  </button>
                </div>
              </div>

              {/* Tab 1: Keypad & PIN */}
              {activeTab === 'keypad' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Phone or Matricule Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Numéro de Téléphone ou Matricule Officiel
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={identifierInput}
                        onChange={(e) => {
                          setIdentifierInput(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="Ex: 053028383 ou 06 600 00 01 ou DDL-PN-001"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono transition focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-300 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-slate-100'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Auto-Detection Card */}
                  {detectedAccount && (
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 animate-fadeIn ${
                      detectedAccount.isSuperAdmin
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        {detectedAccount.photoUrl ? (
                          <img
                            src={detectedAccount.photoUrl}
                            alt={detectedAccount.nomComplet}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {detectedAccount.nomComplet.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {detectedAccount.nomComplet}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {detectedAccount.fonction} • {detectedAccount.matricule}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                        detectedAccount.isSuperAdmin
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }`}>
                        {detectedAccount.isSuperAdmin ? 'SUPER-ADMIN' : 'AGENT DE TERRAIN'}
                      </span>
                    </div>
                  )}

                  {/* PIN Input with Visual Masked Dots */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Code Secret PIN (4 chiffres)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPin ? 'Masquer' : 'Afficher'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        required
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="••••"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono tracking-widest transition focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-300 text-slate-900'
                            : 'bg-slate-950 border-slate-700 text-slate-100'
                        }`}
                      />
                    </div>

                    {/* Masked Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-full transition-all ${
                            pinInput.length > idx
                              ? 'bg-emerald-500 scale-110 shadow-sm'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Virtual Touch Keypad */}
                  <div className="pt-2">
                    <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (key === '⌫') handleKeypadPress('backspace');
                            else if (key === 'C') handleKeypadPress('clear');
                            else handleKeypadPress(key);
                          }}
                          className={`py-2 rounded-xl text-sm font-bold font-mono transition-all active:scale-95 ${
                            key === 'C' || key === '⌫'
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                              : 'bg-slate-100 dark:bg-slate-950 hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>Ouvrir ma Session Sécurisée</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Tab 2: Badge Selection Grid */}
              {activeTab === 'badge_grid' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Sélectionnez votre profil dans la liste des agents officiels DDL-PN :
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                    {allAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectAccount(acc)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 group ${
                          acc.isSuperAdmin
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                            : 'bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/10 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                        }`}
                      >
                        {acc.photoUrl ? (
                          <img
                            src={acc.photoUrl}
                            alt={acc.nomComplet}
                            className="w-9 h-9 rounded-full object-cover border shrink-0"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            acc.isSuperAdmin ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                          }`}>
                            {acc.nomComplet.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate group-hover:text-emerald-500">
                            {acc.nomComplet}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate font-mono">
                            {acc.telephone} • {acc.matricule}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-slate-400 shrink-0">
        République du Congo • Ministère de la Culture, des Arts, du Patrimoine National et du Tourisme • Direction Générale des Loisirs
      </footer>
    </div>
  );
};
