import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  expireAt?: string;
  onExpire?: () => void;
}

export const CountdownTimer72h: React.FC<Props> = ({ expireAt }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!expireAt) {
      // Default to 48h from now if not specified
      const mockExpire = Date.now() + 48 * 3600 * 1000;
      updateTime(mockExpire);
      const timer = setInterval(() => updateTime(mockExpire), 1000);
      return () => clearInterval(timer);
    }

    const target = new Date(expireAt).getTime();
    updateTime(target);
    const timer = setInterval(() => updateTime(target), 1000);
    return () => clearInterval(timer);

    function updateTime(targetTime: number) {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, expired: false });
      }
    }
  }, [expireAt]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono font-bold animate-pulse">
        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
        <span>DÉLAI 72H EXPIRÉ — FERMETURE IMMEDIATE REQUISE</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs font-mono">
      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
        <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
        <span>Compte à Rebours 72h :</span>
      </div>
      <div className="flex items-center gap-1 font-bold text-amber-300">
        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">
          {timeLeft.hours.toString().padStart(2, '0')}h
        </span>
        :
        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">
          {timeLeft.minutes.toString().padStart(2, '0')}m
        </span>
        :
        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400">
          {timeLeft.seconds.toString().padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
};
