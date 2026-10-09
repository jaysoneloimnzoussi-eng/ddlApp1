import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { Establishment, LegalAct } from '../types';

export interface QuarterlyReportData {
  trimestre: string;
  annee: number;
  totalRecettes: number;
  totalEtablissements: number;
  totalInfractions: number;
  totalMisesEnDemeure: number;
  repartitionArrondissements: { nom: string; montant: number; nombre: number }[];
  actionsPta: string[];
}

/**
 * Downloads a generated Blob as a file in the browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates official Attestation de Dépôt in native DOCX format
 * Conforming strictly to DDL-PN administrative standard
 */
export async function generateAttestationDocx(etablissement: Establishment): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Header 2 columns (Left: Ministere, Right: Republique du Congo)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'MINISTÈRE DE LA CULTURE, DES ARTS,', bold: true, font: 'Garamond', size: 24 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DU PATRIMOINE NATIONAL ET DE', bold: true, font: 'Garamond', size: 24 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'L\'INDUSTRIE TOURISTIQUE', bold: true, font: 'Garamond', size: 24 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '———', font: 'Garamond', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DIRECTION GÉNÉRALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '———', font: 'Garamond', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DÉPARTEMENT DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '———', font: 'Garamond', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DIRECTION DÉPARTEMENTALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '———', font: 'Garamond', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'N°042/MCAPNIT/DGL/DPN/DDL-PN', bold: true, font: 'Garamond', size: 22 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'RÉPUBLIQUE DU CONGO', bold: true, size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'Unité - Travail - Progrès', italics: true, size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: '--------------------', size: 16 }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: `Pointe-Noire, le ${new Date().toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}`,
                            size: 18,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240, after: 240 } }),

          // Reference Number
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: `RÉFÉRENCE : N° ${etablissement.numeroAttestation || '042'}/MCAPNIT/DGL/DDL-PNR/SAA/2026`,
                bold: true,
                size: 20,
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240, after: 240 } }),

          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ATTESTATION PROVISOIRE DE DÉPÔT ET DE CONFORMITÉ',
                bold: true,
                size: 26,
                underline: {},
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240, after: 360 } }),

          // Paragraphe 1 : Constat et identité
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { line: 360, after: 240 },
            children: [
              new TextRun({
                text: `Le Directeur Départemental des Loisirs de Pointe-Noire soussigné atteste par la présente que l'établissement dénommé « `,
                size: 22,
              }),
              new TextRun({
                text: etablissement.nomCommercial.toUpperCase(),
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ` », exploité par Monsieur/Madame `,
                size: 22,
              }),
              new TextRun({
                text: etablissement.promoteurNom,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: `, relevant de la catégorie « ${etablissement.categorie} », sis à Pointe-Noire, Arrondissement `,
                size: 22,
              }),
              new TextRun({
                text: `${etablissement.arrondissement} (Quartier ${etablissement.quartier}, Adresse : ${etablissement.adresseExacte})`,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: `, a régulièrement déposé son dossier de régularisation administrative et acquitté ses droits auprès de la Régie Financière sous la quittance de référence légale.`,
                size: 22,
              }),
            ],
          }),

          // Paragraphe 2 : Autorisation provisoire et obligations strictes
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { line: 360, after: 240 },
            children: [
              new TextRun({
                text: `La présente attestation confère au promoteur la faculté de poursuivre ses activités à titre strictement transitoire, en attendant la délivrance formelle de l'Agrément Ministériel Définitif instruit par la Direction Générale des Loisirs à Brazzaville. L'exploitant s'engage solennellement à respecter les normes prescrites par la Loi N° 21-2019, notamment en matière de salubrité publique, de sécurité des usagers et de maîtrise des décibels sonores.`,
                size: 22,
              }),
            ],
          }),

          // Paragraphe 3 : Validité et révocation
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { line: 360, after: 480 },
            children: [
              new TextRun({
                text: `Délivrée pour valoir et servir ce que de droit, la présente attestation est valable pour une durée de quatre-vingt-dix (90) jours renouvelable à compter de sa signature, et demeure révocable sans préavis en cas de constatation d'infractions répétées ou de non-respect des clauses de la charte de tranquillité publique.`,
                size: 22,
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240, after: 240 } }),

          // Signatures Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Le Chef de Service SAA', bold: true, size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 1200 },
                        children: [
                          new TextRun({ text: 'Inspecteur Principal SAA', italics: true, size: 18 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'Pour le Directeur Départemental', bold: true, size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'Et par délégation, l\'Inspecteur Assermenté', bold: true, size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 1200 },
                        children: [
                          new TextRun({ text: '[Sceau Officiel DDL-PN]', italics: true, size: 18 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = etablissement.nomCommercial.replace(/[^a-zA-Z0-9]/g, '_');
  downloadBlob(blob, `Attestation_Depot_${cleanName}_2026.docx`);
}

/**
 * Generates complete Quarterly Administrative Report in native DOCX format
 */
export async function generateQuarterlyReportDocx(data: QuarterlyReportData): Promise<void> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'RÉPUBLIQUE DU CONGO', bold: true, font: 'Garamond', size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Unité – Travail – Progrès', italics: true, font: 'Garamond', size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'MINISTÈRE DE LA CULTURE, DES ARTS, DU PATRIMOINE NATIONAL ET DE L\'INDUSTRIE TOURISTIQUE', font: 'Garamond', size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'DIRECTION GÉNÉRALE DES LOISIRS', bold: true, font: 'Garamond', size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 }),
            ],
          }),
          new Paragraph({ text: '', spacing: { before: 240, after: 240 } }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: `RAPPORT D'ACTIVITÉ TRIMESTRIEL - ${data.trimestre.toUpperCase()} ${data.annee}`,
                bold: true,
                size: 26,
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240, after: 240 } }),

          new Paragraph({
            children: [
              new TextRun({ text: 'I. SYNTHÈSE DES ACTIONS ET RECOUVREMENTS', bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: `Au cours de ce trimestre (${data.trimestre} ${data.annee}), la Direction Départementale a mobilisé ses brigades SAA, SAF et SPA sur l'ensemble des six arrondissements de Pointe-Noire. Les résultats chiffrés attestent d'une intensification des opérations régaliennes :`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Total des recettes départementales recouvrées : `, size: 20 }),
              new TextRun({ text: `${data.totalRecettes.toLocaleString('fr-FR')} FCFA`, bold: true, size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Établissements recensés et contrôlés : `, size: 20 }),
              new TextRun({ text: `${data.totalEtablissements} établissements`, bold: true, size: 20 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Mises en demeure de 72h notifiées : `, size: 20 }),
              new TextRun({ text: `${data.totalMisesEnDemeure}`, bold: true, size: 20 }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240, after: 240 } }),

          new Paragraph({
            children: [
              new TextRun({ text: 'II. VENTILATION TERRITORIALE PAR ARRONDISSEMENT', bold: true, size: 22 }),
            ],
          }),

          // Table of arrondissements
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Arrondissement', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Établissements', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Recettes (FCFA)', bold: true })] })] }),
                ],
              }),
              ...data.repartitionArrondissements.map(
                (arr: { nom: string; montant: number; nombre: number }) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: arr.nom })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: arr.nombre.toString() })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: arr.montant.toLocaleString('fr-FR') })] })] }),
                    ],
                  })
              ),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240, after: 240 } }),

          new Paragraph({
            children: [
              new TextRun({ text: 'III. EXÉCUTION DU PLAN DE TRAVAIL ANNUEL (PTA 2026)', bold: true, size: 22 }),
            ],
          }),
          ...data.actionsPta.map(
            (act: string) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `✓ ${act}`, size: 20 }),
                ],
              })
          ),

          new Paragraph({ text: '', spacing: { before: 360, after: 240 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Fait à Pointe-Noire, pour transmission à Monsieur le Directeur Général des Loisirs.', italics: true, size: 18 }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `Rapport_Trimestriel_${data.trimestre}_${data.annee}_DDL_PN.docx`);
}

export interface TransmissionLetterData {
  numeroActe?: string;
  dateLieu?: string;
  destinataireTitre?: string;
  destinataireVille?: string;
  emetteurTitre?: string;
  objet?: string;
  reference?: string;
  corpsTexte?: string[];
  signataireNom?: string;
  signataireTitre?: string;
  pieceJointe?: string;
}

/**
 * Generates official Transmission Letter (.docx) with exact DDL-PN header and Garamond 13pt
 */
export async function generateTransmissionLetterDocx(data: TransmissionLetterData): Promise<void> {
  const numeroActe = data.numeroActe || 'N°035/MCAPNIT/DGL/DPN/DDL-PN';
  const dateLieu = data.dateLieu || 'Pointe-Noire, le 06 octobre 2026';
  const destinataire = data.destinataireTitre || 'Madame la Directrice Générale des Loisirs';
  const destinataireVille = data.destinataireVille || 'Brazzaville';
  const emetteurTitre = data.emetteurTitre || 'Le Directeur Départemental des Loisirs de Pointe-Noire';
  const objet = data.objet || "Transmission du Rapport d'Activités du 3ème Trimestre 2026.";
  const reference = data.reference || 'N°033/MCAPNIT/DGL/DPN/DDL-PN du 23 septembre 2026.';
  const signataireNom = data.signataireNom || 'Jean Richard NTSEKE NGOUAKA';
  const pieceJointe = data.pieceJointe || "Rapport d'Activités du 3ème Trimestre 2026.";

  const paragraphs = data.corpsTexte && data.corpsTexte.length > 0 ? data.corpsTexte : [
    "J'ai l'honneur de vous transmettre, ci-joint, le Rapport d'Activités du troisième trimestre 2026 de la Direction Départementale des Loisirs de Pointe-Noire, couvrant la période du 1er juillet au 30 septembre 2026.",
    "Veuillez agréer, Madame la Directrice Générale, l'expression de ma considération distinguée."
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2.0 cm
              bottom: 1134, // 2.0 cm
              left: 1417, // 2.5 cm (standard administratif congolais)
              right: 1134, // 2.0 cm
            },
          },
        },
        children: [
          // 2 Columns Official Header
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'MINISTÈRE DE LA CULTURE, DES ARTS,', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DU PATRIMOINE NATIONAL ET DE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'L\'INDUSTRIE TOURISTIQUE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DIRECTION GÉNÉRALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DÉPARTEMENT DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DIRECTION DÉPARTEMENTALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: numeroActe, bold: true, font: 'Garamond', size: 24 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'RÉPUBLIQUE DU CONGO', bold: true, font: 'Garamond', size: 24 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Unité – Travail – Progrès', italics: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '————————', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ text: '', spacing: { before: 180 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: emetteurTitre, italics: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'À', bold: true, font: 'Garamond', size: 24 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: destinataire, bold: true, font: 'Garamond', size: 24 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: destinataireVille, italics: true, font: 'Garamond', size: 22 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Date alignée à droite
          new Paragraph({ text: '', spacing: { before: 240 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: dateLieu, italics: true, font: 'Garamond', size: 24 })],
          }),

          // Objet & Référence
          new Paragraph({ text: '', spacing: { before: 180 } }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Objet : ', bold: true, font: 'Garamond', size: 24 }),
              new TextRun({ text: objet, font: 'Garamond', size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Référence : ', bold: true, font: 'Garamond', size: 24 }),
              new TextRun({ text: reference, italics: true, font: 'Garamond', size: 24 }),
            ],
          }),

          // Formule d'appel
          new Paragraph({ text: '', spacing: { before: 360 } }),
          new Paragraph({
            children: [new TextRun({ text: 'Madame la Directrice Générale,', font: 'Garamond', size: 26 })],
          }),

          // Paragraphes du corps en Garamond 13pt (size: 26) avec retrait 1er ligne
          ...paragraphs.map(p =>
            new Paragraph({
              spacing: { before: 200, line: 360 },
              indent: { firstLine: 720 }, // Retrait paragraphe standard
              alignment: AlignmentType.JUSTIFIED,
              children: [new TextRun({ text: p, font: 'Garamond', size: 26 })],
            })
          ),

          // Bloc signature
          new Paragraph({ text: '', spacing: { before: 600 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Le Directeur Départemental des Loisirs de Pointe-Noire', bold: true, font: 'Garamond', size: 24 }),
            ],
          }),
          new Paragraph({ text: '', spacing: { before: 900 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: signataireNom, bold: true, font: 'Garamond', size: 26 }),
            ],
          }),

          // Pièce jointe
          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Pièce jointe : ', bold: true, font: 'Garamond', size: 22 }),
              new TextRun({ text: pieceJointe, italics: true, font: 'Garamond', size: 22 }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `Lettre_Transmission_${numeroActe.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  downloadBlob(blob, safeFilename);
}

export interface BordereauSoitTransmisData {
  numeroBordereau: string;
  dateTransmission: string;
  listeEtablissements: {
    referenceDossier: string;
    etablissementNom: string;
    promoteurNom: string;
    arrondissement: string;
    montantRegieAcquitte: number;
  }[];
  observations?: string;
  signataire?: string;
}

/**
 * Generates official Bordereau Soit-Transmis (.docx) with table of dossiers
 */
export async function generateBordereauSoitTransmisDocx(data: BordereauSoitTransmisData): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              bottom: 1134,
              left: 1417,
              right: 1134,
            },
          },
        },
        children: [
          // Header 2 Columns
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'MINISTÈRE DE LA CULTURE, DES ARTS,', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DU PATRIMOINE NATIONAL ET DE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'L\'INDUSTRIE TOURISTIQUE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DIRECTION GÉNÉRALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DÉPARTEMENT DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DIRECTION DÉPARTEMENTALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'RÉPUBLIQUE DU CONGO', bold: true, font: 'Garamond', size: 24 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Unité – Travail – Progrès', italics: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '————————', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ text: '', spacing: { before: 180 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Transmis à :', italics: true, font: 'Garamond', size: 20 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Madame la Directrice Générale des Loisirs', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Brazzaville', italics: true, font: 'Garamond', size: 20 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'BORDEREAU D\'ENVOI (SOIT-TRANSMIS)', bold: true, font: 'Garamond', size: 26 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `N° ${data.numeroBordereau}`, bold: true, font: 'Garamond', size: 24 }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 180 } }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date d'expédition : Pointe-Noire, le ${data.dateTransmission}`, italics: true, font: 'Garamond', size: 22 }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 180 } }),

          // Tableau des dossiers
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Réf. Dossier', bold: true, font: 'Garamond' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Établissement & Promoteur', bold: true, font: 'Garamond' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Arrondissement', bold: true, font: 'Garamond' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Recette SAF', bold: true, font: 'Garamond' })] })] }),
                ],
              }),
              ...data.listeEtablissements.map(
                (item) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.referenceDossier, font: 'Garamond' })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${item.etablissementNom} (${item.promoteurNom})`, font: 'Garamond' })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.arrondissement, font: 'Garamond' })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${item.montantRegieAcquitte.toLocaleString('fr-FR')} FCFA`, font: 'Garamond' })] })] }),
                    ],
                  })
              ),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 240 } }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Observations : ', bold: true, font: 'Garamond', size: 22 }),
              new TextRun({ text: data.observations || 'Dossiers régularisés au niveau départemental pour délivrance de l\'Agrément ministériel définitif.', font: 'Garamond', size: 22 }),
            ],
          }),

          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Le Directeur Départemental des Loisirs de Pointe-Noire', bold: true, font: 'Garamond', size: 24 }),
            ],
          }),
          new Paragraph({ text: '', spacing: { before: 800 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Jean Richard NTSEKE NGOUAKA', bold: true, font: 'Garamond', size: 26 }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `Soit_Transmis_${data.numeroBordereau.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  downloadBlob(blob, safeFilename);
}

export interface UniversalAdministrativeDocxData {
  titreActe: string;
  numeroActe: string;
  dateLieu: string;
  destinataireTitre?: string;
  destinataireVille?: string;
  emetteurTitre?: string;
  objet?: string;
  reference?: string;
  formuleAppel?: string;
  sections: {
    titre?: string;
    contenu: string;
  }[];
  signataireNom?: string;
  signataireTitre?: string;
  piecesJointes?: string;
  ampliations?: string[];
  margeGaucheCm?: number;
  margeDroiteCm?: number;
  margeHautCm?: number;
  margeBasCm?: number;
}

/**
 * Universal DOCX generator for the Administrative Drafting Canva (TDR, Convocations, Rapports, etc.)
 */
export async function generateUniversalAdministrativeDocx(data: UniversalAdministrativeDocxData): Promise<void> {
  const topDxa = Math.round((data.margeHautCm ?? 2.0) * 567);
  const bottomDxa = Math.round((data.margeBasCm ?? 2.0) * 567);
  const leftDxa = Math.round((data.margeGaucheCm ?? 2.5) * 567);
  const rightDxa = Math.round((data.margeDroiteCm ?? 2.0) * 567);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: topDxa,
              bottom: bottomDxa,
              left: leftDxa,
              right: rightDxa,
            },
          },
        },
        children: [
          // 2 Columns Official Header
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'MINISTÈRE DE LA CULTURE, DES ARTS,', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DU PATRIMOINE NATIONAL ET DE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'L\'INDUSTRIE TOURISTIQUE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DIRECTION GÉNÉRALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DÉPARTEMENT DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DIRECTION DÉPARTEMENTALE DES LOISIRS', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'DE POINTE-NOIRE', bold: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: '———', font: 'Garamond', size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: data.numeroActe, bold: true, font: 'Garamond', size: 24 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'RÉPUBLIQUE DU CONGO', bold: true, font: 'Garamond', size: 24 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Unité – Travail – Progrès', italics: true, font: 'Garamond', size: 22 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '————————', font: 'Garamond', size: 18 })] }),
                      ...(data.destinataireTitre
                        ? [
                            new Paragraph({ text: '', spacing: { before: 140 } }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.emetteurTitre || 'Le Directeur Départemental', italics: true, font: 'Garamond', size: 20 })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'À', bold: true, font: 'Garamond', size: 22 })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.destinataireTitre, bold: true, font: 'Garamond', size: 22 })] }),
                            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.destinataireVille || 'Pointe-Noire', italics: true, font: 'Garamond', size: 20 })] }),
                          ]
                        : []),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Date alignée à droite
          new Paragraph({ text: '', spacing: { before: 200 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: data.dateLieu, italics: true, font: 'Garamond', size: 24 })],
          }),

          // Titre principal si présent (ex: CONVOCATION, TERMES DE RÉFÉRENCE, RAPPORT)
          ...(data.titreActe
            ? [
                new Paragraph({ text: '', spacing: { before: 240 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: data.titreActe.toUpperCase(), bold: true, font: 'Garamond', size: 28 })],
                }),
              ]
            : []),

          // Objet & Référence
          ...(data.objet
            ? [
                new Paragraph({ text: '', spacing: { before: 180 } }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Objet : ', bold: true, font: 'Garamond', size: 24 }),
                    new TextRun({ text: data.objet, font: 'Garamond', size: 24 }),
                  ],
                }),
              ]
            : []),
          ...(data.reference
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Référence : ', bold: true, font: 'Garamond', size: 24 }),
                    new TextRun({ text: data.reference, italics: true, font: 'Garamond', size: 24 }),
                  ],
                }),
              ]
            : []),

          ...(data.formuleAppel
            ? [
                new Paragraph({ text: '', spacing: { before: 200 } }),
                new Paragraph({
                  children: [new TextRun({ text: data.formuleAppel, font: 'Garamond', size: 26 })],
                }),
              ]
            : []),

          // Sections et paragraphes
          ...data.sections.flatMap((sec) => [
            ...(sec.titre
              ? [
                  new Paragraph({ text: '', spacing: { before: 240 } }),
                  new Paragraph({
                    children: [new TextRun({ text: sec.titre, bold: true, font: 'Garamond', size: 24 })],
                  }),
                ]
              : []),
            new Paragraph({
              spacing: { before: 160, line: 360 },
              indent: { firstLine: 720 },
              alignment: AlignmentType.JUSTIFIED,
              children: [new TextRun({ text: sec.contenu, font: 'Garamond', size: 26 })],
            }),
          ]),

          // Signature
          new Paragraph({ text: '', spacing: { before: 500 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: data.signataireTitre || 'Le Directeur Départemental des Loisirs', bold: true, font: 'Garamond', size: 24 }),
            ],
          }),
          new Paragraph({ text: '', spacing: { before: 900 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: data.signataireNom || 'Jean Richard NTSEKE NGOUAKA', bold: true, font: 'Garamond', size: 26 }),
            ],
          }),

          // Pièces jointes & Ampliations en bas
          ...(data.piecesJointes
            ? [
                new Paragraph({ text: '', spacing: { before: 300 } }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Pièce(s) jointe(s) : ', bold: true, font: 'Garamond', size: 20 }),
                    new TextRun({ text: data.piecesJointes, font: 'Garamond', size: 20 }),
                  ],
                }),
              ]
            : []),

          ...(data.ampliations && data.ampliations.length > 0
            ? [
                new Paragraph({ text: '', spacing: { before: 200 } }),
                new Paragraph({
                  children: [new TextRun({ text: 'Ampliations : ', bold: true, font: 'Garamond', size: 20 })],
                }),
                ...data.ampliations.map(
                  (amp) =>
                    new Paragraph({
                      indent: { left: 360 },
                      children: [new TextRun({ text: `- ${amp}`, font: 'Garamond', size: 18 })],
                    })
                ),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `${data.titreActe.replace(/[^a-zA-Z0-9]/g, '_')}_${data.numeroActe.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  downloadBlob(blob, safeFilename);
}

export async function generateLegalActDocx(act: LegalAct): Promise<void> {
  let titreDoc = "MISE EN DEMEURE";
  if (act.type === 'arrete_fermeture') titreDoc = "ARRÊTÉ DE FERMETURE ADMINISTRATIVE";
  if (act.type === 'pv_sonometrie') titreDoc = "PROCÈS-VERBAL DE CONSTAT SONOMÉTRIQUE";
  if (act.type === 'ordre_mission') titreDoc = "ORDRE DE MISSION DE BRIGADE MOBILE";

  await generateUniversalAdministrativeDocx({
    titreActe: titreDoc,
    numeroActe: `N° ${act.referenceNumero}`,
    dateLieu: `Pointe-Noire, le ${act.dateEmission}`,
    destinataireTitre: `Promoteur : ${act.promoteurNom} (${act.etablissementNom})`,
    destinataireVille: act.arrondissement,
    emetteurTitre: 'Le Directeur Départemental des Loisirs de Pointe-Noire',
    objet: `${titreDoc} — Établissement ${act.etablissementNom} (${act.arrondissement})`,
    reference: "Loi N° 21-2019 du 15 novembre 2019 fixant les règles relatives aux loisirs en République du Congo.",
    formuleAppel: "Monsieur / Madame le Promoteur,",
    sections: [
      {
        titre: "I. VISAS ET FONDEMENTS JURIDIQUES",
        contenu: "VU la Constitution de la République du Congo ;\nVU la Loi N° 21-2019 du 15 novembre 2019 fixant les règles relatives aux loisirs en République du Congo ;\nVU le Décret portant attributions et organisation du Ministère de la Culture, des Arts, du Patrimoine National et de l'Industrie Touristique ;\nVU l'Arrêté Préfectoral réprimant les pollutions acoustiques et le tapage nocturne dans le Département de Pointe-Noire.",
      },
      {
        titre: "II. CONSTATS ET MOTIFS DE LA DÉCISION",
        contenu: `Considérant les constats matériels dressés par les inspecteurs assermentés de la Brigade SAA de la Direction Départementale des Loisirs de Pointe-Noire : ${act.motifs} ${act.decibelsMesures ? `Niveau d'intensité sonore contradictoire mesuré : ${act.decibelsMesures} dB(A), excédant largement les seuils réglementaires autorisés.` : ''}`,
      },
      {
        titre: act.delaiHeures ? `III. INJONCTION ET DÉLAI D'EXÉCUTION (${act.delaiHeures} HEURES)` : "III. DÉCISION ADMINISTRATIVE",
        contenu: act.delaiHeures
          ? `Il est imparti à l'exploitant un délai strict et impératif de ${act.delaiHeures} heures à compter de la notification du présent acte pour régulariser sa situation administrative et se conformer aux prescriptions techniques, sous peine de fermeture immédiate et de poursuites contentieuses.`
          : `L'établissement ${act.etablissementNom} fait l'objet d'une suspension immédiate d'activité avec pose des scellés réglementaires par la force publique jusqu'à mise en conformité intégrale.`,
      },
    ],
    signataireNom: "Jean Richard NTSEKE NGOUAKA",
    signataireTitre: "Le Directeur Départemental des Loisirs de Pointe-Noire",
    ampliations: [
      "Direction Générale des Loisirs / Brazzaville",
      "Cabinet de Monsieur le Préfet du Département de Pointe-Noire",
      "Mairie Centrale de Pointe-Noire",
      "Commandement des Forces de Police de Pointe-Noire",
      "Archives / Chrono Contentieux",
    ],
  });
}

