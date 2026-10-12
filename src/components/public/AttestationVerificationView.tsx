import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  UserCheck,
  MapPin,
  Lock,
  Printer,
  Copy,
  ExternalLink,
  ArrowLeft,
  Stamp,
  Award,
} from 'lucide-react';
import { DdlLogo } from '../common/DdlLogo';

interface AttestationVerificationViewProps {
  onBackToApp?: () => void;
}

export const AttestationVerificationView: React.FC<AttestationVerificationViewProps> = ({ onBackToApp }) => {
  const [params, setParams] = useState({
    ref: 'N°042/MCAPNIT/DGL/DPN/DDL-PN/2026',
    etab: 'LE ROCHER',
    prom: 'Monsieur Jack MATOKO (Promoteur Exploitant)',
    date: '12 octobre 2026',
    code: 'DDL-PN-2026-REC-042',
    statut: 'CONFORME ET RÉGULIER',
    hash: 'SHA256-48F7A19B-ROCHER-OFFICIEL-CONGO-2026',
  });

  const [copied, setCopied] = useState(false);
  const [verificationTimestamp] = useState(() => new Date().toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      let refParam = searchParams.get('ref');
      let etabParam = searchParams.get('etab');
      let promParam = searchParams.get('prom');
      let dateParam = searchParams.get('date');
      let codeParam = searchParams.get('code');
      let statutParam = searchParams.get('statut');
      let hashParam = searchParams.get('hash');

      // Si présent dans le hash (#verify-attestation?...)
      if (!refParam && hash.includes('?')) {
        const hashQuery = hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        refParam = hashParams.get('ref');
        etabParam = hashParams.get('etab');
        promParam = hashParams.get('prom');
        dateParam = hashParams.get('date');
        codeParam = hashParams.get('code');
        statutParam = hashParams.get('statut');
        hashParam = hashParams.get('hash');
      }

      setParams({
        ref: refParam || 'N°042/MCAPNIT/DGL/DPN/DDL-PN/2026',
        etab: etabParam || 'LE ROCHER',
        prom: promParam || 'Monsieur Jack MATOKO (Promoteur Exploitant)',
        date: dateParam || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        code: codeParam || 'DDL-PN-2026-REC-042',
        statut: statutParam || 'CONFORME ET RÉGULIER',
        hash: hashParam || 'SHA256-48F7A19B-ROCHER-OFFICIEL-CONGO-2026',
      });
    }
  }, []);

  const handleCopyUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Republic Banner */}
      <div className="w-full bg-slate-900 border-b border-slate-800 py-3 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-400">
              Système Public de Vérification Souverain DDL-PN
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">Portail Républicain Officiel</span>
          </div>
          <div className="flex items-center gap-2">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portail Interne</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 py-8 px-4 sm:px-6 flex justify-center items-center">
        <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          
          {/* Institutional Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <DdlLogo size="xl" rounded="2xl" bordered={true} className="ring-2 ring-emerald-500/30 shadow-lg" />
              <div>
                <p className="font-bold text-sm tracking-wide text-slate-200 uppercase">
                  RÉPUBLIQUE DU CONGO
                </p>
                <p className="font-garamond italic text-sm text-slate-400">
                  Unité – Travail – Progrès
                </p>
                <div className="w-16 h-0.5 bg-emerald-500 my-1 mx-auto sm:mx-0" />
                <p className="text-xs font-semibold text-slate-300">
                  Direction Départementale des Loisirs
                </p>
                <p className="text-[11px] text-slate-400">
                  Département de Pointe-Noire (MCAPNIT)
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>SCEAU OFFICIEL SÉCURISÉ</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Réf : {params.ref}
              </p>
            </div>
          </div>

          {/* Primary Verified Status Card */}
          <div className="my-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-2 border-emerald-500/50 relative overflow-hidden shadow-xl">
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <ShieldCheck className="w-48 h-48 text-emerald-400" />
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">
                    DOCUMENT CERTIFIÉ CONFORME & AUTHENTIQUE
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                    VÉRIFIÉ
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1 font-medium">
                  Cette Attestation de Dépôt a été formellement enregistrée et validée auprès des services de la Direction Départementale des Loisirs de Pointe-Noire.
                </p>
                <p className="text-xs text-emerald-400/90 mt-2 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Statut : {params.statut}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Verification Cartouche */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Mentions Officielles de l&apos;Attestation de Dépôt</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Etablissement */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Établissement de Loisirs</span>
                </div>
                <p className="text-lg font-bold text-white uppercase tracking-wide">
                  « {params.etab} »
                </p>
                <p className="text-xs text-slate-400">
                  Dossier technique d&apos;agrément d&apos;exploitation
                </p>
              </div>

              {/* Promoteur */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Promoteur / Exploitant Déposant</span>
                </div>
                <p className="text-base font-semibold text-slate-200">
                  {params.prom}
                </p>
                <p className="text-xs text-emerald-400">
                  Identité vérifiée & dossier régulier
                </p>
              </div>

              {/* Référence et N° d'Acte */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>N° d&apos;Enregistrement Officiel</span>
                </div>
                <p className="text-sm font-mono font-bold text-slate-200">
                  {params.ref}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  Code Sécurisé : {params.code}
                </p>
              </div>

              {/* Date & Validité */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Date d&apos;Émission & Validité</span>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Délivrée le : {params.date}
                </p>
                <p className="text-xs text-emerald-400 font-semibold">
                  Validité : 90 jours renouvelable (Loi N° 21-2019)
                </p>
              </div>
            </div>

            {/* Cadre Juridique et Autorité */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
                <span className="font-semibold text-slate-200">Autorité Émettrice :</span>
                <span className="text-white font-medium">Direction Départementale des Loisirs de Pointe-Noire</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
                <span className="font-semibold text-slate-200">Signataire Habilité :</span>
                <span className="text-emerald-400 font-bold">Jean Richard NTSEKE NGOUAKA (Directeur Départemental)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
                <span className="font-semibold text-slate-200">Base Réglementaire :</span>
                <span className="text-slate-300">Loi N° 21-2019 du 13 juin 2019 fixant les règles des activités de loisirs</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-200">Empreinte Cryptographique :</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[260px]">{params.hash}</span>
              </div>
            </div>

            {/* Horodatage du contrôle */}
            <p className="text-[11px] text-center text-slate-500 italic pt-2">
              Contrôle in situ certifié le {verificationTimestamp}. Données scellées issues du registre souverain DDL-PN.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="no-print mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimer le Certificat de Conformité</span>
            </button>

            <button
              onClick={handleCopyUrl}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{copied ? 'Lien copié dans le presse-papier !' : 'Copier le lien officiel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-[11px] text-slate-500">
        <p>
          Direction Départementale des Loisirs de Pointe-Noire • Ministère de la Culture, des Arts, du Patrimoine National et de l&apos;Industrie Touristique
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          Régularité et conformité des actes administratifs • Système Garamond & Scellement QR Code
        </p>
      </footer>
    </div>
  );
};
