import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  LayoutDashboard,
  MapPinPlus,
  CalendarCheck,
  CloudCog,
  Scale,
  FileSpreadsheet,
  Map,
  Award,
  Send,
  Coins,
  FileCheck2,
  BookOpen,
  Target,
  Users,
  Lock,
  Building,
  Smartphone,
  Database,
  RefreshCw,
  Sun,
  Moon,
  Printer,
  Receipt,
  Maximize2,
  Minimize2,
  Flame,
  LogOut,
  ChevronRight,
  X,
  CornerDownLeft,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  FileSignature,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  category: 'modules' | 'actions' | 'dossiers';
  title: string;
  subtitle: string;
  code?: string;
  icon: React.ElementType;
  badge?: string;
  keywords: string[];
  action: () => void;
  isActive?: boolean;
}

export const CommandPalette: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    theme,
    toggleTheme,
    isCalendarFullScreen,
    setIsCalendarFullScreen,
    syncAllToFirestore,
    setShowDomainAuthModal,
    handleGoogleSignIn,
    activateDemoGoogleSession,
    googleUser,
    handleLogout,
    logoutAgentSession,
    authenticatedUser,
    openPrintModal,
    establishments,
    receipts,
    showNotification,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandPaletteOpen]);

  // Focus input and reset search when opening
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCommandPaletteOpen]);

  // 18 Modules Catalog with rich keywords
  const MODULES_DATA = useMemo<PaletteItem[]>(() => [
    {
      id: 'mod-01',
      category: 'modules',
      code: 'MOD-01',
      title: 'Cockpit Stratégique',
      subtitle: 'Dashboard des recettes, KPIs & indicateurs souverains 2026',
      icon: LayoutDashboard,
      keywords: ['dashboard', 'tableau de bord', 'indicateurs', 'kpi', 'recettes', 'stats', 'statistiques', 'direction', 'vue globale'],
      action: () => {
        setActiveModule('MOD-01');
        showNotification('info', 'Module ouvert : MOD-01 Cockpit Stratégique');
      },
      isActive: activeModule === 'MOD-01',
    },
    {
      id: 'mod-02',
      category: 'modules',
      code: 'MOD-02',
      title: 'Recensement de Terrain',
      subtitle: 'Brigade Mobile SAA, fiches in situ, géolocalisation GPS & PWA hors-ligne',
      icon: MapPinPlus,
      keywords: ['recensement', 'terrain', 'brigade', 'mobile', 'saa', 'gps', 'pwa', 'offline', 'hors-ligne', 'dossier', 'nouveau', 'enregistrer', 'etablissement'],
      action: () => {
        setActiveModule('MOD-02');
        showNotification('info', 'Module ouvert : MOD-02 Recensement de Terrain');
      },
      isActive: activeModule === 'MOD-02',
    },
    {
      id: 'mod-03',
      category: 'modules',
      code: 'MOD-03',
      title: 'Google Agenda & Tournées SAA',
      subtitle: 'Calendrier des inspections, tournées de brigades & rendez-vous de recouvrement',
      icon: CalendarCheck,
      keywords: ['agenda', 'calendrier', 'tournees', 'planning', 'rdv', 'rendez-vous', 'recouvrement', 'google calendar', 'visite', 'inspection'],
      action: () => {
        setActiveModule('MOD-03');
        showNotification('info', 'Module ouvert : MOD-03 Planning & Tournées SAA');
      },
      isActive: activeModule === 'MOD-03',
    },
    {
      id: 'mod-04',
      category: 'modules',
      code: 'MOD-04',
      title: 'Google Workspace Cloud',
      subtitle: 'Passerelle Google Calendar, Gmail notification & Google Docs',
      icon: CloudCog,
      keywords: ['google', 'workspace', 'cloud', 'gmail', 'docs', 'calendar', 'drive', 'passerelle', 'synchronisation', 'liaison'],
      action: () => {
        setActiveModule('MOD-04');
        showNotification('info', 'Module ouvert : MOD-04 Google Workspace Passerelle');
      },
      isActive: activeModule === 'MOD-04',
    },
    {
      id: 'mod-05',
      category: 'modules',
      code: 'MOD-05',
      title: 'Police Administrative',
      subtitle: 'Mises en demeure 72h, procès-verbaux d’infraction & arrêtés de fermeture',
      icon: Scale,
      keywords: ['police', 'administrative', 'mise en demeure', 'fermeture', 'arrete', 'pv', 'contentieux', 'infraction', 'amende', 'juridique', 'sanction'],
      action: () => {
        setActiveModule('MOD-05');
        showNotification('info', 'Module ouvert : MOD-05 Police Administrative');
      },
      isActive: activeModule === 'MOD-05',
    },
    {
      id: 'mod-06',
      category: 'modules',
      code: 'MOD-06',
      title: 'Rapports Trimestriels',
      subtitle: 'Bilans périodiques DGL Brazzaville, exportations Word .docx & synthèses',
      icon: FileSpreadsheet,
      keywords: ['rapport', 'trimestriel', 'dgl', 'brazzaville', 'bilan', 'docx', 'word', 'synthese', 'ministere', 'mcapnit', 'export'],
      action: () => {
        setActiveModule('MOD-06');
        showNotification('info', 'Module ouvert : MOD-06 Rapports Trimestriels');
      },
      isActive: activeModule === 'MOD-06',
    },
    {
      id: 'mod-07',
      category: 'modules',
      code: 'MOD-07',
      title: 'SIG & Heatmap Décibels',
      subtitle: 'Cartographie interactive des 6 arrondissements & sonométrie sonore légale',
      icon: Map,
      keywords: ['sig', 'carte', 'map', 'heatmap', 'decibels', 'sonometre', 'bruit', 'arrondissements', 'lumumba', 'mvoumvou', 'tie-tie', 'loandjili', 'mongo-mpoukou', 'ngoyo', 'cartographie'],
      action: () => {
        setActiveModule('MOD-07');
        showNotification('info', 'Module ouvert : MOD-07 SIG & Heatmap Décibels');
      },
      isActive: activeModule === 'MOD-07',
    },
    {
      id: 'mod-08',
      category: 'modules',
      code: 'MOD-08',
      title: 'Promotion Loisirs Sains (SPA)',
      subtitle: 'Label d’excellence SPA, valorisation des établissements & diplômes d’honneur',
      icon: Award,
      keywords: ['spa', 'promotion', 'loisirs sains', 'diplome', 'honneur', 'label', 'excellence', 'culture', 'jeunesse'],
      action: () => {
        setActiveModule('MOD-08');
        showNotification('info', 'Module ouvert : MOD-08 Promotion SPA');
      },
      isActive: activeModule === 'MOD-08',
    },
    {
      id: 'mod-09',
      category: 'modules',
      code: 'MOD-09',
      title: 'Soit-Transmis DGL',
      subtitle: 'Bordereaux de transmission officielle & demandes d’agrément à Brazzaville',
      icon: Send,
      keywords: ['soit transmis', 'bordereau', 'dgl', 'liaison', 'agrement', 'brazzaville', 'courrier', 'transmission', 'officiel'],
      action: () => {
        setActiveModule('MOD-09');
        showNotification('info', 'Module ouvert : MOD-09 Soit-Transmis DGL');
      },
      isActive: activeModule === 'MOD-09',
    },
    {
      id: 'mod-10',
      category: 'modules',
      code: 'MOD-10',
      title: 'Régie des Recettes (SAF)',
      subtitle: 'Livre journal de caisse, ventilation budgétaire SAF & reversements Trésor',
      icon: Coins,
      keywords: ['regie', 'recettes', 'saf', 'caisse', 'livre de caisse', 'tresor', 'argent', 'tresor public', 'ventilation', 'finances', 'comptabilite'],
      action: () => {
        setActiveModule('MOD-10');
        showNotification('info', 'Module ouvert : MOD-10 Régie des Recettes');
      },
      isActive: activeModule === 'MOD-10',
    },
    {
      id: 'mod-11',
      category: 'modules',
      code: 'MOD-11',
      title: 'Titres & Quittances Sécurisées',
      subtitle: 'Délivrance d’Attestations A4 républicaines et reçus thermiques POS 58mm',
      icon: FileCheck2,
      keywords: ['titres', 'quittances', 'attestation', 'recu', 'pos', '58mm', 'a4', 'imprimer', 'recouvrement', 'paiement', 'versement', 'acompte', 'solde'],
      action: () => {
        setActiveModule('MOD-11');
        showNotification('info', 'Module ouvert : MOD-11 Titres & Quittances');
      },
      isActive: activeModule === 'MOD-11',
    },
    {
      id: 'mod-12',
      category: 'modules',
      code: 'MOD-12',
      title: 'Législation & Barèmes Fiscaux',
      subtitle: 'Textes de Loi 21-2019, simulateur interactif de redevances & décrets',
      icon: BookOpen,
      keywords: ['legislation', 'loi', 'loi 21-2019', 'simulateur', 'bareme', 'taxes', 'calcul', 'decret', 'juridique', 'taux'],
      action: () => {
        setActiveModule('MOD-12');
        showNotification('info', 'Module ouvert : MOD-12 Législation & Barèmes');
      },
      isActive: activeModule === 'MOD-12',
    },
    {
      id: 'mod-13',
      category: 'modules',
      code: 'MOD-13',
      title: 'Suivi PTA 2026',
      subtitle: 'Plan de Travail Annuel, jalons opérationnels & taux d’exécution ministériel',
      icon: Target,
      keywords: ['pta', 'plan de travail annuel', 'jalons', 'objectifs', 'ministere', 'performance', 'taux execution', 'strategie'],
      action: () => {
        setActiveModule('MOD-13');
        showNotification('info', 'Module ouvert : MOD-13 Suivi PTA 2026');
      },
      isActive: activeModule === 'MOD-13',
    },
    {
      id: 'mod-14',
      category: 'modules',
      code: 'MOD-14',
      title: 'Personnel & Badges Professionnels',
      subtitle: 'Registre des inspecteurs SAA, cartes professionnelles avec QR Code & brigades',
      icon: Users,
      keywords: ['personnel', 'agents', 'inspecteurs', 'saa', 'badges', 'cartes pro', 'qr code', 'brigades', 'rh', 'matricule'],
      action: () => {
        setActiveModule('MOD-14');
        showNotification('info', 'Module ouvert : MOD-14 Personnel & Badges');
      },
      isActive: activeModule === 'MOD-14',
    },
    {
      id: 'mod-15',
      category: 'modules',
      code: 'MOD-15',
      title: 'Coffre-Fort Numérique & Audit Trail',
      subtitle: 'Archivage cryptographique SHA-256, intégrité des actes & journal des audits',
      icon: Lock,
      keywords: ['coffre fort', 'securite', 'sha256', 'hash', 'cryptographie', 'audit', 'journal', 'tracabilite', 'preuve', 'intégrité'],
      action: () => {
        setActiveModule('MOD-15');
        showNotification('info', 'Module ouvert : MOD-15 Coffre-Fort Numérique');
      },
      isActive: activeModule === 'MOD-15',
    },
    {
      id: 'mod-16',
      category: 'modules',
      code: 'MOD-16',
      title: 'Contrôle Conjoint & Commission Mixte',
      subtitle: 'Opérations inter-services avec la Police Nationale, Mairie & Environnement',
      icon: Building,
      keywords: ['controle', 'conjoint', 'commission mixte', 'police', 'mairie', 'environnement', 'descente', 'inter-services', 'securite'],
      action: () => {
        setActiveModule('MOD-16');
        showNotification('info', 'Module ouvert : MOD-16 Contrôle Conjoint');
      },
      isActive: activeModule === 'MOD-16',
    },
    {
      id: 'mod-17',
      category: 'modules',
      code: 'MOD-17',
      title: 'Portail Télépaiement Promoteur',
      subtitle: 'Interface promoteur, avis de versement & intégration Mobile Money (MTN / Airtel)',
      icon: Smartphone,
      keywords: ['telepaiement', 'promoteur', 'mobile money', 'momo', 'airtel', 'mtn', 'en ligne', 'paiement digital', 'fintech'],
      action: () => {
        setActiveModule('MOD-17');
        showNotification('info', 'Module ouvert : MOD-17 Portail Télépaiement');
      },
      isActive: activeModule === 'MOD-17',
    },
    {
      id: 'mod-18',
      category: 'modules',
      code: 'MOD-18',
      title: 'Import Supabase & Passerelle Cloud',
      subtitle: 'Migration des données SQL vers Firestore, synchronisation & diagnostics',
      icon: Database,
      badge: 'Cloud Sync',
      keywords: ['supabase', 'import', 'migration', 'donnees', 'cloud', 'firestore', 'sql', 'bdd', 'synchronisation'],
      action: () => {
        setActiveModule('MOD-18');
        showNotification('info', 'Module ouvert : MOD-18 Import Supabase / Données');
      },
      isActive: activeModule === 'MOD-18',
    },
    {
      id: 'mod-19',
      category: 'modules',
      code: 'MOD-19',
      title: 'MOD-19 • Canva Rédaction Admin',
      subtitle: 'Canva officiel de rédaction rapide : Rapports, Transmissions, TDR, Convocations en Garamond 13pt & Export Word .docx',
      icon: FileSignature,
      badge: 'Rédaction Garamond',
      keywords: ['canva', 'redaction', 'rapport', 'transmission', 'lettre', 'tdr', 'convocation', 'invitation', 'garamond', 'docx', 'word', 'courrier'],
      action: () => {
        setActiveModule('MOD-19');
        showNotification('info', 'Module ouvert : MOD-19 Canva de Rédaction Administrative');
      },
      isActive: activeModule === 'MOD-19',
    },
    {
      id: 'mod-20',
      category: 'modules',
      code: 'MOD-20',
      title: "MOD-20 • Autorisation d'Exploitation Départementale",
      subtitle: "Délivrance souveraine, Diplôme A4 officiel, Sceau DDL-PN, signature Directorale & Export Word .docx",
      icon: Award,
      badge: 'Titre Régalien',
      keywords: ['autorisation', 'exploitation', 'departementale', 'diplome', 'titre', 'regalien', 'directeur', 'sceau', 'signature', 'jacques matoko', 'loi 21-2019', 'agrement', 'permis', 'mod-20'],
      action: () => {
        setActiveModule('MOD-20');
        showNotification('info', "Module ouvert : MOD-20 Autorisation d'Exploitation Départementale");
      },
      isActive: activeModule === 'MOD-20',
    },
    {
      id: 'mod-21',
      category: 'modules',
      code: 'MOD-21',
      title: "MOD-21 • Relance & Vœux 2027 (Messagerie Républicaine)",
      subtitle: "Campagnes de fin d'année 2026, rappels d'échéances et avis de recouvrement pour établissements 0 entrée en 2027",
      icon: Send,
      badge: 'Campagnes & Relance',
      keywords: ['relance', 'voeux', '2026', '2027', 'recouvrement', 'avis', 'zero entree', 'impaye', 'whatsapp', 'sms', 'message', 'campagne', 'diffuseur', 'loi 21-2019', 'mod-21'],
      action: () => {
        setActiveModule('MOD-21');
        showNotification('info', "Module ouvert : MOD-21 Plateforme de Relance & Messagerie Républicaine");
      },
      isActive: activeModule === 'MOD-21',
    },
  ], [activeModule, setActiveModule, showNotification]);

  // Common quick actions
  const ACTIONS_DATA = useMemo<PaletteItem[]>(() => [
    {
      id: 'act-sync-firestore',
      category: 'actions',
      title: 'Synchroniser avec Firestore',
      subtitle: 'Forcer la synchronisation bilatérale des 4 collections cloud (établissements, reçus, tournées, actes)',
      icon: RefreshCw,
      keywords: ['synchroniser', 'sync', 'firestore', 'firebase', 'cloud', 'actualiser', 'rafraichir', 'base de donnees'],
      action: async () => {
        showNotification('info', 'Synchronisation globale Firestore en cours...');
        await syncAllToFirestore();
      },
    },
    {
      id: 'act-toggle-theme',
      category: 'actions',
      title: theme === 'light' ? 'Passer en Mode Sombre' : 'Passer en Mode Fond Blanc',
      subtitle: `Thème d’affichage actuel : ${theme === 'light' ? 'Fond Blanc (Clair)' : 'Mode Sombre (Dark)'}`,
      icon: theme === 'light' ? Moon : Sun,
      keywords: ['theme', 'sombre', 'blanc', 'clair', 'dark', 'light', 'mode nuit', 'contraste', 'affichage'],
      action: () => {
        toggleTheme();
        showNotification('success', `Thème basculé en ${theme === 'light' ? 'Mode Sombre' : 'Fond Blanc'}.`);
      },
    },
    {
      id: 'act-toggle-fullscreen',
      category: 'actions',
      title: isCalendarFullScreen ? 'Quitter le Plein Écran (Agenda SAA)' : 'Activer le Plein Écran (Agenda SAA)',
      subtitle: 'Agrandit l’espace de travail cartographique et calendrier pour les brigades en tournée',
      icon: isCalendarFullScreen ? Minimize2 : Maximize2,
      keywords: ['plein ecran', 'fullscreen', 'immersion', 'agrandir', 'reduire', 'agenda', 'tournee'],
      action: () => {
        setIsCalendarFullScreen((prev) => !prev);
        setActiveModule('MOD-03');
        showNotification('info', isCalendarFullScreen ? 'Mode standard réactivé.' : 'Mode plein écran terrain activé.');
      },
    },
    {
      id: 'act-vercel-firebase',
      category: 'actions',
      title: 'Centre de Liaison Vercel ⚡ Google Firebase',
      subtitle: 'Gérer les domaines autorisés Firebase Auth, les jetons et le guide d’intégration Cloud',
      icon: Flame,
      keywords: ['vercel', 'firebase', 'auth', 'domaine autorise', 'configuration', 'liaison', 'setup', 'cle api'],
      action: () => {
        setShowDomainAuthModal(true);
      },
    },
    {
      id: 'act-google-auth',
      category: 'actions',
      title: googleUser ? 'Session Google Workspace Active' : 'Lier Google Workspace & Agenda',
      subtitle: googleUser
        ? `Connecté en tant que ${googleUser.displayName || googleUser.email}`
        : 'Authentification Google Workspace (Calendar, Gmail & Docs)',
      icon: CloudCog,
      keywords: ['google', 'connexion', 'login', 'agenda', 'gmail', 'docs', 'authentification', 'compte'],
      action: () => {
        if (googleUser) {
          handleLogout();
        } else {
          handleGoogleSignIn();
        }
      },
    },
    {
      id: 'act-print-a4-specimen',
      category: 'actions',
      title: 'Aperçu Impression Attestation A4 (Spécimen)',
      subtitle: 'Prévisualiser l’attestation officielle républicaine conforme aux normes administratives',
      icon: Printer,
      keywords: ['imprimer', 'impression', 'attestation', 'a4', 'specimen', 'previsualiser', 'document officiel'],
      action: () => {
        const estSample = establishments[0] || {
          id: 'sample',
          codeDossier: 'DDL-PN-2026-TIE-0001',
          nomCommercial: 'Établissement Étalon SAA',
          promoteurNom: 'M. Jean-Paul KOUBA',
          arrondissement: 'Tié-Tié',
          quartier: 'Fond Tié-Tié',
          categorieLoisir: 'debit_boisson_3e',
          regimeFiscal: 'informel_forfaitaire',
          statut: 'en_regle',
          montantRedevanceAnnuelle: 60000,
          soldeRestantDu: 0,
        };
        openPrintModal('a4_attestation', estSample);
      },
    },
    {
      id: 'act-print-pos-specimen',
      category: 'actions',
      title: 'Aperçu Impression Reçu POS 58mm (Spécimen)',
      subtitle: 'Prévisualiser le ticket de caisse thermique mobile remis sur le terrain avec QR Code',
      icon: Receipt,
      keywords: ['recu', 'ticket', 'pos', '58mm', 'thermique', 'caisse', 'quittance', 'imprimer pos'],
      action: () => {
        const recSample = receipts[0] || {
          id: 'rec-sample',
          numeroQuittance: 'QUIT-2026-00001',
          datePaiement: new Date().toISOString().substring(0, 10),
          etablissementNom: 'Établissement Étalon SAA',
          promoteurNom: 'M. Jean-Paul KOUBA',
          arrondissement: 'Tié-Tié',
          montantVerse: 30000,
          resteAPayer: 0,
          modePaiement: 'especes',
          inspecteurOuCaissier: authenticatedUser?.nomComplet || 'Agent de Brigade SAA',
          natureRecette: 'Forfait Informel SAA',
          quittanceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        };
        openPrintModal('pos_receipt', recSample);
      },
    },
    {
      id: 'act-logout',
      category: 'actions',
      title: 'Fermer la session (Déconnexion Sécurisée)',
      subtitle: `Déconnecter ${authenticatedUser?.nomComplet || 'la session active'} et retourner à l’écran d’identification`,
      icon: LogOut,
      keywords: ['deconnexion', 'logout', 'quitter', 'fermer session', 'sortir', 'changer agent'],
      action: () => {
        logoutAgentSession();
        showNotification('info', 'Session fermée. À bientôt.');
      },
    },
  ], [
    theme,
    toggleTheme,
    isCalendarFullScreen,
    setIsCalendarFullScreen,
    syncAllToFirestore,
    setShowDomainAuthModal,
    googleUser,
    handleLogout,
    handleGoogleSignIn,
    openPrintModal,
    establishments,
    receipts,
    authenticatedUser,
    logoutAgentSession,
    setActiveModule,
    showNotification,
  ]);

  // Dynamic search in Establishments (if query is at least 2 chars)
  const DOSSIERS_DATA = useMemo<PaletteItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    return establishments
      .filter((est) => {
        const nom = (est.nomCommercial || '').toLowerCase();
        const code = (est.codeDossier || '').toLowerCase();
        const prom = (est.promoteurNom || '').toLowerCase();
        const arr = (est.arrondissement || '').toLowerCase();
        return nom.includes(q) || code.includes(q) || prom.includes(q) || arr.includes(q);
      })
      .slice(0, 5)
      .map((est) => ({
        id: `est-${est.id}`,
        category: 'dossiers',
        title: est.nomCommercial,
        subtitle: `Dossier ${est.codeDossier || 'DDL'} • ${est.arrondissement} • Promoteur: ${est.promoteurNom || 'N/A'} • Solde dû: ${est.soldeRestantDu?.toLocaleString('fr-FR') || 0} FCFA`,
        icon: Building2,
        code: est.codeDossier,
        keywords: [est.nomCommercial, est.codeDossier || '', est.promoteurNom || '', est.arrondissement || ''],
        action: () => {
          setActiveModule('MOD-02');
          showNotification('success', `Dossier ciblé : ${est.nomCommercial} (${est.codeDossier})`);
        },
      }));
  }, [searchQuery, establishments, setActiveModule, showNotification]);

  // Combined and filtered items
  const filteredItems = useMemo<PaletteItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Default initial state: all 18 modules + primary quick actions
      return [...MODULES_DATA, ...ACTIONS_DATA];
    }

    const matchesQuery = (item: PaletteItem) => {
      const inTitle = item.title.toLowerCase().includes(q);
      const inSubtitle = item.subtitle.toLowerCase().includes(q);
      const inCode = item.code ? item.code.toLowerCase().includes(q) : false;
      const inKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      return inTitle || inSubtitle || inCode || inKeywords;
    };

    const matchedModules = MODULES_DATA.filter(matchesQuery);
    const matchedActions = ACTIONS_DATA.filter(matchesQuery);

    return [...matchedModules, ...matchedActions, ...DOSSIERS_DATA];
  }, [searchQuery, MODULES_DATA, ACTIONS_DATA, DOSSIERS_DATA]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (!listContainerRef.current) return;
    const activeEl = listContainerRef.current.querySelector<HTMLElement>(`[data-palette-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation within the dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsCommandPaletteOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length === 0) return;
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[selectedIndex]) {
        const item = filteredItems[selectedIndex];
        setIsCommandPaletteOpen(false);
        item.action();
      }
      return;
    }
  };

  const handleExecuteItem = (item: PaletteItem) => {
    setIsCommandPaletteOpen(false);
    item.action();
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes DDL-PN"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 px-3 md:px-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsCommandPaletteOpen(false);
        }
      }}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-150 ${
          theme === 'light'
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-900/25'
            : 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-2xl shadow-emerald-950/50'
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b shrink-0 ${
          theme === 'light' ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-950/50'
        }`}>
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher un module, une action, un dossier... (ex: Recensement, MOD-07, Caisse)"
            className="w-full bg-transparent border-0 focus:outline-none text-sm md:text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
            aria-label="Recherche de commande"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className={`hidden sm:inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded border font-semibold shrink-0 ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-500'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            ÉCHAP
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listContainerRef}
          className="max-h-[60vh] overflow-y-auto p-2 space-y-1 divide-y divide-transparent select-none"
          role="listbox"
          tabIndex={-1}
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Aucun résultat pour « {searchQuery} »
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Essayez un code de module (ex: MOD-02), un mot-clé métier (ex: redevance, sonomètre, police) ou effacez la recherche.
              </p>
            </div>
          ) : (
            (() => {
              // Group items for clear visual hierarchy
              const modules = filteredItems.filter((i) => i.category === 'modules');
              const actions = filteredItems.filter((i) => i.category === 'actions');
              const dossiers = filteredItems.filter((i) => i.category === 'dossiers');

              let globalIndex = 0;

              const renderGroup = (title: string, items: PaletteItem[]) => {
                if (items.length === 0) return null;
                return (
                  <div key={title} className="mb-2">
                    <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {title} ({items.length})
                    </div>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const currentIndex = globalIndex++;
                        const isSelected = currentIndex === selectedIndex;
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.id}
                            data-palette-index={currentIndex}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleExecuteItem(item)}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors border ${
                              isSelected
                                ? theme === 'light'
                                  ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 shadow-sm'
                                  : 'bg-emerald-500/15 text-emerald-100 border-emerald-500/40 shadow-sm shadow-emerald-950/40'
                                : 'border-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? theme === 'light'
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                                  : theme === 'light'
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {item.code && (
                                    <span className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded border ${
                                      isSelected
                                        ? 'bg-emerald-200/60 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border-emerald-400/50'
                                        : 'bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                    }`}>
                                      {item.code}
                                    </span>
                                  )}
                                  <span className="text-xs md:text-sm font-semibold truncate">
                                    {item.title}
                                  </span>
                                  {item.isActive && (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Actif
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[11px] truncate mt-0.5 ${
                                  isSelected
                                    ? theme === 'light' ? 'text-emerald-800' : 'text-emerald-200/80'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                              {item.badge && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                  {item.badge}
                                </span>
                              )}
                              {isSelected ? (
                                <span className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 rounded border shadow-xs ${
                                  theme === 'light'
                                    ? 'bg-white border-emerald-300 text-emerald-800'
                                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                }`}>
                                  <span>Ouvrir</span>
                                  <CornerDownLeft className="w-3 h-3" />
                                </span>
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {renderGroup('Modules Métier (18 Modules)', modules)}
                  {renderGroup('Actions Rapides & Système', actions)}
                  {renderGroup('Dossiers & Établissements Trouvés', dossiers)}
                </>
              );
            })()
          )}
        </div>

        {/* Footer with Keyboard Hints & State */}
        <div className={`px-4 py-2.5 border-t text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-800 bg-slate-950 text-slate-400'
        }`}>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px]">
                ↑↓
              </kbd>
              <span>Naviguer</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px]">
                ↵
              </kbd>
              <span>Exécuter</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px]">
                Échap
              </kbd>
              <span>Fermer</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {filteredItems.length} options disponibles
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline">
              18 Modules Intégrés DDL-PN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
