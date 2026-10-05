import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { PrintModal } from './components/common/PrintModal';
import { NotificationToast } from './components/common/NotificationToast';
import { DomainAuthModal } from './components/common/DomainAuthModal';

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
  const { activeModule, theme } = useApp();

  return (
    <main className={`flex-1 overflow-y-auto transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
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
      <DomainAuthModal />
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
