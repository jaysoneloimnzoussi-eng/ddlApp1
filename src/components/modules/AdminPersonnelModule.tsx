import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  ShieldCheck,
  CreditCard,
  Printer,
  Plus,
  Mail,
  Phone,
  Award,
  Lock,
} from 'lucide-react';
import { StaffPersonnel } from '../../types';

export const AdminPersonnelModule: React.FC = () => {
  const { staff, openPrintModal, currentUserRole, setCurrentUserRole, showNotification } = useApp();

  const [selectedStaff, setSelectedStaff] = useState<StaffPersonnel>(staff[0] || null);

  const handlePrintBadge = (agent: StaffPersonnel) => {
    openPrintModal('staff_badge', agent);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-14
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Ressources Humaines & Badges d'Inspecteurs
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Répertoire des officiers assermentés, brigades mobiles SAA, habilitations RBAC et badges d'identité officiels
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste du Personnel Assermenté (7 colonnes) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Tableau des Effectifs Départementaux ({staff.length})</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Assermentés TGI
            </span>
          </div>

          <div className="space-y-3">
            {staff.map((agent) => (
              <div
                key={agent.id}
                className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-emerald-400 mr-2">
                      {agent.matricule}
                    </span>
                    <span className="font-bold text-slate-100 text-sm">{agent.nomComplet}</span>
                    <p className="text-[11px] text-slate-300 font-semibold">{agent.fonction}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 font-mono">
                    {agent.statut}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Affectation :</span>
                    <span className="text-slate-200 font-medium truncate block">
                      {agent.brigadeAffectee || agent.service}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Prestation Serment :</span>
                    <span className="font-mono text-slate-200">{agent.assermentationNumero}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Téléphone :</span>
                    <span className="text-slate-200">{agent.telephone}</span>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => handlePrintBadge(agent)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Carte Professionnelle & Badge ID
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panneau RBAC & Habilitations de Sécurité (5 colonnes) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Contrôle d'Accès par Rôles (RBAC)</span>
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Le modèle de sécurité souverain isole strictement les compétences comptables et répressives :
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-emerald-400">Directeur Départemental</p>
              <p className="text-slate-400 text-[11px]">
                Signature des actes solennels, ordonnancement des recettes, visas des bordereaux DGL Brazzaville.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-amber-400">Inspecteur SAA (Brigades Mobiles)</p>
              <p className="text-slate-400 text-[11px]">
                Recensement terrain, saisies géospatiales, constatations sonométriques et notifications de mise en demeure.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-blue-400">Caissier Régisseur SAF</p>
              <p className="text-slate-400 text-[11px]">
                Encaissement exclusif des fonds, émission des quittances infalsifiables et rapprochement Trésor Public.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <p className="font-bold text-purple-400">Agent Promotion SPA</p>
              <p className="text-slate-400 text-[11px]">
                Labellisation citoyenne, délivrance des diplômes d'honneur et suivi des animations culturelles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
