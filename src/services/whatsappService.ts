import { formatCfa } from './crypto';

/**
 * Service de Notification WhatsApp Officiel DDL-PN
 * Ouvre directement l'application WhatsApp (mobile ou web) avec un message rédigé formel
 */

export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^\d]/g, '');
  // Format Congo (+242)
  if (clean.startsWith('0')) {
    clean = '242' + clean.substring(1);
  } else if (!clean.startsWith('242') && clean.length === 9) {
    clean = '242' + clean;
  }
  return clean;
}

export function openWhatsAppReminder(params: {
  phone: string;
  etablissementNom: string;
  promoteurNom: string;
  montantDu: number;
  rdvDate?: string;
  inspecteurNom?: string;
}): void {
  const cleanNumber = cleanPhoneForWhatsApp(params.phone);
  if (!cleanNumber) return;

  const text = `*DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE (DDL-PN)*
_RÉPUBLIQUE DU CONGO • MCAPNIT / DGL_

Bonjour M./Mme *${params.promoteurNom}* (${params.etablissementNom}),

Nos services vous rappellent que la régularisation de la redevance départementale pour l'exercice en cours présente un solde à recouvrer de :
👉 *${formatCfa(params.montantDu)}*

${params.rdvDate ? `📅 *Visite de la Brigade SAA prévue le :* ${params.rdvDate}` : ''}
${params.inspecteurNom ? `👤 *Agent instructeur :* ${params.inspecteurNom}` : ''}

Merci de bien vouloir préparer votre règlement (Espèces, MoMo ou Airtel Money) auprès de nos inspecteurs assermentés munis de leur badge officiel et de leur terminal de quittance.

_Pour la Direction Départementale des Loisirs de Pointe-Noire._`;

  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function openWhatsAppNotice(params: {
  phone: string;
  etablissementNom: string;
  promoteurNom: string;
  motifs: string;
  referenceNumero: string;
}): void {
  const cleanNumber = cleanPhoneForWhatsApp(params.phone);
  if (!cleanNumber) return;

  const text = `*NOTIFICATION OFFICIELLE DE POLICE ADMINISTRATIVE*
*RÉPUBLIQUE DU CONGO • DDL-PN POINTE-NOIRE*

À l'attention de M./Mme *${params.promoteurNom}*,
Exploitant de l'établissement *« ${params.etablissementNom} »*.

Objet : Notification de l'acte N° *${params.referenceNumero}*
Motif : *${params.motifs}*

Il vous est formellement enjoint de vous conformer aux prescriptions de la Loi N° 21-2019 dans un délai strict de 72 heures sous peine de sanctions administratives et fermeture d'office.

_Direction Départementale des Loisirs de Pointe-Noire._`;

  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function openWhatsAppReceipt(params: {
  phone: string;
  etablissementNom: string;
  promoteurNom: string;
  numeroQuittance: string;
  montantVerse: number;
  resteAPayer: number;
  datePaiement: string;
  modePaiement: string;
  referenceTransaction?: string;
}): void {
  const cleanNumber = cleanPhoneForWhatsApp(params.phone);
  if (!cleanNumber) return;

  const text = `*DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE (DDL-PN)*
_RÉPUBLIQUE DU CONGO • RÉPÉRISSEMENT DE RECETTES SAF_

Bonjour M./Mme *${params.promoteurNom}* (${params.etablissementNom}),

Nous vous confirmons la bonne réception de votre paiement :
📄 *Quittance N° :* ${params.numeroQuittance}
💰 *Montant Encaissé :* ${formatCfa(params.montantVerse)}
📅 *Date :* ${params.datePaiement}
💳 *Mode de règlement :* ${params.modePaiement.toUpperCase()}
${params.referenceTransaction ? `🔖 *Réf. Transaction :* ${params.referenceTransaction}` : ''}
${params.resteAPayer > 0 ? `⚠️ *Solde restant dû :* ${formatCfa(params.resteAPayer)}` : '✅ *Situation fiscale départementale : EN RÈGLE (Solde : 0 FCFA)*'}

Ce récépissé numérique fait foi auprès de toutes les patrouilles de contrôle DDL-PN.

_Régie des Recettes DDL-PN • Pointe-Noire._`;

  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

