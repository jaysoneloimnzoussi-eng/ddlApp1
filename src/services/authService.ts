import { StaffPersonnel, UserRole } from '../types';
import { INITIAL_STAFF } from '../data/seedData';

export interface AuthAccount {
  id: string;
  nomComplet: string;
  matricule: string;
  telephone: string;
  normalizedPhone: string;
  email: string;
  fonction: string;
  service: string;
  role: UserRole;
  photoUrl?: string;
  isSuperAdmin: boolean;
}

// Clean phone number for flexible matching
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '').replace(/^242/, ''); // Remove +242 prefix if present
}

// Super-Admin Account (Directeur Départemental Officiel)
export const SUPER_ADMIN_ACCOUNT: AuthAccount = {
  id: 'all',
  nomComplet: 'NTSEKE NGOUAKA Jean Richard',
  matricule: 'DDL-DIR-001',
  telephone: '+242 06 186 4275',
  normalizedPhone: '061864275',
  email: 'ddloisirs_pnr@loisirs.cg',
  fonction: 'Directeur Départemental des Loisirs',
  service: 'Direction',
  role: 'administrateur',
  isSuperAdmin: true,
};

// All Auth Accounts (Admin + 12 Field Agents)
export function getAllAccounts(): AuthAccount[] {
  const agentAccounts: AuthAccount[] = INITIAL_STAFF.map((staff) => ({
    id: staff.id,
    nomComplet: staff.nomComplet,
    matricule: staff.matricule,
    telephone: staff.telephone,
    normalizedPhone: normalizePhone(staff.telephone),
    email: staff.email,
    fonction: staff.fonction,
    service: staff.service,
    role: staff.role,
    photoUrl: staff.photoUrl,
    isSuperAdmin: false,
  }));

  return [SUPER_ADMIN_ACCOUNT, ...agentAccounts];
}

// Find account by name, phone number, matricule or email
export function findAccountByIdentifier(identifier: string): AuthAccount | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  const cleanSimple = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanPhone = normalizePhone(identifier);

  // Admin and Director keywords (matches M. NTSEKE NGOUAKA Jean Richard)
  if (
    clean === 'admin' ||
    clean === 'directeur' ||
    clean === 'dir' ||
    clean === 'ddl-dir-001' ||
    clean === 'direction' ||
    clean.includes('ntseke') ||
    clean.includes('ngouaka') ||
    clean.includes('jean richard')
  ) {
    return SUPER_ADMIN_ACCOUNT;
  }

  const all = getAllAccounts();

  return all.find((acc) => {
    if (acc.matricule.toLowerCase() === clean) return true;
    if (acc.email.toLowerCase() === clean) return true;

    // Full name and normalized name matching
    const nameLower = acc.nomComplet.toLowerCase();
    const nameSimple = nameLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (nameLower === clean || nameSimple === cleanSimple) return true;
    if (clean.length >= 4 && (nameLower.includes(clean) || clean.includes(nameLower))) return true;
    if (cleanSimple.length >= 4 && (nameSimple.includes(cleanSimple) || cleanSimple.includes(nameSimple))) return true;

    // Split name words (e.g. "matoko" or "jacques")
    const words = nameSimple.split(/\s+/);
    if (words.some((w) => w.length >= 3 && (w === cleanSimple || cleanSimple.includes(w)))) return true;

    // Phone matching
    if (cleanPhone && (acc.normalizedPhone.endsWith(cleanPhone) || cleanPhone.endsWith(acc.normalizedPhone))) {
      return true;
    }
    return false;
  });
}

// Verify credentials securely
/**
 * Legacy local credential verification is intentionally disabled. Credentials
 * must be verified by Firebase Auth; authorization comes from custom claims.
 */
export function verifyCredentials(_identifier: string, _pin: string): {
  success: boolean;
  message: string;
  account?: AuthAccount;
} {
  return {
    success: false,
    message: 'Connexion locale désactivée. Utilisez Firebase Authentication.',
  };
}
