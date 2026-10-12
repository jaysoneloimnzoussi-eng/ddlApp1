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

// Lazy loaded modules for optimal performance & instant mobile startup
const DashboardModule = lazy(() => import('./components/modules/DashboardModule').then((m) => ({ default: m.DashboardModule })));
const FieldRecensementModule = lazy(() => import('./components/modules/FieldRecensementModule').then((m) => ({ default: m.FieldRecensementModule })));
const MobileAgentCalendarModule = lazy(() => import('./components/modules/MobileAgentCalendarModule').then((m) => ({ default: m.MobileAgentCalendarModule })));
const GoogleWorkspaceGatewayModule = lazy(() => import('./components/modules/GoogleWorkspaceGatewayModule').then((m) => ({ default: m.GoogleWorkspaceGatewayModule })));
const LegalActsGeneratorModule = lazy(() => import('./components/modules/LegalActsGeneratorModule').then((m) => ({ default: m.LegalActsGeneratorModule })));
const QuarterlyReportsModule = lazy(() => import('./components/modules/QuarterlyReportsModule').then((m) => ({ default: m.QuarterlyReportsModule })));
const SigMapModule = lazy(() => import('./components/modules/SigMapModule').then((m) => ({ default: m.SigMapModule })));
const SpaPromotionModule = lazy(() => import('./components/modules/SpaPromotionModule').then((m) => ({ default: m.SpaPromotionModule })));
const TransmissionDglModule = lazy(() => import('./components/modules/TransmissionDglModule').then((m) => ({ default: m.TransmissionDglModule })));
const SafRegieRecettesModule = lazy(() => import('./components/modules/SafRegieRecettesModule').then((m) => ({ default: m.SafRegieRecettesModule })));
const TitlesAndReceiptsModule = lazy(() => import('./components/modules/TitlesAndReceiptsModule').then((m) => ({ default: m.TitlesAndReceiptsModule })));
const LegalTextsAndSimulatorModule = lazy(() => import('./components/modules/LegalTextsAndSimulatorModule').then((m) => ({ default: m.LegalTextsAndSimulatorModule })));
const PtaTrackerModule = lazy(() => import('./components/modules/PtaTrackerModule').then((m) => ({ default: m.PtaTrackerModule })));
const AdminPersonnelModule = lazy(() => import('./components/modules/AdminPersonnelModule').then((m) => ({ default: m.AdminPersonnelModule })));
const DocumentArchivingModule = lazy(() => import('./components/modules/DocumentArchivingModule').then((m) => ({ default: m.DocumentArchivingModule })));
const JointInspectionModule = lazy(() => import('./components/modules/JointInspectionModule').then((m) => ({ default: m.JointInspectionModule })));
const PromoterFintechPortalModule = lazy(() => import('./components/modules/PromoterFintechPortalModule').then((m) => ({ default: m.PromoterFintechPortalModule })));
const SupabaseDataImportModule = lazy(() => import('./components/modules/SupabaseDataImportModule').then((m) => ({ default: m.SupabaseDataImportModule })));
const AdministrativeDraftingCanvaModule = lazy(() => import('./components/modules/AdministrativeDraftingCanvaModule').then((m) => ({ default: m.AdministrativeDraftingCanvaModule })));

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

  // Détection d'un scan QR code citoyen / promoteur / police
  const isVerificationScan = typeof window !== 'undefined' && (
    window.location.search.includes('verify=') ||
    window.location.search.includes('num=') ||
    window.location.search.includes('ref=')
  );

  if (!isAuthenticated) {
    if (isVerificationScan && !forceAgentLogin) {
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
