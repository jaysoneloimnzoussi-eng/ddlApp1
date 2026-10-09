/**
 * SHA-256 Cryptographic utility for digital archiving and stamp generation
 */
export async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function formatCfa(amount?: number | null): string {
  const safeAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('fr-CG', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(safeAmount) + ' FCFA';
}
