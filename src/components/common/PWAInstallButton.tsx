import React, { useState, useEffect, useMemo } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Smartphone,
  QrCode,
  X,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Laptop,
  Share2,
  Maximize2,
  Sparkles,
  FileCode2,
  CheckCircle2,
} from 'lucide-react';
import { generateQrCodeDataUrl } from '../../services/qrService';

interface Props {
  className?: string;
  variant?: 'header' | 'hero' | 'compact' | 'sidebar' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'header' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { isAuthenticated } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  // App URL resolution
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Detect execution inside an iframe (like AI Studio preview)
  const isInIframe = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  // Detect platform to highlight the best tab
  const detectedPlatform = useMemo<'android' | 'pc' | 'ios'>(() => {
    if (typeof window === 'undefined') return 'android';
    const ua = window.navigator.userAgent.toLowerCase();
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    return 'pc';
  }, []);

  const [activeTab, setActiveTab] = useState<'android' | 'pc' | 'apk' | 'ios'>('android');

  useEffect(() => {
    setActiveTab(detectedPlatform === 'ios' ? 'ios' : detectedPlatform === 'pc' ? 'pc' : 'android');
  }, [detectedPlatform]);

  useEffect(() => {
    if (showModal && !qrCodeUrl && currentAppUrl) {
      generateQrCodeDataUrl(currentAppUrl, 220).then((url) => {
        setQrCodeUrl(url);
      });
    }
  }, [showModal, qrCodeUrl, currentAppUrl]);

  // Outil interne d'État : Ne JAMAIS afficher la suggestion PWA aux visiteurs ou lors du scan public d'un document !
  if (!isAuthenticated || isInstalled) {
    return null;
  }

