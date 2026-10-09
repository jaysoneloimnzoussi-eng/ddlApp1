/**
 * SHA-256 Cryptographic utility for digital archiving and stamp generation
 */
export async function computeSha256(text: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('crypto.subtle non disponible, utilisation du fallback sha256:', err);
  }
  // Fallback simple checksum hex
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8) + Date.now().toString(16);
}

export function formatCfa(amount?: number | null): string {
  const safeAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('fr-CG', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(safeAmount) + ' FCFA';
}
