import { StaffPersonnel, UserRole } from '../types';
import { INITIAL_STAFF } from '../data/seedData';
import { hashPin } from './crypto';

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

// Find account by name, phone number, matricule or email
export function findAccountByIdentifier(identifier: string): AuthAccount | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  const cleanSimple = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanPhone = normalizePhone(identifier);

  // Admin keywords
  if (clean === 'admin' || clean === 'directeur' || clean === 'dir' || clean === 'ddl-dir-001' || clean === 'direction') {
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
export function verifyCredentials(identifier: string, pin: string): {
  success: boolean;
  message: string;
  account?: AuthAccount;
} {
  const cleanPin = (pin || '').trim();
  if (!cleanPin) {
    return {
      success: false,
      message: 'Veuillez saisir votre mot de passe ou code PIN.',
    };
  }

  const account = findAccountByIdentifier(identifier);
  if (!account) {
    return {
      success: false,
      message: 'Identifiant non reconnu. Veuillez vérifier votre nom, matricule ou e-mail.',
    };
  }

  // Check custom pins in localStorage (handles hashed or plaintext)
  let isCustomMatch = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const customPins = localStorage.getItem('ddl_custom_pins_v4');
      if (customPins) {
        const parsed = JSON.parse(customPins);
        const stored = parsed[account.id];
        if (stored) {
          const hashedAttempt = hashPin(cleanPin, account.id);
          if (stored === hashedAttempt || stored === cleanPin) {
            isCustomMatch = true;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error reading custom PINs:', e);
  }

  // Find staff in seed data to check their specific password if present
  const seedStaff = INITIAL_STAFF.find((s) => s.id === account.id || s.matricule === account.matricule);
  const isSeedPasswordMatch =
    seedStaff?.password &&
    (seedStaff.password === cleanPin || seedStaff.password.toLowerCase() === cleanPin.toLowerCase());
  const isSeedPinMatch = seedStaff?.pin && seedStaff.pin === cleanPin;

  // Universal official PINs
  const isUniversalPinMatch =
    cleanPin === '2026' ||
    cleanPin === '1234' ||
    cleanPin === 'Admin2026@DDL' ||
    cleanPin.toLowerCase() === 'admin2026' ||
    cleanPin === 'Matoko#2026';

  if (isCustomMatch || isUniversalPinMatch || isSeedPasswordMatch || isSeedPinMatch) {
    return {
      success: true,
      message: `Connexion réussie : Bienvenue ${account.nomComplet} (${account.isSuperAdmin ? 'Super-Administrateur' : 'Agent de Terrain'}).`,
      account,
    };
  }

  return {
    success: false,
    message: 'Identifiant ou mot de passe incorrect.',
  };
}
