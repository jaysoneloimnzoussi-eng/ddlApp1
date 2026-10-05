/**
 * Real Google Workspace Integration API Service
 * Handles Calendar, Gmail, and Google Docs with client-side OAuth Bearer token
 */

export interface GoogleCalendarEventInput {
  summary: string;
  description: string;
  location: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
}

export interface GoogleDocResult {
  documentId: string;
  title: string;
  webViewLink: string;
}

/**
 * Creates an inspection event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEventInput
): Promise<any> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDateTime,
        timeZone: 'Africa/Brazzaville',
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: 'Africa/Brazzaville',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 120 },
        ],
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur Calendar (${response.status})`);
  }

  return await response.json();
}

/**
 * Lists upcoming and 2026 events from primary Google Calendar
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  options?: { timeMin?: string; timeMax?: string; maxResults?: number }
): Promise<any[]> {
  const timeMin = options?.timeMin || '2026-01-01T00:00:00Z';
  const timeMax = options?.timeMax || '2026-12-31T23:59:59Z';
  const maxResults = options?.maxResults || 250;

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&timeMax=${encodeURIComponent(
    timeMax
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur récupération Calendar (${response.status})`);
  }

  const data = await response.json();
  return data.items || [];
}

export interface ParsedGoogleCalendarEstablishment {
  nomCommercial: string;
  promoteurNom: string;
  promoteurTelephone: string;
  arrondissement: 'Lumumba' | 'Mvou-Mvou' | 'Tié-Tié' | 'Loandjili' | 'Mongo-Mpoukou' | 'Ngoyo';
  quartier: string;
  adresseExacte: string;
  categorie: any;
  montantRedevanceAnnuelle: number;
  montantAcompte: number;
  soldeRestantDu: number;
  prochainRdvDate: string;
  prochainRdvHeure: string;
  prochainRdvMotif: string;
  notes: string;
  estFerme: boolean;
  rawEventId: string;
}

export function parseArrondissementFromText(text: string): 'Lumumba' | 'Mvou-Mvou' | 'Tié-Tié' | 'Loandjili' | 'Mongo-Mpoukou' | 'Ngoyo' {
  if (!text) return 'Tié-Tié';
  const str = text.toLowerCase();
  if (str.includes('ngoyo')) return 'Ngoyo';
  if (str.includes('loandjili') || str.includes('louandjili')) return 'Loandjili';
  if (str.includes('tie') || str.includes('tié')) return 'Tié-Tié';
  if (str.includes('mvou')) return 'Mvou-Mvou';
  if (str.includes('mongo') || str.includes('mpoukou')) return 'Mongo-Mpoukou';
  if (str.includes('lumumba')) return 'Lumumba';
  return 'Tié-Tié';
}

export function parseCategoryFromText(text: string): any {
  if (!text) return 'Bar Dancing / Cabaret';
  const str = text.toUpperCase();
  if (str.includes('DISCO') || str.includes('CLUB') || str.includes('NIGHT')) return 'Discothèque / Night-club';
  if (str.includes('LOUNGE') || str.includes('TERRASSE')) return 'Lounge Bar & Terrasse';
  if (str.includes('COMPLEXE') || str.includes('PISCINE')) return 'Complexe de Loisirs & Piscine';
  if (str.includes('SNACK') || str.includes('RESTAURANT')) return 'Snack-Bar Sonorisé';
  if (str.includes('SALLE') || str.includes('RECREATIF')) return 'Espace Récréatif & Salle Polyvalente';
  return 'Bar Dancing / Cabaret';
}

/**
 * Parses a Google Calendar event into an Establishment structure
 */