  const handleDirectInstall = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowModal(true);
    }
  };

  const safeOpenLink = (url: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = url;
    }
  };

  const handleOpenStandaloneTab = () => {
    if (typeof window !== 'undefined') {
      safeOpenLink(currentAppUrl);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentAppUrl);
      setHasCopiedUrl(true);
      setTimeout(() => setHasCopiedUrl(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Application Officielle DDL-PN Sovereign v3.0 (Direction Départementale des Loisirs de Pointe-Noire). Cliquez pour ouvrir et installer sur votre téléphone : ${currentAppUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      safeOpenLink(url);
    }
  };

  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentAppUrl)}`;

  // Render trigger button depending on variant
  const renderTriggerButton = () => {
    if (variant === 'banner') {
      return (
        <div
          className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-100 ${className}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-emerald-300">
                  Installer l'App sur votre Ordinateur ou Téléphone Android
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
                  Natif & Hors-Ligne
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Utilisez l'application comme un logiciel autonome sur PC ou une application native Android avec icône sur l'écran d'accueil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Installer l'Application</span>
            </button>
          </div>
        </div>
      );
    }

    if (variant === 'card') {
      return (
        <div
          className={`p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-slate-200 space-y-2 ${className}`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Installation Mobile & PC</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Installez DDL-PN Sovereign sur votre smartphone Android ou PC pour travailler 100% hors-ligne.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer l'App (PC / Android)</span>
          </button>
        </div>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-blue-600/20 border border-emerald-500/40 hover:border-emerald-500 text-left transition active:scale-98 cursor-pointer group ${className}`}
        >
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
            <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span>Installer l'App (PC / Android)</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-300 leading-tight">
            Accès 100% autonome sur votre ordinateur ou smartphone
          </p>
        </button>
      );
    }

    if (variant === 'hero') {
      return (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition active:scale-95 cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Installer sur PC ou Android (Natif / PWA)</span>
        </button>
      );
    }

    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          title="Installer sur Ordinateur ou Téléphone Android"
          className={`p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 transition active:scale-95 cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4" />
        </button>
      );
    }

    // Default: 'header' variant
    return (
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            handleDirectInstall();
          } else {
            setShowModal(true);
          }
        }}
        disabled={isInstalling}
        title="Installer l'application sur votre Ordinateur ou Téléphone Android"
        className={`px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Installer (PC & Android)</span>
        <span className="sm:hidden">Installer</span>
      </button>
    );
  };

  return (
    <>
      {renderTriggerButton()}

      {/* MODALE D'INSTALLATION COMPLÈTE : PC & ANDROID NATIF */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-4 sm:p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                  <Smartphone className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-cinzel font-bold text-base sm:text-lg">
                    Installer DDL-PN Sovereign Enterprise
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Application autonome pour Ordinateur (PC/Mac) & Smartphone Android (Natif / PWA)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* IFRAME NOTICE / DIRECT STANDALONE OPENING */}
            {isInIframe && (
              <div className="p-3.5 bg-amber-950/60 border-b border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Vous êtes dans un aperçu intégré au navigateur</span>
                  </p>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Pour que Google Chrome ou Edge déclenchent l'installation native en 1 clic, ouvrez l'application dans un onglet dédié :
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenStandaloneTab}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir en plein écran</span>
                </button>
              </div>
            )}

            {/* Quick 1-Click Action if browser supports beforeinstallprompt */}
            {isInstallable && (
              <div className="p-4 bg-emerald-950/70 border-b border-emerald-500/30 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs">
                  <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Installation directe supportée sur cet appareil !</span>
                  </p>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Votre navigateur permet d'ajouter l'application immédiatement à votre système.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  disabled={isInstalling}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? 'Installation en cours...' : 'Installer maintenant en 1 clic'}</span>
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex items-center gap-1.5 px-4 py-3 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'android'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Smartphone Android (Natif WebAPK)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pc')}
                className={`flex items-center gap-1.5 px-4 py-3 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'pc'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Ordinateur (PC Windows / Mac)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('apk')}
                className={`flex items-center gap-1.5 px-4 py-3 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'apk'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Générer Fichier APK (.apk)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex items-center gap-1.5 px-4 py-3 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'ios'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad (iOS)</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-6 space-y-4 text-xs max-h-[62vh] overflow-y-auto">
              {/* TAB 1: ANDROID */}
              {activeTab === 'android' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <p className="font-bold text-sm mb-1">
                      Comment l'installer comme une vraie application Android native :
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Android intègre la technologie <strong>WebAPK</strong> officielle de Google : le système compile automatiquement un package natif pour l'application avec icône sur l'écran d'accueil, écran de démarrage officiel DDL-PN, raccourcis rapides et <strong>fonctionnement 100% hors-ligne</strong>.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">
                          Ouvrez l'application dans Google Chrome sur votre téléphone Android
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Scannez le QR Code ci-dessous ou partagez le lien directement via WhatsApp sur votre smartphone.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">
                          Appuyez sur le menu des 3 points (⋮) en haut à droite de Google Chrome
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Un bandeau d'installation peut également apparaître automatiquement en bas de votre écran.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <p className="font-bold text-emerald-400">
                          Sélectionnez « Installer l'application » ou « Ajouter à l'écran d'accueil »
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Android installe l'application dans votre tiroir d'applications, prête pour les tournées sur le terrain !
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code & Link sharing */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    {qrCodeUrl ? (
                      <div className="p-2.5 bg-white rounded-xl shrink-0 shadow-lg">
                        <img src={qrCodeUrl} alt="QR Code d'installation mobile" className="w-32 h-32" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                        <QrCode className="w-8 h-8" />
                      </div>
                    )}
                    <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
                      <p className="font-bold text-slate-200">
                        Scanner avec l'appareil photo de votre smartphone Android :
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Pointez la caméra de votre téléphone sur ce QR Code pour ouvrir l'application directement dans Chrome et l'installer.
                      </p>
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={handleShareWhatsApp}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Envoyer sur WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          {hasCopiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{hasCopiedUrl ? 'Lien copié !' : 'Copier le lien'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDINATEUR (PC / MAC) */}
              {activeTab === 'pc' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    <p className="font-bold text-sm mb-1">Installation sur PC (Windows, Mac ou Linux) :</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      L'application s'installe comme un vrai logiciel de bureau dans une fenêtre indépendante, sans les barres du navigateur, avec un raccourci direct sur le Bureau et dans le menu Démarrer.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">Dans Google Chrome ou Microsoft Edge</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Regardez à l'extrémité droite de la barre d'adresse (URL) : une icône d'ordinateur avec une petite flèche vers le bas ou le bouton <strong>« Installer DDL-PN »</strong> apparaît.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">Ou via le menu du navigateur (⋮ en haut à droite)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Cliquez sur <strong>« Enregistrer et partager »</strong> ou <strong>« Installer DDL-PN Sovereign Enterprise... »</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <p className="font-bold text-emerald-400">Raccourci Bureau & Utilisation Hors-Ligne</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          L'application se lance désormais instantanément comme n'importe quel programme Windows/Mac, même sans connexion Internet.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-200">Ouvrir dans une fenêtre complète maintenant :</p>
                      <p className="text-[11px] text-slate-400">Ouvrez l'application dans son propre onglet pour voir l'icône d'installation dans la barre d'adresse.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenStandaloneTab}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ouvrir l'application</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: APK NATIF */}
              {activeTab === 'apk' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <p className="font-bold text-sm mb-1">Génération d'un fichier APK autonome (.apk) pour Android :</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Si la Direction ou l'administrateur informatique a besoin d'un fichier physique <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">.apk</code> pour l'installer par clé USB, par câble ou le déployer sur les tablettes des agents sans passer par un store :
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <p className="font-bold text-sm text-slate-200">
                        1. Génération en 1 Clic via PWABuilder (Outil Officiel Google / Microsoft)
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Cette application est 100% conforme aux normes <strong>Trusted Web Activity (TWA)</strong> de Google. En cliquant sur le bouton ci-dessous, PWABuilder analyse l'URL de votre application et génère gratuitement le fichier <code className="text-emerald-400 font-mono">.apk</code> ou le projet Android Studio.
                    </p>
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <a
                        href={pwabuilderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Générer l'APK sur PWABuilder</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {hasCopiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Copier l'URL de l'application</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-blue-400" />
                      <p className="font-bold text-slate-200">2. Compilation Ligne de Commande (Google Bubblewrap CLI)</p>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Pour les ingénieurs souhaitant compiler le binaire APK directement sur leur machine avec Java/Android SDK :
                    </p>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 select-all overflow-x-auto">
                      npx @bubblewrap/cli init --manifest="{currentAppUrl.replace(/\/$/, '')}/manifest.webmanifest"
                      <br />
                      npx @bubblewrap/cli build
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <p className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pourquoi le mode WebAPK (Onglet Smartphone Android) est le plus recommandé :</span>
                    </p>
                    <p className="text-slate-400">
                      Avec la méthode <strong>WebAPK</strong>, il n'y a aucun fichier APK à transférer manuellement par câble : l'agent clique sur « Installer » dans Chrome, Android génère le package natif en 2 secondes, et toutes les futures mises à jour se synchronisent automatiquement sans réinstallation !
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: IOS */}
              {activeTab === 'ios' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    <p className="font-bold text-sm mb-1">Installation sur iPhone & iPad (Safari) :</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Apple permet l'installation directe des applications web depuis Safari pour une utilisation plein écran sans interface de navigateur.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">Dans Safari, appuyez sur le bouton Partager</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Le carré avec une flèche vers le haut au bas de l'écran.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">Faites défiler vers le bas et touchez « Sur l'écran d'accueil »</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Option avec une icône de carré avec un « + ».</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <p className="font-bold text-emerald-400">Validez en cliquant sur « Ajouter »</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">L'icône officielle DDL-PN apparaît sur votre écran d'accueil iOS.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Mode Hors-Ligne Souverain garanti (IndexedDB & Service Worker)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
