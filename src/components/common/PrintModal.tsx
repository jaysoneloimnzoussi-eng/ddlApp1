import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from './DdlLogo';
import { X, Printer, Download, Shield, FileText, CheckCircle2 } from 'lucide-react';
import {
  generateAttestationDocx,
  generateLegalActDocx,
  generateUniversalAdministrativeDocx,
  generateDepartmentalAuthorizationDocx,
} from '../../services/docxGenerator';
import { printHtmlElement } from '../../services/printService';
import { OfficialDocumentHeader } from './OfficialDocumentHeader';
import { formatCfa } from '../../services/crypto';
import {
  generateReceiptQrCode,
  generateLegalActQrCode,
  generateAttestationQrCode,
  generateAuthorizationQrCode,
} from '../../services/qrService';

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
        } else if (printMode === 'a4_departmental_authorization') {
          const isPo = printData.signatureDirecteur?.typeSignataire === 'chef_saa_po';
          const signNom = printData.signatureDirecteur?.signataireNom;
          url = await generateAuthorizationQrCode(
            printData.numeroAutorisation || 'AUT-2026/DDL-PN/001',
            printData.nomCommercial || 'LE ROOFTOP VIP CLUB',
            printData.promoteurNom || 'Promoteur Enregistré',
            printData.dateDelivrance || new Date().toISOString().substring(0, 10),
            printData.documentHash || 'DDL-SHA256',
            isPo,
            signNom
          );
        } else if (printMode === 'a4_recovery_notice') {
          url = await generateLegalActQrCode(
            printData.referenceRelance || 'REL-2027-JAN',
            printData.etablissementNom || printData.nomCommercial || 'Établissement',
            printData.documentHash || 'DDL-RECOVERY-SHA256'
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
    else if (printMode === 'a4_departmental_authorization') docTitle = `Autorisation_${printData.numeroAutorisation || 'DDL_PN'}`;
    else if (printMode === 'a4_recovery_notice') docTitle = `Avis_Recouvrement_${printData.codeDossier || printData.referenceRelance || '2027'}`;

    printHtmlElement('printable-modal-doc', docTitle);
  };

  const handleDownloadDocx = async () => {
    if (printMode === 'a4_attestation') {
      await generateAttestationDocx(printData);
    } else if (printMode === 'a4_legal_act') {
      await generateLegalActDocx(printData);
    } else if (printMode === 'a4_departmental_authorization') {
      await generateDepartmentalAuthorizationDocx(printData);
    } else if (printMode === 'a4_recovery_notice') {
      await generateUniversalAdministrativeDocx({
        titreActe: "AVIS OFFICIEL DE RECOUVREMENT & SOMMATION RÉPUBLICAINE",
        numeroActe: printData.referenceRelance || `AVIS-2027-${printData.codeDossier || 'SAF'}`,
        dateLieu: 'Pointe-Noire, le 02 janvier 2027',
        destinataireTitre: `À l'attention de M./Mme ${printData.promoteurNom || 'l’Exploitant'} — « ${printData.nomCommercial || printData.etablissementNom} »`,
        destinataireVille: printData.arrondissement || 'Pointe-Noire',
        sections: [
          {
            titre: 'OBJET : SOMMATION DE RÉGULARISATION FISCALE SOUS HUITAINE (EXERCICE 2027)',
            contenu: `En exécution de la Loi N° 21-2019 et de la Note de service N° 151/MTL-CAB, les états financiers de la Régie SAF constatent que votre établissement accuse un solde restant dû exigible de ${formatCfa(printData.resteAPayer || printData.soldeRestantDu || printData.montantRedevanceAnnuelle || 150000)} au titre des redevances départementales. Vous êtes formellement sommé de vous présenter sous 8 jours ouvrés à la Régie des Recettes pour régularisation, sous peine de fermeture administrative immédiate.`,
          },
        ],
        signataireNom: 'Jacques MATOKO',
        signataireTitre: 'Le Directeur Départemental des Loisirs de Pointe-Noire',
      });
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

  const canDownloadDocx =
    printMode === 'a4_attestation' ||
    printMode === 'a4_legal_act' ||
    printMode === 'spa_diploma' ||
    printMode === 'a4_departmental_authorization' ||
    printMode === 'a4_recovery_notice';

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
              {printMode === 'a4_departmental_authorization' && "Autorisation d'Exploitation Départementale (Diplôme A4)"}
              {printMode === 'a4_recovery_notice' && "Avis de Recouvrement Républicain & Sommation 2027 (A4)"}
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

          {/* 5. AUTORISATION D'EXPLOITATION DÉPARTEMENTALE (DIPLÔME SOLEMNEL A4 - MOD-20) */}
          {printMode === 'a4_departmental_authorization' && (
            <div className="bg-[#fcfbf7] text-slate-900 p-8 md:p-10 rounded-2xl shadow-2xl border-8 border-double border-amber-700/60 w-full max-w-[210mm] mx-auto font-garamond relative print:m-0 print:border-4 print:shadow-none print:w-full">
              {/* Liseré Républicain Tricolore Supérieur */}
              <div className="h-2 w-full rounded-full flex overflow-hidden mb-6 shadow-sm">
                <div className="flex-1 bg-[#009543]" />
                <div className="flex-1 bg-[#fbde4a]" />
                <div className="flex-1 bg-[#dc241f]" />
              </div>

              {/* En-tête Institutionnel Solennel */}
              <div className="flex justify-between items-start border-b border-amber-800/30 pb-4 mb-4">
                <div className="text-left max-w-xs space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    RÉPUBLIQUE DU CONGO
                  </p>
                  <p className="text-[9px] italic text-slate-600 font-serif">Unité • Travail • Progrès</p>
                  <div className="w-12 h-0.5 bg-amber-600 my-1" />
                  <p className="text-[9px] font-semibold text-slate-700 uppercase leading-tight">
                    MINISTÈRE DE L'INDUSTRIE CULTURELLE, TOURISTIQUE, ARTISTIQUE ET DES LOISIRS
                  </p>
                  <p className="text-[8.5px] text-slate-600 uppercase">
                    DIRECTION GÉNÉRALE DES LOISIRS
                  </p>
                  <p className="text-[9px] font-bold text-amber-950 uppercase pt-0.5">
                    DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <DdlLogo size="sm" rounded="full" bordered={true} className="w-14 h-14 shadow-md mb-1" />
                  <span className="text-[8px] font-mono text-slate-600">SCEAU D'ÉTAT</span>
                </div>

                <div className="text-right max-w-xs space-y-0.5 font-mono text-[9px] text-slate-700">
                  <p className="font-bold text-emerald-800 text-[10px]">TITRE RÉGALIEN DDL-PN</p>
                  <p>Réf : <span className="font-bold">{printData.numeroAutorisation || 'AUT-2026/DDL-PN/001'}</span></p>
                  <p>{printData.referenceArrete || 'Arrêté N° 042/MID-DGL/DDL-PN-2026'}</p>
                  <p className="text-slate-500">Exercice Budgétaire : {printData.anneeExercice || 2026}</p>
                </div>
              </div>

              {/* Grand Titre Impérial Cinzel */}
              <div className="text-center my-4 py-2 border-y-2 border-amber-800/40 bg-gradient-to-r from-amber-500/5 via-amber-600/15 to-amber-500/5">
                <h2 className="font-cinzel text-xl md:text-2xl font-black text-amber-950 uppercase tracking-widest leading-tight">
                  AUTORISATION D'EXPLOITATION DÉPARTEMENTALE
                </h2>
                <p className="text-[11px] font-semibold tracking-wider text-amber-900 uppercase mt-0.5">
                  Titre Définitif d'Exercice des Activités de Loisirs • Département de Pointe-Noire
                </p>
              </div>

              {/* Visas Régaliens EB Garamond */}
              <div className="text-[10px] md:text-[10.5px] leading-relaxed text-slate-700 text-justify space-y-1 mb-4 italic">
                <p>
                  <strong className="font-semibold not-italic">LE DIRECTEUR DÉPARTEMENTAL DES LOISIRS DE POINTE-NOIRE,</strong>
                </p>
                <p>
                  <strong>VU</strong> la Constitution de la République du Congo ;
                </p>
                <p>
                  <strong>VU</strong> la Loi N° 21-2019 du 13 juin 2019 fixant les règles relatives à la protection de l'environnement sonore et à l'exercice des activités de loisirs ;
                </p>
                <p>
                  <strong>VU</strong> la Note de Service Ministérielle N° 151/MTL-CAB du Ministre en charge des Loisirs ;
                </p>
                <p>
                  <strong>VU</strong> le procès-verbal d'inspection technique de la Brigade Mobile SAA attestant de la conformité acoustique (<span className="font-semibold not-italic">85 dB(A) max avec limiteur scellé</span>) et sécuritaire ;
                </p>
                <p>
                  <strong>VU</strong> la quittance officielle N° <span className="font-mono font-bold not-italic">{printData.quittanceReference || 'QUIT-2026-0042'}</span> du Régisseur SAF constatant le règlement libératoire de la redevance départementale ;
                </p>
              </div>

              {/* Cadre Majestueux des Données de l'Établissement */}
              <div className="bg-amber-50/60 border-2 border-amber-700/50 rounded-xl p-4 my-3 text-[11px] space-y-2 shadow-xs">
                <div className="text-center pb-2 border-b border-amber-700/30">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Établissement Récipiendaire & Exploitant</span>
                  <h3 className="font-cinzel text-lg md:text-xl font-bold text-slate-950 uppercase tracking-wide">
                    {printData.nomCommercial}
                  </h3>
                  <p className="text-xs text-amber-950 font-medium">
                    Exploitant titulaire : <span className="font-bold">{printData.promoteurNom}</span>
                    {printData.promoteurTelephone ? ` (${printData.promoteurTelephone})` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Activité & Catégorie :</span>
                    <strong className="text-slate-900">{printData.categorie}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Localisation :</span>
                    <strong className="text-slate-900">{printData.arrondissement} • {printData.quartier}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Surface Utile :</span>
                    <strong className="text-slate-900">{printData.surfaceM2 || 120} m²</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Redevance Annuelle :</span>
                    <strong className="text-emerald-700 font-mono font-bold">{formatCfa(printData.montantRedevanceAcquittee || 150000)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Quittance Régie :</span>
                    <strong className="text-slate-800 font-mono">{printData.quittanceReference || 'RÉGLÉE'} ({printData.quittanceDate || printData.dateDelivrance})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Validité Souveraine :</span>
                    <strong className="text-emerald-800 font-semibold">Du {printData.dateDelivrance} au {printData.dateExpiration}</strong>
                  </div>
                </div>
              </div>

              {/* Dispositions Régaliennes (Articles) */}
              <div className="text-[9.5px] leading-relaxed text-slate-700 space-y-1 mb-4">
                <p>
                  <strong className="text-slate-900">Article 1er :</strong> L'établissement désigné ci-dessus est formellement autorisé à exploiter ses activités dans les limites du Département de Pointe-Noire pour l'exercice 2026.
                </p>
                <p>
                  <strong className="text-slate-900">Article 2 :</strong> La présente autorisation est strictement personnelle et incessible. L'exploitant s'oblige au maintien en état de fonctionnement du limiteur sonore homologué et à l'affichage visible du présent diplôme.
                </p>
                <p>
                  <strong className="text-slate-900">Article 3 :</strong> Tout manquement réitéré aux normes de salubrité sonore ou non-présentation du titre lors des tournées de contrôle entraînera la suspension immédiate ou la fermeture administrative.
                </p>
              </div>

              {/* Bloc Tripartite des Visas & Signature Directorale */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t-2 border-amber-800/40 text-center items-end mb-4">
                {/* 1. Visa SAA */}
                <div className="border border-slate-300 rounded-lg p-2 bg-white/70">
                  <p className="text-[8.5px] uppercase font-bold text-slate-700 mb-1">
                    Visa Technique SAA
                  </p>
                  <p className="text-[8px] text-emerald-700 font-semibold">Conformité Acoustique Validée</p>
                  <div className="h-8 flex items-center justify-center italic text-[9px] text-slate-600 font-serif">
                    {printData.visaInspecteurChef?.nomInspecteur || 'Gildas Ambetos'}
                  </div>
                  <p className="text-[7.5px] text-slate-500 font-mono">Date : {printData.visaInspecteurChef?.dateVisa || printData.dateDelivrance}</p>
                </div>

                {/* 2. Visa SAF */}
                <div className="border border-slate-300 rounded-lg p-2 bg-white/70">
                  <p className="text-[8.5px] uppercase font-bold text-slate-700 mb-1">
                    Visa Comptable SAF
                  </p>
                  <p className="text-[8px] text-emerald-700 font-semibold">Redevance Régularisée</p>
                  <div className="h-8 flex items-center justify-center italic text-[9px] text-slate-600 font-serif">
                    {printData.visaRegisseurSaf?.nomRegisseur || 'Patrice Bitemo'}
                  </div>
                  <p className="text-[7.5px] text-slate-500 font-mono">{printData.quittanceReference || 'QUIT-2026'}</p>
                </div>

                {/* 3. Signature & Sceau Directeur ou Chef SAA P.O. */}
                <div className="border-2 border-amber-600 rounded-lg p-2 bg-amber-50/50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-700 flex items-center justify-center rotate-12">
                      <span className="text-[7px] font-bold text-red-700 uppercase text-center leading-tight">
                        DDL-PN<br/>DIRECTION<br/>LOISIRS
                      </span>
                    </div>
                  </div>
                  {printData.signatureDirecteur?.typeSignataire === 'chef_saa_po' ? (
                    <>
                      <p className="text-[7.5px] uppercase font-bold text-amber-950 leading-tight">
                        Pour le Directeur Départemental et P.O.
                      </p>
                      <p className="text-[7.5px] italic text-slate-700 font-semibold">
                        Le Chef de Service Assistance & Autorisation
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[8.5px] uppercase font-bold text-amber-950 leading-tight">
                        Le Directeur Départemental
                      </p>
                      <p className="text-[7.5px] italic text-slate-600">des Loisirs de Pointe-Noire</p>
                    </>
                  )}
                  <div className="h-8 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-xs text-slate-900">
                      {printData.signatureDirecteur?.signataireNom || printData.signatureDirecteur?.nomDirecteur || 'Jacques MATOKO'}
                    </span>
                  </div>
                  <p className="text-[7.5px] font-mono text-emerald-800 font-bold">
                    {printData.signatureDirecteur?.parapheOfficiel || 'Approuvé • DDL-PN • 2026'}
                  </p>
                </div>
              </div>

              {/* Sceau Cryptographique, QR Code et Empreinte SHA-256 */}
              <div className="p-3 bg-slate-100/90 border border-slate-300 rounded-xl font-mono text-[8px] text-slate-600 flex justify-between items-center">
                <div className="space-y-0.5">
                  <p><strong className="text-slate-800">Scellement Numérique :</strong> Certificat d'authenticité DDL-PN / Loi 21-2019</p>
                  <p className="break-all"><strong className="text-slate-800">Empreinte SHA-256 :</strong> {printData.documentHash || 'c7e8a9f24b5d3e12a45c7890bfe1d45892147321e90ab4c3ef1287654321abcd'}</p>
                  <p className="text-[7.5px] text-slate-500 font-sans italic">Document officiel infalsifiable • Vérification instantanée par scan du QR Code ci-contre.</p>
                </div>
                {qrCodeUrl && (
                  <div className="flex flex-col items-center ml-3 shrink-0">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code Officiel"
                      className="w-16 h-16 object-contain p-1 border border-slate-300 rounded-lg bg-white shadow-xs"
                    />
                    <span className="text-[6.5px] text-slate-500 mt-0.5 font-sans font-medium">Contrôle QR DDL-PN</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. AVIS DE RECOUVREMENT RÉGALIEN & SOMMATION D'ÉTAT 2027 */}
          {printMode === 'a4_recovery_notice' && (
            <div className="bg-[#fffefb] text-slate-900 p-8 md:p-10 rounded-xl shadow-2xl border-4 border-double border-red-700/60 max-w-[210mm] mx-auto font-garamond space-y-4">
              {/* Congolese National Ribbon */}
              <div className="h-2 w-full rounded-full flex overflow-hidden shadow-xs">
                <div className="flex-1 bg-[#009543]" />
                <div className="flex-1 bg-[#fbde4a]" />
                <div className="flex-1 bg-[#dc241f]" />
              </div>

              {/* En-tête Institutionnel */}
              <div className="flex justify-between items-start border-b-2 border-red-800/30 pb-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-[9pt] uppercase tracking-wider text-slate-800">
                    RÉPUBLIQUE DU CONGO
                  </p>
                  <p className="text-[8pt] italic font-serif text-slate-600">Unité • Travail • Progrès</p>
                  <div className="pt-1 space-y-0.5">
                    <p className="text-[8pt] font-bold text-slate-700 uppercase">
                      Ministère des Industries Culturelles, Touristiques, Artistiques et des Loisirs
                    </p>
                    <p className="text-[8.5pt] font-black text-red-950 uppercase">
                      Direction Départementale des Loisirs de Pointe-Noire
                    </p>
                    <p className="text-[7.5pt] font-semibold text-slate-600 uppercase">
                      Service Assistance & Autorisation (SAA) • Régie des Recettes (SAF)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <DdlLogo size="sm" rounded="full" bordered={true} className="w-14 h-14 shadow-md" />
                  <span className="text-[7pt] font-mono text-red-800 font-bold mt-0.5">SOUVERAINETÉ</span>
                </div>

                <div className="text-right space-y-0.5 font-mono text-[8pt]">
                  <p className="font-bold text-red-800">{printData.referenceRelance || 'REL-2027-JAN-0001'}</p>
                  <p className="text-slate-600 font-sans text-[7.5pt]">Dossier : <strong>{printData.codeDossier || 'DDL-PN-2026-VALIDE'}</strong></p>
                  <p className="text-slate-500 text-[7.5pt]">Pointe-Noire, le {printData.dateEnvoi ? new Date(printData.dateEnvoi).toLocaleDateString('fr-FR') : '02 Janvier 2027'}</p>
                </div>
              </div>

              {/* Titre Solennel */}
              <div className="text-center py-2.5 border-y-2 border-red-800/40 bg-red-500/10 rounded-lg">
                <h2 className="font-cinzel text-lg md:text-xl font-black text-red-950 tracking-wider">
                  AVIS DE RECOUVREMENT RÉGALIEN & SOMMATION D'ÉTAT
                </h2>
                <p className="text-[9pt] uppercase tracking-wide text-red-900 font-semibold mt-0.5">
                  Mise en Demeure d'Apurement des Redevances Départementales • Exercice Budgétaire 2027
                </p>
              </div>

              {/* Destinataire Encadré */}
              <div className="border border-slate-400 bg-slate-50/90 rounded-lg p-3 text-[9pt] space-y-1">
                <div className="flex justify-between items-baseline border-b border-slate-300 pb-1">
                  <span className="font-cinzel font-bold text-slate-900 text-[10pt] uppercase">
                    {printData.etablissementNom || printData.nomCommercial}
                  </span>
                  <span className="font-mono text-[8pt] px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-300">
                    CONSTAT : {printData.statutPaiement === 'zero_entree' ? 'ZÉRO ENTRÉE CONSTATÉE' : 'ACOMPTE PARTIEL INSUFFISANT'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 text-[8.5pt] pt-1">
                  <div>
                    <span>Exploitant / Promoteur : </span>
                    <strong className="text-slate-900">{printData.promoteurNom || 'Promoteur Enregistré'}</strong>
                  </div>
                  <div>
                    <span>Contact Téléphonique : </span>
                    <strong className="font-mono text-slate-900">{printData.promoteurTelephone || '+242 06 000 0000'}</strong>
                  </div>
                  <div>
                    <span>Localisation Urbaine : </span>
                    <strong>{printData.arrondissement} ({printData.quartier || 'Centre'})</strong>
                  </div>
                  <div>
                    <span>Catégorie Réglementaire : </span>
                    <em>{printData.categorie || 'Établissement Récréatif'}</em>
                  </div>
                </div>
              </div>

              {/* Visas Légaux */}
              <div className="text-justify text-[8pt] text-slate-700 space-y-0.5 leading-relaxed border-l-2 border-red-700/60 pl-2.5 italic">
                <p><strong>Vu</strong> la Constitution de la République du Congo ;</p>
                <p><strong>Vu</strong> la Loi N° 21-2019 fixant le régime financier des débits de boissons et complexes de loisirs ;</p>
                <p><strong>Vu</strong> la Note de service N° 151/MTL-CAB fixant la tarification officielle des droits départementaux ;</p>
                <p><strong>Vu</strong> les procès-verbaux de contrôle constatant l'exploitation commerciale continue sans apurement complet de la redevance régalienne.</p>
              </div>

              {/* Tableau Financier de la Dette */}
              <div className="border border-slate-800 rounded-lg overflow-hidden text-[8.5pt]">
                <div className="bg-slate-900 text-white font-bold grid grid-cols-4 p-1.5 text-center text-[7.5pt]">
                  <span>REDEVANCE FIXÉE</span>
                  <span>ACOMPTES VERSÉS</span>
                  <span>RESTE À RECOUVRER</span>
                  <span>ÉCHÉANCE IMPÉRIEUSE</span>
                </div>
                <div className="grid grid-cols-4 p-2.5 text-center items-center bg-white font-mono text-[9pt]">
                  <span className="text-slate-700">{formatCfa(printData.montantRedevance || printData.montantRedevanceAnnuelle || 150000)}</span>
                  <span className="text-slate-500">{formatCfa(printData.montantPaye || printData.montantEncaisse || 0)}</span>
                  <span className="text-red-700 font-bold text-[10pt] bg-red-50 py-1 rounded">
                    {formatCfa(printData.resteAPayer || printData.soldeRestantDu || printData.montantRedevanceAnnuelle || 150000)}
                  </span>
                  <span className="text-red-800 font-sans font-bold text-[7.5pt]">SOUS HUITAINE (8 JOURS)</span>
                </div>
              </div>

              {/* Injonction & Conséquences Juridiques */}
              <div className="bg-red-50/80 border border-red-300 rounded-lg p-3 text-[8.5pt] leading-relaxed text-red-950 space-y-1">
                <p className="font-bold uppercase tracking-wide text-red-900 text-[9pt]">
                  INJONCTION DE MISE EN RÈGLE RÉGALIENNE :
                </p>
                <p>
                  L'exploitant est formellement sommé de se présenter sous un délai impérieux de <strong>HUIT (08) JOURS OUVRÉS</strong> auprès du Guichet de la Régie SAF (Hôtel de Ville de Pointe-Noire) ou d'effectuer le télépaiement officiel sécurisé (MTN MoMo / Airtel Money).
                </p>
                <p className="text-[7.5pt] text-red-900 italic">
                  À défaut de versement ou d'accord d'échelonnement validé, il sera fait application immédiate des mesures de police administrative prévues par les lois de la République : <strong>fermeture administrative des locaux avec apposition des scellés de police et poursuites judiciaires.</strong>
                </p>
              </div>

              {/* Signatures & Sceau Républicain */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-300 text-center text-[8pt]">
                <div className="border border-slate-300 rounded-lg p-1.5 bg-white/70">
                  <p className="text-[7.5pt] uppercase font-bold text-slate-700">Pour la Brigade SAA</p>
                  <p className="text-[7pt] text-slate-500 italic">Constat & Contrôle</p>
                  <div className="h-7 flex items-center justify-center font-serif italic text-slate-800 text-[8.5pt]">
                    Gildas Ambetos
                  </div>
                  <p className="text-[7pt] font-mono text-slate-500">Inspecteur Chef SAA</p>
                </div>

                <div className="border border-slate-300 rounded-lg p-1.5 bg-white/70">
                  <p className="text-[7.5pt] uppercase font-bold text-slate-700">Pour la Régie SAF</p>
                  <p className="text-[7pt] text-slate-500 italic">Comptabilité des Titres</p>
                  <div className="h-7 flex items-center justify-center font-serif italic text-slate-800 text-[8.5pt]">
                    Patrice Bitemo
                  </div>
                  <p className="text-[7pt] font-mono text-slate-500">Régisseur des Recettes</p>
                </div>

                <div className="border-2 border-red-600 rounded-lg p-1.5 bg-red-50/50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-700 flex items-center justify-center rotate-12">
                      <span className="text-[5.5pt] font-bold text-red-700 uppercase text-center leading-tight">
                        DDL-PN<br/>COMMANDEMENT<br/>ÉTAT
                      </span>
                    </div>
                  </div>
                  <p className="text-[7.5pt] uppercase font-bold text-red-950">Le Directeur Départemental</p>
                  <p className="text-[7pt] italic text-slate-600">des Loisirs de Pointe-Noire</p>
                  <div className="h-7 flex items-center justify-center font-serif italic font-bold text-[9pt] text-slate-900">
                    Jacques MATOKO
                  </div>
                  <p className="text-[7pt] font-mono text-red-800 font-bold">Signé & Scellé • 2027</p>
                </div>
              </div>

              {/* Pied de Page & QR Code de Contrôle */}
              <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl font-mono text-[7.5pt] text-slate-600 flex justify-between items-center">
                <div className="space-y-0.5">
                  <p><strong className="text-slate-800">Numéro d'Avis :</strong> {printData.referenceRelance || 'REL-2027-JAN-0001'}</p>
                  <p className="break-all"><strong className="text-slate-800">Empreinte de Sécurité :</strong> {printData.documentHash || 'e89a3f2b4c10d7a5b678901234567890abcdef1234567890abcdef1234567890'}</p>
                  <p className="text-[7pt] text-slate-500 font-sans italic">Acte officiel notifié avec valeur de sommation préalable à exécution forcée.</p>
                </div>
                {qrCodeUrl && (
                  <div className="flex flex-col items-center ml-2 shrink-0">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code Contrôle"
                      className="w-14 h-14 object-contain p-0.5 border border-slate-300 rounded bg-white shadow-xs"
                    />
                    <span className="text-[6pt] text-slate-500 mt-0.5 font-sans font-medium">Contrôle Légal</span>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
