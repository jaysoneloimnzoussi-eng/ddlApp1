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
 * Lists upcoming events from primary Google Calendar
 */
export async function listGoogleCalendarEvents(accessToken: string): Promise<any[]> {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    now
  )}&maxResults=10&singleEvents=true&orderBy=startTime`;

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
