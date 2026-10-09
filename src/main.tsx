import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for 100% offline access & PWA precaching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('Nouvelle version de DDL-PN disponible.');
    },
    onOfflineReady() {
      console.log('Application DDL-PN prête pour le fonctionnement 100% hors-ligne.');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
