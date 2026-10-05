import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, Download, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { generateAttestationDocx } from '../../services/docxGenerator';
import { formatCfa } from '../../services/crypto';

export const PrintModal: React.FC = () => {
  const { printMode, printData, closePrintModal } = useApp();

  if (printMode === 'none' || !printData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = async () => {
    if (printMode === 'a4_attestation') {
      await generateAttestationDocx(printData);
    }
  };

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
            {printMode === 'a4_attestation' && (
              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
              >
                <Download className="w-4 h-4" />
                Télécharger .DOCX (Word)
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              Imprimer Vectoriel
            </button>
            <button
              onClick={closePrintModal}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-950/60">
          {/* 1. ATTESTATION DE DÉPÔT A4 OFFICIELLE */}
          {printMode === 'a4_attestation' && (
            <div className="page-a4 bg-white text-slate-950 p-8 md:p-12 rounded shadow-2xl max-w-[210mm] w-full border border-slate-300 font-serif leading-relaxed text-sm">
              {/* Header 2 columns */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div className="text-left text-xs font-bold text-slate-900 uppercase space-y-0.5 max-w-[50%]">
                  <p>Ministère de la Culture, des Arts,</p>
                  <p>du Tourisme et des Loisirs</p>
                  <p className="text-[10px] tracking-widest">------------------------</p>
                  <p>Direction Générale des Loisirs</p>
                  <p className="font-cinzel text-slate-950 font-black text-sm">
                    Direction Départementale des Loisirs
                  </p>
                  <p className="font-cinzel text-slate-950 font-black text-sm">
                    de Pointe-Noire
                  </p>
                  <p className="font-mono text-[10px] text-slate-700 italic pt-1">
                    Service de l'Animation et des Agréments (SAA)
                  </p>
                </div>

                <div className="text-right text-xs uppercase space-y-0.5">
                  <p className="font-cinzel font-black text-sm text-slate-950">
                    RÉPUBLIQUE DU CONGO
                  </p>
                  <p className="italic font-serif text-[11px] text-slate-700 normal-case">
                    Unité - Travail - Progrès
                  </p>
                  <p className="text-[10px] tracking-widest text-slate-400">------------------------</p>
                  <p className="text-[11px] font-medium text-slate-800 pt-2 normal-case">
                    Pointe-Noire, le{' '}
                    <span className="font-bold underline">
                      {new Date().toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                </div>
              </div>

              {/* Reference */}
              <div className="mb-6 font-mono text-xs font-bold text-slate-900 bg-slate-100 p-2 border-l-4 border-slate-900">
                RÉFÉRENCE : N° {printData.numeroAttestation || '042'}/MCAPNIT/DGL/DDL-PNR/SAA/2026
              </div>

              {/* Title */}
              <div className="text-center my-6">
                <h1 className="font-cinzel text-xl font-black uppercase tracking-wider text-slate-950 underline decoration-2 underline-offset-4">
                  ATTESTATION PROVISOIRE DE DÉPÔT ET DE CONFORMITÉ
                </h1>
                <p className="text-xs font-mono text-slate-600 mt-1">
                  Valable pour l'exploitation transitoire - Titre N° 2026/{printData.codeDossier?.substring(11)}
                </p>
              </div>

              {/* Paragraphe 1 */}
              <p className="text-justify mb-4 text-[13px] leading-6">
                Le Directeur Départemental des Loisirs de Pointe-Noire soussigné atteste par la présente que l'établissement de loisirs dénommé{' '}
                <strong className="font-black uppercase tracking-wide">
                  « {printData.nomCommercial} »
                </strong>
                , exploité par{' '}
                <strong className="font-bold">{printData.promoteurNom}</strong>, relevant de la catégorie{' '}
                <em>{printData.categorie}</em>, sis à Pointe-Noire, Arrondissement{' '}
                <strong className="underline">
                  {printData.arrondissement} (Quartier {printData.quartier}, {printData.adresseExacte})
                </strong>
                , a régulièrement déposé auprès de nos services son dossier technique de régularisation et s'est acquitté des redevances départementales requises par la Régie Financière.
              </p>

              {/* Paragraphe 2 */}
              <p className="text-justify mb-4 text-[13px] leading-6">
                La présente attestation confère au promoteur la faculté de poursuivre ses activités à titre strictement transitoire, en attendant la délivrance solennelle de l'Agrément Ministériel Définitif instruit par la Direction Générale des Loisirs à Brazzaville. L'exploitant s'engage expressément à respecter les prescriptions de la Loi N° 21-2019, notamment en ce qui concerne la salubrité des lieux, la sécurité physique des usagers et la stricte limitation des émergences sonores nocturnes.
              </p>

              {/* Paragraphe 3 */}
              <p className="text-justify mb-8 text-[13px] leading-6">
                Délivrée pour valoir et servir ce que de droit, la présente attestation est valable pour une période de{' '}
                <strong>quatre-vingt-dix (90) jours renouvelable</strong> à compter de sa signature, et demeure révocable sans préavis en cas de constatation d'infraction caractérisée ou de trouble grave à la tranquillité publique.
              </p>

              {/* Security watermark and Hash */}
              <div className="p-2 bg-slate-50 border border-slate-300 rounded font-mono text-[9px] text-slate-600 flex justify-between items-center mb-10">
                <span>Code Sécurisé : {printData.codeDossier}</span>
                <span>Statut : {printData.statut?.toUpperCase()}</span>
                <span>Contrôle QR : ACTIF</span>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-4 mt-6">
                <div className="text-center w-60">
                  <p className="font-bold text-xs uppercase mb-14 text-slate-900">
                    Le Chef de Service SAA
                  </p>
                  <div className="border-t border-slate-800 pt-1">
                    <p className="font-bold text-xs">Inspecteur Principal SAA</p>
                    <p className="text-[10px] text-slate-600">Brigade Assermentée</p>
                  </div>
                </div>

                <div className="text-center w-72">
                  <p className="font-bold text-xs uppercase mb-1 text-slate-900">
                    Pour le Directeur Départemental
                  </p>
                  <p className="text-[11px] italic mb-12">Et par délégation, l'Inspecteur Assermenté</p>
                  <div className="border-t border-slate-800 pt-1 relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-2 border-dashed border-red-700/60 flex items-center justify-center rotate-12 pointer-events-none opacity-80">
                      <span className="text-[9px] font-bold text-red-700 uppercase tracking-tighter text-center">
                        DDL-PN<br/>SCEAU<br/>OFFICIEL
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-950">Gildas AMBETOS</p>
                    <p className="text-[10px] text-slate-600">Inspecteur Central des Loisirs</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. REÇU THERMIQUE POS 58MM */}
          {printMode === 'pos_receipt' && (
            <div className="receipt-58mm bg-white text-slate-950 p-4 rounded shadow-2xl w-[58mm] font-mono text-[10px] leading-tight border border-slate-300">
              <div className="text-center mb-2">
                <p className="font-bold text-xs">RÉPUBLIQUE DU CONGO</p>
                <p className="text-[8px]">MCAPNIT / DGL / DDL-PN</p>
                <p className="font-bold text-[9px] mt-1">RÉGIE DES RECETTES SAF</p>
                <p className="text-[8px]">BRIGADE MOBILE DE RECOUVREMENT</p>
                <p className="text-[8px] my-1">==============================</p>
              </div>

              <div className="space-y-1 my-2">
                <p className="font-bold text-[11px]">QUITTANCE N° :</p>
                <p className="font-black text-xs">{printData.numeroQuittance}</p>
                <p className="text-[9px]">Date : {printData.datePaiement}</p>
                <p className="text-[9px]">Arrondissement : {printData.arrondissement}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-800 py-1.5 my-2 space-y-1">
                <p className="font-bold truncate">Établissement :</p>
                <p className="font-bold uppercase text-[11px]">{printData.etablissementNom}</p>
                <p className="truncate">Promoteur : {printData.promoteurNom}</p>
                <p className="text-[9px] italic">Nature : {printData.natureRecette}</p>
              </div>

              <div className="space-y-1 text-right my-2">
                <p className="text-[9px]">Mode : {printData.modePaiement?.toUpperCase()}</p>
                <p className="text-xs">MONTANT VERSÉ :</p>
                <p className="font-black text-sm">{formatCfa(printData.montantVerse)}</p>
                <p className="text-[9px] text-slate-700">
                  Reste à payer : {formatCfa(printData.resteAPayer || 0)}
                </p>
              </div>

              <div className="border-t border-dashed border-slate-800 pt-2 my-2 text-center text-[8px] space-y-1">
                <p>Agent : {printData.inspecteurOuCaissier}</p>
                <p className="font-mono truncate text-[7px]">Hash: {printData.quittanceHash?.substring(0, 24)}...</p>
                <div className="my-2 py-1 bg-slate-100 border border-slate-400 font-mono text-[8px] tracking-widest font-bold">
                  ||| | |||| | ||| || |||
                </div>
                <p className="font-bold">CONSERVEZ CETTE QUITTANCE</p>
                <p>À présenter à toute réquisition des Brigades SAA</p>
              </div>
            </div>
          )}

          {/* 3. ACTE DE POLICE ADMINISTRATIVE A4 */}
          {printMode === 'a4_legal_act' && (
            <div className="page-a4 bg-white text-slate-950 p-8 md:p-12 rounded shadow-2xl max-w-[210mm] w-full border border-slate-300 font-serif leading-relaxed text-sm">
              <div className="flex justify-between items-start border-b-2 border-red-800 pb-3 mb-6">
                <div>
                  <p className="font-bold text-xs uppercase">Direction Départementale des Loisirs de Pointe-Noire</p>
                  <p className="font-mono text-xs text-red-800 font-bold">Police Administrative des Loisirs & Contentieux</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-black text-xs font-cinzel">RÉPUBLIQUE DU CONGO</p>
                  <p className="italic text-[10px]">Unité - Travail - Progrès</p>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-3 mb-6">
                <p className="font-mono text-xs font-bold text-red-950">
                  RÉF : {printData.referenceNumero}
                </p>
                <p className="text-xs text-red-800">
                  Date d'émission : {printData.dateEmission} | Arrondissement : {printData.arrondissement}
                </p>
              </div>

              <div className="text-center my-6">
                <h2 className="font-cinzel text-lg font-black uppercase text-red-950">
                  {printData.type === 'mise_en_demeure' && "MISE EN DEMEURE SOUS SOIXANTE-DOUZE (72) HEURES"}
                  {printData.type === 'arrete_fermeture' && "ARRÊTÉ DE FERMETURE ADMINISTRATIVE AVEC RÉQUISITION"}
                  {printData.type === 'pv_sonometrie' && "PROCÈS-VERBAL DE CONSTAT SONOMÉTRIQUE CONTRADICTOIRE"}
                  {printData.type === 'ordre_mission' && "ORDRE DE MISSION DE BRIGADE MOBILE DDL-PN"}
                </h2>
                <p className="text-xs font-bold uppercase mt-1 text-slate-800">
                  À l'encontre de : {printData.etablissementNom} (Exploitant : {printData.promoteurNom})
                </p>
              </div>

              <div className="my-6 space-y-4 text-justify text-xs leading-6">
                <p>
                  <strong>VU</strong> la Loi N° 21-2019 du 15 novembre 2019 fixant les règles relatives aux loisirs en République du Congo ;
                </p>
                <p>
                  <strong>VU</strong> l'Arrêté Préfectoral N° 045/P-PNR/CAB réprimant les nuisances acoustiques et le tapage nocturne ;
                </p>
                <p>
                  <strong>CONSIDÉRANT</strong> les constats dressés par les inspecteurs assermentés de la Brigade Mobile SAA :
                </p>
                <div className="p-3 bg-slate-100 rounded border border-slate-300 font-sans text-xs">
                  <p className="font-semibold text-slate-900">Motifs et faits constatés :</p>
                  <p className="text-slate-800 mt-1">{printData.motifs}</p>
                  {printData.decibelsMesures && (
                    <p className="mt-2 font-mono font-bold text-red-700">
                      Niveau sonore mesuré : {printData.decibelsMesures} dB(A) [Seuil maximal autorisé : 65 dB(A)]
                    </p>
                  )}
                </div>

                {printData.delaiHeures && (
                  <p className="font-bold text-red-700">
                    INJONCTION : Il est imparti à l'exploitant un délai strict et impératif de {printData.delaiHeures} heures pour se conformer intégralement. À défaut, la fermeture immédiate de l'établissement sera prononcée avec réquisition de la force publique et pose des scellés départementaux.
                  </p>
                )}
              </div>

              <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-300">
                <div className="text-xs">
                  <p className="font-bold">Inspecteurs signataires :</p>
                  {printData.inspecteursAssermentes?.map((insp: string, i: number) => (
                    <p key={i} className="text-slate-700">• {insp}</p>
                  ))}
                </div>
                <div className="text-center text-xs">
                  <p className="font-bold uppercase">Le Directeur Départemental des Loisirs</p>
                  <div className="mt-10 font-bold">Commandement Territorial SAA</div>
                </div>
              </div>
            </div>
          )}

          {/* 4. CARTE PRO / BADGE INSPECTEUR */}
          {printMode === 'staff_badge' && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl shadow-2xl w-96 border-2 border-emerald-500/50 font-sans">
              <div className="flex justify-between items-center border-b border-emerald-500/30 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
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
  );
};
