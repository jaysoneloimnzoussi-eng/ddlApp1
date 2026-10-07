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
  const summary = (event?.summary || '').toString();
  const description = (event?.description || '').toString();
  const location = (event?.location || '').toString();
  const allText = `${summary} ${description} ${location}`;

  // Extract Establishment Name
  let nomCommercial = summary
    .replace(/^(?:contr[oô]le|recensement|rdv|visite|tourn[ée]e|inspection|acompte|paiement|relance)\s*[:-]?\s*/i, '')
    .trim();
  if (!nomCommercial || nomCommercial.length < 3) {
    nomCommercial = summary.trim() || 'Établissement SAA';
  }

  // Check if closed
  const estFerme = /fermé|éteint|cessation|inactif|abandonn[ée]|fermeture|rideau/i.test(allText);

  // Extract phone
  const phoneMatch = allText.match(/(?:\+?242|06|05|04)\s?[0-9]{2}\s?[0-9]{3}\s?[0-9]{2,4}/);
  const promoteurTelephone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : '+242 06 600 00 00';

  // Extract promoter name
  const promMatch = description.match(/(?:promoteur|proprio|propriétaire|gérant|contact)\s*:\s*([^\n,;]+)/i);
  const promoteurNom = (promMatch && promMatch[1] && promMatch[1].trim()) ? promMatch[1].trim() : 'Promoteur ' + nomCommercial;

  // Extract Arrondissement
  const arrondissement = parseArrondissementFromText(allText);

  // Extract Quartier
  const quartierMatch = description.match(/quartier\s*:\s*([^\n,;]+)/i) || location.match(/,\s*([^\n,]+)/);
  const quartier = (quartierMatch && quartierMatch[1] && quartierMatch[1].trim()) ? quartierMatch[1].trim() : 'Centre-Ville';

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

/**
 * Parses a standard .ics (iCalendar) export file from Google Calendar
 * Unfolds continuation lines, parses VEVENT blocks, and transforms them into standard event objects
 */
export function parseICalendarContent(icsText: string): any[] {
  if (!icsText || typeof icsText !== 'string' || !icsText.trim()) return [];

  // 1. Unfold lines (RFC 5545: lines starting with space or tab are continuations)
  const unfolded = icsText.replace(/\r\n[ \t]|\r[ \t]|\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\r|\n/);

  const events: any[] = [];
  let inEvent = false;
  let currentEvent: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = (line || '').trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      if (inEvent && (currentEvent.SUMMARY || currentEvent.DESCRIPTION)) {
        // Build Google Calendar-like item
        const unescapeIcs = (str?: string) =>
          (str || '')
            .replace(/\\n|\\N/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');

        const summary = unescapeIcs(currentEvent.SUMMARY);
        const description = unescapeIcs(currentEvent.DESCRIPTION);
        const location = unescapeIcs(currentEvent.LOCATION);

        // Parse DTSTART (e.g., 20261012T090000Z or 20261012)
        let dateTime: string | undefined;
        let dateOnly: string | undefined;
        const dtstart = currentEvent.DTSTART || currentEvent['DTSTART;VALUE=DATE'];
        if (dtstart) {
          const match = dtstart.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
          if (match) {
            const [, y, m, d, hh, mm] = match;
            if (hh !== undefined) {
              dateTime = `${y}-${m}-${d}T${hh}:${mm || '00'}:00Z`;
            } else {
              dateOnly = `${y}-${m}-${d}`;
            }
          }
        }

        events.push({
          id: currentEvent.UID || `ics-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          summary,
          description,
          location,
          start: {
            dateTime: dateTime || (dateOnly ? `${dateOnly}T10:00:00Z` : undefined),
            date: dateOnly,
          },
          status: currentEvent.STATUS?.toLowerCase() || 'confirmed',
        });
      }
      inEvent = false;
      continue;
    }

    if (inEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const rawKey = line.substring(0, colonIdx);
        const val = line.substring(colonIdx + 1);
        const key = rawKey.split(';')[0]; // strip parameters like ;VALUE=DATE
        currentEvent[key] = val;
      }
    }
  }

  return events;
}

/**
 * Parses free-form text or list of appointments/notes into event items
 * Format can be lines with:
 * "Le Palmier VIP - Tié-Tié, Mbota - Promoteur: M. Jean (06 600 11 22) - Acompte: 50000 FCFA - RDV: 2026-10-15 11:00"
 */
export function parsePastedTextEvents(rawText: string): any[] {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) return [];

  // Check if it's ICS content
  if (rawText.includes('BEGIN:VCALENDAR') || rawText.includes('BEGIN:VEVENT')) {
    return parseICalendarContent(rawText);
  }

  // Otherwise, split by double newlines or single non-empty lines
  const rawBlocks = rawText
    .split(/\n\s*\n/)
    .map((b) => (b || '').trim())
    .filter(Boolean);

  const lines = rawBlocks.length > 1
    ? rawBlocks
    : rawText.split('\n').map((l) => (l || '').trim()).filter((l) => l.length > 5);

  const results: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const block = lines[i];
    // Try to extract date
    const dateMatch = block.match(/\b(202[5-7]-\d{2}-\d{2}|\d{2}\/\d{2}\/202[5-7]|\d{1,2}\s+(?:janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)[a-z]*\s+202[5-7])/i);
    let dateStr = '2026-10-14';
    if (dateMatch) {
      const rawD = dateMatch[0];
      if (rawD.includes('/')) {
        const [d, m, y] = rawD.split('/');
        dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else if (rawD.startsWith('202')) {
        dateStr = rawD;
      }
    }

    // Try to extract time
    const timeMatch = block.match(/\b([01]?\d|2[0-3])[:hH]([0-5]\d)\b/);
    const timeStr = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '10:00';

    // Summary line: first line or before first dash/colon
    const firstLine = (block || '').split('\n')[0] || '';
    const summaryCandidate = (firstLine.split(/ - | – | \| /)[0] || '').replace(/^[0-9\.\-\*\•\s]+/, '').trim();

    results.push({
      id: `text-imp-${Date.now()}-${i}`,
      summary: summaryCandidate || `Établissement #${i + 1}`,
      description: block,
      location: block,
      start: {
        dateTime: `${dateStr}T${timeStr}:00Z`,
        date: dateStr,
      },
      status: 'confirmed',
    });
  }

  return results;
}
