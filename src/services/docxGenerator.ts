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
import { Establishment } from '../types';

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
                          new TextRun({ text: 'MINISTÈRE DE LA CULTURE, DES ARTS,', bold: true, size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DU PROMOTION DU TOURISME ET DES LOISIRS', bold: true, size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '--------------------', size: 16 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DIRECTION GÉNÉRALE DES LOISIRS', bold: true, size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DIRECTION DÉPARTEMENTALE DES LOISIRS', bold: true, size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'DE POINTE-NOIRE', bold: true, size: 18 }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'SERVICE DE L\'ANIMATION ET DES AGRÉMENTS (SAA)', italics: true, size: 16 }),
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
              new TextRun({ text: 'RÉPUBLIQUE DU CONGO', bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Unité - Travail - Progrès', italics: true, size: 18 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'MINISTÈRE DE LA CULTURE, DES ARTS, DU TOURISME ET DES LOISIRS', size: 18 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE', bold: true, size: 20 }),
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
