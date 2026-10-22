import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-reload on dynamic module chunk load failure (e.g. network drops or fresh dev server build)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

// Register Service Worker for 100% offline access & PWA precaching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('Nouvelle version de DDL-PN disponible.');
      },
      onOfflineReady() {
        console.log('Application DDL-PN prête pour le fonctionnement 100% hors-ligne.');
      },
    });
  } catch (err) {
    console.warn('Service worker registration skipped in dev mode:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
