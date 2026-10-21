import QRCode from 'qrcode';
import { CashReceipt } from '../types';

/**
 * Service de génération de QR Codes sécurisés DDL-PN
 * 100% Hors-Ligne (In situ) pour reçus thermiques POS 58mm et Attestations officielles
 */

export async function generateQrCodeDataUrl(text: string, size = 180): Promise<string> {
  try {
    // Canvas-based tricolor Congolese gradient generation (Vert - Jaune - Rouge)
    if (typeof document !== 'undefined') {
      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, text, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#00000000', // transparent
        },
        errorCorrectionLevel: 'M',
      });

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = size;
      outputCanvas.height = size;
      const ctx = outputCanvas.getContext('2d');

      if (ctx) {
        // 1. Fond blanc pur pour un contraste et une lisibilité parfaits au scanner
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // 2. Calque de dégradé tricolore national
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = size;
        maskCanvas.height = size;
        const maskCtx = maskCanvas.getContext('2d');

        if (maskCtx) {
          // Dégradé diagonal République du Congo : Vert #009543 -> Jaune #FBDE4A -> Rouge #DC241F
          const grad = maskCtx.createLinearGradient(0, 0, size, size);
          grad.addColorStop(0.0, '#00853c'); // Vert Congo
          grad.addColorStop(0.35, '#009543');
          grad.addColorStop(0.5, '#eab308');  // Jaune Or
          grad.addColorStop(0.65, '#dc2626'); // Rouge Congo
          grad.addColorStop(1.0, '#b91c1c');

          maskCtx.fillStyle = grad;
          maskCtx.fillRect(0, 0, size, size);

          // Découpage du dégradé selon les motifs du QR Code
          maskCtx.globalCompositeOperation = 'destination-in';
          maskCtx.drawImage(tempCanvas, 0, 0);

          // Fusion sur le fond blanc
          ctx.drawImage(maskCanvas, 0, 0);

          return outputCanvas.toDataURL('image/png');
        }
      }
    }

    // Fallback standard
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#00853c',
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
    : 'https://ddlpn.loisirs.gouv.cg';

  const verificationUrl = `${origin}/?verify=receipt&num=${encodeURIComponent(receipt.numeroQuittance)}&etab=${encodeURIComponent(receipt.etablissementNom)}&montant=${encodeURIComponent(receipt.montantVerse)}`;
  return generateQrCodeDataUrl(verificationUrl, 160);
}

/**
 * Génère le QR Code d'une attestation provisoire ou d'un acte juridique pointant vers une URL scannable
 */
export async function generateLegalActQrCode(referenceNumero: string, etablissementNom: string, hash: string): Promise<string> {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ddlpn.loisirs.gouv.cg';

  const verificationUrl = `${origin}/?verify=act&ref=${encodeURIComponent(referenceNumero)}&etab=${encodeURIComponent(etablissementNom)}&hash=${encodeURIComponent(hash)}`;
  return generateQrCodeDataUrl(verificationUrl, 160);
}

/**
 * Génère le QR Code officiel de certification d'une Autorisation d'Exploitation Départementale
 */
export async function generateAuthorizationQrCode(
  authNumero: string,
  etablissementNom: string,
  promoteurNom: string,
  dateDelivrance: string,
  hash: string,
  isPo = false,
  signataireNom?: string
): Promise<string> {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ddlpn.loisirs.gouv.cg';

  let verificationUrl = `${origin}/?verify=auth&num=${encodeURIComponent(authNumero)}&etab=${encodeURIComponent(etablissementNom)}&prom=${encodeURIComponent(promoteurNom)}&date=${encodeURIComponent(dateDelivrance)}&hash=${encodeURIComponent(hash)}`;
  if (isPo) {
    verificationUrl += `&po=true`;
  }
  if (signataireNom) {
    verificationUrl += `&sign=${encodeURIComponent(signataireNom)}`;
  }
  return generateQrCodeDataUrl(verificationUrl, 180);
}

export async function generateConvocationQrCode(
  referenceNumero: string,
  etablissementNom: string,
  promoteurNom: string,
  forfait: number,
  dateComparution: string
): Promise<string> {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ddlpn.loisirs.gouv.cg';

  const verificationUrl = `${origin}/?verify=convocation&ref=${encodeURIComponent(
    referenceNumero
  )}&etab=${encodeURIComponent(etablissementNom)}&prom=${encodeURIComponent(
    promoteurNom
  )}&forfait=${encodeURIComponent(forfait)}&rdv=${encodeURIComponent(dateComparution)}`;
  return generateQrCodeDataUrl(verificationUrl, 180);
}


