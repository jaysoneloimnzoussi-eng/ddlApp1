import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { PrintModal } from './components/common/PrintModal';
import { NotificationToast } from './components/common/NotificationToast';
import { DomainAuthModal } from './components/common/DomainAuthModal';
import { CommandPalette } from './components/common/CommandPalette';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AgentLoginConsole } from './components/auth/AgentLoginConsole';
import { PublicDocumentVerification } from './components/common/PublicDocumentVerification';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

import { AttestationVerificationView } from './components/public/AttestationVerificationView';
import { DashboardModule } from './components/modules/DashboardModule';

// Resilient lazy loader with automatic retries for offline resilience
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 3,
  interval = 1200
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (remaining <= 0) {
              reject(error);
              return;
            }
            setTimeout(() => {
              attempt(remaining - 1);
            }, interval);
          });
      };
      attempt(retriesLeft);
    })
  );
}

// Lazy loaded secondary modules with automatic retry
const FieldRecensementModule = lazyWithRetry(() => import('./components/modules/FieldRecensementModule').then((m) => ({ default: m.FieldRecensementModule })));
const MobileAgentCalendarModule = lazyWithRetry(() => import('./components/modules/MobileAgentCalendarModule').then((m) => ({ default: m.MobileAgentCalendarModule })));
const GoogleWorkspaceGatewayModule = lazyWithRetry(() => import('./components/modules/GoogleWorkspaceGatewayModule').then((m) => ({ default: m.GoogleWorkspaceGatewayModule })));
const LegalActsGeneratorModule = lazyWithRetry(() => import('./components/modules/LegalActsGeneratorModule').then((m) => ({ default: m.LegalActsGeneratorModule })));
const QuarterlyReportsModule = lazyWithRetry(() => import('./components/modules/QuarterlyReportsModule').then((m) => ({ default: m.QuarterlyReportsModule })));
const SigMapModule = lazyWithRetry(() => import('./components/modules/SigMapModule').then((m) => ({ default: m.SigMapModule })));
const SpaPromotionModule = lazyWithRetry(() => import('./components/modules/SpaPromotionModule').then((m) => ({ default: m.SpaPromotionModule })));
const TransmissionDglModule = lazyWithRetry(() => import('./components/modules/TransmissionDglModule').then((m) => ({ default: m.TransmissionDglModule })));
const SafRegieRecettesModule = lazyWithRetry(() => import('./components/modules/SafRegieRecettesModule').then((m) => ({ default: m.SafRegieRecettesModule })));
const TitlesAndReceiptsModule = lazyWithRetry(() => import('./components/modules/TitlesAndReceiptsModule').then((m) => ({ default: m.TitlesAndReceiptsModule })));
const LegalTextsAndSimulatorModule = lazyWithRetry(() => import('./components/modules/LegalTextsAndSimulatorModule').then((m) => ({ default: m.LegalTextsAndSimulatorModule })));
const PtaTrackerModule = lazyWithRetry(() => import('./components/modules/PtaTrackerModule').then((m) => ({ default: m.PtaTrackerModule })));
const AdminPersonnelModule = lazyWithRetry(() => import('./components/modules/AdminPersonnelModule').then((m) => ({ default: m.AdminPersonnelModule })));
const DocumentArchivingModule = lazyWithRetry(() => import('./components/modules/DocumentArchivingModule').then((m) => ({ default: m.DocumentArchivingModule })));
const JointInspectionModule = lazyWithRetry(() => import('./components/modules/JointInspectionModule').then((m) => ({ default: m.JointInspectionModule })));
const PromoterFintechPortalModule = lazyWithRetry(() => import('./components/modules/PromoterFintechPortalModule').then((m) => ({ default: m.PromoterFintechPortalModule })));
const SupabaseDataImportModule = lazyWithRetry(() => import('./components/modules/SupabaseDataImportModule').then((m) => ({ default: m.SupabaseDataImportModule })));
const AdministrativeDraftingCanvaModule = lazyWithRetry(() => import('./components/modules/AdministrativeDraftingCanvaModule').then((m) => ({ default: m.AdministrativeDraftingCanvaModule })));

const ModuleLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-xs">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
      Chargement du module DDL-PN...
    </p>
    <p className="text-xs text-slate-400 mt-1">
      Optimisation de la mémoire et du réseau
    </p>
  </div>
);

