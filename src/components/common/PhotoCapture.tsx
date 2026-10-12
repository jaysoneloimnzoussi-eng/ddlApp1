import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';

interface PhotoCaptureProps {
  onPhotoCaptured: (dataUrl: string) => void;
  onPhotoRemoved: () => void;
  currentPhoto?: string;
  label?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotoCaptured,
  onPhotoRemoved,
  currentPhoto,
  label = 'Photo de Façade / Enseigne / Compteur',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize and compress on canvas
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onPhotoCaptured(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        {label}
      </span>

      {currentPhoto ? (
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-900 aspect-video max-h-48 group">
          <img
            src={currentPhoto}
            alt="Preuve terrain DDL-PN"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <CheckCircle2 className="w-3 h-3" />
            Photo enregistrée
          </div>
          <button
            type="button"
            onClick={onPhotoRemoved}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white transition shadow-md cursor-pointer"
            title="Supprimer la photo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-500/5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isCompressing ? 'Optimisation en cours...' : 'Prendre une photo in situ'}
              </p>
              <p className="text-[11px] text-slate-400">
                Appareil photo smartphone ou galerie (compressé automatiquement)
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
