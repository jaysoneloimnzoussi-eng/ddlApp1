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

export interface AttestationVerificationData {
  referenceNumero: string;
  etablissementNom: string;
  promoteurNom?: string;
  dateDepot?: string;
  codeDossier?: string;
  statut?: string;
}

/**
 * Construit l'URL publique de vérification officielle d'une attestation de dépôt
 * Compatible nativement avec les lecteurs de QR Code de smartphones (iOS / Android)
 */
export function getAttestationVerificationUrl(data: AttestationVerificationData): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ais-pre-ftzn6g7lleao4hsua3ruyd-423672129970.europe-west2.run.app';

  const params = new URLSearchParams();
  params.set('verify', 'attestation');
  params.set('ref', data.referenceNumero || 'N°042/MCAPNIT/DGL/DPN/DDL-PN');
  params.set('etab', data.etablissementNom || 'LE ROCHER');
  if (data.promoteurNom) params.set('prom', data.promoteurNom);
  if (data.dateDepot) params.set('date', data.dateDepot);
  if (data.codeDossier) params.set('code', data.codeDossier);
  if (data.statut) params.set('statut', data.statut);

  return `${origin}/?${params.toString()}`;
}

/**
 * Génère le QR Code officiel d'une attestation de dépôt renvoyant vers la page publique de certification
 */
export async function generateAttestationQrCode(data: AttestationVerificationData, size = 180): Promise<string> {
  const verificationUrl = getAttestationVerificationUrl(data);
  return generateQrCodeDataUrl(verificationUrl, size);
}

/**
 * Génère le QR Code de certification officielle d'une quittance de régie SAF
 */
export async function generateReceiptQrCode(receipt: CashReceipt): Promise<string> {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ais-pre-ftzn6g7lleao4hsua3ruyd-423672129970.europe-west2.run.app';

  const verificationUrl = `${origin}/?verify=receipt&num=${encodeURIComponent(receipt.numeroQuittance)}&etab=${encodeURIComponent(receipt.etablissementNom)}&montant=${encodeURIComponent(receipt.montantVerse)}`;
  return generateQrCodeDataUrl(verificationUrl, 160);
}

/**
 * Génère le QR Code d'une attestation provisoire ou d'un acte juridique pointant vers une URL scannable
 */
export async function generateLegalActQrCode(referenceNumero: string, etablissementNom: string, hash: string): Promise<string> {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ais-pre-ftzn6g7lleao4hsua3ruyd-423672129970.europe-west2.run.app';

  const verificationUrl = `${origin}/?verify=attestation&ref=${encodeURIComponent(referenceNumero)}&etab=${encodeURIComponent(etablissementNom)}&hash=${encodeURIComponent(hash)}`;
  return generateQrCodeDataUrl(verificationUrl, 160);
}

