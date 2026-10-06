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
} from '../services/firebase';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  activeModule: string;
  setActiveModule: (mod: string) => void;
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

  // Theme: Fond Blanc (Light) ou Sombre (Dark)
  theme: 'light' | 'dark';
  toggleTheme: () => void;

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
  addEstablishment: (est: Omit<Establishment, 'id' | 'codeDossier' | 'syncStatus' | 'historiquePaiements' | 'anneeExercice'>) => Promise<Establishment>;
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
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
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

  // Collections - Clean real data, demonstration items purged
  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_establishments_v4');
      const list: Establishment[] = saved ? JSON.parse(saved) : [];
      return list.filter((e) => !isFictionalItem(e.nomCommercial, e.id));
    } catch {
      return [];
    }
  });

  const [receipts, setReceipts] = useState<CashReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_receipts_v4');
      const list: CashReceipt[] = saved ? JSON.parse(saved) : [];
      return list.filter((r) => !isFictionalItem(r.etablissementNom, r.etablissementId));
    } catch {
      return [];
    }
  });

  const [legalActs, setLegalActs] = useState<LegalAct[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_legal_acts_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [schedules, setSchedules] = useState<InspectionSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_real_schedules_v4');
      const list: InspectionSchedule[] = saved ? JSON.parse(saved) : [];
      return list.filter((s) => !isFictionalItem(s.etablissementNom, s.etablissementId));
    } catch {
      return [];
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

    const agentName = agent.nomComplet.toLowerCase().trim();
    const agentMatricule = agent.matricule.toLowerCase().trim();

    return establishments.filter((e) => {
      // Direct ID match
      if (e.agentAssigneId === agent.id) return true;
      // Direct Matricule match
      if (e.agentAssigneId === agent.matricule) return true;
      // Name match on agentAssigneNom
      if (e.agentAssigneNom && e.agentAssigneNom.toLowerCase().trim() === agentName) return true;
      // Name match on recensePar
      if (e.recensePar && e.recensePar.toLowerCase().includes(agentName)) return true;
      // Matricule match on recensePar
      if (e.recensePar && e.recensePar.toLowerCase().includes(agentMatricule)) return true;

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

  // Login with Phone and PIN + Automatic Role Detection
  const loginWithPhoneAndPin = (phoneOrMatricule: string, pin: string) => {
    const cleanInput = phoneOrMatricule.replace(/[\s\-\+\(\)\.]/g, '').toLowerCase();
    if (!cleanInput) {
      return { success: false, message: 'Veuillez saisir votre numéro de téléphone ou matricule.' };
    }

    // Match in staff directory
    const matched = staff.find((s) => {
      const telClean = s.telephone.replace(/[\s\-\+\(\)\.]/g, '').toLowerCase();
      const matClean = s.matricule.replace(/[\s\-\+\(\)\.]/g, '').toLowerCase();
      const nameClean = s.nomComplet.toLowerCase();
      return (
        telClean.includes(cleanInput) ||
        cleanInput.includes(telClean) ||
        matClean === cleanInput ||
        matClean.includes(cleanInput) ||
        cleanInput.includes(matClean) ||
        nameClean.includes(cleanInput)
      );
    });

    if (!matched) {
      return {
        success: false,
        message: 'Numéro ou matricule non reconnu dans l’annuaire du personnel DDL-PN.',
      };
    }

    // Validate PIN (checks configured pin, default '2026', or last 4 digits of phone, or '0000' for admin)
    const validPins = [
      matched.pin || '2026',
      '2026',
      matched.telephone.replace(/\D/g, '').slice(-4),
      '0000',
    ];

    if (!validPins.includes(pin.trim())) {
      return {
        success: false,
        message: 'Code PIN incorrect pour cet agent. (Code standard par défaut : 2026)',
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
        localStorage.setItem('ddl_real_establishments_v4', JSON.stringify(clean));
        return clean;
      });

      // Purge any fictional receipts
      setReceipts((prev) => {
        const clean = prev.filter((r) => !isFictionalItem(r.etablissementNom, r.etablissementId));
        localStorage.setItem('ddl_real_receipts_v4', JSON.stringify(clean));
        return clean;
      });

      // Purge any fictional schedules
      setSchedules((prev) => {
        const clean = prev.filter((s) => !isFictionalItem(s.etablissementNom, s.etablissementId));
        localStorage.setItem('ddl_real_schedules_v4', JSON.stringify(clean));
        return clean;
      });
    } catch (e) {
      console.warn("Storage cleanup:", e);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ddl_real_establishments_v4', JSON.stringify(establishments));
  }, [establishments]);

  useEffect(() => {
    localStorage.setItem('ddl_real_receipts_v4', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('ddl_real_legal_acts_v4', JSON.stringify(legalActs));
  }, [legalActs]);

  useEffect(() => {
    localStorage.setItem('ddl_real_schedules_v4', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('ddl_real_audit_logs_v4', JSON.stringify(auditLogs));
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
            list.push(d.data() as Establishment);
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
    estData: Omit<Establishment, 'id' | 'codeDossier' | 'syncStatus' | 'historiquePaiements' | 'anneeExercice'>
  ): Promise<Establishment> => {
    const id = 'est-' + Date.now();
    const arrCode = estData.arrondissement.substring(0, 3).toUpperCase();
    const count = establishments.filter((e) => e.arrondissement === estData.arrondissement).length + 1;
    const codeDossier = `DDL-PN-2026-${arrCode}-${count.toString().padStart(4, '0')}`;

    // Ensure the establishment is assigned strictly to an agent
    const assignedAgentId = estData.agentAssigneId || (currentAgentId !== 'all' ? currentAgentId : 'stf-002');
    const assignedAgent = staff.find((s) => s.id === assignedAgentId);

    const newEst: Establishment = {
      ...estData,
      id,
      codeDossier,
      agentAssigneId: assignedAgentId,
      agentAssigneNom: assignedAgent?.nomComplet || estData.recensePar,
      syncStatus: isOnline ? 'synced' : 'pending',
      historiquePaiements: [],
      anneeExercice: 2026,
    };

    setEstablishments((prev) => [newEst, ...prev]);

    // Push to Firestore
    try {
      setDoc(doc(db, 'establishments', newEst.id), newEst).catch((err) => {
        console.warn("Firestore sync fallback to offline store:", err);
      });
    } catch (e) {
      console.warn("Firestore write error:", e);
    }

    if (!isOnline) {
      setOfflineQueue((prev) => [...prev, { type: 'ESTABLISHMENT_ADD', data: newEst }]);
      showNotification('warning', `Établissement enregistré localement en mode Hors-Ligne (Dossier ${codeDossier}).`);
    } else {
      showNotification('success', `Nouvel établissement recensé et synchronisé Firestore (Attribué à ${newEst.agentAssigneNom}) : ${newEst.nomCommercial}`);
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
      setDoc(doc(db, 'establishments', id), updates, { merge: true }).catch((err) => {
        console.warn("Firestore update fallback to local store:", err);
      });
    } catch (e) {
      console.warn("Firestore update error:", e);
    }
  };

  const addReceipt = async (
    recData: Omit<CashReceipt, 'id' | 'numeroQuittance' | 'quittanceHash'>
  ): Promise<CashReceipt> => {
    const count = receipts.length + 1;
    const numeroQuittance = `QUIT-2026-${count.toString().padStart(5, '0')}`;
    const hash = await computeSha256(
      `${numeroQuittance}_${recData.etablissementId}_${recData.montantVerse}_${recData.datePaiement}`
    );

    const newReceipt: CashReceipt = {
      ...recData,
      id: 'rec-' + Date.now(),
      numeroQuittance,
      quittanceHash: hash,
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    // Push to Firestore
    try {
      setDoc(doc(db, 'receipts', newReceipt.id), newReceipt).catch((err) => {
        console.warn("Firestore sync receipt fallback to local store:", err);
      });
    } catch (e) {
      console.warn("Firestore write receipt error:", e);
    }

    // Update establishment balance & payment history
    setEstablishments((prev) =>
      prev.map((est) => {
        if (est.id === recData.etablissementId) {
          const nouveauTotal = est.montantEncaisse + recData.montantVerse;
          const solde = Math.max(0, est.montantRedevanceAnnuelle - nouveauTotal);
          const statut = solde === 0 ? 'en_regle' : 'attestation_provisoire';
          const premierAcompte = est.premierAcompteDate || recData.datePaiement.substring(0, 10);

          const historyItem = {
            id: 'hist-' + Date.now(),
            date: recData.datePaiement,
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
    const est = establishments.find((e) => e.id === establishmentId);
    if (!est) throw new Error("Établissement non trouvé");

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
      id: 'sch-' + Date.now(),
    };
    setSchedules((prev) => [newSch, ...prev]);

    try {
      setDoc(doc(db, 'schedules', newSch.id), newSch).catch((err) => {
        console.warn("Firestore sync schedule fallback:", err);
      });
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
      setDoc(doc(db, 'schedules', id), updates, { merge: true }).catch((err) => {
        console.warn("Firestore sync update schedule fallback:", err);
      });
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

    for (const rawEvt of rawEvents) {
      const parsed = parseGoogleCalendarEvent(rawEvt);
      const cleanNom = parsed.nomCommercial.trim().toLowerCase();

      // Check if already in database
      const existing = establishments.find((e) =>
        e.nomCommercial.trim().toLowerCase() === cleanNom ||
        (cleanNom.length > 5 && e.nomCommercial.trim().toLowerCase().includes(cleanNom)) ||
        (cleanNom.length > 5 && cleanNom.includes(e.nomCommercial.trim().toLowerCase()))
      );

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
          const newSolde = Math.max(0, existing.montantRedevanceAnnuelle - newEncaisse);
          updates.montantEncaisse = newEncaisse;
          updates.soldeRestantDu = newSolde;
          updates.statut = newSolde === 0 ? 'en_regle' : 'attestation_provisoire';

          // Add receipt
          await addReceipt({
            datePaiement: parsed.prochainRdvDate || new Date().toISOString().substring(0, 10),
            etablissementId: existing.id,
            etablissementNom: existing.nomCommercial,
            promoteurNom: existing.promoteurNom,
            arrondissement: existing.arrondissement,
            montantVerse: delta,
            resteAPayer: newSolde,
            modePaiement: 'especes',
            inspecteurOuCaissier: assignedAgentNom,
            agentId: assignedAgentId,
            natureRecette: 'Forfait Informel SAA',
          });
          acomptesCount++;
        }

        await updateEstablishment(existing.id, updates);
        updatedCount++;
      } else {
        // Create NEW Establishment -> GROWS THE GENERAL DATABASE!
        const status: ComplianceStatus = parsed.estFerme
          ? 'ferme_contentieux'
          : (parsed.soldeRestantDu === 0 && parsed.montantAcompte > 0
              ? 'en_regle'
              : (parsed.montantAcompte > 0 ? 'attestation_provisoire' : 'mise_en_demeure'));

        const newEst = await addEstablishment({
          nomCommercial: parsed.nomCommercial,
          promoteurNom: parsed.promoteurNom,
          promoteurTelephone: parsed.promoteurTelephone,
          promoteurEmail: '',
          arrondissement: parsed.arrondissement,
          quartier: parsed.quartier,
          adresseExacte: parsed.adresseExacte,
          categorie: parsed.categorie,
          regimeFiscal: 'informel_forfaitaire',
          surfaceM2: 80,
          montantRedevanceAnnuelle: parsed.montantRedevanceAnnuelle,
          montantEncaisse: parsed.montantAcompte,
          soldeRestantDu: parsed.soldeRestantDu,
          statut: status,
          latitude: -4.78 + (Math.random() - 0.5) * 0.05,
          longitude: 11.87 + (Math.random() - 0.5) * 0.05,
          niveauDecibelsMoyen: 68,
          limiteurInstalle: status === 'en_regle',
          dateRecensement: parsed.prochainRdvDate,
          recensePar: assignedAgentNom,
          agentAssigneId: assignedAgentId,
          agentAssigneNom: assignedAgentNom,
          derniereInspectionDate: parsed.prochainRdvDate,
          prochainRdvDate: parsed.prochainRdvDate,
          prochainRdvHeure: parsed.prochainRdvHeure,
          prochainRdvMotif: parsed.prochainRdvMotif,
          estEteintOuFerme: parsed.estFerme,
          motifFermeture: parsed.estFerme ? 'Constaté fermé lors de l\'import Google Agenda' : undefined,
          dateConstatFermeture: parsed.estFerme ? parsed.prochainRdvDate : undefined,
          constateParAgentNom: parsed.estFerme ? assignedAgentNom : undefined,
        });

        // Add receipt if acompte was recorded
        if (parsed.montantAcompte > 0) {
          await addReceipt({
            datePaiement: parsed.prochainRdvDate,
            etablissementId: newEst.id,
            etablissementNom: newEst.nomCommercial,
            promoteurNom: newEst.promoteurNom,
            arrondissement: newEst.arrondissement,
            montantVerse: parsed.montantAcompte,
            resteAPayer: parsed.soldeRestantDu,
            modePaiement: 'especes',
            inspecteurOuCaissier: assignedAgentNom,
            agentId: assignedAgentId,
            natureRecette: 'Forfait Informel SAA',
          });
          acomptesCount++;
        }

        // Add schedule for field tour
        await addSchedule({
          etablissementId: newEst.id,
          etablissementNom: newEst.nomCommercial,
          arrondissement: newEst.arrondissement,
          brigadeAssignee: `Brigade SAA - ${newEst.arrondissement}`,
          dateTournee: parsed.prochainRdvDate,
          heure: parsed.prochainRdvHeure,
          typeMission: 'Recouvrement',
          inspecteurChef: assignedAgentNom,
          agentId: assignedAgentId,
          statut: parsed.estFerme ? 'annule' : 'planifie',
          notes: parsed.notes,
        });

        importedCount++;
      }
    }

    const totalAfter = establishments.length + importedCount;

    showNotification(
      'success',
      `Synchronisation Google Calendar réussie : ${importedCount} nouveaux établissements ajoutés, ${updatedCount} actualisés, ${acomptesCount} acomptes enregistrés.`
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
        theme,
        toggleTheme,
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
