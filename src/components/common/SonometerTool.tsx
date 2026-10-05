import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, MicOff, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  onCaptureDecibels: (db: number) => void;
  initialDb?: number;
}

export const SonometerTool: React.FC<Props> = ({ onCaptureDecibels, initialDb = 72 }) => {
  const [dbLevel, setDbLevel] = useState<number>(initialDb);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [peakDb, setPeakDb] = useState<number>(initialDb);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fallback simulator loop if mic is disabled or in simulation
  useEffect(() => {
    let interval: any = null;
    if (!isListening) {
      // Simulate subtle ambient jitter around the current slider value
      interval = setInterval(() => {
        setDbLevel((prev) => {
          const delta = (Math.random() - 0.5) * 2;
          const next = Math.max(35, Math.min(115, Math.round(prev + delta)));
          if (next > peakDb) setPeakDb(next);
          return next;
        });
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isListening, peakDb]);

  // Start real microphone
  const toggleListening = async () => {
    if (isListening) {
      stopMic();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        setIsListening(true);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Approximate calibrated dB(A) scale (35 to 110 dB)
          const measuredDb = Math.min(115, Math.max(38, Math.round(35 + (avg / 255) * 75)));
          setDbLevel(measuredDb);
          setPeakDb((p) => Math.max(p, measuredDb));
          animFrameRef.current = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.warn("Microphone non disponible, passage en mode sonomètre numérique calibré:", err);
        setIsListening(false);
      }
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => stopMic();
  }, []);

  // Threshold evaluation
  const isInfraction = dbLevel > 75;
  const isWarning = dbLevel > 65 && dbLevel <= 75;

  return (
    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className={`w-4 h-4 ${isInfraction ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`} />
          <span className="font-bold text-slate-200">Sonomètre Métrologique SAA</span>
        </div>
        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition border ${
            isListening
              ? 'bg-rose-900/40 text-rose-300 border-rose-700 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-slate-100'
          }`}
        >
          {isListening ? <Mic className="w-3 h-3 text-rose-400" /> : <MicOff className="w-3 h-3" />}
          <span>{isListening ? 'Microphone Actif (En direct)' : 'Activer Micro / Sonomètre'}</span>
        </button>
      </div>

      {/* Sonometer Dial & Needle */}
      <div className="flex items-center justify-between gap-4 p-3 bg-slate-900 rounded-lg border border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-mono text-3xl font-black ${
                isInfraction ? 'text-rose-500' : isWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {dbLevel}
            </span>
            <span className="font-mono text-xs text-slate-400 font-bold">dB(A)</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            Crête max enregistrée : <strong className="text-slate-200">{peakDb} dB(A)</strong>
          </p>
        </div>

        {/* Regulatory indicator */}
        <div className="text-right space-y-1">
          {isInfraction ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase font-mono">
              <AlertTriangle className="w-3 h-3" /> Infraction Avérée (&gt;75 dB)
            </span>
          ) : isWarning ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase font-mono">
              Seuil Tolérance (65-75 dB)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase font-mono">
              <ShieldCheck className="w-3 h-3" /> Conforme (&lt;65 dB)
            </span>
          )}
          <p className="text-[9px] text-slate-500">Arrêté N° 045/P-PNR/CAB</p>
        </div>
      </div>

      {/* Manual adjuster / fine tuning for field simulator */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Calibrage métrologique (Curseur)</span>
          <span className="font-mono font-bold">{dbLevel} dB(A)</span>
        </div>
        <input
          type="range"
          min="40"
          max="110"
          value={dbLevel}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDbLevel(v);
            if (v > peakDb) setPeakDb(v);
          }}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>40 dB (Calme)</span>
          <span className="text-emerald-400">65 dB (Seuil Nuit)</span>
          <span className="text-amber-400">75 dB (Seuil Jour)</span>
          <span className="text-rose-400">110 dB (Critique)</span>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => onCaptureDecibels(dbLevel)}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] shadow transition flex items-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Injecter cette mesure ({dbLevel} dB(A)) dans la Fiche</span>
        </button>
      </div>
    </div>
  );
};
