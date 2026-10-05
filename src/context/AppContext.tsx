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
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentAgentId: string;
  setCurrentAgentId: (id: string) => void;
  currentAgent: StaffPersonnel | undefined;

  // Theme: Fond Blanc (Light) ou Sombre (Dark)
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  googleUser: User | null;
  googleAccessToken: string | null;
  handleGoogleSignIn: () => Promise<void>;
  handleLogout: () => Promise<void>;
  isSigningIn: boolean;

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
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('directeur');

  // Agent Siloing: 'all' for admin/directeur, or 'stf-002', 'stf-003', 'stf-005'
  const [currentAgentId, setCurrentAgentId] = useState<string>('all');

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

  // Collections
  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_establishments_v3');
      return saved ? JSON.parse(saved) : INITIAL_ESTABLISHMENTS;
    } catch {
      return INITIAL_ESTABLISHMENTS;
    }
  });

  const [receipts, setReceipts] = useState<CashReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_receipts_v3');
      return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
    } catch {
      return INITIAL_RECEIPTS;
    }
  });

  const [legalActs, setLegalActs] = useState<LegalAct[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_legal_acts_v3');
      return saved ? JSON.parse(saved) : INITIAL_LEGAL_ACTS;
    } catch {
      return INITIAL_LEGAL_ACTS;
    }
  });

  const [schedules, setSchedules] = useState<InspectionSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_schedules_v3');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  const [ptaMilestones, setPtaMilestones] = useState<PtaMilestone[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_pta_v3');
      return saved ? JSON.parse(saved) : INITIAL_PTA_MILESTONES;
    } catch {
      return INITIAL_PTA_MILESTONES;
    }
  });

  const [staff] = useState<StaffPersonnel[]>(INITIAL_STAFF);

  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_audit_logs_v3');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [soitTransmis, setSoitTransmis] = useState<SoitTransmisDgl[]>(() => {
    try {
      const saved = localStorage.getItem('ddl_soit_transmis_v3');
      return saved ? JSON.parse(saved) : INITIAL_SOIT_TRANSMIS;
    } catch {
      return INITIAL_SOIT_TRANSMIS;
    }
  });

  // Current Agent Object
  const currentAgent = useMemo(() => {
    return staff.find((s) => s.id === currentAgentId);
  }, [staff, currentAgentId]);

  // Strict Siloing: Visible Establishments
  const visibleEstablishments = useMemo(() => {
    if (currentUserRole === 'directeur' || currentUserRole === 'administrateur' || currentAgentId === 'all') {
      return establishments; // Full view for Admin/Director
    }
    // Strict agent silo: ONLY see establishments that this agent is assigned to and following
    return establishments.filter((e) => e.agentAssigneId === currentAgentId);
  }, [establishments, currentUserRole, currentAgentId]);

  // Strict Siloing: Visible Schedules
  const visibleSchedules = useMemo(() => {
    if (currentUserRole === 'directeur' || currentUserRole === 'administrateur' || currentAgentId === 'all') {
      return schedules;
    }
    return schedules.filter((s) => s.agentId === currentAgentId);
  }, [schedules, currentUserRole, currentAgentId]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ddl_establishments_v3', JSON.stringify(establishments));
  }, [establishments]);

  useEffect(() => {
    localStorage.setItem('ddl_receipts_v3', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('ddl_legal_acts_v3', JSON.stringify(legalActs));
  }, [legalActs]);

  useEffect(() => {
    localStorage.setItem('ddl_schedules_v3', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('ddl_audit_logs_v3', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('ddl_soit_transmis_v3', JSON.stringify(soitTransmis));
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

  // Firebase Firestore Real-Time Sync & Validation
  useEffect(() => {
    testFirestoreConnection();

    try {
      const unsubEst = onSnapshot(
        collection(db, 'establishments'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Establishment[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as Establishment);
            });
            setEstablishments((prev) => {
              // Merge remote with local if any items exist
              const remoteIds = new Set(list.map((e) => e.id));
              const localOnly = prev.filter((e) => !remoteIds.has(e.id));
              return [...list, ...localOnly];
            });
          }
        },
        (err) => {
          console.warn("Connexion Firestore en cache local IndexedDB:", err);
        }
      );

      return () => unsubEst();
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
      showNotification('error', `Échec d'authentification Google: ${err.message || 'Erreur inconnue'}`);
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
        theme,
        toggleTheme,
        googleUser,
        googleAccessToken,
        handleGoogleSignIn,
        handleLogout,
        isSigningIn,
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
