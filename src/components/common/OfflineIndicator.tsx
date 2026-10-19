import React from 'react';
import { useApp } from '../../context/AppContext';
import { WifiOff, ShieldCheck, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, offlineQueueCount, syncOfflineQueue, establishments } = useApp();

  const pendingCount = Math.max(
    offlineQueueCount,
    establishments.filter((e) => e.syncStatus === 'pending').length
  );

  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <aside
        aria-label="Statut hors-ligne"
        className="fixed bottom-20 md:bottom-4 left-4 z-50 max-w-sm rounded-xl bg-slate-900/95 border border-amber-500/40 p-3 shadow-2xl backdrop-blur-md text-slate-100 flex items-center gap-3 animate-fadeIn"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-amber-400">Mode Hors-Ligne Terrain</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              100% Autonome
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
            Toutes vos fiches & quittances sont sécurisées localement sur cet appareil.
          </p>
        </div>
      </aside>
    );
  }

  // Back online with pending items
  return (
    <aside
      aria-label="Synchronisation en attente"
      className="fixed bottom-20 md:bottom-4 left-4 z-50 max-w-sm rounded-xl bg-slate-900/95 border border-emerald-500/40 p-3 shadow-2xl backdrop-blur-md text-slate-100 flex items-center gap-3 animate-fadeIn"
    >
      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-bold text-emerald-400">Connexion Rétablie</span>
        <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
          {pendingCount} fiche(s) terrain prête(s) à être synchronisée(s).
        </p>
      </div>
      <button
        onClick={syncOfflineQueue}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Synchroniser
      </button>
    </aside>
  );
};