const MainContent: React.FC = () => {
  const { activeModule, theme } = useApp();

  return (
    <main className={`flex-1 overflow-y-auto overflow-x-hidden min-w-0 transition-colors duration-200 pb-20 md:pb-0 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <ErrorBoundary key={activeModule}>
        <Suspense fallback={<ModuleLoader />}>
          {activeModule === 'MOD-01' && <DashboardModule />}
          {activeModule === 'MOD-02' && <FieldRecensementModule />}
          {activeModule === 'MOD-03' && <MobileAgentCalendarModule />}
          {activeModule === 'MOD-04' && <GoogleWorkspaceGatewayModule />}
          {activeModule === 'MOD-05' && <LegalActsGeneratorModule />}
          {activeModule === 'MOD-06' && <QuarterlyReportsModule />}
          {activeModule === 'MOD-07' && <SigMapModule />}
          {activeModule === 'MOD-08' && <SpaPromotionModule />}
          {activeModule === 'MOD-09' && <TransmissionDglModule />}
          {activeModule === 'MOD-10' && <SafRegieRecettesModule />}
          {activeModule === 'MOD-11' && <TitlesAndReceiptsModule />}
          {activeModule === 'MOD-12' && <LegalTextsAndSimulatorModule />}
          {activeModule === 'MOD-13' && <PtaTrackerModule />}
          {activeModule === 'MOD-14' && <AdminPersonnelModule />}
          {activeModule === 'MOD-15' && <DocumentArchivingModule />}
          {activeModule === 'MOD-16' && <JointInspectionModule />}
          {activeModule === 'MOD-17' && <PromoterFintechPortalModule />}
          {activeModule === 'MOD-18' && <SupabaseDataImportModule />}
          {activeModule === 'MOD-19' && <AdministrativeDraftingCanvaModule />}
        </Suspense>
      </ErrorBoundary>
    </main>
  );
};

const AppContent: React.FC = () => {
  const { theme, isAuthenticated, activeModule, isCalendarFullScreen } = useApp();
  const [forceAgentLogin, setForceAgentLogin] = React.useState(false);
  const [showAttestationVerify, setShowAttestationVerify] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search;
    const hash = window.location.hash;
    return (
      search.includes('verify=attestation') ||
      search.includes('verify-attestation') ||
      hash.includes('verify-attestation')
    );
  });

  const isReceiptScan = typeof window !== 'undefined' && (
    window.location.search.includes('verify=receipt') ||
    window.location.search.includes('verify=act') ||
    window.location.search.includes('num=') ||
    window.location.search.includes('ref=')
  );

  // Écouter les changements d'URL / hash pour naviguer vers la certification d'attestation
  React.useEffect(() => {
    const handleUrlCheck = () => {
      const search = window.location.search;
      const hash = window.location.hash;
      const isVerify =
        search.includes('verify=attestation') ||
        search.includes('verify-attestation') ||
        hash.includes('verify-attestation');
      setShowAttestationVerify(isVerify);
    };

    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, []);

  // Scan public d'attestation : affichage direct sans invite PWA
  if (showAttestationVerify) {
    return (
      <AttestationVerificationView
        onBackToApp={() => {
          setShowAttestationVerify(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  // Scan public de quittance ou acte : affichage direct sans invite PWA
  if (!isAuthenticated) {
    if (isReceiptScan && !forceAgentLogin) {
      return <PublicDocumentVerification onGoToLogin={() => setForceAgentLogin(true)} />;
    }

    return (
      <div className={`min-h-screen ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}>
        <AgentLoginConsole />
        <OfflineIndicator />
        <NotificationToast />
      </div>
    );
  }


  const isFullScreenCalendar = activeModule === 'MOD-03' && isCalendarFullScreen;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    } selection:bg-emerald-500/30 selection:text-emerald-700`}>
      <Header />
      <div className="flex-1 flex overflow-hidden min-w-0">
        {!isFullScreenCalendar && <Sidebar />}
        <MainContent />
      </div>
      {!isFullScreenCalendar && <MobileBottomNav />}
      <PrintModal />
      <DomainAuthModal />
      <CommandPalette />
      <OfflineIndicator />
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
