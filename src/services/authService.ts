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

// Super-Admin Account
export const SUPER_ADMIN_ACCOUNT: AuthAccount = {
  id: 'all',
  nomComplet: 'Directeur Départemental des Loisirs',
  matricule: 'DDL-DIR-001',
  telephone: '06 600 00 01',
  normalizedPhone: '066000001',
  email: 'directeur.ddlpn@loisirs.gouv.cg',
  fonction: 'Directeur Départemental (Super-Admin)',
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

// Find account by phone number or matricule
export function findAccountByIdentifier(identifier: string): AuthAccount | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  const cleanPhone = normalizePhone(identifier);

  // Admin keywords
  if (clean === 'admin' || clean === 'directeur' || clean === 'dir' || clean === 'ddl-dir-001') {
    return SUPER_ADMIN_ACCOUNT;
  }

  const all = getAllAccounts();

  return all.find((acc) => {
    if (acc.matricule.toLowerCase() === clean) return true;
    if (acc.email.toLowerCase() === clean) return true;
    if (cleanPhone && acc.normalizedPhone.endsWith(cleanPhone) || (acc.normalizedPhone && cleanPhone.endsWith(acc.normalizedPhone))) {
      return true;
    }
    return false;
  });
}

// Get user PIN (checks custom PINs in localStorage, fallback to defaults)
export function getAccountPin(account: AuthAccount): string {
  try {
    const customPins = localStorage.getItem('ddl_custom_pins_v4');
    if (customPins) {
      const parsed = JSON.parse(customPins);
      if (parsed[account.id]) return parsed[account.id];
    }
  } catch (e) {
    console.warn('Error reading custom PINs:', e);
  }

  // Default PINs
  if (account.isSuperAdmin) {
    return '2026'; // Admin default PIN
  }
  return '1234'; // Agents default PIN
}

// Verify PIN
export function verifyCredentials(identifier: string, pin: string): {
  success: boolean;
  message: string;
  account?: AuthAccount;
} {
  const account = findAccountByIdentifier(identifier);
  if (!account) {
    return {
      success: false,
      message: 'Numéro de téléphone ou matricule non reconnu dans les effectifs officiels DDL-PN.',
    };
  }

  const expectedPin = getAccountPin(account);
  // Also allow universal master rescue PIN for testing/demo
  const isRescuePin = pin === '2026' && account.isSuperAdmin;

  if (pin === expectedPin || isRescuePin) {
    return {
      success: true,
      message: `Connexion réussie : Bienvenue ${account.nomComplet} (${account.isSuperAdmin ? 'Super-Administrateur' : 'Agent de Terrain'}).`,
      account,
    };
  }

  return {
    success: false,
    message: 'Code PIN incorrect. Veuillez réessayer.',
    account, // Still return account so UI can display who is attempting to login
  };
}
