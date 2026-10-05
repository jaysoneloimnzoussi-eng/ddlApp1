import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { PrintModal } from './components/common/PrintModal';
import { NotificationToast } from './components/common/NotificationToast';

// 17 Module Components
import { DashboardModule } from './components/modules/DashboardModule';
import { FieldRecensementModule } from './components/modules/FieldRecensementModule';
import { MobileAgentCalendarModule } from './components/modules/MobileAgentCalendarModule';
import { GoogleWorkspaceGatewayModule } from './components/modules/GoogleWorkspaceGatewayModule';
import { LegalActsGeneratorModule } from './components/modules/LegalActsGeneratorModule';
import { QuarterlyReportsModule } from './components/modules/QuarterlyReportsModule';
import { SigMapModule } from './components/modules/SigMapModule';
import { SpaPromotionModule } from './components/modules/SpaPromotionModule';
import { TransmissionDglModule } from './components/modules/TransmissionDglModule';
import { SafRegieRecettesModule } from './components/modules/SafRegieRecettesModule';
import { TitlesAndReceiptsModule } from './components/modules/TitlesAndReceiptsModule';
import { LegalTextsAndSimulatorModule } from './components/modules/LegalTextsAndSimulatorModule';
import { PtaTrackerModule } from './components/modules/PtaTrackerModule';
import { AdminPersonnelModule } from './components/modules/AdminPersonnelModule';
import { DocumentArchivingModule } from './components/modules/DocumentArchivingModule';
import { JointInspectionModule } from './components/modules/JointInspectionModule';
import { PromoterFintechPortalModule } from './components/modules/PromoterFintechPortalModule';
import { SupabaseDataImportModule } from './components/modules/SupabaseDataImportModule';
import { AgentLoginConsole } from './components/auth/AgentLoginConsole';

const MainContent: React.FC = () => {
  const { activeModule, theme, currentUserRole } = useApp();
  const isFieldAgent = currentUserRole !== 'directeur' && currentUserRole !== 'administrateur';

  // Strict containment for Field Agents: ONLY MOD-01 & MOD-02
  const effectiveModule = isFieldAgent
    ? (activeModule === 'MOD-02' ? 'MOD-02' : 'MOD-01')
    : activeModule;

  return (
    <main className={`flex-1 overflow-y-auto transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {effectiveModule === 'MOD-01' && <DashboardModule />}
      {effectiveModule === 'MOD-02' && <FieldRecensementModule />}
      {effectiveModule === 'MOD-03' && <MobileAgentCalendarModule />}
      {effectiveModule === 'MOD-04' && <GoogleWorkspaceGatewayModule />}
      {effectiveModule === 'MOD-05' && <LegalActsGeneratorModule />}
      {effectiveModule === 'MOD-06' && <QuarterlyReportsModule />}
      {effectiveModule === 'MOD-07' && <SigMapModule />}
      {effectiveModule === 'MOD-08' && <SpaPromotionModule />}
      {effectiveModule === 'MOD-09' && <TransmissionDglModule />}
      {effectiveModule === 'MOD-10' && <SafRegieRecettesModule />}
      {effectiveModule === 'MOD-11' && <TitlesAndReceiptsModule />}
      {effectiveModule === 'MOD-12' && <LegalTextsAndSimulatorModule />}
      {effectiveModule === 'MOD-13' && <PtaTrackerModule />}
      {effectiveModule === 'MOD-14' && <AdminPersonnelModule />}
      {effectiveModule === 'MOD-15' && <DocumentArchivingModule />}
      {effectiveModule === 'MOD-16' && <JointInspectionModule />}
      {effectiveModule === 'MOD-17' && <PromoterFintechPortalModule />}
      {effectiveModule === 'MOD-18' && <SupabaseDataImportModule />}
    </main>
  );
};

const AppContent: React.FC = () => {
  const { theme, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}>
        <AgentLoginConsole />
        <NotificationToast />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    } selection:bg-emerald-500/30 selection:text-emerald-700`}>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <PrintModal />
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
