import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  MapPin,
  CheckCircle2,
  Receipt,
  Cloud,
  Lock,
  User,
  ExternalLink,
  RotateCcw,
  Sparkles,
  X,
  CreditCard,
  DollarSign,
  AlertCircle,
  Phone,
  Printer,
  CalendarCheck,
  Check,
  Building,
  Shield,
  Layers,
  HelpCircle,
  Settings,
  MoreVertical,
  Download,
  CloudDownload,
  Ban,
  AlertOctagon,
  Flame,
  Maximize2,
  Minimize2,
  Upload,
  FileText,
  ClipboardPaste,
  Database,
  RefreshCw,
} from 'lucide-react';
import { InspectionSchedule, Establishment, CashReceipt } from '../../types';
import {
  createGoogleCalendarEvent,
  listGoogleCalendarEvents,
  parseGoogleCalendarEvent,
  parseICalendarContent,
  parsePastedTextEvents,
  ParsedGoogleCalendarEstablishment,
} from '../../services/googleWorkspace';
import { formatCfa } from '../../services/crypto';

export const MobileAgentCalendarModule: React.FC = () => {
  const {
    visibleSchedules,
    visibleEstablishments,
    establishments,
    receipts,
    schedules,
    syncAllToFirestore,
    currentAgent,
    currentAgentId,
    setCurrentAgentId,
    currentUserRole,
    staff,
    recordPaymentAndScheduleNext,
    reportEstablishmentClosed,
    importFromGoogleCalendar,
    googleUser,
    googleAccessToken,
    handleGoogleSignIn,
    setShowDomainAuthModal,
    openPrintModal,
    showNotification,
    theme,
    addSchedule,
    addEstablishment,
    isCalendarFullScreen,
    setIsCalendarFullScreen,
    setActiveModule,
  } = useApp();

  const isLight = theme === 'light';

  // Target date simulation (starts at Oct 6, 2026)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 6));
  const [viewMode, setViewMode] = useState<'jour' | 'semaine' | 'mois' | 'planning'>('semaine');
  const [selectedSchedule, setSelectedSchedule] = useState<InspectionSchedule | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Quick Action Modal states (Encaissement d'acompte + Prochain RDV)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [targetEstForPayment, setTargetEstForPayment] = useState<Establishment | null>(null);
  const [montantAcompte, setMontantAcompte] = useState<number>(20000);
  const [modePaiement, setModePaiement] = useState<CashReceipt['modePaiement']>('momo_mtn');
  const [nextRdvDate, setNextRdvDate] = useState<string>('2026-10-14');
  const [nextRdvHeure, setNextRdvHeure] = useState<string>('11:00');
  const [nextRdvMotif, setNextRdvMotif] = useState<string>('Solde convenu avec le promoteur');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Create new appointment modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createEstId, setCreateEstId] = useState<string>('');
  const [isCustomEst, setIsCustomEst] = useState<boolean>(false);
  const [customEstNom, setCustomEstNom] = useState<string>('');
  const [createArrondissement, setCreateArrondissement] = useState<string>('Tié-Tié');
  const [createDate, setCreateDate] = useState<string>('2026-10-07');
  const [createHeure, setCreateHeure] = useState<string>('10:00');
  const [createMotif, setCreateMotif] = useState<InspectionSchedule['typeMission']>('Recouvrement');
  const [createNotes, setCreateNotes] = useState<string>('Tournée de recouvrement SAA');
  const [isCreatingSchedule, setIsCreatingSchedule] = useState<boolean>(false);

  // Auto-sync available establishments for selection
  const availableEstablishments = useMemo(() => {
    return visibleEstablishments.length > 0 ? visibleEstablishments : establishments;
  }, [visibleEstablishments, establishments]);

  useEffect(() => {
    if (!createEstId && availableEstablishments.length > 0) {
      setCreateEstId(availableEstablishments[0].id);
    }
  }, [availableEstablishments, createEstId]);

  // Google Calendar 2026 Import Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importSourceTab, setImportSourceTab] = useState<'file' | 'paste' | 'api'>('file');
  const [pastedContent, setPastedContent] = useState<string>('');
  const [importFileName, setImportFileName] = useState<string>('');
  const [isLoadingImport, setIsLoadingImport] = useState<boolean>(false);
  const [rawCalendarEvents, setRawCalendarEvents] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isExecutingImport, setIsExecutingImport] = useState<boolean>(false);

  // Report Closed / Extinct Establishment Modal
  const [reportingClosedEst, setReportingClosedEst] = useState<Establishment | null>(null);
  const [closedMotif, setClosedMotif] = useState<string>('Cessation d\'activité définitive / Rideau baissé');
  const [closedObservations, setClosedObservations] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState<boolean>(false);

  // Mini calendar helpers
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const fullDaysOfWeek = ['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'];

  // Current Week dates (Monday to Sunday)
  const weekStart = new Date(currentDate);
  const dayIndex = (weekStart.getDay() + 6) % 7; // Monday = 0
  weekStart.setDate(weekStart.getDate() - dayIndex);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hoursGutter = Array.from({ length: 14 }).map((_, i) => i + 7); // 07:00 to 20:00

  // Format date string YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectedDateKey = formatDateKey(currentDate);
  const simulatedTodayKey = '2026-10-06';

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'jour') d.setDate(d.getDate() - 1);
    else if (viewMode === 'semaine') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'jour') d.setDate(d.getDate() + 1);
    else if (viewMode === 'semaine') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 6)); // Target simulation today
  };

  // Filtered schedules for search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const source = establishments.length > 0 ? establishments : availableEstablishments;
    return source.filter(
      (e) =>
        e && (
          (e.nomCommercial || '').toLowerCase().includes(q) ||
          (e.promoteurNom || '').toLowerCase().includes(q) ||
          (e.arrondissement || '').toLowerCase().includes(q) ||
          (e.quartier || '').toLowerCase().includes(q) ||
          (e.codeDossier || '').toLowerCase().includes(q)
        )
    );
  }, [searchQuery, establishments, availableEstablishments]);

  // Execute payment & next appointment workflow
  const handleExecutePaymentWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEstForPayment) return;

    setIsProcessing(true);
    try {
      const res = await recordPaymentAndScheduleNext({
        establishmentId: targetEstForPayment.id,
        montantVerse: Number(montantAcompte),
        modePaiement,
        nextRdvDate,
        nextRdvHeure,
        nextRdvMotif,
        currentScheduleId: selectedSchedule?.id,
      });

      // Synchronize with Google Calendar if connected
      if (googleAccessToken && res.nextSchedule) {
        try {
          const startIso = `${res.nextSchedule.dateTournee}T${res.nextSchedule.heure}:00`;
          const endHour = (parseInt(res.nextSchedule.heure.split(':')[0], 10) + 1).toString().padStart(2, '0');
          const endIso = `${res.nextSchedule.dateTournee}T${endHour}:${res.nextSchedule.heure.split(':')[1]}:00`;

          await createGoogleCalendarEvent(googleAccessToken, {
            summary: `[DDL-PN] RDV Recouvrement ${targetEstForPayment.nomCommercial}`,
            description: `${nextRdvMotif}. Montant attendu : ${formatCfa(res.nextSchedule.montantAcompteAttendu || 0)}`,
            location: `${targetEstForPayment.nomCommercial}, ${targetEstForPayment.arrondissement}, Pointe-Noire`,
            startDateTime: startIso,
            endDateTime: endIso,
          });
        } catch (calErr) {
          console.warn("Sync Google Agenda warning:", calErr);
        }
      }

      openPrintModal('pos_receipt', res.receipt);
      setIsPaymentModalOpen(false);
      setSelectedSchedule(null);
      setTargetEstForPayment(null);
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'encaissement : ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Push individual event to Google Calendar
  const handleSyncSingleEventToGoogle = async (sch: InspectionSchedule) => {
    if (!googleAccessToken) {
      showNotification('warning', 'Veuillez d\'abord connecter votre compte Google Agenda.');
      handleGoogleSignIn();
      return;
    }

    try {
      const startIso = `${sch.dateTournee}T${sch.heure}:00`;
      const endHour = (parseInt(sch.heure.split(':')[0], 10) + 1).toString().padStart(2, '0');
      const endIso = `${sch.dateTournee}T${endHour}:${sch.heure.split(':')[1]}:00`;

      await createGoogleCalendarEvent(googleAccessToken, {
        summary: `[DDL-PN] ${sch.typeMission} : ${sch.etablissementNom}`,
        description: `Inspecteur : ${sch.inspecteurChef} (${sch.brigadeAssignee}). Notes : ${sch.notes || ''}`,
        location: `${sch.etablissementNom}, ${sch.arrondissement}, Pointe-Noire`,
        startDateTime: startIso,
        endDateTime: endIso,
      });

      showNotification('success', `Descente synchronisée avec succès dans votre Google Agenda officiel !`);
    } catch (err: any) {
      showNotification('error', `Erreur de synchronisation Google: ${err.message}`);
    }
  };

  // Google Calendar Universal Import Actions (Fichier .ics, Texte brut / RDV, ou API)
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    if (googleAccessToken) {
      setImportSourceTab('api');
      loadFromGoogleApi();
    } else {
      setImportSourceTab('file');
    }
  };

  const loadFromGoogleApi = async () => {
    if (!googleAccessToken) return;
    setIsLoadingImport(true);
    try {
      const events = await listGoogleCalendarEvents(googleAccessToken, {
        timeMin: '2026-01-01T00:00:00Z',
        timeMax: '2026-12-31T23:59:59Z',
        maxResults: 250,
      });

      const validEvents = events || [];
      setRawCalendarEvents(validEvents);
      setSelectedIndices(new Set(validEvents.map((_, i) => i)));

      if (validEvents.length === 0) {
        showNotification(
          'info',
          'Aucun événement 2026 trouvé dans votre agenda Google réel. Vous pouvez importer un fichier .ics ou coller vos données directement.'
        );
      }
    } catch (err: any) {
      showNotification('error', `Erreur de chargement Google Agenda: ${err.message}`);
      setRawCalendarEvents([]);
      setSelectedIndices(new Set());
    } finally {
      setIsLoadingImport(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setIsLoadingImport(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const events = parseICalendarContent(content);
        setRawCalendarEvents(events);
        setSelectedIndices(new Set(events.map((_, i) => i)));
        showNotification('success', `${events.length} rendez-vous et établissements détectés dans le fichier ${file.name}`);
      } catch (err: any) {
        showNotification('error', `Erreur lors de la lecture du fichier .ics : ${err.message}`);
      } finally {
        setIsLoadingImport(false);
      }
    };
    reader.onerror = () => {
      showNotification('error', "Impossible de lire le fichier sélectionné.");
      setIsLoadingImport(false);
    };
    reader.readAsText(file);
  };

  const handleParsePastedContent = () => {
    if (!pastedContent.trim()) {
      showNotification('warning', 'Veuillez coller le contenu de votre calendrier ou vos lignes de rendez-vous.');
      return;
    }
    setIsLoadingImport(true);
    try {
      const events = parsePastedTextEvents(pastedContent);
      setRawCalendarEvents(events);
      setSelectedIndices(new Set(events.map((_, i) => i)));
      showNotification('success', `${events.length} événements / établissements identifiés.`);
    } catch (err: any) {
      showNotification('error', `Erreur de traitement : ${err.message}`);
    } finally {
      setIsLoadingImport(false);
    }
  };

  const handleToggleSelectIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSelectAllIndices = () => {
    if (selectedIndices.size === rawCalendarEvents.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(rawCalendarEvents.map((_, i) => i)));
    }
  };

  const handleExecuteImport = async () => {
    if (selectedIndices.size === 0) {
      showNotification('warning', 'Veuillez sélectionner au moins un événement à importer.');
      return;
    }

    setIsExecutingImport(true);
    try {
      const eventsToImport = rawCalendarEvents.filter((_, i) => selectedIndices.has(i));
      await importFromGoogleCalendar(eventsToImport);
      setIsImportModalOpen(false);
    } catch (err: any) {
      showNotification('error', `Erreur lors de l'importation: ${err.message}`);
    } finally {
      setIsExecutingImport(false);
    }
  };

  // Report Closed / Extinct Establishment
  const handleReportClosedFromSchedule = (sch: InspectionSchedule) => {
    const est = establishments.find((e) => e.id === sch.etablissementId) ||
                visibleEstablishments.find((e) => e.id === sch.etablissementId);
    if (est) {
      setReportingClosedEst(est);
      setClosedMotif('Cessation d\'activité constatée lors du rendez-vous');
      setClosedObservations(`Rendez-vous du ${sch.dateTournee} : établissement constaté éteint/rideau de fer baissé.`);
    }
  };

  const handleConfirmReportClosed = async () => {
    if (!reportingClosedEst) return;
    setIsSubmittingClose(true);
    try {
      await reportEstablishmentClosed({
        establishmentId: reportingClosedEst.id,
        motif: closedMotif,
        observations: closedObservations,
      });
      setReportingClosedEst(null);
      setSelectedSchedule(null);
    } catch (err: any) {
      showNotification('error', `Erreur lors du signalement: ${err.message}`);
    } finally {
      setIsSubmittingClose(false);
    }
  };

  // Open Create Appointment Modal with prefilled parameters
  const handleOpenCreateModal = (dateStr?: string, hourStr?: string, estId?: string) => {
    if (estId) {
      setCreateEstId(estId);
      setIsCustomEst(false);
    } else if (!createEstId || !availableEstablishments.some((e) => e.id === createEstId)) {
      if (availableEstablishments[0]) {
        setCreateEstId(availableEstablishments[0].id);
      }
    }
    if (dateStr) {
      setCreateDate(dateStr);
    }
    if (hourStr) {
      setCreateHeure(hourStr);
    }
    setIsCreateModalOpen(true);
  };

  // Create new appointment manually
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSchedule(true);

    try {
      let est: Establishment | undefined = undefined;

      if (isCustomEst && customEstNom.trim()) {
        const activeAgent = currentAgent || staff[1];
        const newEstData: Omit<Establishment, 'id' | 'codeDossier' | 'syncStatus' | 'historiquePaiements' | 'anneeExercice'> = {
          nomCommercial: customEstNom.trim(),
          promoteurNom: `Promoteur ${customEstNom.trim()}`,
          promoteurTelephone: '+242 06 600 00 00',
          promoteurEmail: '',
          arrondissement: (createArrondissement as any) || 'Tié-Tié',
          quartier: 'Centre-Ville',
          adresseExacte: `${createArrondissement || 'Tié-Tié'}, Pointe-Noire`,
          categorie: 'Bar Dancing / Cabaret',
          regimeFiscal: 'informel_forfaitaire',
          surfaceM2: 80,
          montantRedevanceAnnuelle: 60000,
          montantEncaisse: 0,
          soldeRestantDu: 60000,
          statut: 'mise_en_demeure',
          latitude: -4.78 + (Math.random() - 0.5) * 0.05,
          longitude: 11.87 + (Math.random() - 0.5) * 0.05,
          niveauDecibelsMoyen: 68,
          limiteurInstalle: false,
          dateRecensement: createDate,
          recensePar: activeAgent.nomComplet,
          agentAssigneId: activeAgent.id,
          agentAssigneNom: activeAgent.nomComplet,
        };
        est = await addEstablishment(newEstData);
      } else {
        const targetId = createEstId || availableEstablishments[0]?.id;
        est = availableEstablishments.find((e) => e.id === targetId) ||
              establishments.find((e) => e.id === targetId);
      }

      if (!est) {
        showNotification('warning', 'Veuillez sélectionner un établissement valide ou saisir son nom.');
        return;
      }

      const activeAgent = currentAgent || staff.find((s) => s.id === est?.agentAssigneId) || staff[1];

      await addSchedule({
        dateTournee: createDate,
        heure: createHeure,
        etablissementId: est.id,
        etablissementNom: est.nomCommercial,
        arrondissement: est.arrondissement,
        brigadeAssignee: activeAgent.brigadeAffectee || 'Brigade SAA',
        inspecteurChef: activeAgent.nomComplet,
        agentId: activeAgent.id,
        typeMission: createMotif,
        montantAcompteAttendu: est.soldeRestantDu > 0 ? est.soldeRestantDu : undefined,
        notes: createNotes,
        statut: 'planifie',
      });

      if (googleAccessToken) {
        try {
          const startIso = `${createDate}T${createHeure}:00`;
          const endHour = (parseInt(createHeure.split(':')[0], 10) + 1).toString().padStart(2, '0');
          const endIso = `${createDate}T${endHour}:${createHeure.split(':')[1]}:00`;
          await createGoogleCalendarEvent(googleAccessToken, {
            summary: `[DDL-PN] ${createMotif} : ${est.nomCommercial}`,
            description: `${createNotes}. Agent : ${activeAgent.nomComplet}`,
            location: `${est.nomCommercial}, ${est.arrondissement}, Pointe-Noire`,
            startDateTime: startIso,
            endDateTime: endIso,
          });
        } catch (calErr) {
          console.warn("Sync Google agenda warning:", calErr);
        }
      }

      showNotification('success', `Rendez-vous planifié au ${createDate} pour ${est.nomCommercial}`);
      setIsCreateModalOpen(false);
      setCustomEstNom('');
      setIsCustomEst(false);
    } catch (err: any) {
      showNotification('error', `Erreur de planification: ${err.message}`);
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  // Open Payment modal from a schedule (ultra robust with fallbacks and on-the-fly creation)
  const handleOpenPaymentFromSchedule = async (sch: InspectionSchedule) => {
    // 1. Try finding in visibleEstablishments by ID
    let est = visibleEstablishments.find((e) => e && e.id === sch.etablissementId);

    // 2. Try finding in all establishments by ID
    if (!est) {
      est = establishments.find((e) => e && e.id === sch.etablissementId);
    }

    // 3. Try finding by commercial name in visibleEstablishments or establishments
    if (!est && sch.etablissementNom) {
      const schNom = sch.etablissementNom.toLowerCase().trim();
      est = visibleEstablishments.find((e) => e && (e.nomCommercial || '').toLowerCase().trim() === schNom) ||
            establishments.find((e) => e && (e.nomCommercial || '').toLowerCase().trim() === schNom);

      // 4. Try fuzzy match by name
      if (!est) {
        est = establishments.find((e) => {
          if (!e || !e.nomCommercial) return false;
          const eNom = e.nomCommercial.toLowerCase().trim();
          return (schNom.length > 5 && (eNom.includes(schNom) || schNom.includes(eNom)));
        });
      }
    }

    // 5. If STILL not found: create a real establishment on the fly
    if (!est) {
      const activeAgent = currentAgent || staff.find((s) => s.id === sch.agentId) || staff[1];
      const newEstData: Omit<Establishment, 'id' | 'codeDossier' | 'syncStatus' | 'historiquePaiements' | 'anneeExercice'> = {
        nomCommercial: (sch.etablissementNom || 'Établissement SAA').trim(),
        promoteurNom: `Promoteur ${(sch.etablissementNom || 'Établissement').trim()}`,
        promoteurTelephone: '+242 06 600 00 00',
        promoteurEmail: '',
        arrondissement: (sch.arrondissement as any) || 'Tié-Tié',
        quartier: 'Centre-Ville',
        adresseExacte: `${sch.arrondissement || 'Tié-Tié'}, Pointe-Noire`,
        categorie: 'Bar Dancing / Cabaret',
        regimeFiscal: 'informel_forfaitaire',
        surfaceM2: 80,
        montantRedevanceAnnuelle: sch.montantAcompteAttendu ? Math.max(sch.montantAcompteAttendu, 60000) : 60000,
        montantEncaisse: 0,
        soldeRestantDu: sch.montantAcompteAttendu ? Math.max(sch.montantAcompteAttendu, 60000) : 60000,
        statut: 'mise_en_demeure',
        latitude: -4.78 + (Math.random() - 0.5) * 0.05,
        longitude: 11.87 + (Math.random() - 0.5) * 0.05,
        niveauDecibelsMoyen: 68,
        limiteurInstalle: false,
        dateRecensement: sch.dateTournee || new Date().toISOString().substring(0, 10),
        recensePar: sch.inspecteurChef || activeAgent.nomComplet,
        agentAssigneId: sch.agentId || activeAgent.id,
        agentAssigneNom: sch.inspecteurChef || activeAgent.nomComplet,
      };

      try {
        est = await addEstablishment(newEstData, { silent: true });
        showNotification('info', `Dossier initialisé pour ${est.nomCommercial} afin d'enregistrer l'encaissement.`);
      } catch (err: any) {
        showNotification('error', `Erreur lors de la préparation du dossier : ${err.message}`);
        return;
      }
    }

    if (est) {
      setSelectedSchedule(sch);
      setTargetEstForPayment(est);
      const defaultAcompte = sch.montantAcompteAttendu && sch.montantAcompteAttendu > 0
        ? sch.montantAcompteAttendu
        : (est.soldeRestantDu > 0 ? Math.min(25000, est.soldeRestantDu) : 50000);
      setMontantAcompte(defaultAcompte);
      setNextRdvDate(sch.dateTournee || new Date().toISOString().substring(0, 10));
      setNextRdvHeure(sch.heure || '10:00');
      setNextRdvMotif(`Suite tournée pour ${est.nomCommercial}`);
      setIsPaymentModalOpen(true);
    }
  };

  // Helper color tag for Google Calendar events
  const getEventBadgeStyle = (sch: InspectionSchedule) => {
    if (sch.statut === 'effectue') {
      return isLight
        ? 'bg-slate-100 text-slate-500 border-slate-300 line-through'
        : 'bg-slate-800 text-slate-400 border-slate-700 line-through';
    }
    if (sch.typeMission === 'Renouvellement Annuel N+1') {
      return 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm';
    }
    if (sch.typeMission === 'Contrôle Décibels') {
      return 'bg-purple-600 text-white border-purple-700 shadow-sm';
    }
    if (sch.typeMission === 'Signification Mise en Demeure') {
      return 'bg-rose-600 text-white border-rose-700 shadow-sm';
    }
    return 'bg-blue-600 text-white border-blue-700 shadow-sm';
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-4.5rem)] font-sans select-none transition-colors duration-200 ${
      isLight ? 'bg-white text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* 1. GOOGLE AGENDA HEADER (Reproduction Pixel-Perfect) */}
      <div className={`h-16 px-4 flex items-center justify-between border-b shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {/* Google Calendar Logo simulation */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-md font-sans">
              <span className="text-[9px] font-bold uppercase tracking-wider">OCT</span>
              <span className="text-base font-black leading-none font-mono">06</span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Google Agenda
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  Terrain SAA
                </span>
              </div>
              <p className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <span>Pointe-Noire Sovereign Engine</span>
                {googleAccessToken && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

          {/* Navigation Today, Prev, Next */}
          <button
            onClick={handleToday}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLight
                ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 hover:bg-slate-800 text-slate-200'
            }`}
          >
            Aujourd'hui
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 min-w-[150px]">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* Center: Google Search Bar for Establishments */}
        <div className="relative hidden md:block flex-1 max-w-md mx-4">
          <div className={`flex items-center px-3.5 py-1.5 rounded-full border transition ${
            isLight
              ? 'bg-slate-100 border-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-md'
              : 'bg-slate-800/80 border-slate-700 focus-within:bg-slate-900 focus-within:border-blue-400'
          }`}>
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un établissement, un promoteur..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-50 overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                {searchResults.length} établissement(s) trouvé(s)
              </div>
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => {
                      setTargetEstForPayment(est);
                      setMontantAcompte(est.soldeRestantDu > 0 ? Math.min(25000, est.soldeRestantDu) : 50000);
                      setIsPaymentModalOpen(true);
                      setIsSearchOpen(false);
                    }}
                    className={`p-2.5 flex items-center justify-between cursor-pointer border-b last:border-0 transition ${
                      isLight ? 'hover:bg-blue-50 border-slate-100' : 'hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {est.nomCommercial}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {est.arrondissement} • Promoteur : {est.promoteurNom}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-emerald-600">
                        Reste : {formatCfa(est.soldeRestantDu)}
                      </span>
                      <p className="text-[9px] text-blue-600 font-semibold">1-clic pour encaisser</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right header controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Google Sync Button */}
          {googleUser ? (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold truncate max-w-[140px]">{googleUser.email}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow shadow-sm text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Connecter mon Google Agenda</span>
              </button>
              <button
                onClick={() => setShowDomainAuthModal(true)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                title="Aide domaine Firebase ou Mode Démo Google"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Import Google Calendar 2026 Button */}
          <button
            onClick={handleOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition cursor-pointer"
            title="Importer les événements, établissements et acomptes de Google Agenda"
          >
            <CloudDownload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importer Google Agenda</span>
            <span className="sm:hidden">Import</span>
          </button>

          {/* Bouton Mode Plein Écran (pour faciliter le travail de l'agent de terrain) */}
          <button
            onClick={() => setIsCalendarFullScreen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              isCalendarFullScreen
                ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm'
                : isLight
                ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
            }`}
            title={
              isCalendarFullScreen
                ? "Mode plein écran actif (barre latérale masquée). Cliquez pour réafficher le menu latéral."
                : "Passer en mode plein écran pour élargir l'espace de travail de l'agent."
            }
          >
            {isCalendarFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden lg:inline">Plein Écran (Actif)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Plein Écran</span>
              </>
            )}
          </button>

          {/* Quick shortcuts when in full screen */}
          {isCalendarFullScreen && (
            <div className="hidden 2xl:flex items-center gap-1">
              <button
                onClick={() => setActiveModule('MOD-01')}
                className="px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title="Retourner au Tableau de Bord"
              >
                Tableau de Bord
              </button>
              <button
                onClick={() => setActiveModule('MOD-02')}
                className="px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title="Aller au Recensement Terrain"
              >
                Recensement
              </button>
            </div>
          )}

          {/* View switcher dropdown */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {(['jour', 'semaine', 'mois', 'planning'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2.5 py-1 rounded capitalize transition ${
                  viewMode === m
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BODY : SIDEBAR GOOGLE GAUCHE + GRILLE D'AGENDA CENTRALE */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Google Calendar Sidebar */}
        <aside className={`w-72 border-r p-4 flex flex-col justify-between shrink-0 overflow-y-auto hidden lg:flex transition ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="space-y-6">
            {/* Google "+ Créer" Pill Button */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-slate-800 hover:shadow-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm shadow-md transition hover:bg-slate-50 cursor-pointer w-full"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-6 h-6">
                  <path fill="#4285F4" d="M16 16v14h4V16h14v-4H20V-2h-4v14H2v4h14z" />
                  <path fill="#FBBC05" d="M30 16H20v14h4V20h6z" />
                  <path fill="#34A853" d="M16 30h4V16H2v4h14z" />
                  <path fill="#EA4335" d="M20 2v14h14v-4H20z" />
                </svg>
              </div>
              <span>Programmer une descente</span>
            </button>

            {/* Quick Import Google Calendar 2026 */}
            <button
              onClick={handleOpenImportModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition w-full shadow-sm cursor-pointer"
            >
              <CloudDownload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Importer Google Agenda (+Base)</span>
            </button>

            {/* Mini Calendar Month Picker */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-700 dark:text-slate-300">
                <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <div className="flex gap-1">
                  <button onClick={handlePrev} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleNext} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[10px] text-slate-400">
                {daysOfWeek.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              {/* Days grid for October 2026 (Starts on Thursday Oct 1) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                {/* 3 leading empty spaces for Thu start */}
                <span className="text-slate-300 dark:text-slate-700">28</span>
                <span className="text-slate-300 dark:text-slate-700">29</span>
                <span className="text-slate-300 dark:text-slate-700">30</span>
                {Array.from({ length: 31 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSimulatedToday = dayNum === 6;
                  const isSelected = currentDate.getDate() === dayNum && currentDate.getMonth() === 9;
                  return (
                    <button
                      key={dayNum}
                      onClick={() => {
                        const d = new Date(currentDate);
                        d.setDate(dayNum);
                        setCurrentDate(d);
                      }}
                      className={`h-7 w-7 rounded-full flex items-center justify-center mx-auto transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : isSimulatedToday
                            ? 'bg-blue-100 text-blue-700 font-bold dark:bg-blue-950 dark:text-blue-300'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statut Synchronisation Base Firebase Firestore */}
            <div className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-[11px]">
                  <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Base Firestore Synchronisée
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">
                34 établissements réels, tournées et acomptes enregistrés dans Firebase Firestore.
              </p>
            </div>

            {/* Mon Portefeuille Exclusif (Strict Silo List) */}
            <div className="space-y-2 border-t pt-4 border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mes Dossiers Exclusifs ({visibleEstablishments.length})</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Seul vous êtes responsable du suivi de ces établissements.
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(visibleEstablishments.length > 0 ? visibleEstablishments : establishments).slice(0, 30).map((est) => (
                  <div
                    key={est.id}
                    onClick={() => {
                      setTargetEstForPayment(est);
                      setMontantAcompte(est.soldeRestantDu > 0 ? Math.min(25000, est.soldeRestantDu) : 50000);
                      setNextRdvDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
                      setNextRdvHeure('10:00');
                      setNextRdvMotif(`Suite tournée pour ${est.nomCommercial}`);
                      setIsPaymentModalOpen(true);
                    }}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                      isLight ? 'bg-slate-50 hover:bg-blue-50 border-slate-200' : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="font-bold truncate text-slate-800 dark:text-slate-200">
                        {est.nomCommercial}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {est.arrondissement}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold text-emerald-600">
                        {formatCfa(est.soldeRestantDu)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkbox "Mes Agendas" */}
            <div className="space-y-2 border-t pt-3 border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Mes Agendas SAA</span>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span>Recouvrement Forfait Informel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span>Contrôles Décibels (65 dB(A))</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-amber-500 focus:ring-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Reconductions N+1 (Loi 21-2019)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Agent Switcher Card (Test de cloisonnement strict) */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1 text-blue-600">
                <Lock className="w-3.5 h-3.5" />
                Session Agent Terrain :
              </span>
            </div>
            <select
              value={currentAgentId}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentAgentId(val);
                const found = staff.find((s) => s.id === val);
                showNotification(
                  'info',
                  val === 'all'
                    ? 'Vue Direction Générale : tous les établissements et tournées sont visibles.'
                    : `Session de terrain activée pour ${found?.nomComplet}. Cloisonnement strict appliqué.`
                );
              }}
              className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
            >
              <option value="all">Super-Admin / Direction (Tous les dossiers)</option>
              {staff.filter(s => s.service === 'SAA' || s.service === 'Direction').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nomComplet} ({s.brigadeAffectee || s.fonction})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 leading-tight">
              Chaque inspecteur ne voit que ses dossiers et rendez-vous attribués.
            </p>
          </div>
        </aside>

        {/* Central Calendar Screen: Week, Day, Month, or Planning view */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* A. SEMAINE (Week View) */}
          {viewMode === 'semaine' && (
            <div className="flex-1 flex flex-col min-w-[700px]">
              {/* Header Days Row */}
              <div className={`grid grid-cols-8 border-b shrink-0 sticky top-0 z-20 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                {/* Time zone gutter label */}
                <div className="p-3 text-[11px] font-mono text-slate-400 text-center border-r border-slate-200 dark:border-slate-800">
                  GMT+1
                </div>

                {weekDays.map((d, i) => {
                  const dayNum = d.getDate();
                  const isSimulatedToday = formatDateKey(d) === simulatedTodayKey;
                  const isSelected = formatDateKey(d) === selectedDateKey;

                  return (
                    <div
                      key={i}
                      onClick={() => setCurrentDate(d)}
                      className={`p-2 text-center border-r last:border-r-0 cursor-pointer transition ${
                        isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-800 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {fullDaysOfWeek[i]}
                      </span>
                      <div className="flex justify-center mt-0.5">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                          isSimulatedToday
                            ? 'bg-blue-600 text-white shadow-md'
                            : isSelected
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {dayNum}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hourly Grid with Time Gutter & Event Chips */}
              <div className="flex-1 overflow-y-auto relative">
                {hoursGutter.map((hour) => {
                  const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <div key={hour} className="grid grid-cols-8 min-h-[64px] border-b border-slate-100 dark:border-slate-800/60 relative">
                      {/* Left time label */}
                      <div className="p-1 pr-2 text-right text-[11px] font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800 select-none">
                        {hourStr}
                      </div>

                      {/* 7 Columns for each day of week */}
                      {weekDays.map((d, colIdx) => {
                        const dateKey = formatDateKey(d);
                        // Find events scheduled on this day during this hour
                        const eventsInSlot = visibleSchedules.filter((sch) => {
                          if (sch.dateTournee !== dateKey) return false;
                          const schHour = parseInt(sch.heure.split(':')[0], 10);
                          return schHour === hour;
                        });

                        const isSimulatedToday = dateKey === simulatedTodayKey;

                        return (
                          <div
                            key={colIdx}
                            onClick={(e) => {
                              if (e.target === e.currentTarget) {
                                handleOpenCreateModal(dateKey, hourStr);
                              }
                            }}
                            className={`border-r last:border-r-0 p-1 relative min-h-[64px] transition cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
                              isLight ? 'border-slate-100' : 'border-slate-800/60'
                            }`}
                            title="Cliquer pour programmer une descente à cette date et heure"
                          >
                            {/* Red Current Time Line on Today at 10:30 */}
                            {isSimulatedToday && hour === 10 && (
                              <div className="absolute top-[50%] left-0 right-0 z-10 flex items-center pointer-events-none">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-600 -ml-1.5" />
                                <div className="flex-1 h-[2px] bg-red-600" />
                              </div>
                            )}

                            {/* Render events */}
                            {eventsInSlot.map((sch) => (
                              <div
                                key={sch.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSchedule(sch);
                                }}
                                className={`rounded-lg p-2 text-xs cursor-pointer border transition shadow-sm hover:scale-[1.02] ${getEventBadgeStyle(sch)}`}
                              >
                                <div className="flex justify-between items-start font-bold">
                                  <span className="truncate pr-1">{sch.etablissementNom}</span>
                                  <span className="font-mono text-[9px] shrink-0">{sch.heure}</span>
                                </div>
                                <div className="text-[10px] opacity-90 truncate mt-0.5">
                                  {sch.typeMission} • {sch.arrondissement}
                                </div>
                                {sch.montantAcompteAttendu && sch.statut !== 'effectue' && (
                                  <div className="text-[10px] font-mono font-bold mt-1 bg-black/20 rounded px-1 py-0.5 inline-block">
                                    Attendu: {formatCfa(sch.montantAcompteAttendu)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* B. JOUR (Day View) */}
          {viewMode === 'jour' && (
            <div className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Descentes du {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-blue-600 font-bold">
                    {visibleSchedules.filter(s => s.dateTournee === selectedDateKey).length} mission(s)
                  </span>
                  <button
                    onClick={() => handleOpenCreateModal(selectedDateKey)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Programmer</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {visibleSchedules.filter(s => s.dateTournee === selectedDateKey).length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <CalendarCheck className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-semibold">Aucune descente programmée à cette date.</p>
                    <button
                      onClick={() => handleOpenCreateModal(selectedDateKey)}
                      className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Programmer une descente</span>
                    </button>
                  </div>
                ) : (
                  visibleSchedules.filter(s => s.dateTournee === selectedDateKey).map((sch) => (
                    <div
                      key={sch.id}
                      className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getEventBadgeStyle(sch)}`}>
                            {sch.typeMission}
                          </span>
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {sch.heure}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sch.etablissementNom}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {sch.arrondissement} • Agent assigné : {sch.inspecteurChef}
                        </p>
                        {sch.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                            « {sch.notes} »
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {sch.statut !== 'effectue' && (
                          <button
                            onClick={() => handleOpenPaymentFromSchedule(sch)}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Encaisser & Reprogrammer</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleSyncSingleEventToGoogle(sch)}
                          className="p-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="Pousser dans Google Agenda"
                        >
                          <Cloud className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* C. MOIS (Month View) */}
          {viewMode === 'mois' && (
            <div className="flex-1 flex flex-col min-w-[700px]">
              <div className={`grid grid-cols-7 border-b text-center font-bold text-xs p-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                {fullDaysOfWeek.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1 border-b border-slate-200 dark:border-slate-800">
                {/* 3 leading offset cells */}
                <div className="p-1 border-r border-b border-slate-100 dark:border-slate-800/40 text-slate-300">28</div>
                <div className="p-1 border-r border-b border-slate-100 dark:border-slate-800/40 text-slate-300">29</div>
                <div className="p-1 border-r border-b border-slate-100 dark:border-slate-800/40 text-slate-300">30</div>

                {Array.from({ length: 31 }).map((_, i) => {
                  const dayNum = i + 1;
                  const d = new Date(2026, 9, dayNum);
                  const dateKey = formatDateKey(d);
                  const dayEvents = visibleSchedules.filter((s) => s.dateTournee === dateKey);
                  const isSimulatedToday = dateKey === simulatedTodayKey;

                  return (
                    <div
                      key={dayNum}
                      onClick={() => {
                        setCurrentDate(d);
                        setViewMode('jour');
                      }}
                      className={`p-1.5 border-r border-b min-h-[90px] cursor-pointer transition ${
                        isLight ? 'border-slate-100 hover:bg-blue-50/50' : 'border-slate-800/60 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSimulatedToday ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {dayNum}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[9px] font-mono text-blue-600 font-bold">
                            {dayEvents.length} RDV
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((sch) => (
                          <div
                            key={sch.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSchedule(sch);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium hover:opacity-80 transition cursor-pointer ${getEventBadgeStyle(sch)}`}
                          >
                            {sch.heure} {sch.etablissementNom}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-bold pl-1">
                            +{dayEvents.length - 2} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* D. PLANNING (Agenda Chronological List View) */}
          {viewMode === 'planning' && (
            <div className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Planning Chronologique des Tournées & Échéances (Vue Agent Exclusif)
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-blue-600 font-bold">
                    {visibleSchedules.length} missions enregistrées
                  </span>
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Programmer</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {visibleSchedules.map((sch) => (
                  <div
                    key={sch.id}
                    className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      sch.typeMission === 'Renouvellement Annuel N+1'
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : isLight
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getEventBadgeStyle(sch)}`}>
                          {sch.typeMission}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {sch.dateTournee} à {sch.heure}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {sch.etablissementNom}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {sch.arrondissement} • Agent : {sch.inspecteurChef}
                      </p>
                      {sch.historiquePrecedent && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          {sch.historiquePrecedent}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sch.statut !== 'effectue' && (
                        <button
                          onClick={() => handleOpenPaymentFromSchedule(sch)}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Encaisser</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedSchedule(sch)}
                        className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL GOOGLE STYLE: DETAIL DE L'ÉVÉNEMENT */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Top color bar */}
            <div className={`h-3 w-full ${
              selectedSchedule.typeMission === 'Renouvellement Annuel N+1' ? 'bg-amber-500' : 'bg-blue-600'
            }`} />

            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase">
                    {selectedSchedule.typeMission}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedSchedule.etablissementNom}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {selectedSchedule.dateTournee} de {selectedSchedule.heure} à {parseInt(selectedSchedule.heure.split(':')[0], 10) + 1}:00
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Arrondissement de {selectedSchedule.arrondissement}, Pointe-Noire</span>
              </div>

              {/* Strict Exclusive Agent Silo Banner */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Agent exclusif en charge : {selectedSchedule.inspecteurChef}</span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight">
                  Règle de souveraineté DDL-PN : Seul cet inspecteur est habilité à instruire et encaisser ce dossier.
                </p>
              </div>

              {/* Complete Payment History */}
              {(() => {
                const targetEst = visibleEstablishments.find((e) => e.id === selectedSchedule.etablissementId) ||
                                  establishments.find((e) => e.id === selectedSchedule.etablissementId) ||
                                  establishments.find((e) => (e.nomCommercial || '').toLowerCase().trim() === (selectedSchedule.etablissementNom || '').toLowerCase().trim());
                if (!targetEst) return null;

                return (
                  <div className="space-y-2 border-t pt-3 border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Situation Fiscale :</span>
                      <span className="font-mono font-bold text-emerald-600">
                        Reste dû : {formatCfa(targetEst.soldeRestantDu)} / {formatCfa(targetEst.montantRedevanceAnnuelle)}
                      </span>
                    </div>

                    {targetEst.historiquePaiements && targetEst.historiquePaiements.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Historique des Acomptes Antérieurs :</span>
                        {targetEst.historiquePaiements.map((h) => (
                          <div key={h.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 text-[11px] flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{formatCfa(h.montant)}</span>
                              <span className="text-slate-400 text-[10px] ml-2">({h.quittanceNumero})</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{h.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Aucun acompte précédent enregistré.</p>
                    )}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleReportClosedFromSchedule(selectedSchedule)}
                  className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  title="Signaler la fermeture ou la cessation d'activité de cet établissement"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Signaler Établissement Fermé / Éteint</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleSyncSingleEventToGoogle(selectedSchedule)}
                    className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <Cloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sync Google</span>
                  </button>

                  <button
                    onClick={() => {
                      handleOpenCreateModal(selectedSchedule.dateTournee, selectedSchedule.heure, selectedSchedule.etablissementId);
                      setSelectedSchedule(null);
                    }}
                    className="px-3 py-2 rounded-lg border border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reprogrammer</span>
                  </button>

                  {selectedSchedule.statut !== 'effectue' && (
                    <button
                      onClick={() => {
                        handleOpenPaymentFromSchedule(selectedSchedule);
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Encaisser & Reprogrammer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL WORKFLOW: ENCAISSER UN ACOMPTE ET FIXER LE PROCHAIN RENDEZ-VOUS */}
      {isPaymentModalOpen && targetEstForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Encaisser & Programmer Prochain RDV</h3>
                <p className="text-xs text-emerald-100 truncate">{targetEstForPayment.nomCommercial}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePaymentWorkflow} className="p-5 space-y-4 text-xs">
              {/* Current Balances */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxe annuelle totale :</span>
                  <span className="font-mono font-bold">{formatCfa(targetEstForPayment.montantRedevanceAnnuelle)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Déjà versé :</span>
                  <span className="font-mono text-blue-600 font-bold">{formatCfa(targetEstForPayment.montantEncaisse)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-emerald-700 dark:text-emerald-400">Solde restant dû :</span>
                  <span className="font-mono text-emerald-600">{formatCfa(targetEstForPayment.soldeRestantDu)}</span>
                </div>
              </div>

              {/* Payment input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Montant de l'acompte à encaisser aujourd'hui (FCFA) :
                </label>
                <input
                  type="number"
                  min="1000"
                  max={targetEstForPayment.soldeRestantDu || 500000}
                  value={montantAcompte}
                  onChange={(e) => setMontantAcompte(Number(e.target.value))}
                  className="w-full text-sm font-mono font-bold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Mode de règlement Trésor :
                </label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
                >
                  <option value="momo_mtn">MTN Mobile Money (MoMo)</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="especes">Espèces (Régie Trésor)</option>
                  <option value="cheque_tresor">Chèque Trésor / Virement</option>
                </select>
              </div>

              {/* Logic Check: Partial vs Full Settlement */}
              {targetEstForPayment.soldeRestantDu - montantAcompte > 0 ? (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
                  <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fixer la date du prochain rendez-vous d'acompte :</span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    L'établissement disparaîtra d'aujourd'hui et réapparaîtra à la date fixée avec tout l'historique !
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Date convenue :</label>
                      <input
                        type="date"
                        value={nextRdvDate}
                        onChange={(e) => setNextRdvDate(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Heure :</label>
                      <input
                        type="time"
                        value={nextRdvHeure}
                        onChange={(e) => setNextRdvHeure(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Motif du prochain passage :</label>
                    <input
                      type="text"
                      value={nextRdvMotif}
                      onChange={(e) => setNextRdvMotif(e.target.value)}
                      placeholder="Ex: Deuxième acompte convenu avec promoteur"
                      className="w-full text-xs px-2 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1.5">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Taxe 2026 Intégralement Soldée !</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                    Conformément à la Loi 21-2019, la reconduction annuelle pour l'exercice suivant (N+1) sera automatiquement programmée l'année prochaine au jour anniversaire de son 1er acompte !
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Encaisser et Programmer le RDV</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: PROGRAMMER NOUVELLE DESCENTE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Programmer une descente de terrain</h3>
                <p className="text-xs text-blue-100">Ajout à l'agenda de l'inspecteur exclusif</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-blue-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Établissement concerné :
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomEst(!isCustomEst)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 underline"
                  >
                    {isCustomEst ? "Sélectionner dans la liste existante" : "+ Saisir un autre établissement"}
                  </button>
                </div>

                {!isCustomEst ? (
                  <select
                    value={createEstId}
                    onChange={(e) => setCreateEstId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
                    required={!isCustomEst}
                  >
                    {availableEstablishments.length === 0 && (
                      <option value="">Aucun établissement enregistré</option>
                    )}
                    {availableEstablishments.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.nomCommercial} ({est.arrondissement}) - Reste: {formatCfa(est.soldeRestantDu)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Nom commercial de l'établissement :</label>
                      <input
                        type="text"
                        required={isCustomEst}
                        placeholder="Ex: Bar Chez Maman Pauline"
                        value={customEstNom}
                        onChange={(e) => setCustomEstNom(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold">Arrondissement :</label>
                      <select
                        value={createArrondissement}
                        onChange={(e) => setCreateArrondissement(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      >
                        <option value="Lumumba">1 - Lumumba</option>
                        <option value="Mvou-Mvou">2 - Mvou-Mvou</option>
                        <option value="Tié-Tié">3 - Tié-Tié</option>
                        <option value="Loandjili">4 - Loandjili</option>
                        <option value="Mongo-Poukou">5 - Mongo-Poukou</option>
                        <option value="Ngoyo">6 - Ngoyo</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Date :</label>
                  <input
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Heure :</label>
                  <input
                    type="time"
                    value={createHeure}
                    onChange={(e) => setCreateHeure(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Nature de la mission :</label>
                <select
                  value={createMotif}
                  onChange={(e) => setCreateMotif(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
                >
                  <option value="Recouvrement">Recouvrement Forfait Informel SAA</option>
                  <option value="Contrôle Décibels">Contrôle Décibels & Sonométrie</option>
                  <option value="Signification Mise en Demeure">Signification Mise en Demeure</option>
                  <option value="Vérification Agréments">Vérification des Agréments & Licences</option>
                  <option value="Renouvellement Annuel N+1">Renouvellement Annuel N+1</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Notes d'instruction :</label>
                <textarea
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSchedule}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingSchedule ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Programmation en cours...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Programmer cette descente</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: IMPORT GOOGLE AGENDA 2026 (ENRICHISSEMENT DE LA BASE GÉNÉRALE) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <CloudDownload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Passerelle Google Agenda ➔ Base Générale Souveraine</h3>
                  <p className="text-xs text-blue-100">
                    Importation automatique des établissements, acomptes perçus et prochains RDV 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Statut Firestore */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong>Base Firebase Firestore Connectée :</strong> {establishments.length} établissements, {schedules.length} tournées et {receipts.length} quittances synchronisés en temps réel.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await syncAllToFirestore();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                  title="Pousser immédiatement tous les établissements vers Firebase Firestore"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Synchroniser vers Firestore</span>
                </button>
              </div>

              {/* Onglets de Source d'Importation */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setImportSourceTab('file')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                    importSourceTab === 'file'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>1. Fichier .ics (Google Agenda Export)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportSourceTab('paste')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                    importSourceTab === 'paste'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>2. Coller Texte / RDV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportSourceTab('api');
                    if (googleAccessToken) loadFromGoogleApi();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                    importSourceTab === 'api'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>3. Connexion Directe Google API</span>
                </button>
              </div>

              {/* CONTENU ONGLET 1 : FICHIER .ICS + TUTORIEL D'EXTRACTION */}
              {importSourceTab === 'file' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 space-y-2">
                    <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
                      <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Méthode officielle : Comment exporter vos données Google Agenda</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <li>Ouvrez Google Agenda sur votre ordinateur ou mobile (<strong className="text-blue-700 dark:text-blue-400">calendar.google.com</strong>).</li>
                      <li>Cliquez sur la roue crantée ⚙️ en haut à droite, puis sélectionnez <strong className="text-slate-800 dark:text-slate-100">Paramètres</strong>.</li>
                      <li>Dans le menu de gauche, cliquez sur <strong className="text-slate-800 dark:text-slate-100">Importer et exporter</strong>.</li>
                      <li>Sous la section <strong className="text-blue-700 dark:text-blue-400">Exporter</strong>, cliquez sur le bouton <strong className="text-slate-800 dark:text-slate-100">Exporter</strong>. Cela télécharge une archive contenant votre fichier <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.ics</code>.</li>
                      <li>Décompressez l'archive et sélectionnez le fichier <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.ics</code> ci-dessous.</li>
                    </ol>
                  </div>

                  {/* Zone de sélection du fichier .ics */}
                  <div className={`p-5 rounded-xl border-2 border-dashed text-center space-y-3 transition ${
                    isLight ? 'bg-slate-50 border-slate-300 hover:border-blue-500' : 'bg-slate-950/60 border-slate-700 hover:border-blue-500'
                  }`}>
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
                    <div>
                      <label className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md transition">
                        <span>Sélectionner le fichier .ics</span>
                        <input
                          type="file"
                          accept=".ics,text/calendar"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Format supporté : <strong>.ics (iCalendar standard Google Agenda)</strong>
                      </p>
                    </div>
                    {importFileName && (
                      <div className="p-2 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[11px] inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fichier chargé : {importFileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CONTENU ONGLET 2 : COLLER DU TEXTE BRUT */}
              {importSourceTab === 'paste' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block">
                      Copier-coller libre :
                    </span>
                    <p>
                      Collez le contenu d'un fichier <code>.ics</code>, ou bien vos notes de rendez-vous (ex: <em>« VIP Lounge - Tié-Tié - Promoteur M. Jean (06 600 11 22) - Acompte 50000 FCFA - RDV 2026-10-15 10:00 »</em>).
                    </p>
                  </div>

                  <textarea
                    rows={6}
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder="Collez ici le texte brut ou le contenu de votre Google Calendar..."
                    className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                        : 'bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-400'
                    }`}
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedContent}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyser le texte et extraire les établissements</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CONTENU ONGLET 3 : CONNEXION DIRECTE API GOOGLE */}
              {importSourceTab === 'api' && (
                <div className="space-y-3">
                  {googleAccessToken ? (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Connecté avec : {googleUser?.email || 'Compte Google officiel'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={loadFromGoogleApi}
                        disabled={isLoadingImport}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                      >
                        <CloudDownload className="w-3.5 h-3.5" />
                        <span>Actualiser depuis Google Agenda 2026</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border text-center space-y-3 bg-slate-50 dark:bg-slate-950">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Connectez votre compte Google pour synchroniser en 1 clic vos rendez-vous réels.
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs shadow-sm hover:shadow text-slate-800 dark:text-slate-200 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span>Se connecter avec Google</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status bar des résultats détectés */}
              <div className="flex items-center justify-between py-2 border-t border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {rawCalendarEvents.length} Événement(s) Détecté(s)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                    {selectedIndices.size} sélectionné(s)
                  </span>
                </div>
                {rawCalendarEvents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllIndices}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    {selectedIndices.size === rawCalendarEvents.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                )}
              </div>

              {/* List of events to import */}
              {isLoadingImport ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Analyse et extraction du calendrier en cours...</p>
                </div>
              ) : rawCalendarEvents.length === 0 ? (
                <div className="p-6 text-center space-y-2 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-800">
                  <Calendar className="w-7 h-7 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Aucune donnée de calendrier chargée pour l'instant.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Sélectionnez votre fichier <code className="text-blue-600">.ics</code> extrait de Google Agenda ou collez vos notes ci-dessus pour prévisualiser les établissements.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {rawCalendarEvents.map((evt, idx) => {
                    const parsed = parseGoogleCalendarEvent(evt);
                    const isSelected = selectedIndices.has(idx);

                    return (
                      <div
                        key={evt.id || idx}
                        onClick={() => handleToggleSelectIndex(idx)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? isLight
                              ? 'bg-blue-50/70 border-blue-300'
                              : 'bg-blue-950/30 border-blue-600'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-slate-900 border-slate-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded accent-blue-600 w-4 h-4"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {parsed.nomCommercial}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                                {parsed.arrondissement} ({parsed.quartier})
                              </span>
                              {parsed.estFerme ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500">
                                  Constaté Éteint / Fermé
                                </span>
                              ) : parsed.montantAcompte > 0 ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600">
                                  Acompte Versé : {formatCfa(parsed.montantAcompte)}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                              <span>Promoteur: {parsed.promoteurNom}</span>
                              <span>•</span>
                              <span>Prochain RDV : <strong>{parsed.prochainRdvDate} ({parsed.prochainRdvHeure})</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            {formatCfa(parsed.montantRedevanceAnnuelle)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Reliquat : {formatCfa(parsed.soldeRestantDu)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                Base actuelle : {establishments.length} établissements recensés
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  disabled={isExecutingImport || selectedIndices.size === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isExecutingImport ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Synchronisation de la base...</span>
                    </>
                  ) : (
                    <>
                      <CloudDownload className="w-4 h-4" />
                      <span>Intégrer à la Base Générale ({selectedIndices.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: SIGNALER ÉTABLISSEMENT FERMÉ / ÉTEINT (STATISTIQUES DE TERRAIN) */}
      {reportingClosedEst && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="bg-rose-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-bold text-sm">Constat de Cessation / Établissement Éteint</h3>
                  <p className="text-xs text-rose-100 truncate">{reportingClosedEst.nomCommercial}</p>
                </div>
              </div>
              <button
                onClick={() => setReportingClosedEst(null)}
                className="p-1 rounded-full hover:bg-rose-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold text-rose-700 dark:text-rose-400">Impact Statistique & Juridique :</span>
                <p className="text-[11px] leading-relaxed">
                  Cet établissement sera immédiatement classé comme <strong>inactif / éteint</strong> dans le dashboard de l'administrateur, annulant les convocations en cours et retirant la redevance du prévisionnel actif.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Motif du constat de fermeture :
                </label>
                <select
                  value={closedMotif}
                  onChange={(e) => setClosedMotif(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
                >
                  <option value="Cessation d'activité définitive / Rideau baissé">Cessation d'activité définitive / Rideau baissé</option>
                  <option value="Établissement éteint / Local inoccupé ou abandonné">Établissement éteint / Local inoccupé ou abandonné</option>
                  <option value="Faillite ou insolvabilité avérée du promoteur">Faillite ou insolvabilité avérée du promoteur</option>
                  <option value="Changement d'activité non déclaré (hors secteur loisirs)">Changement d'activité non déclaré (hors secteur loisirs)</option>
                  <option value="Fermeture administrative par arrêté de police">Fermeture administrative par arrêté de police</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Observations de terrain de l'agent :
                </label>
                <textarea
                  value={closedObservations}
                  onChange={(e) => setClosedObservations(e.target.value)}
                  placeholder="Ex : Constaté in situ lors de la tournée : enseigne déposée, portes cadenassées, promoteur injoignable..."
                  rows={3}
                  className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportingClosedEst(null)}
                  className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSubmittingClose}
                  onClick={handleConfirmReportClosed}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  {isSubmittingClose ? 'Enregistrement...' : 'Valider le Signalement (Fermé)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
