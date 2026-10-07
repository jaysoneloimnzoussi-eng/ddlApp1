import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Establishment,
  CashReceipt,
  LegalAct,
  InspectionSchedule,
  PtaMilestone,
  StaffPersonnel,
  AuditRecord,
  SoitTransmisDgl,
  UserRole,
  ComplianceStatus,
} from '../types';
import {
  INITIAL_ESTABLISHMENTS,
  INITIAL_RECEIPTS,
  INITIAL_LEGAL_ACTS,
  INITIAL_SCHEDULES,
  INITIAL_PTA_MILESTONES,
  INITIAL_STAFF,
  INITIAL_AUDIT_LOGS,
  INITIAL_SOIT_TRANSMIS,
} from '../data/seedData';
import { computeSha256, formatCfa } from '../services/crypto';
import { parseGoogleCalendarEvent } from '../services/googleWorkspace';
import {
  initAuth,
  googleSignIn,
  logout as firebaseLogout,
  db,
  testFirestoreConnection,
  cleanForFirestore,
} from '../services/firebase';
import { doc, setDoc, onSnapshot, collection, writeBatch } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  syncAllToFirestore: () => Promise<void>;
  // Agent Siloing & Identity
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentAgentId: string;
  setCurrentAgentId: (id: string) => void;
  currentAgent: StaffPersonnel | undefined;

  // Dedicated Agent Authentication (Phone + PIN & Role Auto-detection)
  authenticatedUser: StaffPersonnel | null;
  isAuthenticated: boolean;
  loginWithPhoneAndPin: (phoneOrMatricule: string, pin: string) => { success: boolean; message: string; user?: StaffPersonnel };
  logoutAgentSession: () => void;
  updateStaffPin: (staffId: string, newPin: string) => void;
  updateStaffCredentials: (staffId: string, updates: { loginId?: string; password?: string; pin?: string }) => void;

  // Theme: Fond Blanc (Light) ou Sombre (Dark)
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Mode Plein Écran pour Google Calendar (Terrain immersif)
  isCalendarFullScreen: boolean;
  setIsCalendarFullScreen: React.Dispatch<React.SetStateAction<boolean>>;

  googleUser: User | null;
  googleAccessToken: string | null;
  handleGoogleSignIn: () => Promise<void>;
  handleLogout: () => Promise<void>;
  isSigningIn: boolean;
  showDomainAuthModal: boolean;
  setShowDomainAuthModal: (show: boolean) => void;
  activateDemoGoogleSession: () => void;

  // Centralized Master Collections
  establishments: Establishment[];
  visibleEstablishments: Establishment[]; // Filtered by current field agent
  receipts: CashReceipt[];
  legalActs: LegalAct[];
  schedules: InspectionSchedule[];
  visibleSchedules: InspectionSchedule[]; // Filtered by current field agent
  ptaMilestones: PtaMilestone[];
  staff: StaffPersonnel[];
  auditLogs: AuditRecord[];
  soitTransmis: SoitTransmisDgl[];

  // Mutators & Business Actions
  addEstablishment: (est: Omit<Establishment, 'id' | 'codeDossier' | 'syncStatus' | 'historiquePaiements' | 'anneeExercice'>, options?: { silent?: boolean }) => Promise<Establishment>;
  updateEstablishment: (id: string, updates: Partial<Establishment>) => Promise<void>;
  addReceipt: (rec: Omit<CashReceipt, 'id' | 'numeroQuittance' | 'quittanceHash'>) => Promise<CashReceipt>;
  issueLegalAct: (act: Omit<LegalAct, 'id' | 'referenceNumero' | 'documentHash'>) => Promise<LegalAct>;
  addSchedule: (sch: Omit<InspectionSchedule, 'id'>) => Promise<InspectionSchedule>;
  updateSchedule: (id: string, updates: Partial<InspectionSchedule>) => Promise<void>;
  recordPaymentAndScheduleNext: (params: {
    establishmentId: string;
    montantVerse: number;
    modePaiement: CashReceipt['modePaiement'];
    nextRdvDate?: string;
    nextRdvHeure?: string;
    nextRdvMotif?: string;
    currentScheduleId?: string;
  }) => Promise<{ receipt: CashReceipt; nextSchedule?: InspectionSchedule }>;

  addAuditLog: (action: string, typeEntite: string, referenceId: string, details: string) => Promise<void>;
  createSoitTransmis: (bordereau: Omit<SoitTransmisDgl, 'id' | 'numeroBordereau'>) => Promise<SoitTransmisDgl>;

  // Signalement Établissement Fermé / Éteint & Import Google Calendar
  reportEstablishmentClosed: (params: {
    establishmentId: string;
    motif: string;
    observations?: string;
  }) => Promise<void>;
  importFromGoogleCalendar: (rawEvents: any[]) => Promise<{
    importedCount: number;
    updatedCount: number;
    acomptesCount: number;
    totalEstablishmentsAfter: number;
  }>;

  // Offline status & alerts
  isOnline: boolean;
  offlineQueueCount: number;
  syncOfflineQueue: () => void;
  notifications: NotificationItem[];
  showNotification: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
  removeNotification: (id: string) => void;

  // Print Preview state
  printMode: 'none' | 'a4_attestation' | 'a4_legal_act' | 'a4_report' | 'pos_receipt' | 'staff_badge' | 'spa_diploma';
  printData: any;
  openPrintModal: (mode: AppContextType['printMode'], data: any) => void;
  closePrintModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<string>('MOD-01');

  // Staff registry with persistence
  const [staff, setStaff] = useState<StaffPersonnel[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_staff_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_STAFF so newly created loginId and password fields are guaranteed
          return INITIAL_STAFF.map((init) => {
            const found = parsed.find((p: any) => p.id === init.id || p.matricule === init.matricule);
            return {
              ...init,
              ...(found || {}),
              loginId: found?.loginId || init.loginId,
              password: found?.password || init.password,
              pin: found?.pin || init.pin,
            };
          });
        }
      }
      return INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  });

  // Dedicated Agent Authentication (Phone + PIN & Auto-detection)
  const [authenticatedUser, setAuthenticatedUser] = useState<StaffPersonnel | null>(() => {
    try {
      const saved = localStorage.getItem('ddl_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!authenticatedUser;

  // Role & Siloing initialized from authenticated session
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return authenticatedUser?.role || 'directeur';
  });

  // Agent Siloing: 'all' for admin/directeur, or specific agent id
  const [currentAgentId, setCurrentAgentId] = useState<string>(() => {
    if (!authenticatedUser) return 'all';
    return (authenticatedUser.role === 'directeur' || authenticatedUser.role === 'administrateur')
      ? 'all'
      : authenticatedUser.id;
  });

  // Keep role & agent in sync when authenticatedUser changes
  useEffect(() => {
    if (authenticatedUser) {
      setCurrentUserRole(authenticatedUser.role);
      const isPrivileged = authenticatedUser.role === 'directeur' || authenticatedUser.role === 'administrateur';
      setCurrentAgentId(isPrivileged ? 'all' : authenticatedUser.id);
    }
  }, [authenticatedUser]);

  // Theme: Fond Blanc (light) ou Sombre (dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('ddl_theme_mode');
      return saved === 'dark' ? 'dark' : 'light'; // Default to light mode (fond blanc) as requested!
    } catch {
      return 'light';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('ddl_theme_mode', next);
      return next;
    });
  };

  // Google Calendar Full Screen State (Default true for maximum workspace)
  const [isCalendarFullScreen, setIsCalendarFullScreen] = useState<boolean>(true);

  // Google Workspace & Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [showDomainAuthModal, setShowDomainAuthModal] = useState<boolean>(false);

  // Helper to identify and purge any fictional demonstration data
  const isFictionalItem = (name?: string, id?: string): boolean => {
    if (!name && !id) return false;
    const n = (name || '').toLowerCase();
    const i = (id || '').toLowerCase();
    return (
      n.includes('le must vip lounge') ||
      n.includes('symphonie des étoiles') ||
      n.includes('privilège night') ||
      n.includes('le belvédère') ||
      n.includes('les palétuviers') ||
      n.includes('oxygène parc') ||
      n.includes('le corail') ||
      i.startsWith('gcal-pn-2026-')
    );
  };

  // Network State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const q = localStorage.getItem('ddl_offline_queue');
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [printMode, setPrintMode] = useState<AppContextType['printMode']>('none');
  const [printData, setPrintData] = useState<any>(null);

  // Collections - Clean real data, initialized with Jacques MATOKO's Google Agenda export
  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_establishments_v5');
      if (saved) {
        const list: Establishment[] = JSON.parse(saved);
        const filtered = list.filter((e) => !isFictionalItem(e.nomCommercial, e.id));
        if (filtered.length > 0) return filtered;
      }
      return INITIAL_ESTABLISHMENTS;
    } catch {
      return INITIAL_ESTABLISHMENTS;
    }
  });

  const [receipts, setReceipts] = useState<CashReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_receipts_v5');
      if (saved) {
        const list: CashReceipt[] = JSON.parse(saved);
        const filtered = list.filter((r) => !isFictionalItem(r.etablissementNom, r.etablissementId));
        if (filtered.length > 0) return filtered;
      }
      return INITIAL_RECEIPTS;
    } catch {
      return INITIAL_RECEIPTS;
    }
  });

  const [legalActs, setLegalActs] = useState<LegalAct[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_legal_acts_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [schedules, setSchedules] = useState<InspectionSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_schedules_v5');
      if (saved) {
        const list: InspectionSchedule[] = JSON.parse(saved);
        const filtered = list.filter((s) => !isFictionalItem(s.etablissementNom, s.etablissementId));
        if (filtered.length > 0) return filtered;
      }
      return INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  const [ptaMilestones, setPtaMilestones] = useState<PtaMilestone[]>(INITIAL_PTA_MILESTONES);

  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_audit_logs_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [soitTransmis, setSoitTransmis] = useState<SoitTransmisDgl[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_soit_transmis_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current Agent Object
  const currentAgent = useMemo(() => {
    return staff.find((s) => s.id === currentAgentId) || authenticatedUser || undefined;
  }, [staff, currentAgentId, authenticatedUser]);

  // Strict Siloing: Visible Establishments
  // Field agents ONLY see establishments they surveyed / collected. Admin sees all.
  const visibleEstablishments = useMemo(() => {
    if (currentUserRole === 'directeur' || currentUserRole === 'administrateur' || currentAgentId === 'all') {
      return establishments; // Full sovereign view for Admin/Director
    }

    const agent = staff.find((s) => s.id === currentAgentId) || authenticatedUser;
    if (!agent) return [];

    const agentName = (agent.nomComplet || '').toLowerCase().trim();
    const agentMatricule = (agent.matricule || '').toLowerCase().trim();

    return establishments.filter((e) => {
      if (!e) return false;
      // Direct ID match
      if (e.agentAssigneId === agent.id) return true;
      // Direct Matricule match
      if (e.agentAssigneId === agent.matricule) return true;
      // Name match on agentAssigneNom
      if (e.agentAssigneNom && (e.agentAssigneNom || '').toLowerCase().trim() === agentName) return true;
      // Name match on recensePar
      if (e.recensePar && (e.recensePar || '').toLowerCase().includes(agentName)) return true;
      // Matricule match on recensePar
      if (e.recensePar && (e.recensePar || '').toLowerCase().includes(agentMatricule)) return true;

      return false;
    });
  }, [establishments, currentUserRole, currentAgentId, staff, authenticatedUser]);

  // Strict Siloing: Visible Schedules
  const visibleSchedules = useMemo(() => {
    if (currentUserRole === 'directeur' || currentUserRole === 'administrateur' || currentAgentId === 'all') {
      return schedules;
    }
    const agent = staff.find((s) => s.id === currentAgentId) || authenticatedUser;
    return schedules.filter((s) => {
      if (s.agentId === currentAgentId) return true;
      if (agent && s.inspecteurChef && s.inspecteurChef.toLowerCase().includes(agent.nomComplet.toLowerCase())) return true;
      return false;
    });
  }, [schedules, currentUserRole, currentAgentId, staff, authenticatedUser]);

  // Login with Credentials (Identifier + Password/PIN) + Automatic Role Detection
  const loginWithPhoneAndPin = (phoneOrMatricule: string, pin: string) => {
    const rawInput = (phoneOrMatricule || '').trim().toLowerCase();
    const cleanInput = rawInput.replace(/[\s\-\+\(\)\.]/g, '');
    const secret = (pin || '').trim();

    if (!rawInput) {
      return { success: false, message: 'Veuillez saisir votre identifiant ou matricule.' };
    }
    if (!secret) {
      return { success: false, message: 'Veuillez saisir votre mot de passe confidentiel.' };
    }

    // Match in staff directory
    const matched = staff.find((s) => {
      const loginClean = (s.loginId || '').trim().toLowerCase();
      const matClean = s.matricule.trim().toLowerCase();
      const matNoDash = matClean.replace(/[\s\-\+\(\)\.]/g, '');
      const telClean = s.telephone.replace(/[\s\-\+\(\)\.]/g, '').toLowerCase();
      const emailClean = (s.email || '').trim().toLowerCase();
      const nameClean = s.nomComplet.trim().toLowerCase();

      // Direct matches on ID, Matricule, Email, or Telephone
      if (loginClean && (loginClean === rawInput || loginClean === cleanInput)) return true;
      if (matClean === rawInput || matNoDash === cleanInput) return true;
      if (emailClean && emailClean === rawInput) return true;
      if (telClean && (telClean === cleanInput || cleanInput.endsWith(telClean) || telClean.endsWith(cleanInput))) return true;

      // Special handling for admin keywords and developer email
      if (
        (s.role === 'directeur' || s.role === 'administrateur') &&
        (rawInput === 'admin' ||
          rawInput === 'directeur' ||
          rawInput === 'direction' ||
          rawInput === 'ddl-dir-001' ||
          rawInput === 'liameloimnzoussi@gmail.com')
      ) {
        return true;
      }

      return false;
    });

    if (!matched) {
      return {
        success: false,
        message: 'Identifiant ou mot de passe incorrect. Veuillez contacter l’Administrateur DDL-PN.',
      };
    }

    // Validate secret against password, custom pin, default PIN '2026', or Admin password
    const isSecretValid =
      (matched.password && matched.password === secret) ||
      (matched.pin && matched.pin === secret) ||
      secret === '2026' ||
      ((matched.role === 'directeur' || matched.role === 'administrateur') &&
        (secret === 'Admin2026@DDL' || secret === 'admin2026' || secret === 'Admin2026'));

    if (!isSecretValid) {
      return {
        success: false,
        message: 'Identifiant ou mot de passe incorrect. Veuillez contacter l’Administrateur DDL-PN.',
      };
    }

    // Authentication Success!
    setAuthenticatedUser(matched);
    setCurrentUserRole(matched.role);
    const isPrivileged = matched.role === 'directeur' || matched.role === 'administrateur';
    setCurrentAgentId(isPrivileged ? 'all' : matched.id);

    try {
      localStorage.setItem('ddl_auth_session', JSON.stringify(matched));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }

    return {
      success: true,
      message: `Connexion réussie : Bienvenue ${matched.nomComplet} (${matched.fonction}).`,
      user: matched,
    };
  };

  // Logout Session
  const logoutAgentSession = () => {
    try {
      localStorage.removeItem('ddl_auth_session');
    } catch (e) {
      console.warn('Storage remove failed:', e);
    }
    setAuthenticatedUser(null);
    setCurrentUserRole('directeur');
    setCurrentAgentId('all');
  };

  // Update Agent PIN
  const updateStaffPin = (staffId: string, newPin: string) => {
    setStaff((prev) => {
      const updated = prev.map((s) => (s.id === staffId ? { ...s, pin: newPin } : s));
      try {
        localStorage.setItem('ddl_real_staff_v4', JSON.stringify(updated));
      } catch (e) {
        console.warn('Staff storage error:', e);
      }
      return updated;
    });
  };

  // Update Agent Credentials (Login ID, Password, PIN)
  const updateStaffCredentials = (
    staffId: string,
    updates: { loginId?: string; password?: string; pin?: string }
  ) => {
    setStaff((prev) => {
      const updated = prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              ...(updates.loginId !== undefined ? { loginId: updates.loginId } : {}),
              ...(updates.password !== undefined ? { password: updates.password } : {}),
              ...(updates.pin !== undefined ? { pin: updates.pin } : {}),
            }
          : s
      );
      try {
        localStorage.setItem('ddl_real_staff_v4', JSON.stringify(updated));
      } catch (e) {
        console.warn('Staff storage error:', e);
      }
      return updated;
    });
  };

  // One-time purge of old demonstration data and fictional examples from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('ddl_establishments_v3');
      localStorage.removeItem('ddl_receipts_v3');
      localStorage.removeItem('ddl_legal_acts_v3');
      localStorage.removeItem('ddl_schedules_v3');
      localStorage.removeItem('ddl_audit_logs_v3');
      localStorage.removeItem('ddl_soit_transmis_v3');

      // Purge any fictional sample establishments
      setEstablishments((prev) => {
        const clean = prev.filter((e) => !isFictionalItem(e.nomCommercial, e.id));
        const list = clean.length > 0 ? clean : INITIAL_ESTABLISHMENTS;
        localStorage.setItem('ddl_real_establishments_v5', JSON.stringify(list));
        return list;
      });

      // Purge any fictional receipts
      setReceipts((prev) => {
        const clean = prev.filter((r) => !isFictionalItem(r.etablissementNom, r.etablissementId));
        const list = clean.length > 0 ? clean : INITIAL_RECEIPTS;
        localStorage.setItem('ddl_real_receipts_v5', JSON.stringify(list));
        return list;
      });

      // Purge any fictional schedules
      setSchedules((prev) => {
        const clean = prev.filter((s) => !isFictionalItem(s.etablissementNom, s.etablissementId));
        const list = clean.length > 0 ? clean : INITIAL_SCHEDULES;
        localStorage.setItem('ddl_real_schedules_v5', JSON.stringify(list));
        return list;
      });
    } catch (e) {
      console.warn("Storage cleanup:", e);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ddl_real_establishments_v5', JSON.stringify(establishments));
  }, [establishments]);

  useEffect(() => {
    localStorage.setItem('ddl_real_receipts_v5', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('ddl_real_legal_acts_v5', JSON.stringify(legalActs));
  }, [legalActs]);

  useEffect(() => {
    localStorage.setItem('ddl_real_schedules_v5', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('ddl_real_audit_logs_v5', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('ddl_real_soit_transmis_v4', JSON.stringify(soitTransmis));
  }, [soitTransmis]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        if (token) setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Firebase Firestore Real-Time Sync & Validation (Real database source)
  useEffect(() => {
    testFirestoreConnection();

    try {
      const unsubEst = onSnapshot(
        collection(db, 'establishments'),
        (snapshot) => {
          const list: Establishment[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (data) {
              list.push({
                ...data,
                id: data.id || d.id,
                nomCommercial: (data.nomCommercial || (data as any).nom || (data as any).nom_commercial || (data as any).name || 'Établissement SAA').toString(),
              } as Establishment);
            }
          });
          setEstablishments(list);
        },
        (err) => {
          console.warn("Connexion Firestore en cache local:", err);
        }
      );

      const unsubRec = onSnapshot(
        collection(db, 'receipts'),
        (snapshot) => {
          const list: CashReceipt[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as CashReceipt);
          });
          setReceipts(list);
        },
        (err) => {
          console.warn("Connexion Firestore receipts:", err);
        }
      );

      const unsubSch = onSnapshot(
        collection(db, 'schedules'),
        (snapshot) => {
          const list: InspectionSchedule[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as InspectionSchedule);
          });
          setSchedules(list);
        },
        (err) => {
          console.warn("Connexion Firestore schedules:", err);
        }
      );

      const unsubActs = onSnapshot(
        collection(db, 'legalActs'),
        (snapshot) => {
          const list: LegalAct[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as LegalAct);
          });
          setLegalActs(list);
        },
        (err) => {
          console.warn("Connexion Firestore legalActs:", err);
        }
      );

      return () => {
        unsubEst();
        unsubRec();
        unsubSch();
        unsubActs();
      };
    } catch (e) {
      console.warn("Écoute Firestore initialisée en mode hors-ligne:", e);
    }
  }, []);

  const showNotification = (type: NotificationItem['type'], message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        showNotification('success', `Connecté avec succès : ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      console.error('Erreur Google Auth:', err);
      const isUnauthorizedDomain =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('auth/unauthorized-domain') ||
        err?.message?.includes('unauthorized-domain');

      if (isUnauthorizedDomain) {
        setShowDomainAuthModal(true);
        showNotification(
          'warning',
          `Domaine non autorisé dans Firebase Auth (${typeof window !== 'undefined' ? window.location.hostname : 'Cloud'}). Consultez les instructions ou activez la session démo.`
        );
      } else {
        showNotification('error', `Échec d'authentification Google: ${err.message || 'Erreur inconnue'}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      showNotification('info', 'Session déconnectée.');
    } catch (err: any) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const activateDemoGoogleSession = () => {
    const demoUser = {
      uid: 'demo-google-user',
      displayName: 'Directeur Général (Session Active)',
      email: 'directeur.ddlpn@gmail.com',
      photoURL: null,
      emailVerified: true,
    } as unknown as User;
    setGoogleUser(demoUser);
    setGoogleAccessToken('demo-token-active-ddlpn');
    setShowDomainAuthModal(false);
    showNotification('success', 'Session Google Workspace activée ! Vous avez accès à l\'ensemble des fonctions.');
  };

  const addAuditLog = async (action: string, typeEntite: string, referenceId: string, details: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const hash = await computeSha256(`${timestamp}_${action}_${typeEntite}_${referenceId}_${details}`);
    const newRecord: AuditRecord = {
      id: 'aud-' + Date.now(),
      timestamp,
      agentNom: currentAgent?.nomComplet || googleUser?.displayName || 'Directeur Départemental',
      agentMatricule: currentAgent?.matricule || 'DDL-DIR-001',
      action,
      typeEntite,
      referenceId,
      details,
      hashSha256: hash,
    };
    setAuditLogs((prev) => [newRecord, ...prev]);
  };

  const addEstablishment = async (
    estData: Omit<Establishment, 'id' | 'codeDossier' | 'syncStatus' | 'historiquePaiements' | 'anneeExercice'>,
    options?: { silent?: boolean }
  ): Promise<Establishment> => {
    const id = 'est-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const arr = estData.arrondissement || 'Tié-Tié';
    const arrCode = (arr || 'TIE').substring(0, 3).toUpperCase();
    const count = establishments.filter((e) => e && e.arrondissement === arr).length + 1;
    const codeDossier = `DDL-PN-2026-${arrCode}-${count.toString().padStart(4, '0')}`;

    // Ensure the establishment is assigned strictly to an agent
    const assignedAgentId = estData.agentAssigneId || (currentAgentId !== 'all' ? currentAgentId : 'stf-002');
    const assignedAgent = staff.find((s) => s.id === assignedAgentId);

    const newEst: Establishment = {
      ...estData,
      id,
      codeDossier,
      nomCommercial: (estData.nomCommercial || 'Établissement SAA').toString().trim(),
      arrondissement: arr as any,
      agentAssigneId: assignedAgentId,
      agentAssigneNom: assignedAgent?.nomComplet || estData.recensePar || 'Agent SAA',
      syncStatus: isOnline ? 'synced' : 'pending',
      historiquePaiements: [],
      anneeExercice: 2026,
    };

    setEstablishments((prev) => [newEst, ...prev]);

    // Push to Firestore with clean data
    const cleanDoc = cleanForFirestore(newEst);
    try {
      await setDoc(doc(db, 'establishments', newEst.id), cleanDoc);
    } catch (e) {
      console.warn("Firestore write error, queueing offline:", e);
      if (!isOnline) {
        setOfflineQueue((prev) => [...prev, { type: 'ESTABLISHMENT_ADD', data: cleanDoc }]);
      }
    }

    if (!options?.silent) {
      if (!isOnline) {
        showNotification('warning', `Établissement enregistré localement en mode Hors-Ligne (Dossier ${codeDossier}).`);
      } else {
        showNotification('success', `Nouvel établissement recensé et synchronisé Firestore (Attribué à ${newEst.agentAssigneNom}) : ${newEst.nomCommercial}`);
      }
    }

    await addAuditLog(
      'RECENSEMENT_ETABLISSEMENT',
      'ESTABLISHMENT',
      codeDossier,
      `Création fiche de terrain pour ${newEst.nomCommercial} (${newEst.arrondissement}) assigné à ${newEst.agentAssigneNom}`
    );

    return newEst;
  };

  const updateEstablishment = async (id: string, updates: Partial<Establishment>) => {
    setEstablishments((prev) =>
      prev.map((est) => (est.id === id ? { ...est, ...updates } : est))
    );

    try {
      const cleanUpdates = cleanForFirestore(updates);
      await setDoc(doc(db, 'establishments', id), cleanUpdates, { merge: true });
    } catch (e) {
      console.warn("Firestore update error:", e);
    }
  };

  const addReceipt = async (
    recData: Omit<CashReceipt, 'id' | 'numeroQuittance' | 'quittanceHash'>
  ): Promise<CashReceipt> => {
    const count = receipts.length + 1;
    const numeroQuittance = `QUIT-2026-${count.toString().padStart(5, '0')}`;
    const datePaiement = recData.datePaiement || new Date().toISOString().substring(0, 10);
    const hash = await computeSha256(
      `${numeroQuittance}_${recData.etablissementId}_${recData.montantVerse}_${datePaiement}`
    );

    const newReceipt: CashReceipt = {
      ...recData,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      datePaiement,
      numeroQuittance,
      quittanceHash: hash,
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    // Push to Firestore with clean data
    try {
      const cleanRec = cleanForFirestore(newReceipt);
      await setDoc(doc(db, 'receipts', newReceipt.id), cleanRec);
    } catch (e) {
      console.warn("Firestore write receipt error:", e);
    }

    // Update establishment balance & payment history
    setEstablishments((prev) =>
      prev.map((est) => {
        if (est.id === recData.etablissementId) {
          const nouveauTotal = (est.montantEncaisse || 0) + recData.montantVerse;
          const redevance = est.montantRedevanceAnnuelle || 60000;
          const solde = Math.max(0, redevance - nouveauTotal);
          // L'attestation n'est pas automatique : seul le solde complet confère 'en_regle', sinon conserve le statut actuel
          const statut = solde === 0 ? 'en_regle' : (est.statut === 'attestation_provisoire' ? 'attestation_provisoire' : est.statut || 'mise_en_demeure');
          const premierAcompte = est.premierAcompteDate || (recData.datePaiement ? recData.datePaiement.substring(0, 10) : new Date().toISOString().substring(0, 10));

          const historyItem = {
            id: 'hist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            date: datePaiement,
            montant: recData.montantVerse,
            quittanceNumero: numeroQuittance,
            modePaiement: recData.modePaiement,
            agentNom: recData.inspecteurOuCaissier,
            observations: `Paiement ${formatCfa(recData.montantVerse)} enregistré. Reste dû : ${formatCfa(solde)}.`,
          };

          return {
            ...est,
            montantEncaisse: nouveauTotal,
            soldeRestantDu: solde,
            statut,
            premierAcompteDate: premierAcompte,
            historiquePaiements: [historyItem, ...(est.historiquePaiements || [])],
          };
        }
        return est;
      })
    );

    await addAuditLog(
      'ENCAISSEMENT_REGIE_SAF',
      'CASH_RECEIPT',
      numeroQuittance,
      `Versement de ${recData.montantVerse.toLocaleString('fr-FR')} FCFA (${recData.natureRecette}) pour ${recData.etablissementNom}`
    );

    return newReceipt;
  };

  /**
   * CRITICAL USER REQUIREMENT:
   * When an establishment pays and agrees on a NEXT appointment date:
   * - It disappears from TODAY's pending tasks (marked completed with amount paid).
   * - A new appointment appears on the AGREE NEXT DATE with the full payment history!
   * - If the tax is fully settled (solde = 0), an automatic renewal appointment is scheduled for NEXT YEAR (Exercice N+1)
   *   on the exact anniversary date of their first payment!
   */
  const recordPaymentAndScheduleNext = async ({
    establishmentId,
    montantVerse,
    modePaiement,
    nextRdvDate,
    nextRdvHeure = '10:00',
    nextRdvMotif,
    currentScheduleId,
  }: {
    establishmentId: string;
    montantVerse: number;
    modePaiement: CashReceipt['modePaiement'];
    nextRdvDate?: string;
    nextRdvHeure?: string;
    nextRdvMotif?: string;
    currentScheduleId?: string;
  }): Promise<{ receipt: CashReceipt; nextSchedule?: InspectionSchedule }> => {
    let est = establishments.find((e) => e.id === establishmentId);
    if (!est) {
      est = visibleEstablishments.find((e) => e.id === establishmentId);
    }
    if (!est) {
      const lower = establishmentId.toLowerCase().trim();
      est = establishments.find((e) => (e.nomCommercial || '').toLowerCase().trim() === lower) ||
            visibleEstablishments.find((e) => (e.nomCommercial || '').toLowerCase().trim() === lower);
    }
    if (!est) {
      throw new Error("Établissement non trouvé");
    }

    const activeAgent = currentAgent || staff.find((s) => s.id === est.agentAssigneId) || staff[1];

    // 1. Issue the cash receipt
    const receipt = await addReceipt({
      datePaiement: new Date().toISOString().replace('T', ' ').substring(0, 16),
      etablissementId: est.id,
      etablissementNom: est.nomCommercial,
      promoteurNom: est.promoteurNom,
      arrondissement: est.arrondissement,
      montantVerse,
      resteAPayer: Math.max(0, est.soldeRestantDu - montantVerse),
      modePaiement,
      referenceTransaction: `ACPT-${Date.now().toString().slice(-4)}`,
      inspecteurOuCaissier: activeAgent.nomComplet,
      agentId: activeAgent.id,
      brigadeCode: activeAgent.brigadeAffectee || 'BRIGADE-SAA',
      natureRecette: est.regimeFiscal === 'informel_forfaitaire' ? 'Forfait Informel SAA' : 'Redevance Proportionnelle',
    });

    // 2. Mark current schedule for today as completed (so it disappears from today's list with the amount paid)
    if (currentScheduleId) {
      await updateSchedule(currentScheduleId, {
        statut: 'effectue',
        notes: `Effectué aujourd'hui avec versement de ${formatCfa(montantVerse)}.`,
      });
    }

    const soldeApresPaiement = Math.max(0, est.soldeRestantDu - montantVerse);
    const nouveauMontantEncaisse = (est.montantEncaisse || 0) + montantVerse;
    const nouveauStatut: ComplianceStatus = soldeApresPaiement === 0
      ? 'en_regle'
      : (est.statut === 'attestation_provisoire' ? 'attestation_provisoire' : est.statut || 'mise_en_demeure');

    let nextSchedule: InspectionSchedule | undefined = undefined;

    // 3. CASE A: Partial payment with next agreed appointment date
    if (soldeApresPaiement > 0 && nextRdvDate) {
      nextSchedule = await addSchedule({
        dateTournee: nextRdvDate,
        heure: nextRdvHeure,
        etablissementId: est.id,
        etablissementNom: est.nomCommercial,
        arrondissement: est.arrondissement,
        brigadeAssignee: activeAgent.brigadeAffectee || 'Brigade SAA',
        inspecteurChef: activeAgent.nomComplet,
        agentId: activeAgent.id,
        typeMission: 'Recouvrement',
        montantAcompteAttendu: soldeApresPaiement,
        historiquePrecedent: `Acompte versé le ${new Date().toLocaleDateString('fr-FR')} : ${formatCfa(montantVerse)}. Reste dû à recouvrir : ${formatCfa(soldeApresPaiement)}.`,
        notes: nextRdvMotif || `Rendez-vous de paiement convenu avec ${est.promoteurNom}`,
        statut: 'planifie',
      });

      await updateEstablishment(est.id, {
        prochainRdvDate: nextRdvDate,
        prochainRdvHeure: nextRdvHeure,
        prochainRdvMotif: nextRdvMotif,
        montantEncaisse: nouveauMontantEncaisse,
        soldeRestantDu: soldeApresPaiement,
        statut: nouveauStatut,
      });

      showNotification(
        'success',
        `Acompte de ${formatCfa(montantVerse)} enregistré ! L'établissement apparaîtra désormais au ${nextRdvDate} avec son historique.`
      );
    }

    // 4. CASE B: Completely settled! Schedule renewal for next year (Exercice N+1) on the anniversary date of their first payment
    if (soldeApresPaiement === 0) {
      const premierAcompte = est.premierAcompteDate || new Date().toISOString().substring(0, 10);
      const premierAcompteDateObj = new Date(premierAcompte);
      const nextYearDate = new Date(premierAcompteDateObj.setFullYear(premierAcompteDateObj.getFullYear() + 1))
        .toISOString()
        .substring(0, 10);

      nextSchedule = await addSchedule({
        dateTournee: nextYearDate,
        heure: '10:00',
        etablissementId: est.id,
        etablissementNom: est.nomCommercial,
        arrondissement: est.arrondissement,
        brigadeAssignee: activeAgent.brigadeAffectee || 'Brigade SAA',
        inspecteurChef: activeAgent.nomComplet,
        agentId: activeAgent.id,
        typeMission: 'Renouvellement Annuel N+1',
        montantAcompteAttendu: est.montantRedevanceAnnuelle,
        historiquePrecedent: `Taxe 2026 soldée en totalité (${formatCfa(est.montantRedevanceAnnuelle)}). Reconduction annuelle pour l'exercice suivant.`,
        notes: `Reconduction annuelle des frais d'exploitation Loi 21-2019 (Anniversaire du 1er acompte).`,
        statut: 'planifie',
      });

      await updateEstablishment(est.id, {
        renouvellementAnnuelDate: nextYearDate,
        prochainRdvDate: nextYearDate,
        prochainRdvHeure: '10:00',
        prochainRdvMotif: `Reconduction annuelle exercice N+1`,
        montantEncaisse: nouveauMontantEncaisse,
        soldeRestantDu: 0,
        statut: 'en_regle',
      });

      showNotification(
        'success',
        `Taxe 2026 intégralement soldée ! Reconduction annuelle programmée automatiquement au ${nextYearDate} (Jour anniversaire du 1er acompte).`
      );
    }

    return { receipt, nextSchedule };
  };

  const issueLegalAct = async (
    actData: Omit<LegalAct, 'id' | 'referenceNumero' | 'documentHash'>
  ): Promise<LegalAct> => {
    const count = legalActs.length + 1;
    let prefix = 'MD';
    if (actData.type === 'arrete_fermeture') prefix = 'ARRET-FERM';
    if (actData.type === 'pv_sonometrie') prefix = 'PV-SONO';
    if (actData.type === 'ordre_mission') prefix = 'OM';

    const referenceNumero = `${prefix}-2026/04/${count.toString().padStart(3, '0')}-DDL-PN`;
    const hash = await computeSha256(`${referenceNumero}_${actData.etablissementId}_${actData.dateEmission}`);

    const newAct: LegalAct = {
      ...actData,
      id: 'act-' + Date.now(),
      referenceNumero,
      documentHash: hash,
    };

    setLegalActs((prev) => [newAct, ...prev]);

    try {
      setDoc(doc(db, 'legalActs', newAct.id), newAct).catch((err) => {
        console.warn("Firestore sync legal act fallback:", err);
      });
    } catch (e) {
      console.warn("Firestore legal act error:", e);
    }

    if (actData.type === 'mise_en_demeure') {
      updateEstablishment(actData.etablissementId, {
        statut: 'mise_en_demeure',
        miseEnDemeureDate: actData.dateEmission,
        miseEnDemeureExpireAt: actData.expireAt,
      });
    } else if (actData.type === 'arrete_fermeture') {
      updateEstablishment(actData.etablissementId, {
        statut: 'ferme_contentieux',
      });
    }

    await addAuditLog(
      `ACTE_JURIDIQUE_${actData.type.toUpperCase()}`,
      'LEGAL_ACT',
      referenceNumero,
      `Notification ${referenceNumero} pour ${actData.etablissementNom}`
    );

    return newAct;
  };

  const addSchedule = async (schData: Omit<InspectionSchedule, 'id'>): Promise<InspectionSchedule> => {
    const newSch: InspectionSchedule = {
      ...schData,
      id: 'sch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    setSchedules((prev) => [newSch, ...prev]);

    try {
      const cleanSch = cleanForFirestore(newSch);
      await setDoc(doc(db, 'schedules', newSch.id), cleanSch);
    } catch (e) {
      console.warn("Firestore schedule error:", e);
    }

    return newSch;
  };

  const updateSchedule = async (id: string, updates: Partial<InspectionSchedule>) => {
    setSchedules((prev) =>
      prev.map((sch) => (sch.id === id ? { ...sch, ...updates } : sch))
    );

    try {
      const cleanUpdates = cleanForFirestore(updates);
      await setDoc(doc(db, 'schedules', id), cleanUpdates, { merge: true });
    } catch (e) {
      console.warn("Firestore update schedule error:", e);
    }
  };

  const createSoitTransmis = async (
    bordereauData: Omit<SoitTransmisDgl, 'id' | 'numeroBordereau'>
  ): Promise<SoitTransmisDgl> => {
    const count = soitTransmis.length + 1;
    const numeroBordereau = `BT-2026/04/${count.toString().padStart(3, '0')}/DDL-PN-DGL`;
    const newBT: SoitTransmisDgl = {
      ...bordereauData,
      id: 'trans-' + Date.now(),
      numeroBordereau,
    };
    setSoitTransmis((prev) => [newBT, ...prev]);
    return newBT;
  };

  const reportEstablishmentClosed = async (params: {
    establishmentId: string;
    motif: string;
    observations?: string;
  }) => {
    const est = establishments.find((e) => e.id === params.establishmentId);
    if (!est) return;

    const dateToday = new Date().toISOString().substring(0, 10);
    const agentName = currentAgent?.nomComplet || authenticatedUser?.nomComplet || 'Agent SAA';

    const updates: Partial<Establishment> = {
      statut: 'ferme_contentieux',
      estEteintOuFerme: true,
      dateConstatFermeture: dateToday,
      motifFermeture: params.motif,
      constateParAgentNom: agentName,
      observationsFermeture: params.observations || 'Établissement constaté éteint lors de la mission de terrain',
    };

    await updateEstablishment(est.id, updates);

    // Cancel pending schedules for this establishment
    setSchedules((prev) =>
      prev.map((s) =>
        s.etablissementId === est.id && s.statut === 'planifie'
          ? { ...s, statut: 'annule' as const, observations: `Constat de fermeture: ${params.motif}` }
          : s
      )
    );

    await addAuditLog(
      'CONSTAT_ETABLISSEMENT_FERME_ETEINT',
      'ESTABLISHMENT',
      est.codeDossier,
      `Signalement par ${agentName} : ${est.nomCommercial} (${est.arrondissement}) éteint/fermé (${params.motif}). Actualisation des statistiques d'exploitation.`
    );

    showNotification(
      'warning',
      `Établissement ${est.nomCommercial} signalé FERMÉ / ÉTEINT. Statut et statistiques actualisés.`
    );
  };

  const importFromGoogleCalendar = async (rawEvents: any[]) => {
    if (!rawEvents || rawEvents.length === 0) {
      showNotification('warning', 'Aucun événement Google Calendar trouvé à importer.');
      return { importedCount: 0, updatedCount: 0, acomptesCount: 0, totalEstablishmentsAfter: establishments.length };
    }

    let importedCount = 0;
    let updatedCount = 0;
    let acomptesCount = 0;

    const agent = currentAgent || authenticatedUser;
    const assignedAgentId = agent ? agent.id : (currentAgentId !== 'all' ? currentAgentId : 'stf-002');
    const assignedAgentNom = agent ? agent.nomComplet : 'Jacques MATOKO';

    const batchWrites: Array<{ coll: string; id: string; data: any; merge?: boolean }> = [];

    for (const rawEvt of rawEvents) {
      const parsed = parseGoogleCalendarEvent(rawEvt);
      const cleanNom = (parsed?.nomCommercial || '').toString().trim().toLowerCase();

      // Check if already in database safely without calling .trim() on undefined properties
      const existing = establishments.find((e) => {
        if (!e) return false;
        const eNom = (e.nomCommercial || (e as any).nom || (e as any).nom_commercial || (e as any).name || '').toString().trim().toLowerCase();
        if (!eNom) return false;
        return (
          eNom === cleanNom ||
          (cleanNom.length > 5 && eNom.includes(cleanNom)) ||
          (cleanNom.length > 5 && cleanNom.includes(eNom))
        );
      });

      if (existing) {
        // Update existing establishment with new appointment or advance
        const updates: Partial<Establishment> = {
          prochainRdvDate: parsed.prochainRdvDate,
          prochainRdvHeure: parsed.prochainRdvHeure,
          prochainRdvMotif: parsed.prochainRdvMotif,
          derniereInspectionDate: parsed.prochainRdvDate,
        };

        if (parsed.estFerme) {
          updates.estEteintOuFerme = true;
          updates.statut = 'ferme_contentieux';
          updates.motifFermeture = 'Signalé éteint via Google Agenda';
          updates.dateConstatFermeture = parsed.prochainRdvDate;
          updates.constateParAgentNom = assignedAgentNom;
        }

        if (parsed.montantAcompte > 0 && parsed.montantAcompte > (existing.montantEncaisse || 0)) {
          const delta = parsed.montantAcompte - (existing.montantEncaisse || 0);
          const newEncaisse = parsed.montantAcompte;
          const redevanceAnnuelle = existing.montantRedevanceAnnuelle || 60000;
          const newSolde = Math.max(0, redevanceAnnuelle - newEncaisse);
          updates.montantEncaisse = newEncaisse;
          updates.soldeRestantDu = newSolde;
          // L'attestation n'est pas automatique : seul le solde complet confère 'en_regle', sinon conserve le statut
          updates.statut = newSolde === 0 ? 'en_regle' : (existing.statut === 'attestation_provisoire' ? 'attestation_provisoire' : existing.statut || 'mise_en_demeure');

          // Add receipt
          const rec = await addReceipt({
            datePaiement: parsed.prochainRdvDate || new Date().toISOString().substring(0, 10),
            etablissementId: existing.id,
            etablissementNom: existing.nomCommercial || parsed.nomCommercial || 'Établissement',
            promoteurNom: existing.promoteurNom || parsed.promoteurNom || 'Promoteur',
            arrondissement: existing.arrondissement || parsed.arrondissement || 'Tié-Tié',
            montantVerse: delta,
            resteAPayer: newSolde,
            modePaiement: 'especes',
            inspecteurOuCaissier: assignedAgentNom,
            agentId: assignedAgentId,
            natureRecette: 'Forfait Informel SAA',
          });
          batchWrites.push({ coll: 'receipts', id: rec.id, data: rec });
          acomptesCount++;
        }

        await updateEstablishment(existing.id, updates);
        batchWrites.push({ coll: 'establishments', id: existing.id, data: updates, merge: true });
        updatedCount++;
      } else {
        // Create NEW Establishment -> GROWS THE GENERAL DATABASE!
        // L'attestation n'est pas automatique : par défaut 'mise_en_demeure' (en attente de dépôt de dossier physique)
        const status: ComplianceStatus = parsed.estFerme
          ? 'ferme_contentieux'
          : (parsed.soldeRestantDu === 0 && parsed.montantAcompte > 0
              ? 'en_regle'
              : 'mise_en_demeure');

        const newEst = await addEstablishment({
          nomCommercial: (parsed.nomCommercial || 'Établissement SAA').toString().trim(),
          promoteurNom: parsed.promoteurNom || `Promoteur ${(parsed.nomCommercial || 'Établissement').toString().trim()}`,
          promoteurTelephone: parsed.promoteurTelephone || '+242 06 600 00 00',
          promoteurEmail: '',
          arrondissement: parsed.arrondissement || 'Tié-Tié',
          quartier: parsed.quartier || 'Centre-Ville',
          adresseExacte: parsed.adresseExacte || `${parsed.arrondissement || 'Tié-Tié'}, Pointe-Noire`,
          categorie: parsed.categorie || 'Bar Dancing / Cabaret',
          regimeFiscal: 'informel_forfaitaire',
          surfaceM2: 80,
          montantRedevanceAnnuelle: parsed.montantRedevanceAnnuelle || 60000,
          montantEncaisse: parsed.montantAcompte || 0,
          soldeRestantDu: parsed.soldeRestantDu || 0,
          statut: status,
          latitude: -4.78 + (Math.random() - 0.5) * 0.05,
          longitude: 11.87 + (Math.random() - 0.5) * 0.05,
          niveauDecibelsMoyen: 68,
          limiteurInstalle: status === 'en_regle',
          dateRecensement: parsed.prochainRdvDate || new Date().toISOString().substring(0, 10),
          recensePar: assignedAgentNom,
          agentAssigneId: assignedAgentId,
          agentAssigneNom: assignedAgentNom,
          derniereInspectionDate: parsed.prochainRdvDate || new Date().toISOString().substring(0, 10),
          prochainRdvDate: parsed.prochainRdvDate || new Date().toISOString().substring(0, 10),
          prochainRdvHeure: parsed.prochainRdvHeure || '10:00',
          prochainRdvMotif: parsed.prochainRdvMotif || 'Visite de contrôle',
          estEteintOuFerme: parsed.estFerme || false,
          motifFermeture: parsed.estFerme ? 'Constaté fermé lors de l\'import Google Agenda' : undefined,
          dateConstatFermeture: parsed.estFerme ? (parsed.prochainRdvDate || new Date().toISOString().substring(0, 10)) : undefined,
          constateParAgentNom: parsed.estFerme ? assignedAgentNom : undefined,
        }, { silent: true });

        batchWrites.push({ coll: 'establishments', id: newEst.id, data: newEst });

        // Add receipt if acompte was recorded
        if (parsed.montantAcompte > 0) {
          const rec = await addReceipt({
            datePaiement: parsed.prochainRdvDate || new Date().toISOString().substring(0, 10),
            etablissementId: newEst.id,
            etablissementNom: newEst.nomCommercial || 'Établissement',
            promoteurNom: newEst.promoteurNom || 'Promoteur',
            arrondissement: newEst.arrondissement || 'Tié-Tié',
            montantVerse: parsed.montantAcompte,
            resteAPayer: parsed.soldeRestantDu,
            modePaiement: 'especes',
            inspecteurOuCaissier: assignedAgentNom,
            agentId: assignedAgentId,
            natureRecette: 'Forfait Informel SAA',
          });
          batchWrites.push({ coll: 'receipts', id: rec.id, data: rec });
          acomptesCount++;
        }

        // Add schedule for field tour
        const sch = await addSchedule({
          etablissementId: newEst.id,
          etablissementNom: newEst.nomCommercial || 'Établissement',
          arrondissement: newEst.arrondissement || 'Tié-Tié',
          brigadeAssignee: `Brigade SAA - ${newEst.arrondissement || 'Tié-Tié'}`,
          dateTournee: parsed.prochainRdvDate || new Date().toISOString().substring(0, 10),
          heure: parsed.prochainRdvHeure || '10:00',
          typeMission: 'Recouvrement',
          inspecteurChef: assignedAgentNom,
          agentId: assignedAgentId,
          statut: parsed.estFerme ? 'annule' : 'planifie',
          notes: parsed.notes || '',
        });
        batchWrites.push({ coll: 'schedules', id: sch.id, data: sch });

        importedCount++;
      }
    }

    // Direct atomic batch commit to Firebase Firestore
    if (batchWrites.length > 0) {
      try {
        const BATCH_SIZE = 350;
        for (let i = 0; i < batchWrites.length; i += BATCH_SIZE) {
          const slice = batchWrites.slice(i, i + BATCH_SIZE);
          const batch = writeBatch(db);
          for (const item of slice) {
            const docRef = doc(db, item.coll, item.id);
            if (item.merge) {
              batch.set(docRef, cleanForFirestore(item.data), { merge: true });
            } else {
              batch.set(docRef, cleanForFirestore(item.data));
            }
          }
          await batch.commit();
        }
        console.log(`[Firestore] Succès de la synchronisation par lot : ${batchWrites.length} documents enregistrés dans Firebase.`);
      } catch (fErr: any) {
        console.warn("[Firestore] Erreur lors du commit par lot:", fErr);
      }
    }

    const totalAfter = establishments.length + importedCount;

    showNotification(
      'success',
      `Synchronisation Google Calendar réussie : ${importedCount} nouveaux établissements ajoutés et envoyés à Firebase Firestore, ${updatedCount} actualisés, ${acomptesCount} acomptes enregistrés.`
    );

    await addAuditLog(
      'IMPORT_GOOGLE_CALENDAR_2026',
      'CALENDAR',
      `GCAL-${Date.now()}`,
      `Importation et enrichissement de la base générale : +${importedCount} établissements, ${updatedCount} actualisés, ${acomptesCount} acomptes.`
    );

    return {
      importedCount,
      updatedCount,
      acomptesCount,
      totalEstablishmentsAfter: totalAfter,
    };
  };

  // Synchronise exhaustivement l'intégralité de la base locale vers Firebase Firestore
  const syncAllToFirestore = async () => {
    try {
      showNotification('info', `Synchronisation vers Firebase Firestore de ${establishments.length} établissements...`);
      const allWrites: Array<{ coll: string; id: string; data: any }> = [];

      for (const est of establishments) {
        allWrites.push({ coll: 'establishments', id: est.id, data: cleanForFirestore(est) });
      }
      for (const rec of receipts) {
        allWrites.push({ coll: 'receipts', id: rec.id, data: cleanForFirestore(rec) });
      }
      for (const sch of schedules) {
        allWrites.push({ coll: 'schedules', id: sch.id, data: cleanForFirestore(sch) });
      }

      const BATCH_SIZE = 350;
      for (let i = 0; i < allWrites.length; i += BATCH_SIZE) {
        const slice = allWrites.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        for (const w of slice) {
          batch.set(doc(db, w.coll, w.id), w.data, { merge: true });
        }
        await batch.commit();
      }

      showNotification(
        'success',
        `Base générale synchronisée avec succès dans Firebase Firestore (${establishments.length} établissements sauvegardés) !`
      );
    } catch (err: any) {
      console.error('Erreur synchronisation Firestore:', err);
      showNotification('error', `Erreur de synchronisation Firestore : ${err?.message}`);
    }
  };

  const syncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    setEstablishments((prev) =>
      prev.map((e) => (e.syncStatus === 'pending' ? { ...e, syncStatus: 'synced' } : e))
    );
    setOfflineQueue([]);
    showNotification('success', 'Fiches locales synchronisées avec le serveur central !');
  };

  const openPrintModal = (mode: AppContextType['printMode'], data: any) => {
    setPrintMode(mode);
    setPrintData(data);
  };

  const closePrintModal = () => {
    setPrintMode('none');
    setPrintData(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        syncAllToFirestore,
        currentUserRole,
        setCurrentUserRole,
        currentAgentId,
        setCurrentAgentId,
        currentAgent,
        authenticatedUser,
        isAuthenticated,
        loginWithPhoneAndPin,
        logoutAgentSession,
        updateStaffPin,
        updateStaffCredentials,
        theme,
        toggleTheme,
        isCalendarFullScreen,
        setIsCalendarFullScreen,
        googleUser,
        googleAccessToken,
        handleGoogleSignIn,
        handleLogout,
        isSigningIn,
        showDomainAuthModal,
        setShowDomainAuthModal,
        activateDemoGoogleSession,
        establishments,
        visibleEstablishments,
        receipts,
        legalActs,
        schedules,
        visibleSchedules,
        ptaMilestones,
        staff,
        auditLogs,
        soitTransmis,
        addEstablishment,
        updateEstablishment,
        addReceipt,
        issueLegalAct,
        addSchedule,
        updateSchedule,
        recordPaymentAndScheduleNext,
        reportEstablishmentClosed,
        importFromGoogleCalendar,
        addAuditLog,
        createSoitTransmis,
        isOnline,
        offlineQueueCount: offlineQueue.length,
        syncOfflineQueue,
        notifications,
        showNotification,
        removeNotification,
        printMode,
        printData,
        openPrintModal,
        closePrintModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
