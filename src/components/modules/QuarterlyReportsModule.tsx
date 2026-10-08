import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  BarChart3,
  TrendingUp,
  Building,
  CheckCircle2,
  FileText,
  Mail,
  Shield,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { generateQuarterlyReportDocx } from '../../services/docxGenerator';
import { formatCfa } from '../../services/crypto';
import { Arrondissement } from '../../types';
import { OfficialDocumentHeader } from '../common/OfficialDocumentHeader';
import { printHtmlElement } from '../../services/printService';

export const QuarterlyReportsModule: React.FC = () => {
  const { establishments, receipts, legalActs, ptaMilestones, showNotification, setActiveModule } = useApp();

  const [trimestre, setTrimestre] = useState<'T1' | 'T2' | 'T3' | 'T4'>('T3');
  const [viewTab, setViewTab] = useState<'rapport_integral' | 'synthese' | 'indicateurs'>('rapport_integral');
  const annee = 2026;

  const totalRecettes = receipts.reduce((sum, r) => sum + r.montantVerse, 0);
  const totalEtablissements = establishments.length;
  const totalMisesEnDemeure = legalActs.filter((a) => a.type === 'mise_en_demeure').length;
  const totalInfractions = legalActs.length;

  const arrondissements: Arrondissement[] = [
    'Lumumba',
    'Mvou-Mvou',
    'Tié-Tié',
    'Loandjili',
    'Mongo-Mpoukou',
    'Ngoyo',
  ];

  const repartitionArrondissements = arrondissements.map((nom) => {
    const etabs = establishments.filter((e) => e.arrondissement === nom);
    const recs = receipts.filter((r) => r.arrondissement === nom);
    return {
      nom,
      nombre: etabs.length,
      montant: recs.reduce((s, r) => s + r.montantVerse, 0),
    };
  });

  const actionsPta = ptaMilestones.map(
    (p) => `${p.activite} (${p.serviceResponsable}) : ${p.tauxExecutionPhysique}% réalisé.`
  );

  const handleExportDocx = async () => {
    try {
      await generateQuarterlyReportDocx({
        trimestre,
        annee,
        totalRecettes,
        totalEtablissements,
        totalInfractions,
        totalMisesEnDemeure,
        repartitionArrondissements,
        actionsPta,
      });
      showNotification('success', `Rapport Trimestriel ${trimestre} ${annee} exporté en format Word (.docx) avec succès !`);
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'exportation Word : ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-06
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Rapports Trimestriels d&apos;Activités DDL-PN
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Production, consultation et diffusion des bilans officiels (N°033/MCAPNIT/DGL/DPN/DDL-PN) destinés à la DGL Brazzaville
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModule('MOD-09')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Lettre de Transmission (MOD-09)</span>
          </button>
          <button
            onClick={handleExportDocx}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger Word (.docx)</span>
          </button>
          <button
            onClick={() => printHtmlElement('printable-rapport-t3', `Rapport_Trimestriel_${trimestre}_${annee}_DDL_PN`)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Rapport A4</span>
          </button>
        </div>
      </div>

      {/* Selectors Toolbar */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap justify-between items-center gap-4">
        {/* Trimestre pills */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Exercice {annee} :</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['T1', 'T2', 'T3', 'T4'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setTrimestre(q)}
                className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  trimestre === q
                    ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Trimestre {q}</span>
                {q === 'T3' && (
                  <span className="text-[9px] px-1 rounded bg-black/30 font-mono font-bold">Prototype</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewTab('rapport_integral')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewTab === 'rapport_integral'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rapport Intégral A4 (Garamond 13)</span>
          </button>
          <button
            onClick={() => setViewTab('synthese')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewTab === 'synthese'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Synthèse du Rapport</span>
          </button>
          <button
            onClick={() => setViewTab('indicateurs')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewTab === 'indicateurs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Chiffres & Répartition</span>
          </button>
        </div>
      </div>

      {/* VIEW TAB 1 : RAPPORT INTÉGRAL CONFORME AU DOCUMENT OFFICIEL DU T3 */}
      {viewTab === 'rapport_integral' && (
        <div className="space-y-6">
          {/* Header notice */}
          <div className="no-print p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 text-xs flex items-center justify-between text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Document Prototype Officiel Conforme :</strong> Ce rapport intègre fidèlement l&apos;intégralité des sections, tableaux d&apos;activités, participations ministérielles et suggestions du document{' '}
                <code className="text-blue-200 font-mono font-bold">N°033/MCAPNIT/DGL/DPN/DDL-PN</code> (Juillet – Septembre 2026) rédigé en police Garamond taille 13.
              </span>
            </div>
            <button
              onClick={() => setActiveModule('MOD-09')}
              className="text-xs font-bold underline flex items-center gap-1 hover:text-white cursor-pointer shrink-0 ml-4"
            >
              <span>Voir Lettre de Transmission N°035</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Wrapper for isolated clean printing */}
          <div id="printable-rapport-t3" className="space-y-6">
            {/* PAGE A4 1 : EN-TÊTE + CADRE SIGNALÉTIQUE + INTRODUCTION */}
            <div
              className="page-a4 bg-white text-slate-900 rounded-xl shadow-2xl max-w-[210mm] mx-auto border border-slate-300 font-garamond leading-relaxed select-text space-y-6"
              style={{ padding: '20mm 20mm 20mm 25mm' }}
            >
            {/* Running header */}
            <div className="text-[9pt] text-slate-500 italic flex justify-between border-b border-slate-200 pb-1 mb-4">
              <span>DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</span>
              <span>Rapport d&apos;Activités — 3ème Trimestre 2026</span>
            </div>

            {/* Authentic 2-Column Administrative Header */}
            <OfficialDocumentHeader
              numeroActe="N°033/MCAPNIT/DGL/DPN/DDL-PN"
              className="mb-6"
            />

            {/* Document Box Title */}
            <div className="border border-slate-900 p-4 text-center space-y-1 bg-slate-50/50">
              <h2 className="font-bold text-[14pt] uppercase tracking-wide text-slate-950">
                RAPPORT D&apos;ACTIVITÉS DU TROISIÈME TRIMESTRE 2026
              </h2>
              <p className="italic text-[12.5pt] text-slate-800">
                Direction Départementale des Loisirs de Pointe-Noire
              </p>
              <p className="font-semibold text-[12pt] text-slate-900">
                Juillet – Septembre 2026
              </p>
            </div>

            {/* Structure identification table */}
            <div className="border border-slate-800 text-[12pt]">
              <div className="grid grid-cols-12 border-b border-slate-800">
                <div className="col-span-4 p-2.5 font-bold bg-slate-100 border-r border-slate-800">Structure</div>
                <div className="col-span-8 p-2.5">Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)</div>
              </div>
              <div className="grid grid-cols-12 border-b border-slate-800">
                <div className="col-span-4 p-2.5 font-bold bg-slate-100 border-r border-slate-800">Ministère</div>
                <div className="col-span-8 p-2.5 leading-snug">
                  MCAPNIT — Ministère de la Culture, des Arts, du Patrimoine National et de l&apos;Industrie Touristique.
                </div>
              </div>
              <div className="grid grid-cols-12 border-b border-slate-800">
                <div className="col-span-4 p-2.5 font-bold bg-slate-100 border-r border-slate-800">Hiérarchie</div>
                <div className="col-span-8 p-2.5">Direction Générale des Loisirs (DGL)</div>
              </div>
              <div className="grid grid-cols-12 border-b border-slate-800">
                <div className="col-span-4 p-2.5 font-bold bg-slate-100 border-r border-slate-800">Période couverte</div>
                <div className="col-span-8 p-2.5">1er juillet — 30 septembre 2026</div>
              </div>
              <div className="grid grid-cols-12 border-b border-slate-800">
                <div className="col-span-4 p-2.5 font-bold bg-slate-100 border-r border-slate-800">Référence PTA</div>
                <div className="col-span-8 p-2.5">Plan de Travail Annuel 2026 — DDL-PN</div>
              </div>
              <div className="grid grid-cols-12">
                <div className="col-span-4 p-2.5 font-bold bg-slate-100 border-r border-slate-800">N° de document</div>
                <div className="col-span-8 p-2.5 font-bold">N°033/MCAPNIT/DGL/DPN/DDL-PN</div>
              </div>
            </div>

            {/* 1. INTRODUCTION */}
            <div className="space-y-3 pt-3">
              <h3 className="text-[13pt] font-bold text-slate-950 uppercase border-b border-slate-800 pb-1">
                1. INTRODUCTION
              </h3>
              <p className="text-justify text-[13pt] leading-[1.6]">
                Le présent rapport dresse le bilan des activités du troisième trimestre de l&apos;exercice 2026 de la
                Direction Départementale des Loisirs (DDL) de Pointe-Noire. Il fait suite au rapport du deuxième
                trimestre 2026, qui avait documenté un acquis de fond — la production de la Fiche Technique des
                manques et besoins de la DDL-PN — tout en relevant la persistance, sur deux trimestres consécutifs,
                de plusieurs contraintes structurelles (absence de véhicule, insuffisance budgétaire, partenariats
                non formalisés).
              </p>
              <p className="text-justify text-[13pt] leading-[1.6]">
                Le troisième trimestre a été dominé par une charge de représentation institutionnelle
                inhabituellement soutenue : en l&apos;espace de trois jours, la Direction a été sollicitée pour trois
                événements officiels de premier plan à Pointe-Noire, sous le patronage respectif du Premier
                Ministre, du Ministre des Hydrocarbures et du Ministre délégué chargé de la Jeunesse et de
                l&apos;Éducation Civique. Le trimestre a également vu le service de la Promotion et Animation
                franchir une étape dans la structuration de sa communication, avec le lancement de la page
                Facebook officielle de la DDL-PN.
              </p>
              <p className="text-justify text-[13pt] leading-[1.6]">
                À l&apos;inverse, les contraintes structurelles relevées aux deux trimestres précédents n&apos;ont, dans
                leur grande majorité, pas connu d&apos;évolution favorable au cours du T3 : la deuxième mission de
                contrôle qualité des établissements demeure reportée pour la troisième fois consécutive, les
                conventions de partenariat stratégique restent sans signature, la note de besoin logistique n&apos;a
                toujours pas été transmise formellement à la Direction Générale des Loisirs, et la Fiche Technique
                des manques, préparée depuis le 17 juin 2026, est toujours en attente de remise à Monsieur le
                Ministre. Le présent rapport en rend compte avec la même rigueur et la même transparence que les
                rapports précédents.
              </p>
            </div>
          </div>

          {/* PAGE A4 2 : 2. ACTIVITÉS PROGRAMMÉES RÉALISÉES (SAFM, AUTORISATION, SSID, SPA) */}
          <div className="page-a4 bg-white text-slate-900 p-8 sm:p-12 md:p-14 rounded-xl shadow-2xl max-w-[210mm] mx-auto border border-slate-300 font-garamond leading-relaxed select-text space-y-6">
            <div className="text-[9pt] text-slate-500 italic flex justify-between border-b border-slate-200 pb-1 mb-2">
              <span>DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</span>
              <span>Rapport d&apos;Activités — 3ème Trimestre 2026</span>
            </div>

            <h3 className="text-[13pt] font-bold text-slate-950 uppercase border-b border-slate-800 pb-1">
              2. ACTIVITÉS PROGRAMMÉES RÉALISÉES
            </h3>
            <p className="text-justify text-[13pt] leading-[1.6]">
              Le troisième trimestre 2026 a été marqué par la continuité de la gestion administrative courante
              et par une mobilisation institutionnelle particulièrement dense au mois de septembre, ainsi que
              par le lancement du premier outil de communication numérique de la Direction.
            </p>

            {/* a. SAFM */}
            <div className="space-y-2">
              <h4 className="font-bold text-[12.5pt] text-slate-950">
                a. Service Administratif, Financier et du Matériel (SAFM)
              </h4>
              <p className="text-[12pt] leading-snug">
                Le SAFM a assuré la continuité de la gestion administrative courante de la Direction tout au
                long du trimestre, sans rupture de service.
              </p>
              <div className="border border-slate-800 text-[11.5pt] overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center">
                      <th className="p-2 border border-slate-800 w-10">N°</th>
                      <th className="p-2 border border-slate-800 w-36">Activités Prévues</th>
                      <th className="p-2 border border-slate-800">Contenus / Actions</th>
                      <th className="p-2 border border-slate-800 w-28">Indicateurs</th>
                      <th className="p-2 border border-slate-800 w-24">Exécution</th>
                      <th className="p-2 border border-slate-800 w-44">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">01</td>
                      <td className="p-2 border border-slate-800 font-bold">Gestion Administrative et Courrier</td>
                      <td className="p-2 border border-slate-800">
                        Traitement de la correspondance entrante et sortante ; archivage et classement des
                        documents du trimestre ; suivi des actes administratifs.
                      </td>
                      <td className="p-2 border border-slate-800 text-center">Registre de courrier à jour ; archives classées</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-emerald-800">Exécuté</td>
                      <td className="p-2 border border-slate-800">Activité routinière assurée sans discontinuité durant tout le T3 2026.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">02</td>
                      <td className="p-2 border border-slate-800 font-bold">Gestion des Ressources Humaines</td>
                      <td className="p-2 border border-slate-800">
                        Tenue du registre de présence ; suivi des congés et absences ; gestion des mouvements du personnel.
                      </td>
                      <td className="p-2 border border-slate-800 text-center">Registre de présence à jour</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-emerald-800">Exécuté</td>
                      <td className="p-2 border border-slate-800">Coordination humaine assurée pour les activités du trimestre, notamment la mobilisation autour des cérémonies officielles de septembre.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* b. Service de l'Autorisation */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-[12.5pt] text-slate-950">
                b. Service de l&apos;Autorisation
              </h4>
              <p className="text-[12pt] leading-snug">
                Le Service de l&apos;Autorisation a poursuivi sa mission quotidienne d&apos;accueil et d&apos;information des usagers.
                La deuxième mission de contrôle qualité des établissements, déjà reportée aux T1 et T2, n&apos;a pu être conduite
                faute de moyens de déplacement autonomes.
              </p>
              <div className="border border-slate-800 text-[11.5pt] overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center">
                      <th className="p-2 border border-slate-800 w-10">N°</th>
                      <th className="p-2 border border-slate-800 w-36">Activités Prévues</th>
                      <th className="p-2 border border-slate-800">Contenus / Actions</th>
                      <th className="p-2 border border-slate-800 w-28">Indicateurs</th>
                      <th className="p-2 border border-slate-800 w-24">Exécution</th>
                      <th className="p-2 border border-slate-800 w-44">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">01</td>
                      <td className="p-2 border border-slate-800 font-bold">2ème mission de contrôle qualité des établissements de loisirs</td>
                      <td className="p-2 border border-slate-800">
                        Vérification de la conformité réglementaire des établissements ; rédaction des rapports de contrôle ; le cas échéant, procès-verbaux de mise en demeure.
                      </td>
                      <td className="p-2 border border-slate-800 text-center">2 missions prévues au T1 (PTA 2026), report cumulé</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-2 border border-slate-800">Aucune mission de contrôle autonome possible en l&apos;absence de véhicule de service, pour le troisième trimestre consécutif. Report cumulé à urgenter au T4 2026.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">02</td>
                      <td className="p-2 border border-slate-800 font-bold">Vulgarisation continue des textes réglementaires (Notes N°151 et 152)</td>
                      <td className="p-2 border border-slate-800">
                        Information et accompagnement quotidien des usagers à l&apos;accueil ; explication des conditions d&apos;obtention des autorisations d&apos;exploitation.
                      </td>
                      <td className="p-2 border border-slate-800 text-center">Usagers informés à chaque passage à la DDL</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-emerald-800">Exécuté</td>
                      <td className="p-2 border border-slate-800">Information délivrée sans interruption. Les séances formelles hors les murs restent en attente de moyens de déplacement.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PAGE A4 3 : SUITE ACTIVITÉS RÉALISÉES (SSID & SPA) + 3. ACTIVITÉS NON RÉALISÉES */}
          <div className="page-a4 bg-white text-slate-900 p-8 sm:p-12 md:p-14 rounded-xl shadow-2xl max-w-[210mm] mx-auto border border-slate-300 font-garamond leading-relaxed select-text space-y-6">
            <div className="text-[9pt] text-slate-500 italic flex justify-between border-b border-slate-200 pb-1 mb-2">
              <span>DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</span>
              <span>Rapport d&apos;Activités — 3ème Trimestre 2026</span>
            </div>

            {/* c. SSID */}
            <div className="space-y-2">
              <h4 className="font-bold text-[12.5pt] text-slate-950">
                c. Service des Statistiques, de l&apos;Information et de la Documentation (SSID)
              </h4>
              <p className="text-[12pt] leading-snug">
                Le SSID a maintenu le suivi documentaire courant au T3 2026. La Fiche Technique des manques et besoins,
                finalisée le 17 juin 2026, demeure tenue prête pour remise à Monsieur le Ministre.
              </p>
              <div className="border border-slate-800 text-[11.5pt] overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center">
                      <th className="p-2 border border-slate-800 w-10">N°</th>
                      <th className="p-2 border border-slate-800 w-36">Activités Prévues</th>
                      <th className="p-2 border border-slate-800">Contenus / Actions</th>
                      <th className="p-2 border border-slate-800 w-28">Indicateurs</th>
                      <th className="p-2 border border-slate-800 w-24">Exécution</th>
                      <th className="p-2 border border-slate-800 w-44">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">01</td>
                      <td className="p-2 border border-slate-800 font-bold">Suivi et mise à jour documentaire</td>
                      <td className="p-2 border border-slate-800">Classement et mise à jour des documents de référence du service ; suivi de l&apos;état d&apos;avancement de la Fiche Technique.</td>
                      <td className="p-2 border border-slate-800 text-center">Fiche Technique maintenue à jour</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-emerald-800">Exécuté</td>
                      <td className="p-2 border border-slate-800">Aucun élément nouveau à intégrer faute de remise effective au Ministre à ce stade.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">02</td>
                      <td className="p-2 border border-slate-800 font-bold">Remise de la Fiche Technique des manques à Monsieur le Ministre</td>
                      <td className="p-2 border border-slate-800">Transmission du document de plaidoyer chiffré dès l&apos;arrivée de Monsieur le Ministre à Pointe-Noire.</td>
                      <td className="p-2 border border-slate-800 text-center">1 remise officielle</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-2 border border-slate-800">La visite de Monsieur le Ministre à Pointe-Noire n&apos;a pas encore eu lieu au terme du T3 2026. Document toujours tenu prêt.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* d. SPA */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-[12.5pt] text-slate-950">
                d. Service de la Promotion et Animation (SPA)
              </h4>
              <p className="text-[12pt] leading-snug">
                Le T3 2026 a été marqué par le lancement de la page Facebook officielle de la DDL-PN, porté par le service SPA,
                ainsi que par une charge de représentation institutionnelle soutenue au mois de septembre.
              </p>
              <div className="border border-slate-800 text-[11.5pt] overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center">
                      <th className="p-2 border border-slate-800 w-10">N°</th>
                      <th className="p-2 border border-slate-800 w-36">Activités Prévues</th>
                      <th className="p-2 border border-slate-800">Contenus / Actions</th>
                      <th className="p-2 border border-slate-800 w-28">Indicateurs</th>
                      <th className="p-2 border border-slate-800 w-24">Exécution</th>
                      <th className="p-2 border border-slate-800 w-44">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">01</td>
                      <td className="p-2 border border-slate-800 font-bold">Lancement de la page Facebook institutionnelle de la DDL-PN</td>
                      <td className="p-2 border border-slate-800">Création et mise en ligne de la page ; premiers contenus de visibilité pour la Direction.</td>
                      <td className="p-2 border border-slate-800 text-center">1 page Facebook active</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-emerald-800">Exécuté</td>
                      <td className="p-2 border border-slate-800">Les termes de référence (TDR) encadrant l&apos;animation de la page sont encore en cours d&apos;élaboration.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-800 text-center font-bold">02</td>
                      <td className="p-2 border border-slate-800 font-bold">Consolidation des acquis du service</td>
                      <td className="p-2 border border-slate-800">Poursuite des activités déjà engagées par le service.</td>
                      <td className="p-2 border border-slate-800 text-center">Continuité assurée</td>
                      <td className="p-2 border border-slate-800 text-center font-bold text-emerald-800">Exécuté</td>
                      <td className="p-2 border border-slate-800">Aucun développement nouveau à signaler au-delà du lancement de la page Facebook.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. ACTIVITÉS PROGRAMMÉES NON RÉALISÉES */}
            <div className="space-y-2 pt-3">
              <h3 className="text-[13pt] font-bold text-slate-950 uppercase border-b border-slate-800 pb-1">
                3. ACTIVITÉS PROGRAMMÉES NON RÉALISÉES
              </h3>
              <p className="text-justify text-[13pt] leading-[1.6]">
                Les contraintes matérielles, budgétaires et institutionnelles documentées depuis le T1 2026 ont continué de peser
                sur l&apos;exécution du programme propre de la DDL au T3. La persistance de ces blocages sur trois trimestres consécutifs
                en aggrave désormais sensiblement l&apos;urgence.
              </p>
              <div className="border border-slate-800 text-[11pt] overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center">
                      <th className="p-2 border border-slate-800 w-8">N°</th>
                      <th className="p-2 border border-slate-800 w-36">Activités Prévues</th>
                      <th className="p-2 border border-slate-800">Contenus / Actions</th>
                      <th className="p-2 border border-slate-800 w-28">Indicateurs</th>
                      <th className="p-2 border border-slate-800 w-20">Exécution</th>
                      <th className="p-2 border border-slate-800 w-44">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1.5 border border-slate-800 text-center font-bold">01</td>
                      <td className="p-1.5 border border-slate-800 font-bold">2ème mission de contrôle qualité des établissements (report cumulé T1-T2-T3)</td>
                      <td className="p-1.5 border border-slate-800">Vérification de la conformité réglementaire ; rédaction des rapports de contrôle ; PV de mise en demeure des établissements non conformes.</td>
                      <td className="p-1.5 border border-slate-800 text-center">2 missions prévues au T1 (PTA 2026)</td>
                      <td className="p-1.5 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-1.5 border border-slate-800">Aucune mission réalisée depuis le T1. Absence persistante de véhicule de service et d&apos;Ordre de Service. — priorité absolue T4 2026.</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-800 text-center font-bold">02</td>
                      <td className="p-1.5 border border-slate-800 font-bold">Formalisation des conventions de partenariat (Globaline, Institut Français, Wing Wah, club hippique)</td>
                      <td className="p-1.5 border border-slate-800">Négociation des termes et engagements ; validation juridique des conventions ; signature et cérémonie de lancement.</td>
                      <td className="p-1.5 border border-slate-800 text-center">Au moins 1 convention signée (cible T1-T3)</td>
                      <td className="p-1.5 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-1.5 border border-slate-800">Les négociations se poursuivent mais aucune signature n&apos;est intervenue au T3. Les résultats de l&apos;enquête (V2) et la Fiche Technique demeurent des arguments disponibles.</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-800 text-center font-bold">03</td>
                      <td className="p-1.5 border border-slate-800 font-bold">Transmission de la note de besoin logistique (véhicule, motos, tablettes)</td>
                      <td className="p-1.5 border border-slate-800">Rédaction d&apos;une note de besoin argumentée et transmission formelle à la hiérarchie (DGL).</td>
                      <td className="p-1.5 border border-slate-800 text-center">1 note de besoin rédigée et transmise</td>
                      <td className="p-1.5 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-1.5 border border-slate-800">La note formelle dédiée n&apos;a toujours pas été rédigée ni transmise au T3. Les besoins restent intégrés dans la Fiche Technique du 17/06/2026.</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-800 text-center font-bold">04</td>
                      <td className="p-1.5 border border-slate-800 font-bold">Activités de loisirs sains avec les établissements scolaires</td>
                      <td className="p-1.5 border border-slate-800">Prise de contact avec les écoles ; organisation de concours de scrabble, matchs interclasses et séances de sensibilisation.</td>
                      <td className="p-1.5 border border-slate-800 text-center">10 écoles engagées ; 4 concours ; 4 matchs</td>
                      <td className="p-1.5 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-1.5 border border-slate-800">Aucun sponsor confirmé, aucune ligne budgétaire débloquée au T3. Report cumulé au T4 2026.</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-800 text-center font-bold">05</td>
                      <td className="p-1.5 border border-slate-800 font-bold">Programme d&apos;initiation au scrabble pour orphelins et enfants vulnérables</td>
                      <td className="p-1.5 border border-slate-800">Identification de structures d&apos;accueil ; acquisition de matériel pédagogique ; organisation de séances hebdomadaires.</td>
                      <td className="p-1.5 border border-slate-800 text-center">30 orphelins bénéficiaires minimum</td>
                      <td className="p-1.5 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-1.5 border border-slate-800">Absence de ligne budgétaire et de partenariats formalisés avec les structures d&apos;accueil. Toujours bloqué au T3.</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-800 text-center font-bold">06</td>
                      <td className="p-1.5 border border-slate-800 font-bold">Activités inclusives pour personnes âgées (randonnées, jeux de société)</td>
                      <td className="p-1.5 border border-slate-800">Identification d&apos;associations de seniors ; organisation de randonnées mensuelles ; séances de jeux et ateliers.</td>
                      <td className="p-1.5 border border-slate-800 text-center">2 randonnées / trimestre</td>
                      <td className="p-1.5 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-1.5 border border-slate-800">Absence de partenariats et de ressources budgétaires. Toujours bloqué au T3.</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-800 text-center font-bold">07</td>
                      <td className="p-1.5 border border-slate-800 font-bold">Note de proposition de simplification des procédures administratives</td>
                      <td className="p-1.5 border border-slate-800">Analyse des blocages actuels ; rédaction d&apos;une note de proposition ; transmission à la DGL et au Cabinet.</td>
                      <td className="p-1.5 border border-slate-800 text-center">1 note transmise et validée</td>
                      <td className="p-1.5 border border-slate-800 text-center font-bold text-red-700">Non exécuté</td>
                      <td className="p-1.5 border border-slate-800">Information continue délivrée aux usagers à l&apos;accueil, mais la note formelle n&apos;a pas été rédigée. Les besoins figurent déjà dans la Fiche Technique. À finaliser au T4.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PAGE A4 4 : 4. PARTICIPATIONS INSTITUTIONNELLES + 5. DIFFICULTÉS + 6. SUGGESTIONS + 7. CONCLUSION */}
          <div className="page-a4 bg-white text-slate-900 p-8 sm:p-12 md:p-14 rounded-xl shadow-2xl max-w-[210mm] mx-auto border border-slate-300 font-garamond leading-relaxed select-text space-y-6">
            <div className="text-[9pt] text-slate-500 italic flex justify-between border-b border-slate-200 pb-1 mb-2">
              <span>DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</span>
              <span>Rapport d&apos;Activités — 3ème Trimestre 2026</span>
            </div>

            {/* 4. ACTIVITÉS PONCTUELLES — PARTICIPATIONS INSTITUTIONNELLES */}
            <div className="space-y-3">
              <h3 className="text-[13pt] font-bold text-slate-950 uppercase border-b border-slate-800 pb-1">
                4. ACTIVITÉS PONCTUELLES — PARTICIPATIONS INSTITUTIONNELLES
              </h3>
              <p className="text-justify text-[13pt] leading-[1.6]">
                La Direction Départementale des Loisirs a assuré une représentation institutionnelle particulièrement soutenue au cours du mois de septembre 2026, avec trois participations officielles en l&apos;espace de trois jours.
              </p>
              <div className="border border-slate-800 text-[11.5pt] overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-center">
                      <th className="p-2.5 border border-slate-800 w-36">DATE / LIEU</th>
                      <th className="p-2.5 border border-slate-800">ACTIVITÉ / ÉVÉNEMENT</th>
                      <th className="p-2.5 border border-slate-800 w-44">RÔLE / PARTICIPATION</th>
                      <th className="p-2.5 border border-slate-800 w-48">CADRE / PATRONAGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 border border-slate-800 text-center font-bold">
                        19/09/2026<br />
                        <span className="font-normal italic text-[10.5pt]">Auditorium du Port Autonome de Pointe-Noire</span>
                      </td>
                      <td className="p-2.5 border border-slate-800 font-semibold">Cérémonie de clôture de la 3ème édition VAC+</td>
                      <td className="p-2.5 border border-slate-800 text-center">Participation officielle de la DDL-PN</td>
                      <td className="p-2.5 border border-slate-800">Haut patronage de Monsieur le Premier Ministre, Chef du Gouvernement</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-800 text-center font-bold">
                        19/09/2026<br />
                        <span className="font-normal italic text-[10.5pt]">Station-Service SCI, Pointe-Noire</span>
                      </td>
                      <td className="p-2.5 border border-slate-800 font-semibold">Cérémonie d&apos;inauguration de la Station-Service de la société SCI</td>
                      <td className="p-2.5 border border-slate-800 text-center">Participation officielle de la DDL-PN</td>
                      <td className="p-2.5 border border-slate-800">Patronage de Monsieur le Ministre des Hydrocarbures</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-800 text-center font-bold">
                        21/09/2026<br />
                        <span className="font-normal italic text-[10.5pt]">Salle de Conférence du Conseil Congolais des Chargeurs</span>
                      </td>
                      <td className="p-2.5 border border-slate-800 font-semibold">
                        Conférence-débat : Campagne Nationale de Sensibilisation sur le Civisme, la Citoyenneté et la Paix
                      </td>
                      <td className="p-2.5 border border-slate-800 text-center">Participation officielle de la DDL-PN</td>
                      <td className="p-2.5 border border-slate-800">Patronage de Monsieur le Ministre délégué chargé de la Jeunesse et de l&apos;Éducation Civique</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-justify text-[12.5pt] leading-[1.6] italic">
                Cette densité d&apos;invitations officielles sur un même mois confirme la place institutionnelle désormais acquise par la DDL-PN au sein du dispositif départemental, dans la continuité de la dynamique amorcée aux deux premiers trimestres de l&apos;année.
              </p>
            </div>

            {/* 5. DIFFICULTÉS RENCONTRÉES */}
            <div className="space-y-2 pt-2">
              <h3 className="text-[13pt] font-bold text-slate-950 uppercase border-b border-slate-800 pb-1">
                5. DIFFICULTÉS RENCONTRÉES
              </h3>
              <p className="text-justify text-[13pt] leading-[1.6]">
                Les obstacles structurels identifiés dès le rapport du premier trimestre 2026 ont continué de peser, sans évolution favorable, sur l&apos;exécution du programme propre de la DDL au cours du T3 2026 :
              </p>
              <div className="space-y-2 text-[12.5pt] leading-[1.55] pl-2">
                <p>
                  <strong>1. Absence persistante de moyens logistiques :</strong> Le défaut de véhicule de service et de motos a continué de paralyser les missions de contrôle autonomes. La 2ème mission de contrôle qualité, déjà reportée aux T1 et T2, n&apos;a pu être réalisée au T3.
                </p>
                <p>
                  <strong>2. Insuffisance budgétaire chronique :</strong> Aucune ligne budgétaire opérationnelle n&apos;a été débloquée au T3 2026, reconduisant la situation des deux trimestres précédents. L&apos;ensemble des activités à fort impact social demeure bloqué faute de ressources financières propres.
                </p>
                <p>
                  <strong>3. Partenariats stratégiques toujours non formalisés :</strong> Malgré la poursuite des négociations, les conventions avec les partenaires identifiés depuis 2025 (Globaline, Institut Français de Pointe-Noire, Wing Wah, club hippique) n&apos;ont toujours pas été signées au terme du T3.
                </p>
                <p>
                  <strong>4. Complexité administrative persistante :</strong> Le nombre élevé de pièces exigées pour l&apos;obtention des autorisations d&apos;exploitation continue de décourager les opérateurs.
                </p>
                <p>
                  <strong>5. Locaux inadaptés :</strong> Les conditions de travail demeurent inchangées : absence de bureau individuel pour le Directeur Départemental, absence d&apos;espaces de travail distincts par service, confidentialité et accueil du public non assurés.
                </p>
              </div>
            </div>

            {/* 6. SUGGESTIONS POUR LE QUATRIÈME TRIMESTRE 2026 */}
            <div className="space-y-2 pt-2">
              <h3 className="text-[13pt] font-bold text-slate-950 uppercase border-b border-slate-800 pb-1">
                6. SUGGESTIONS POUR LE QUATRIÈME TRIMESTRE 2026
              </h3>
              <div className="space-y-2 text-[12.5pt] leading-[1.55] pl-2">
                <p><strong>I. Obtenir un arbitrage formel sur la Fiche Technique des manques :</strong> Remettre sans délai la Fiche Technique à Monsieur le Ministre dès son arrivée à Pointe-Noire.</p>
                <p><strong>II. Rédiger et transmettre la note de besoin logistique formelle :</strong> Formaliser une note de besoin logistique autonome adressée à la DGL selon la voie hiérarchique classique.</p>
                <p><strong>III. Conclure au moins une convention de partenariat :</strong> Viser la signature effective d&apos;au moins une convention dès le T4 2026.</p>
                <p><strong>IV. Réaliser la 2ème mission de contrôle qualité en priorité absolue :</strong> Solliciter sans délai un nouvel Ordre de Service préfectoral.</p>
                <p><strong>V. Finaliser les TDR et structurer l&apos;animation de la page Facebook :</strong> Mettre en place un calendrier éditorial régulier.</p>
                <p><strong>VI. Renforcer la coordination interservices et avec les mairies :</strong> Mettre en place la Commission Interservices de Coordination des Loisirs (DDL, DDAT, Sapeurs-Pompiers, Hygiène, Police, Impôts).</p>
              </div>
            </div>

            {/* 7. CONCLUSION */}
            <div className="space-y-3 pt-3">
              <h3 className="text-[13pt] font-bold text-slate-950 uppercase border-b border-slate-800 pb-1">
                7. CONCLUSION
              </h3>
              <p className="text-justify text-[13pt] leading-[1.6]">
                Le troisième trimestre 2026 s&apos;achève sur un bilan contrasté, dans la continuité directe des deux trimestres précédents. D&apos;un côté, les contraintes structurelles se sont reconduites sans évolution favorable. De l&apos;autre, la DDL-PN a continué d&apos;affirmer sa place institutionnelle avec une représentation soutenue à trois événements officiels de premier plan en septembre et le lancement de sa page Facebook officielle.
              </p>
              <p className="text-justify text-[13pt] leading-[1.6]">
                Le quatrième trimestre 2026 devra être celui de la transformation du plaidoyer en décision. La DDL a démontré sa capacité à assurer sa mission institutionnelle et à documenter rigoureusement ses contraintes ; il appartient désormais aux autorités de tutelle de transformer ce plaidoyer en moyens d&apos;action.
              </p>

              {/* Signature block */}
              <div className="pt-8 flex justify-end">
                <div className="text-center w-80 space-y-16">
                  <p className="text-[12pt] italic">Fait à Pointe-Noire, le 23 septembre 2026</p>
                  <div>
                    <p className="font-bold text-[12.5pt] text-slate-950">
                      Le Directeur départemental des Loisirs
                    </p>
                    <p className="font-bold text-[13.5pt] uppercase text-slate-950 tracking-wide mt-12 underline underline-offset-4 decoration-1">
                      Jean Richard NTSEKE NGOUAKA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2 : SYNTHÈSE DU RAPPORT (PAGES 12-13 DU PDF) */}
      {viewTab === 'synthese' && (
        <div className="page-a4 bg-white text-slate-900 p-8 sm:p-14 md:p-16 rounded-xl shadow-2xl max-w-[210mm] mx-auto border border-slate-300 font-garamond leading-relaxed select-text space-y-6">
          <div className="text-[9pt] text-slate-500 italic flex justify-between border-b border-slate-200 pb-1 mb-2">
            <span>DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</span>
            <span>Rapport d&apos;Activités — 3ème Trimestre 2026</span>
          </div>

          <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
            <h2 className="font-bold text-[15pt] uppercase tracking-wider text-slate-950">
              SYNTHÈSE DU RAPPORT
            </h2>
            <p className="italic text-[13pt] text-slate-800">
              Rapport d&apos;Activités du Troisième Trimestre 2026 — DDL-PN
            </p>
          </div>

          <div className="space-y-4 text-[13pt] leading-[1.65]">
            <div>
              <h4 className="font-bold text-[13.5pt] text-blue-900 mb-1">Vue d&apos;ensemble</h4>
              <p className="text-justify">
                Le troisième trimestre 2026 (juillet-septembre) confirme la trajectoire amorcée aux T1 et T2 :
                une Direction qui assume pleinement sa mission institutionnelle malgré l&apos;absence persistante de
                moyens matériels et budgétaires. Le trimestre a été dominé par une charge de représentation
                exceptionnelle en septembre — trois cérémonies officielles en trois jours — et par le lancement de
                la page Facebook de la DDL-PN, premier jalon de communication numérique de la Direction.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[13.5pt] text-emerald-900 mb-1">Acquis du trimestre</h4>
              <ul className="list-disc pl-6 space-y-1 text-justify">
                <li>
                  <strong>Représentation institutionnelle assurée à trois cérémonies officielles</strong> de premier plan en septembre 2026 : clôture de VAC+ (patronage du Premier Ministre), inauguration de la station-service SCI (patronage du Ministre des Hydrocarbures) et conférence-débat sur le civisme et la citoyenneté (patronage du Ministre délégué à la Jeunesse).
                </li>
                <li>
                  <strong>Lancement de la page Facebook officielle de la DDL-PN</strong> par le service Promotion et Animation, en vue d&apos;une meilleure visibilité institutionnelle auprès du public de la ville.
                </li>
                <li>
                  <strong>Continuité assurée de la gestion administrative courante</strong> (SAFM) et de l&apos;accueil/information des usagers (Service de l&apos;Autorisation).
                </li>
                <li>
                  <strong>Maintien en état de la Fiche Technique des manques et besoins</strong>, toujours tenue prête pour remise à Monsieur le Ministre.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[13.5pt] text-red-900 mb-1">Points de blocage persistants (reportés depuis le T1)</h4>
              <ul className="list-disc pl-6 space-y-1 text-justify">
                <li>
                  <strong>2ème mission de contrôle qualité des établissements :</strong> toujours non réalisée, faute de véhicule et d&apos;Ordre de Service préfectoral — report cumulé sur trois trimestres.
                </li>
                <li>
                  <strong>Conventions de partenariat</strong> (Globaline, Institut Français, Wing Wah, club hippique) : toujours en négociation, aucune signature.
                </li>
                <li>
                  <strong>Note de besoin logistique formelle :</strong> toujours non transmise distinctement à la DGL.
                </li>
                <li>
                  <strong>Activités de loisirs sains</strong> (écoles, orphelins, seniors) : toujours bloquées faute de ligne budgétaire.
                </li>
                <li>
                  <strong>Fiche Technique des manques :</strong> toujours pas remise, la visite de Monsieur le Ministre à Pointe-Noire n&apos;ayant pas encore eu lieu.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[13.5pt] text-amber-900 mb-1">Priorités pour le T4 2026</h4>
              <ul className="list-disc pl-6 space-y-1 text-justify">
                <li>Remettre sans délai la Fiche Technique à Monsieur le Ministre dès son arrivée à Pointe-Noire, et obtenir un arbitrage formel sur le tableau des besoins prioritaires.</li>
                <li>Rédiger et transmettre la note de besoin logistique formelle à la DGL, selon la voie hiérarchique classique.</li>
                <li>Conclure au moins une convention de partenariat stratégique.</li>
                <li>Réaliser en priorité absolue la 2ème mission de contrôle qualité, reportée depuis trois trimestres consécutifs.</li>
                <li>Finaliser les TDR de la page Facebook et structurer un calendrier éditorial régulier.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border-l-4 border-slate-900 italic text-[12.5pt] leading-relaxed mt-6">
              « La DDL-PN a démontré, pour le troisième trimestre consécutif, sa capacité à assurer sa mission institutionnelle et à documenter rigoureusement ses contraintes ; il appartient désormais à la hiérarchie de transformer ce plaidoyer cumulé en moyens d&apos;action concrets. »
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3 : INDICATEURS & CHIFFRES CLÉS */}
      {viewTab === 'indicateurs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
              <span className="text-[11px] font-semibold text-slate-400">Recettes Encaissées Régie</span>
              <p className="font-mono text-xl font-bold text-emerald-400">{formatCfa(totalRecettes)}</p>
              <span className="text-[10px] text-slate-500">Comptabilité SAF Trésor</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
              <span className="text-[11px] font-semibold text-slate-400">Établissements Recensés</span>
              <p className="font-mono text-xl font-bold text-blue-400">{totalEtablissements}</p>
              <span className="text-[10px] text-slate-500">6 Arrondissements de Pointe-Noire</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
              <span className="text-[11px] font-semibold text-slate-400">Mises en Demeure Notifiées</span>
              <p className="font-mono text-xl font-bold text-amber-400">{totalMisesEnDemeure}</p>
              <span className="text-[10px] text-slate-500">Police administrative sonore 65 dB(A)</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow">
              <span className="text-[11px] font-semibold text-slate-400">Représentations Officielles T3</span>
              <p className="font-mono text-xl font-bold text-purple-400">3 Ministères</p>
              <span className="text-[10px] text-slate-500">Premier Ministre, Hydrocarbures, Jeunesse</span>
            </div>
          </div>

          {/* Tableau Répartition Arrondissements */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Répartition Territoriale des Établissements & Recettes (Pointe-Noire)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Arrondissement</th>
                    <th className="p-2.5 text-center">Établissements Recensés</th>
                    <th className="p-2.5 text-right">Recettes Acquittées SAF</th>
                    <th className="p-2.5 text-right">Part Régionale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {repartitionArrondissements.map((row) => (
                    <tr key={row.nom} className="hover:bg-slate-800/40 text-slate-200">
                      <td className="p-2.5 font-bold">{row.nom}</td>
                      <td className="p-2.5 text-center font-mono">{row.nombre}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-400">{formatCfa(row.montant)}</td>
                      <td className="p-2.5 text-right font-mono text-slate-400">
                        {totalRecettes > 0 ? ((row.montant / totalRecettes) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
