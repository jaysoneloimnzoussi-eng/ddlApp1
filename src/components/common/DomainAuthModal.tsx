import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  X,
  AlertTriangle,
  Globe,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const DomainAuthModal: React.FC = () => {
  const {
    showDomainAuthModal,
    setShowDomainAuthModal,
    handleGoogleSignIn,
    isSigningIn,
    theme,
  } = useApp();

  const [copied, setCopied] = useState(false);

  if (!showDomainAuthModal) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const currentProjectId = 'gen-lang-client-0446306316';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${currentProjectId}/authentication/settings`;

  const handleCopyHostname = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  Firebase Authentication
                </span>
                <span className="text-[11px] font-mono text-slate-500">auth/unauthorized-domain</span>
              </div>
              <h2 className="text-lg font-bold font-cinzel mt-1 text-slate-900 dark:text-slate-100">
                Autoriser votre domaine pour la connexion Google réelle
              </h2>
            </div>
          </div>
          <button
            onClick={() => setShowDomainAuthModal(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Explanation */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              Pourquoi cette autorisation est-elle obligatoire ?
            </div>
            <p className="text-[11px] leading-relaxed opacity-95">
              Pour des données réelles et sécurisées, Google exige que le domaine web de votre application soit enregistré dans la console Firebase du projet <strong>{currentProjectId}</strong>.
            </p>
          </div>

          {/* Domain To Copy */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Domaine exact de votre application :
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2.5 rounded-xl font-mono text-xs font-bold truncate border bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-blue-600 dark:text-blue-400 select-all">
                {currentHostname}
              </div>
              <button
                onClick={handleCopyHostname}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Step-by-step instructions */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Étapes à suivre dans Firebase Console (2 minutes) :</span>
            </h3>
            <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Ouvrez les paramètres d'authentification Firebase via le lien ci-dessous.
              </li>
              <li>
                Faites défiler jusqu'à la section <strong>Domaines autorisés (Authorized domains)</strong>.
              </li>
              <li>
                Cliquez sur le bouton <strong>Ajouter un domaine (Add domain)</strong>.
              </li>
              <li>
                Collez le domaine : <code className="text-blue-500 font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">{currentHostname}</code> et cliquez sur <strong>Enregistrer</strong>.
              </li>
            </ol>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <span>Ouvrir la Console Firebase</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              </a>

              <button
                onClick={() => handleGoogleSignIn()}
                disabled={isSigningIn}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSigningIn ? 'Connexion en cours...' : 'Se Connecter à Google (Réel)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Direction Départementale des Loisirs de Pointe-Noire (Données Réelles)</span>
          </div>
          <button
            onClick={() => setShowDomainAuthModal(false)}
            className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
