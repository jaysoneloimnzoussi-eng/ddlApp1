import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from './DdlLogo';
import { X, Printer, Download, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { generateAttestationDocx, generateLegalActDocx, generateUniversalAdministrativeDocx } from '../../services/docxGenerator';
import { printHtmlElement } from '../../services/printService';
import { OfficialDocumentHeader } from './OfficialDocumentHeader';
import { formatCfa } from '../../services/crypto';
import { generateReceiptQrCode, generateLegalActQrCode, generateAttestationQrCode } from '../../services/qrService';

export const PrintModal: React.FC = () => {
  const { printMode, printData, closePrintModal } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!printData) return;

    const loadQr = async () => {
      try {
        let url = '';
        if (printMode === 'pos_receipt') {
          url = await generateReceiptQrCode(printData);
        } else if (printMode === 'a4_attestation') {
          url = await generateAttestationQrCode({
            referenceNumero: printData.numeroAttestation
              ? `N°${printData.numeroAttestation}/MCAPNIT/DGL/DPN/DDL-PN/2026`
              : (printData.codeDossier || 'N°042/MCAPNIT/DGL/DPN/DDL-PN/2026'),
            etablissementNom: printData.nomCommercial || 'LE ROCHER',
            promoteurNom: printData.promoteurNom || 'Monsieur Jack MATOKO',
            dateDepot: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
            codeDossier: printData.codeDossier || 'DDL-PN-2026-REC-042',
            statut: printData.statut || 'CONFORME ET REGULIER',
          });
        } else if (printMode === 'a4_legal_act') {
          url = await generateLegalActQrCode(
            printData.referenceNumero || 'ACTE-2026',
            printData.etablissementNom || '',
            printData.documentHash || ''
          );
        }
        if (isMounted) setQrCodeUrl(url);
      } catch (err) {
        console.warn('QR Code load error:', err);
      }
    };


    loadQr();
    return () => {
      isMounted = false;
    };
  }, [printMode, printData]);

  if (printMode === 'none' || !printData) return null;

  const handlePrint = () => {
    let docTitle = 'Document_Officiel_DDL_PN';
    if (printMode === 'a4_attestation') docTitle = `Attestation_${printData.codeDossier || 'DDL_PN'}`;
    else if (printMode === 'a4_legal_act') docTitle = `Acte_${printData.referenceNumero || 'DDL_PN'}`;
    else if (printMode === 'pos_receipt') docTitle = `Quittance_${printData.numeroQuittance || 'DDL_PN'}`;
    else if (printMode === 'staff_badge') docTitle = `Badge_${printData.matricule || 'Agent'}`;
    else if (printMode === 'spa_diploma') docTitle = `Diplome_${printData.nomCommercial || 'DDL_PN'}`;

    printHtmlElement('printable-modal-doc', docTitle);
  };

  const handleDownloadDocx = async () => {
    if (printMode === 'a4_attestation') {
      await generateAttestationDocx(printData);
    } else if (printMode === 'a4_legal_act') {
      await generateLegalActDocx(printData);
    } else if (printMode === 'spa_diploma') {
      await generateUniversalAdministrativeDocx({
        titreActe: "DIPLÔME D'HONNEUR DU CIVISME ACOUSTIQUE",
        numeroActe: `DIP-2026-${printData.codeDossier || 'DDL'}`,
        dateLieu: 'Pointe-Noire, le 08 octobre 2026',
        destinataireTitre: `Décerné à l'établissement : ${printData.nomCommercial}`,
        destinataireVille: printData.arrondissement || 'Pointe-Noire',
        sections: [
          {
            titre: 'DISTINCTION OFFICIELLE DDL-PN',
            contenu: `En reconnaissance de son civisme exemplaire, de sa conformité acoustique stricte à la Loi N° 21-2019 (< 65 dB(A)) et de sa contribution active à la tranquillité publique et à la salubrité environnementale du Département de Pointe-Noire.`,
          },
        ],
        signataireNom: 'Jean Richard NTSEKE NGOUAKA',
        signataireTitre: 'Le Directeur Départemental des Loisirs',
        margeGaucheCm: 2.5,
        margeDroiteCm: 2.0,
        margeHautCm: 2.0,
        margeBasCm: 2.0,
      });
    }
  };

  const canDownloadDocx = printMode === 'a4_attestation' || printMode === 'a4_legal_act' || printMode === 'spa_diploma';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Toolbar (hidden during actual browser print) */}
        <div className="no-print p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-cinzel text-base font-bold text-slate-100">
              {printMode === 'a4_attestation' && "Attestation Provisoire de Dépôt (A4 Officiel)"}
              {printMode === 'pos_receipt' && "Quittance de Caisse Thermique POS (58mm)"}
              {printMode === 'a4_legal_act' && `Acte de Police Administrative (${printData.referenceNumero})`}
              {printMode === 'staff_badge' && "Carte Professionnelle & Badge d'Inspecteur SAA"}
              {printMode === 'spa_diploma' && "Diplôme d'Honneur Départemental (Loisirs Sains)"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {canDownloadDocx && (
              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                title="Télécharger le fichier éditable Word .DOCX"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger .DOCX (Word)</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md transition cursor-pointer"
              title="Lancer l'impression vectorielle A4 avec mise en page et marges réglementaires"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={closePrintModal}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-950/60">
          <div id="printable-modal-doc" className="w-full flex justify-center">
          {/* 1. ATTESTATION DE DÉPÔT A4 OFFICIELLE */}
          {printMode === 'a4_attestation' && (
            <div className="page-a4 bg-white text-slate-950 p-8 md:p-12 rounded shadow-2xl max-w-[210mm] w-full border border-slate-300 font-garamond leading-relaxed text-[13pt]">
              {/* En-tête officiel centré avec QR Code en haut à droite sous la devise */}
              <OfficialDocumentHeader
                numeroActe={printData.numeroAttestation ? `N° ${printData.numeroAttestation}/MCAPNIT/DGL/DPN/DDL-PN` : undefined}
                dateLieu={`Pointe-Noire, le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
                qrCodeUrl={qrCodeUrl}
                className="mb-6"
              />

              {/* Title en police officielle Garamond */}
              <div className="text-center my-6 py-2 border-y-2 border-slate-900 bg-slate-50/50">
                <h1 className="font-garamond text-xl font-bold uppercase tracking-wider text-slate-950">
                  ATTESTATION DE DÉPÔT
                </h1>
                <p className="text-xs font-garamond italic text-slate-600 mt-0.5">
                  Valable pour l'exploitation transitoire • Dossier N° {printData.codeDossier || 'REC-2026'}
                </p>
              </div>

              {/* Paragraphe 1 */}
              <p className="text-justify mb-4 text-[13pt] leading-7" style={{ textIndent: '1.5cm' }}>
                Le Directeur Départemental des Loisirs de Pointe-Noire soussigné atteste par la présente que l'établissement de loisirs dénommé{' '}
                <strong className="font-bold uppercase tracking-wide">
                  « {printData.nomCommercial} »
                </strong>
                , exploité par{' '}
                <strong className="font-bold">{printData.promoteurNom}</strong>, relevant de la catégorie{' '}
                <em>{printData.categorie}</em>, sis à Pointe-Noire, Arrondissement{' '}
                <strong>
                  {printData.arrondissement} ({printData.quartier ? `Quartier ${printData.quartier}, ` : ''}{printData.adresseExacte})
                </strong>
                , a régulièrement déposé auprès de nos services son dossier technique de régularisation et s'est acquitté des redevances départementales requises par la Régie Financière.
              </p>

              {/* Paragraphe 2 */}
              <p className="text-justify mb-4 text-[13pt] leading-7" style={{ textIndent: '1.5cm' }}>
                La présente attestation confère au promoteur la faculté de poursuivre ses activités à titre strictement transitoire, en attendant la délivrance solennelle de l'Agrément Ministériel Définitif instruit par la Direction Générale des Loisirs à Brazzaville. L'exploitant s'engage expressément à respecter les prescriptions réglementaires en vigueur, notamment en ce qui concerne la salubrité des lieux, la sécurité physique des usagers et la préservation de la tranquillité publique.
              </p>

              {/* Paragraphe 3 */}
              <p className="text-justify mb-8 text-[13pt] leading-7" style={{ textIndent: '1.5cm' }}>
                Délivrée pour valoir et servir ce que de droit, la présente attestation d'autorisation d'exploitation est valable pour une période d'<strong>UN (01) AN renouvelable</strong> à compter de son premier versement ou de son règlement intégral conformément à la Loi N° 21-2019. L'échéance de son prochain renouvellement annuel est fixée au jour anniversaire de son premier paiement ({printData.renouvellementAnnuelDate || printData.prochainRdvDate || printData.premierAcompteDate || 'Exercice N+1'}), et demeure révocable sans préavis en cas de constatation d'infraction caractérisée ou de trouble grave à la tranquillité publique.
              </p>

              {/* Security watermark, QR Code and Hash */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[9px] text-slate-600 flex justify-between items-center mb-8">
                <div className="space-y-0.5">
                  <p><strong className="text-slate-800">Code Sécurisé :</strong> {printData.codeDossier}</p>
                  <p><strong className="text-slate-800">Validité :</strong> 1 AN RENOUVELABLE</p>
                  <p><strong className="text-slate-800">Statut Républicain :</strong> {printData.statut?.toUpperCase()}</p>
                  <p><strong className="text-slate-800">Scellement Numérique :</strong> Conforme Loi 21-2019</p>
                </div>
                {qrCodeUrl && (
                  <div className="flex flex-col items-center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Sceau Officiel"
                      className="w-18 h-18 object-contain p-1 border border-slate-300 rounded-lg bg-white shadow-xs"
                    />
                    <span className="text-[7px] text-slate-500 mt-0.5 font-sans font-medium">Contrôle QR Officiel</span>
                  </div>
                )}
              </div>
              {/* Signatures */}
              <div className="flex justify-between items-end pt-4 mt-6">
                <div className="text-center w-60">
                  <p className="font-bold text-xs uppercase mb-4 text-slate-900">
                    Le Chef de Service SAA
                  </p>
                  {printData.signatureUrl ? (
                    <img
                      src={printData.signatureUrl}
                      alt="Signature Émargement"
                      className="h-12 mx-auto object-contain mb-1"
                    />
                  ) : (
                    <div className="h-10" />
                  )}
                  <div className="border-t border-slate-800 pt-1">
                    <p className="font-bold text-xs">Inspecteur Principal SAA</p>
                    <p className="text-[10px] text-slate-600">Brigade Assermentée</p>
                  </div>
                </div>

                <div className="text-center w-72">
                  <p className="font-bold text-xs uppercase mb-1 text-slate-900">
                    Le Directeur Départemental des Loisirs
                  </p>
                  <p className="text-[11px] italic mb-12">de Pointe-Noire</p>
                  <div className="border-t border-slate-800 pt-1 relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-2 border-dashed border-red-700/60 flex items-center justify-center rotate-12 pointer-events-none opacity-80">
                      <span className="text-[9px] font-bold text-red-700 uppercase tracking-tighter text-center">
                        DDL-PN<br/>SCEAU<br/>OFFICIEL
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-950">Jean Richard NTSEKE NGOUAKA</p>
                    <p className="text-[10px] text-slate-600">Le Directeur Départemental</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. REÇU THERMIQUE POS 58MM - DESIGN MODERNE ÉPURÉ */}
          {printMode === 'pos_receipt' && (
            <div className="receipt-58mm bg-white text-slate-900 p-4 rounded-xl shadow-2xl w-[58mm] font-sans text-[10px] leading-tight border border-slate-200">
              {/* Ruban Tricolore National */}
              <div className="h-1.5 w-full rounded-full flex overflow-hidden mb-3">
                <div className="flex-1 bg-[#009543]" />
                <div className="flex-1 bg-[#fbde4a]" />
                <div className="flex-1 bg-[#dc241f]" />
              </div>

              {/* En-tête institutionnel moderne */}
              <div className="text-center pb-2 border-b border-slate-200 flex flex-col items-center">
                <DdlLogo size="xs" rounded="lg" bordered={false} className="w-9 h-9 mb-1.5 shadow-xs" />
                <p className="font-bold text-[11px] uppercase tracking-wide text-slate-950">RÉPUBLIQUE DU CONGO</p>
                <p className="text-[7.5px] italic text-slate-500 font-serif">Unité • Travail • Progrès</p>
                <p className="text-[8px] font-medium text-slate-600 mt-1">MCAPNIT • DGL</p>
                <p className="font-bold text-[9px] text-emerald-800 mt-0.5 uppercase tracking-tight">Direction des Loisirs • Pointe-Noire</p>
                <span className="mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[8px] uppercase tracking-wider">
                  Régie des Recettes SAF
                </span>
              </div>

              {/* Bloc Quittance N° */}
              <div className="my-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[8px] text-slate-500">
                  <span>QUITTANCE N°</span>
                  <span className="font-mono">{printData.datePaiement}</span>
                </div>
                <p className="font-mono font-bold text-[11px] text-slate-950">{printData.numeroQuittance}</p>
                <div className="text-[8.5px] text-slate-600 flex justify-between pt-0.5 border-t border-slate-200/60">
                  <span>Arrondissement :</span>
                  <span className="font-semibold">{printData.arrondissement}</span>
                </div>
              </div>

              {/* Bloc Redevable */}
              <div className="py-2 border-b border-slate-200 space-y-1 text-[9px]">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Établissement</span>
                  <p className="font-bold text-[11px] text-slate-950 truncate uppercase leading-snug">{printData.etablissementNom}</p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Promoteur</span>
                  <p className="font-semibold text-slate-800 truncate">{printData.promoteurNom}</p>
                </div>
                <div className="flex justify-between items-center pt-0.5 text-[8px]">
                  <span className="text-slate-500">Nature recette :</span>
                  <span className="font-medium text-slate-800 truncate max-w-[120px]">{printData.natureRecette}</span>
                </div>
              </div>

              {/* Bloc Montants & Règlement */}
              <div className="my-2.5 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/70 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] text-slate-600 font-semibold uppercase">Mode :</span>
                  <span className="text-[8.5px] font-mono uppercase px-1.5 py-0.2 bg-white rounded border border-slate-300 font-bold text-slate-800">
                    {printData.modePaiement?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-emerald-200/50">
                  <span className="text-[9px] font-bold text-slate-700 uppercase">Montant Versé :</span>
                  <span className="font-mono font-black text-sm text-emerald-800">{formatCfa(printData.montantVerse)}</span>
                </div>
                <div className="flex justify-between items-center text-[8.5px] pt-0.5">
                  <span className="text-slate-600">Solde restant dû :</span>
                  <span className={`font-mono font-bold ${Number(printData.resteAPayer || 0) === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {Number(printData.resteAPayer || 0) === 0 ? '0 FCFA (Soldé)' : formatCfa(printData.resteAPayer || 0)}
                  </span>
                </div>

                {/* Ventilation officielle Note 151/MTL-CAB */}
                <div className="pt-1 border-t border-emerald-200/50 text-[7px] text-slate-600 space-y-0.5 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans">Quote-part Étude (50% Admin) :</span>
                    <span>{formatCfa(Math.round(printData.montantVerse * 0.5))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">Part Trésor Public (50%) :</span>
                    <span>{formatCfa(printData.montantVerse - Math.round(printData.montantVerse * 0.5))}</span>
                  </div>
                </div>
              </div>

              {/* Règle de validité légale Note 151 & 152 */}
              <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200 text-[7.5px] text-slate-600 leading-tight space-y-0.5 mb-2">
                <p><strong>Réglementation :</strong> Notes de Service N° 151 & 152/MTL-CAB et Loi 21-2019.</p>
                <p>Frais d'enquête terrain DDL-PN : 30 000 FCFA acquittés auprès de la Régie SAF.</p>
              </div>

              {/* QR Code Tricolore & Sécurité */}
              <div className="text-center pt-1 border-t border-slate-200 space-y-1.5">
                {qrCodeUrl && (
                  <div className="my-1.5 flex flex-col items-center">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code Contrôle DDL-PN"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <span className="text-[7px] text-slate-500 font-medium mt-1">
                      Scanner pour contrôle d'authenticité officiel
                    </span>
                  </div>
                )}

                {printData.signatureUrl && (
                  <div className="my-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[7px] font-bold text-slate-500 mb-0.5">Émargement / Signature :</p>
                    <img
                      src={printData.signatureUrl}
                      alt="Signature"
                      className="h-8 mx-auto object-contain"
                    />
                  </div>
                )}

                <div className="text-[7px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                  <p className="truncate">Caissier : <span className="font-semibold text-slate-700">{printData.inspecteurOuCaissier}</span></p>
                  <p className="font-mono truncate text-[6.5px] text-slate-400">Empreinte SHA-256 : {printData.quittanceHash?.substring(0, 20)}...</p>
                  <p className="font-bold text-slate-800 uppercase tracking-tight pt-1">Document libératoire officiel</p>
                  <p className="text-[6.5px]">À présenter à toute réquisition des Brigades de contrôle</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. ACTE DE POLICE ADMINISTRATIVE A4 */}
          {printMode === 'a4_legal_act' && (
            <div className="page-a4 bg-white text-slate-950 p-8 md:p-12 rounded shadow-2xl max-w-[210mm] w-full border border-slate-300 font-garamond leading-relaxed text-[13pt]">
              <OfficialDocumentHeader
                numeroActe={`N°${printData.referenceNumero || '035'}/MCAPNIT/DGL/DPN/DDL-PN`}
                dateLieu={`Pointe-Noire, le ${printData.dateEmission || '08 octobre 2026'}`}
                destinataireTitre={`Promoteur : ${printData.promoteurNom} (${printData.etablissementNom})`}
                destinataireVille={printData.arrondissement}
                emetteurTitre="Le Directeur Départemental des Loisirs de Pointe-Noire"
                showDestinataire={true}
                objet={`${printData.type === 'mise_en_demeure' ? 'Mise en demeure sous 72 heures' : printData.type === 'arrete_fermeture' ? 'Arrêté de fermeture administrative' : 'Procès-verbal de contrôle'} — ${printData.etablissementNom}`}
                reference="Loi N° 21-2019 du 15 novembre 2019 fixant les règles relatives aux loisirs en République du Congo."
              />

              <div className="text-center my-6 pt-4 border-t border-slate-300">
                <h2 className="font-cinzel text-xl font-bold uppercase tracking-wide text-slate-950">
                  {printData.type === 'mise_en_demeure' && "MISE EN DEMEURE SOUS SOIXANTE-DOUZE (72) HEURES"}
                  {printData.type === 'arrete_fermeture' && "ARRÊTÉ DE FERMETURE ADMINISTRATIVE AVEC RÉQUISITION"}
                  {printData.type === 'pv_sonometrie' && "PROCÈS-VERBAL DE CONSTAT SONOMÉTRIQUE CONTRADICTOIRE"}
                  {printData.type === 'ordre_mission' && "ORDRE DE MISSION DE BRIGADE MOBILE DDL-PN"}
                </h2>
                <p className="text-[12pt] font-semibold uppercase mt-1 text-slate-800">
                  Établissement : {printData.etablissementNom} (Arrondissement : {printData.arrondissement})
                </p>
              </div>

              <div className="my-6 space-y-4 text-justify text-[13pt] leading-relaxed">
                <p>
                  <strong>VU</strong> la Constitution de la République du Congo ;
                </p>
                <p>
                  <strong>VU</strong> la Loi N° 21-2019 du 15 novembre 2019 fixant les règles relatives aux loisirs en République du Congo ;
                </p>
                <p>
                  <strong>VU</strong> l&apos;Arrêté Préfectoral N° 045/P-PNR/CAB réprimant les pollutions acoustiques et le tapage nocturne dans le Département de Pointe-Noire ;
                </p>
                <p>
                  <strong>CONSIDÉRANT</strong> les constats matériels dressés par les inspecteurs assermentés de la Brigade Mobile SAA de la Direction Départementale des Loisirs :
                </p>
                <div className="p-4 bg-slate-50 rounded border border-slate-300 text-[12pt] leading-normal">
                  <p className="font-bold text-slate-900">Motifs et infractions constatées :</p>
                  <p className="text-slate-800 mt-1">{printData.motifs}</p>
                  {printData.decibelsMesures && (
                    <p className="mt-2 font-mono font-bold text-red-700">
                      Niveau sonore contradictoire mesuré : {printData.decibelsMesures} dB(A) [Seuil maximal autorisé : 65 dB(A)]
                    </p>
                  )}
                </div>

                {printData.delaiHeures ? (
                  <p className="font-bold text-slate-900 bg-red-50/70 p-3 rounded border border-red-200">
                    INJONCTION : Il est imparti à l&apos;exploitant un délai strict et impératif de {printData.delaiHeures} heures à compter de la notification du présent acte pour se conformer intégralement. À défaut, la fermeture immédiate de l&apos;établissement sera exécutée avec le concours de la force publique.
                  </p>
                ) : (
                  <p className="font-bold text-slate-900 bg-red-50/70 p-3 rounded border border-red-200">
                    DÉCISION : L&apos;activité de l&apos;établissement est suspendue sans délai. Les scellés de la Direction Départementale des Loisirs sont apposés jusqu&apos;à parfaite régularisation.
                  </p>
                )}
              </div>

              <div className="flex justify-between items-end mt-10 pt-6 border-t border-slate-300">
                <div className="text-[11.5pt] space-y-1">
                  <p className="font-bold">Les Inspecteurs SAA signataires :</p>
                  {printData.inspecteursAssermentes?.map((insp: string, i: number) => (
                    <p key={i} className="text-slate-700">• {insp}</p>
                  ))}
                  <p className="italic text-[10pt] text-slate-500 pt-1">Assermentés près le TGI de Pointe-Noire</p>
                </div>
                <div className="text-center text-[12pt] space-y-1">
                  <p className="font-bold uppercase">Le Directeur Départemental des Loisirs</p>
                  <div className="h-16 flex items-center justify-center italic text-xs text-slate-400">
                    [Signature & Sceau Officiel]
                  </div>
                  <p className="font-bold text-[13pt]">Jean Richard NTSEKE NGOUAKA</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. CARTE PRO / BADGE INSPECTEUR */}
          {printMode === 'staff_badge' && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl shadow-2xl w-96 border-2 border-emerald-500/50 font-sans">
              <div className="flex justify-between items-center border-b border-emerald-500/30 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <DdlLogo size="xs" rounded="md" bordered={false} className="w-6 h-6" />
                  <span className="font-cinzel text-xs font-bold tracking-wider">DDL-PN</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CARTE PROFESSIONNELLE
                </span>
              </div>

              <div className="flex gap-4 items-center my-4">
                <div className="w-20 h-24 rounded-lg bg-slate-800 border-2 border-emerald-400/40 flex items-center justify-center text-slate-400 font-mono text-xs">
                  [PHOTO PHOTO]
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-100">{printData.nomComplet}</p>
                  <p className="text-xs text-emerald-400 font-semibold">{printData.fonction}</p>
                  <p className="text-[10px] text-slate-300 font-mono">Matricule : {printData.matricule}</p>
                  <p className="text-[10px] text-slate-300">Grade : {printData.grade}</p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-[10px] space-y-1 font-mono">
                <p>Assermentation : {printData.assermentationNumero}</p>
                <p>TGI de Pointe-Noire ({printData.dateAssermentation})</p>
                <p className="text-emerald-400 font-bold">Qualité : Officier de Police Administrative</p>
              </div>

              <div className="text-center mt-3 pt-2 border-t border-slate-800 text-[9px] text-slate-400">
                Ministère de l'Industrie Touristique et des Loisirs • MCAPNIT
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
