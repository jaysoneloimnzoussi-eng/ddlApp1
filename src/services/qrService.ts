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

/**
 * Génère le QR Code de certification officielle d'une quittance de régie SAF
 */
export async function generateReceiptQrCode(receipt: CashReceipt): Promise<string> {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://ddlpn.loisirs.gouv.cg';
  const verifyUrl = `${origin}?verify=receipt&num=${encodeURIComponent(receipt.numeroQuittance)}`;

  const verificationPayload = JSON.stringify({
    emetteur: 'DDL-PN / REGIE SAF TRESOR',
    quittance: receipt.numeroQuittance,
    etablissement: receipt.etablissementNom,
    montant: `${receipt.montantVerse} FCFA`,
    date: receipt.datePaiement,
    scellement: receipt.quittanceHash || 'SEAL-SHA256-AUTHENTICATED',
    url: verifyUrl,
  });

  return generateQrCodeDataUrl(verificationPayload, 160);
}

/**
 * Génère le QR Code d'une attestation provisoire ou d'un acte juridique
 */
export async function generateLegalActQrCode(referenceNumero: string, etablissementNom: string, hash: string): Promise<string> {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://ddlpn.loisirs.gouv.cg';
  const verifyUrl = `${origin}?verify=act&ref=${encodeURIComponent(referenceNumero)}`;

  const verificationPayload = JSON.stringify({
    emetteur: 'DDL-PN / POLICE ADMINISTRATIVE',
    reference: referenceNumero,
    etablissement: etablissementNom,
    hash: hash,
    url: verifyUrl,
  });

  return generateQrCodeDataUrl(verificationPayload, 160);
}
