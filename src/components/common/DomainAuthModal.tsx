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
  Database,
  Key,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { activeFirebaseConfig, testFirestoreConnection } from '../../services/firebase';

export const DomainAuthModal: React.FC = () => {
  const {
    showDomainAuthModal,
    setShowDomainAuthModal,
    handleGoogleSignIn,
    isSigningIn,
    theme,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'domains' | 'env' | 'test'>('domains');
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!showDomainAuthModal) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isVercelDomain = currentHostname.includes('vercel.app');
  const currentProjectId = activeFirebaseConfig.projectId;
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${currentProjectId}/authentication/settings`;
  const firebaseFirestoreUrl = `https://console.firebase.google.com/project/${currentProjectId}/firestore`;

  const vercelEnvBlock = `# Configuration Firebase pour Vercel (Client Vite)
VITE_FIREBASE_API_KEY=${activeFirebaseConfig.apiKey}
VITE_FIREBASE_PROJECT_ID=${activeFirebaseConfig.projectId}
VITE_FIREBASE_APP_ID=${activeFirebaseConfig.appId}
VITE_FIREBASE_AUTH_DOMAIN=${activeFirebaseConfig.authDomain}
VITE_FIREBASE_FIRESTORE_DATABASE_ID=${activeFirebaseConfig.firestoreDatabaseId}
VITE_FIREBASE_STORAGE_BUCKET=${activeFirebaseConfig.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${activeFirebaseConfig.messagingSenderId}`;

  const handleCopyHostname = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(vercelEnvBlock);
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2500);
    } catch (e) {
      console.error('Failed to copy env', e);
    }
  };

  const handleRunConnectionTest = async () => {
    setTestStatus('testing');
    setTestMessage('Test de connexion avec la base Firestore en cours...');
    const startTime = performance.now();
    try {
      const ok = await testFirestoreConnection();
      const duration = Math.round(performance.now() - startTime);
      if (ok) {
        setTestStatus('success');
        setTestMessage(`Connexion active et réactive (${duration} ms). Base ${activeFirebaseConfig.firestoreDatabaseId} opérationnelle !`);
      } else {
        setTestStatus('error');
        setTestMessage('La connexion n\'a pas pu être établie. Vérifiez l\'accès réseau.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Erreur de connexion : ${err?.message || 'Inconnue'}`);
    }
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <Layers className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black uppercase">
                  ▲ Vercel
                </span>
                <span className="text-[10px] font-mono text-slate-400">⚡</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                  🔥 Firebase
                </span>
                {isVercelDomain && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                    Domaine Vercel Détecté
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold font-cinzel mt-1 text-slate-900 dark:text-slate-100">
                Liaison Vercel ⚡ Google Firebase & Firestore
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 px-4 shrink-0">
          <button
            onClick={() => setActiveTab('domains')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'domains'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Domaines Autorisés</span>
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'env'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>2. Variables Vercel (.env)</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'test'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. Test & Statut Firestore</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {/* TAB 1: DOMAINES AUTORISÉS FIREBASE */}
          {activeTab === 'domains' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  Autorisation de domaine obligatoire pour Google Auth sur Vercel
                </div>
                <p className="text-[11px] leading-relaxed opacity-95">
                  Lorsqu'une application est hébergée sur Vercel (ex: <code className="font-mono font-bold">{currentHostname}</code>), Google bloque l'authentification et les popups tant que le nom d'hôte exact n'a pas été ajouté à la liste des <strong>Domaines Autorisés</strong> dans Firebase Console.
                </p>
              </div>

              {/* Hostname Copy */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    Nom d'hôte actuel à enregistrer dans Firebase :
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Projet : {currentProjectId}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 rounded-xl font-mono text-xs font-bold truncate border bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-blue-600 dark:text-blue-400 select-all">
                    {currentHostname}
                  </div>
                  <button
                    onClick={handleCopyHostname}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
                  >
                    {copiedDomain ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedDomain ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              {/* Step by step */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Procédure rapide (2 minutes) :</span>
                </h3>
                <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Ouvrez la console Firebase via le bouton ci-dessous (onglet <strong>Authentication &gt; Paramètres</strong>).
                  </li>
                  <li>
                    Descendez jusqu'à la section <strong>Domaines autorisés (Authorized domains)</strong>.
                  </li>
                  <li>
                    Cliquez sur <strong>Ajouter un domaine (Add domain)</strong>.
                  </li>
                  <li>
                    Collez votre domaine : <code className="text-blue-500 font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">{currentHostname}</code> et validez avec <strong>Enregistrer</strong>.
                  </li>
                </ol>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={firebaseSettingsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow"
                  >
                    <span>Ouvrir Firebase Console &gt; Domaines</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </a>

                  <button
                    onClick={() => handleGoogleSignIn()}
                    disabled={isSigningIn}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow"
                  >
                    <span>{isSigningIn ? 'Vérification...' : 'Tester Connexion Google'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VARIABLES VERCEL */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Deux options de liaison disponibles
                </div>
                <p className="text-[11px] leading-relaxed opacity-95">
                  1. <strong>Prêt à l'emploi :</strong> Le fichier <code className="font-mono bg-emerald-200/50 dark:bg-emerald-900/50 px-1 rounded">firebase-applet-config.json</code> est déjà présent dans le code et fonctionne automatiquement sur Vercel sans configuration supplémentaire.
                  <br />
                  2. <strong>Personnalisation Vercel :</strong> Si vous préférez injecter vos variables via l'interface Vercel (Project &gt; Settings &gt; Environment Variables), copiez le bloc ci-dessous :
                </p>
              </div>

              {/* Block to copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Bloc de Variables d'Environnement Vercel (.env) :
                  </span>
                  <button
                    onClick={handleCopyEnv}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {copiedEnv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEnv ? 'Variables Copiées !' : 'Copier tout le bloc'}</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 select-all">
                  {vercelEnvBlock}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs">Tableau de bord Vercel</p>
                  <p className="text-[11px] text-slate-500">Ajoutez ces variables dans Settings &gt; Environment Variables</p>
                </div>
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <span>Accéder à Vercel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC & TEST FIRESTORE */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    Statut Actuel de l'Instance Firebase
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Actif
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Firebase Project ID</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                      {activeFirebaseConfig.projectId}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Base Firestore Spécifique</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block text-[10px]">
                      {activeFirebaseConfig.firestoreDatabaseId}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Auth Domain</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                      {activeFirebaseConfig.authDomain}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Storage Bucket</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                      {activeFirebaseConfig.storageBucket}
                    </span>
                  </div>
                </div>

                {/* Test button & output */}
                <div className="pt-2">
                  <button
                    onClick={handleRunConnectionTest}
                    disabled={testStatus === 'testing'}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow"
                  >
                    <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>
                      {testStatus === 'testing' ? 'Test de connectivité en cours...' : 'Lancer un Test de Connexion Firestore'}
                    </span>
                  </button>

                  {testMessage && (
                    <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      testStatus === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                        : testStatus === 'error'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      {testStatus === 'success' && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {testStatus === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                      <span>{testMessage}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <a
                    href={firebaseFirestoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Consulter les Collections en Direct dans Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Direction Départementale des Loisirs de Pointe-Noire • Déploiement Souverain</span>
          </div>
          <button
            onClick={() => setShowDomainAuthModal(false)}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
