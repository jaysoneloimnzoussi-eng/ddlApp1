import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  FileCheck,
  Building,
  Printer,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  Mail,
  ExternalLink,
  Download,
  Eye,
  PenTool,
} from 'lucide-react';
import { SoitTransmisDgl } from '../../types';
import { formatCfa } from '../../services/crypto';
import { OfficialDocumentHeader } from '../common/OfficialDocumentHeader';
import { printHtmlElement } from '../../services/printService';
import {
  generateTransmissionLetterDocx,
  generateBordereauSoitTransmisDocx,
} from '../../services/docxGenerator';

export const TransmissionDglModule: React.FC = () => {
  const { soitTransmis, createSoitTransmis, establishments, showNotification, setActiveModule } = useApp();

  const [activeTab, setActiveTab] = useState<'lettre_transmission' | 'bordereau'>('lettre_transmission');
  const [selectedBordereau, setSelectedBordereau] = useState<SoitTransmisDgl>(
    soitTransmis[0] || null
  );

  // Sub-view in bordereau tab: printable A4 view vs tracker view
  const [bordereauViewMode, setBordereauViewMode] = useState<'document_a4' | 'tableau_suivi'>('document_a4');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEstIds, setSelectedEstIds] = useState<string[]>([]);
  const [observations, setObservations] = useState(
    'Dossiers entièrement régularisés au niveau départemental avec quittances SAF et contrôles acoustiques conformes.'
  );

  // Eligible establishments (with status 'en_regle' or 'attestation_provisoire')
  const eligibleEsts = establishments.filter(
    (e) => e.statut === 'en_regle' || e.statut === 'attestation_provisoire'
  );

  const handleToggleEst = (id: string) => {
    setSelectedEstIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateBordereau = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEstIds.length === 0) {
      showNotification('warning', "Veuillez sélectionner au moins un dossier d'établissement.");
      return;
    }

    const items = selectedEstIds.map((id) => {
      const est = establishments.find((x) => x.id === id)!;
      return {
        etablissementNom: est.nomCommercial,
        promoteurNom: est.promoteurNom,
        arrondissement: est.arrondissement,
        montantRegieAcquitte: est.montantEncaisse,
        referenceDossier: est.codeDossier,
      };
    });

    const newBT = await createSoitTransmis({
      dateTransmission: new Date().toISOString().substring(0, 10),
      nombreDossiers: items.length,
      listeEtablissements: items,
      statut: 'prepare',
      signataireDepartemental: 'Directeur Départemental des Loisirs',
      observations,
    });

    setSelectedBordereau(newBT);
    setIsModalOpen(false);
    setSelectedEstIds([]);
    showNotification('success', `Nouveau Bordereau ${newBT.numeroBordereau} généré avec succès.`);
  };

  // Actions d'impression
  const handlePrintCurrentDocument = () => {
    if (activeTab === 'lettre_transmission') {
      printHtmlElement('printable-lettre-transmission', 'Lettre_Transmission_N035_DDL_PN');
    } else {
      printHtmlElement('printable-soit-transmis', `Soit_Transmis_${selectedBordereau?.numeroBordereau || 'DDL_PN'}`);
    }
  };

  // Actions d'export Word DOCX
  const handleDownloadLettreWord = async () => {
    try {
      await generateTransmissionLetterDocx({
        numeroActe: 'N°035/MCAPNIT/DGL/DPN/DDL-PN',
        dateLieu: 'Pointe-Noire, le 06 octobre 2026',
        destinataireTitre: 'Madame la Directrice Générale des Loisirs',
        destinataireVille: 'Brazzaville',
        objet: "Transmission du Rapport d'Activités du 3ème Trimestre 2026.",
        reference: 'N°033/MCAPNIT/DGL/DPN/DDL-PN du 23 septembre 2026.',
        signataireNom: 'Jean Richard NTSEKE NGOUAKA',
        pieceJointe: "Rapport d'Activités du 3ème Trimestre 2026.",
      });
      showNotification('success', 'Lettre de transmission exportée en Word (.docx) avec succès !');
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'exportation Word : ${err.message}`);
    }
  };

  const handleDownloadBordereauWord = async () => {
    if (!selectedBordereau) return;
    try {
      await generateBordereauSoitTransmisDocx({
        numeroBordereau: selectedBordereau.numeroBordereau,
        dateTransmission: selectedBordereau.dateTransmission,
        listeEtablissements: selectedBordereau.listeEtablissements,
        observations: selectedBordereau.observations,
      });
      showNotification('success', `Bordereau ${selectedBordereau.numeroBordereau} exporté en Word (.docx) avec succès !`);
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'exportation Word : ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title & Global Action Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-09
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Courriers & Transmissions DGL Brazzaville
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Liaison hiérarchique officielle entre Pointe-Noire et la Direction Générale des Loisirs (Lettre de transmission, Bordereaux Soit-Transmis & Canva Admin)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Nouveau Canva de Rédaction Rapide */}
          <button
            onClick={() => setActiveModule('MOD-19')}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Ouvrir le Canva pour rédiger tout type de document officiel avec l'en-tête"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Canva Rédaction Admin (MOD-19)</span>
          </button>

          {/* Bouton Téléchargement Word */}
          {activeTab === 'lettre_transmission' ? (
            <button
              onClick={handleDownloadLettreWord}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Télécharger la lettre au format Microsoft Word .docx pour d'éventuels réajustements"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger Word (.docx)</span>
            </button>
          ) : (
            <button
              onClick={handleDownloadBordereauWord}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Télécharger le bordereau au format Microsoft Word .docx pour d'éventuels réajustements"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger Word (.docx)</span>
            </button>
          )}

          {/* Bouton Impression A4 */}
          <button
            onClick={handlePrintCurrentDocument}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Imprimer le document officiel au format A4 avec les marges réglementaires"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Document A4</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="no-print flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('lettre_transmission')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'lettre_transmission'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Lettre de Transmission N°035 (Modèle Officiel Garamond 13)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">Conforme PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('bordereau')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'bordereau'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Bordereaux Soit-Transmis (A4 Officiel & Dossiers)</span>
        </button>
      </div>

      {/* TAB 1: LETTRE DE TRANSMISSION OFFICIELLE PROTOTYPE CONFORME AU PDF */}
      {activeTab === 'lettre_transmission' && (
        <div className="space-y-4">
          {/* Quick Notice */}
          <div className="no-print p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Document Conforme :</strong> Lettre officielle{' '}
                <code className="text-emerald-200 font-mono font-bold">N°035/MCAPNIT/DGL/DPN/DDL-PN</code> avec police Garamond 13, en-tête réglementaire et marges officielles (Gauche 2.5cm, Droite 2.0cm, Haut/Bas 2.0cm).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadLettreWord}
                className="px-2.5 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Télécharger .DOCX</span>
              </button>
              <button
                onClick={() => setActiveModule('MOD-06')}
                className="text-xs font-bold underline flex items-center gap-1 hover:text-emerald-100 cursor-pointer"
              >
                <span>Voir Rapport T3 (MOD-06)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document A4 Garamond 13 Page (ID pour impression isolée et fidèle) */}
          <div
            id="printable-lettre-transmission"
            className="page-a4 bg-white text-slate-900 rounded-xl shadow-2xl max-w-[210mm] mx-auto border border-slate-300 font-garamond leading-relaxed select-text"
            style={{ padding: '20mm 20mm 20mm 25mm' }}
          >
            {/* Authentic 2-Column Administrative Header */}
            <OfficialDocumentHeader
              numeroActe="N°035/MCAPNIT/DGL/DPN/DDL-PN"
              emetteurTitre="Le Directeur Départemental des Loisirs de Pointe-Noire"
              destinataireTitre="Madame la Directrice Générale des Loisirs"
              destinataireVille="Brazzaville"
              showDestinataire={true}
              dateLieu="Pointe-Noire, le 06 octobre 2026"
              objet="Transmission du Rapport d'Activités du 3ème Trimestre 2026."
              reference="N°033/MCAPNIT/DGL/DPN/DDL-PN du 23 septembre 2026."
            />

            {/* Letter Body in Garamond 13 */}
            <div className="mt-10 text-[13pt] leading-[1.65] space-y-6 text-justify">
              <p className="font-medium text-left">
                Madame la Directrice Générale,
              </p>

              <p style={{ textIndent: '1.5cm' }}>
                J&apos;ai l&apos;honneur de vous transmettre, ci-joint, le Rapport d&apos;Activités du troisième trimestre
                2026 de la Direction Départementale des Loisirs de Pointe-Noire, couvrant la période du 1er
                juillet au 30 septembre 2026.
              </p>

              <p style={{ textIndent: '1.5cm' }}>
                Veuillez agréer, Madame la Directrice Générale, l&apos;expression de ma considération
                distinguée.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-16 mr-6 flex flex-col items-end text-center">
              <div className="w-80 space-y-20">
                <p className="font-bold text-[12.5pt] text-slate-950">
                  Le Directeur Départemental des Loisirs de Pointe-Noire
                </p>
                <div>
                  <p className="font-bold text-[13.5pt] uppercase text-slate-950 tracking-wide underline underline-offset-4 decoration-1">
                    Jean Richard NTSEKE NGOUAKA
                  </p>
                </div>
              </div>
            </div>

            {/* Pièce jointe en bas à gauche */}
            <div className="mt-14 pt-4 border-t border-slate-200/80 text-[11.5pt] text-slate-800 italic">
              <span className="font-bold not-italic">Pièce jointe : </span>
              <span>Rapport d&apos;Activités du 3ème Trimestre 2026.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BORDEREAUX SOIT-TRANSMIS DGL */}
      {activeTab === 'bordereau' && (
        <div className="space-y-4">
          {/* Sub-bar : Selector & Actions */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Mode d&apos;affichage :</span>
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setBordereauViewMode('document_a4')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    bordereauViewMode === 'document_a4'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Document A4 Officiel Imprimable (Garamond 13)</span>
                </button>
                <button
                  onClick={() => setBordereauViewMode('tableau_suivi')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    bordereauViewMode === 'tableau_suivi'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Gestion & Suivi des Envois</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadBordereauWord}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                title="Télécharger ce bordereau en format Word .docx"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger .DOCX</span>
              </button>
              <button
                onClick={handlePrintCurrentDocument}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                title="Imprimer le bordereau en A4 vectoriel"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer le Soit-Transmis A4</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nouveau Bordereau</span>
              </button>
            </div>
          </div>

          {/* VUE 1 : DOCUMENT A4 OFFICIEL IMPRIMABLE (RÉPOND STRICTEMENT À LA DEMANDE DE L'UTILISATEUR) */}
          {bordereauViewMode === 'document_a4' && (
            <div className="space-y-4">
              {/* Notice */}
              <div className="no-print p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 text-xs flex items-center justify-between text-blue-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <strong>Bordereau Officiel A4 :</strong> Présentation conforme aux normes de la République du Congo pour transmission des dossiers à la DGL Brazzaville. Marges réglementaires appliquées.
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-blue-200">
                  {selectedBordereau?.numeroBordereau}
                </span>
              </div>

              {selectedBordereau ? (
                <div
                  id="printable-soit-transmis"
                  className="page-a4 bg-white text-slate-900 rounded-xl shadow-2xl max-w-[210mm] mx-auto border border-slate-300 font-garamond leading-relaxed select-text"
                  style={{ padding: '20mm 20mm 20mm 25mm' }}
                >
                  {/* En-tête officiel 2 colonnes */}
                  <OfficialDocumentHeader
                    numeroActe={`Bordereau ${selectedBordereau.numeroBordereau}`}
                    dateLieu={`Pointe-Noire, le ${selectedBordereau.dateTransmission}`}
                  />

                  {/* Suscription de transmission */}
                  <div className="flex justify-end mt-4 mb-6">
                    <div className="w-72 text-center text-[12pt] leading-snug space-y-1">
                      <p className="italic font-medium">Bordereau d&apos;envoi transmis à :</p>
                      <p className="font-bold text-[12.5pt]">
                        Madame la Directrice Générale des Loisirs
                      </p>
                      <p className="italic font-medium text-slate-800">
                        Brazzaville
                      </p>
                    </div>
                  </div>

                  {/* Titre central */}
                  <div className="text-center my-6 py-2 border-y-2 border-slate-900 bg-slate-50/60">
                    <h2 className="font-bold text-[14pt] uppercase tracking-wider text-slate-950">
                      BORDEREAU D&apos;ENVOI (SOIT-TRANSMIS)
                    </h2>
                    <p className="font-mono text-[11.5pt] font-bold text-slate-800 mt-0.5">
                      N° {selectedBordereau.numeroBordereau}
                    </p>
                  </div>

                  {/* Objet & Destination */}
                  <div className="text-[12.5pt] space-y-1 mb-6">
                    <p>
                      <span className="font-bold">Objet : </span>
                      <span>Transmission de dossiers techniques pour instruction et délivrance de l&apos;Agrément Ministériel Définitif.</span>
                    </p>
                    <p>
                      <span className="font-bold">Nombre de dossiers transmis : </span>
                      <span className="font-bold underline">{selectedBordereau.nombreDossiers} dossier(s)</span>
                    </p>
                  </div>

                  {/* Tableau officiel des pièces transmises */}
                  <div className="border border-slate-800 text-[11.5pt] mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-800 text-center">
                          <th className="p-2 border border-slate-800 w-12">N°</th>
                          <th className="p-2 border border-slate-800 w-36">Réf. Dossier</th>
                          <th className="p-2 border border-slate-800">Établissement & Promoteur</th>
                          <th className="p-2 border border-slate-800 w-32">Arrondissement</th>
                          <th className="p-2 border border-slate-800 w-36 text-right">Recette SAF Acquittée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBordereau.listeEtablissements.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-800 last:border-0">
                            <td className="p-2 border border-slate-800 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 border border-slate-800 font-mono text-[10.5pt]">{item.referenceDossier}</td>
                            <td className="p-2 border border-slate-800">
                              <span className="font-bold">{item.etablissementNom}</span>
                              <br />
                              <span className="text-[10.5pt] text-slate-700">Promoteur : {item.promoteurNom}</span>
                            </td>
                            <td className="p-2 border border-slate-800 text-center">{item.arrondissement}</td>
                            <td className="p-2 border border-slate-800 text-right font-mono font-bold text-slate-900">
                              {formatCfa(item.montantRegieAcquitte)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes / Observations administratives */}
                  {selectedBordereau.observations && (
                    <div className="text-[12pt] p-3 border border-slate-300 bg-slate-50 rounded mb-8">
                      <p className="font-bold text-slate-900 mb-0.5">Observations administratives :</p>
                      <p className="italic text-slate-800">{selectedBordereau.observations}</p>
                    </div>
                  )}

                  {/* Bloc signature officielle */}
                  <div className="mt-12 flex justify-between items-end pt-4">
                    <div className="text-left text-[11pt] space-y-1">
                      <p className="font-bold">Pour attribution :</p>
                      <p className="italic text-slate-700">Direction Générale des Loisirs (Brazzaville)</p>
                      <p className="text-[10pt] text-slate-600">Reçu le : ___________________</p>
                    </div>

                    <div className="text-center w-80 space-y-16">
                      <p className="font-bold text-[12pt] text-slate-950">
                        Le Directeur Départemental des Loisirs de Pointe-Noire
                      </p>
                      <div>
                        <p className="font-bold text-[13.5pt] uppercase text-slate-950 tracking-wide underline underline-offset-4 decoration-1">
                          Jean Richard NTSEKE NGOUAKA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  Sélectionnez un bordereau pour afficher le document A4 officiel.
                </div>
              )}
            </div>
          )}

          {/* VUE 2 : TABLEAU DE BORD DE SUIVI DGL */}
          {bordereauViewMode === 'tableau_suivi' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Liste des Bordereaux (4 colonnes) */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Historique des Envois ({soitTransmis.length})</span>
                </h2>

                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {soitTransmis.map((bt) => {
                    const isSelected = selectedBordereau?.id === bt.id;
                    return (
                      <button
                        key={bt.id}
                        onClick={() => setSelectedBordereau(bt)}
                        className={`w-full text-left p-3 rounded-lg border transition space-y-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 text-slate-100'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {bt.numeroBordereau}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                              bt.statut === 'agrement_signe'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : bt.statut === 'recu_brazzaville'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {bt.statut.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-medium">
                          {bt.nombreDossiers} dossiers transmis
                        </p>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                          <span>Date: {bt.dateTransmission}</span>
                          <span>Signé: DDL-PN</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Détail du Bordereau sélectionné (8 colonnes) */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                {selectedBordereau ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-slate-100 font-mono">
                          {selectedBordereau.numeroBordereau}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Transmis le {selectedBordereau.dateTransmission} à la DGL Brazzaville
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setBordereauViewMode('document_a4')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Voir Page A4 Officielle</span>
                        </button>
                      </div>
                    </div>

                    {/* Status progression bar */}
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-200">1. Transmis de Pointe-Noire</span>
                      </div>
                      <span className="text-slate-500">&rarr;</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedBordereau.statut === 'recu_brazzaville' || selectedBordereau.statut === 'agrement_signe' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <span className="font-semibold text-slate-200">2. Réceptionné à Brazzaville</span>
                      </div>
                      <span className="text-slate-500">&rarr;</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedBordereau.statut === 'agrement_signe' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <span className="font-semibold text-slate-200">3. Agrément Ministériel Délivré</span>
                      </div>
                    </div>

                    {/* Tableau des établissements inclus */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Dossiers Inclus dans ce Bordereau ({selectedBordereau.listeEtablissements.length})
                      </h4>
                      <div className="border border-slate-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left min-w-[550px]">
                            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                              <tr>
                                <th className="p-2.5">Réf. Dossier</th>
                                <th className="p-2.5">Établissement</th>
                                <th className="p-2.5">Promoteur</th>
                                <th className="p-2.5">Arrondissement</th>
                                <th className="p-2.5 text-right">Recette Acquittée</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {selectedBordereau.listeEtablissements.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40 text-slate-200">
                                  <td className="p-2.5 font-mono text-[11px] text-slate-400">{item.referenceDossier}</td>
                                  <td className="p-2.5 font-bold">{item.etablissementNom}</td>
                                  <td className="p-2.5">{item.promoteurNom}</td>
                                  <td className="p-2.5">{item.arrondissement}</td>
                                  <td className="p-2.5 text-right font-mono text-emerald-400 font-semibold">
                                    {formatCfa(item.montantRegieAcquitte)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {selectedBordereau.observations && (
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                        <span className="font-semibold text-slate-400 block">Notes administratives :</span>
                        <p className="text-slate-300 italic">{selectedBordereau.observations}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-12">
                    Sélectionnez un bordereau pour afficher les détails.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Nouveau Bordereau */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-cinzel">
              <Send className="w-5 h-5 text-emerald-400" />
              Créer un Bordereau Soit-Transmis vers Brazzaville
            </h2>

            <form onSubmit={handleCreateBordereau} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-2">
                  Sélectionner les dossiers régularisés à expédier ({selectedEstIds.length} sélectionnés)
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950">
                  {eligibleEsts.map((est) => (
                    <label
                      key={est.id}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEstIds.includes(est.id)}
                        onChange={() => handleToggleEst(est.id)}
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                      />
                      <div className="flex-1 text-slate-200">
                        <span className="font-bold">{est.nomCommercial}</span> ({est.arrondissement}) —{' '}
                        <span className="font-mono text-emerald-400">{formatCfa(est.montantEncaisse)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Observations d&apos;accompagnement</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  Générer le Bordereau Officiel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