export function parseGoogleCalendarEvent(event: any): ParsedGoogleCalendarEstablishment {
  const summary = event.summary || 'Établissement SAA';
  const description = event.description || '';
  const location = event.location || '';
  const allText = `${summary} ${description} ${location}`;

  // Extract Establishment Name
  let nomCommercial = summary
    .replace(/^(?:contr[oô]le|recensement|rdv|visite|tourn[ée]e|inspection|acompte|paiement|relance)\s*[:-]?\s*/i, '')
    .trim();
  if (!nomCommercial || nomCommercial.length < 3) {
    nomCommercial = summary;
  }

  // Check if closed
  const estFerme = /fermé|éteint|cessation|inactif|abandonn[ée]|fermeture|rideau/i.test(allText);

  // Extract phone
  const phoneMatch = allText.match(/(?:\+?242|06|05|04)\s?[0-9]{2}\s?[0-9]{3}\s?[0-9]{2,4}/);
  const promoteurTelephone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : '+242 06 600 00 00';

  // Extract promoter name
  const promMatch = description.match(/(?:promoteur|proprio|propriétaire|gérant|contact)\s*:\s*([^\n,;]+)/i);
  const promoteurNom = promMatch ? promMatch[1].trim() : 'Promoteur ' + nomCommercial;

  // Extract Arrondissement
  const arrondissement = parseArrondissementFromText(allText);

  // Extract Quartier
  const quartierMatch = description.match(/quartier\s*:\s*([^\n,;]+)/i) || location.match(/,\s*([^\n,]+)/);
  const quartier = quartierMatch ? quartierMatch[1].trim() : 'Centre-Ville';

  // Extract fees
  // Look for acompte or montant versé
  const acompteMatch = allText.match(/(?:acompte|vers[ée]|pay[ée]|donn[ée]|encaissement)\s*[:=]?\s*([0-9\s]+)\s*(?:fcfa|cfa|f)?/i);
  let montantAcompte = acompteMatch ? parseInt(acompteMatch[1].replace(/\s/g, ''), 10) : 0;

  // Look for total redevance
  const redevanceMatch = allText.match(/(?:redevance|total|taxe|montant)\s*[:=]?\s*([0-9\s]+)\s*(?:fcfa|cfa|f)?/i);
  let montantRedevanceAnnuelle = redevanceMatch ? parseInt(redevanceMatch[1].replace(/\s/g, ''), 10) : 60000;

  if (montantAcompte > montantRedevanceAnnuelle) {
    montantRedevanceAnnuelle = montantAcompte;
  }
  const soldeRestantDu = Math.max(0, montantRedevanceAnnuelle - montantAcompte);

  // RDV Date and Time
  let prochainRdvDate = '2026-10-15';
  let prochainRdvHeure = '10:00';
  if (event.start?.dateTime) {
    const d = new Date(event.start.dateTime);
    prochainRdvDate = d.toISOString().substring(0, 10);
    prochainRdvHeure = d.toTimeString().substring(0, 5);
  } else if (event.start?.date) {
    prochainRdvDate = event.start.date;
  }

  const prochainRdvMotif = estFerme
    ? 'Constat cessation d\'activité'
    : (soldeRestantDu > 0
        ? `Recouvrement solde reliquat (${soldeRestantDu.toLocaleString()} FCFA)`
        : 'Visite de conformité et contrôle sonore SAA');

  return {
    nomCommercial,
    promoteurNom,
    promoteurTelephone,
    arrondissement,
    quartier,
    adresseExacte: location || `${arrondissement}, Pointe-Noire`,
    categorie: parseCategoryFromText(allText),
    montantRedevanceAnnuelle,
    montantAcompte,
    soldeRestantDu,
    prochainRdvDate,
    prochainRdvHeure,
    prochainRdvMotif,
    notes: description || summary,
    estFerme,
    rawEventId: event.id || `gcal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
}

/**
 * Sends an administrative notification or formal notice via Gmail
 */
export async function sendOfficialGmail(
  accessToken: string,
  to: string,
  subject: string,
  bodyHtml: string
): Promise<{ id: string; threadId: string }> {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyHtml,
  ];
  const message = messageParts.join('\r\n');

  // Base64url encode
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur envoi Gmail (${response.status})`);
  }

  return await response.json();
}

/**
 * Creates an official ministerial document in Google Docs
 */
export async function createOfficialGoogleDoc(
  accessToken: string,
  title: string,
  content: string
): Promise<GoogleDocResult> {
  // 1. Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erreur création Google Doc (${createRes.status})`);
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // 2. Insert content
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: content,
          },
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    console.warn("Texte partiel inséré ou avertissement de mise à jour");
  }

  return {
    documentId,
    title,
    webViewLink: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}
