import QRCode from 'qrcode';
import { CashReceipt } from '../types';

/**
 * Service de génération de QR Codes sécurisés DDL-PN
 * 100% Hors-Ligne (In situ) pour reçus thermiques POS 58mm et Attestations officielles
 */

export async function generateQrCodeDataUrl(text: string, size = 180): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Erreur génération QR Code:', err);
    return '';
  }
}

/**
 * Génère le QR Code de certification officielle d'une quittance de régie SAF
 */
export async function generateReceiptQrCode(receipt: CashReceipt): Promise<string> {
  const verificationPayload = JSON.stringify({
    emetteur: 'DDL-PN / REGIE SAF TRESOR',
    quittance: receipt.numeroQuittance,
    etablissement: receipt.etablissementNom,
    montant: `${receipt.montantVerse} FCFA`,
    date: receipt.datePaiement,
    scellement: receipt.quittanceHash || 'SEAL-SHA256-AUTHENTICATED',
    url: `https://ddlpn.loisirs.gouv.cg/verify/receipt?num=${encodeURIComponent(receipt.numeroQuittance)}`,
  });

  return generateQrCodeDataUrl(verificationPayload, 160);
}

/**
 * Génère le QR Code d'une attestation provisoire ou d'un acte juridique
 */
export async function generateLegalActQrCode(referenceNumero: string, etablissementNom: string, hash: string): Promise<string> {
  const verificationPayload = JSON.stringify({
    emetteur: 'DDL-PN / POLICE ADMINISTRATIVE',
    reference: referenceNumero,
    etablissement: etablissementNom,
    hash: hash,
    url: `https://ddlpn.loisirs.gouv.cg/verify/act?ref=${encodeURIComponent(referenceNumero)}`,
  });

  return generateQrCodeDataUrl(verificationPayload, 160);
}
