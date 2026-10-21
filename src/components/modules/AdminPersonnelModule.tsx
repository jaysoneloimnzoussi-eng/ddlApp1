import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  ShieldCheck,
  CreditCard,
  Printer,
  Plus,
  Mail,
  Phone,
  Award,
  Lock,
  KeyRound,
  Check,
  Eye,
  EyeOff,
  Copy,
  Share2,
  BookOpen,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookmarkCheck,
  HelpCircle,
  Download,
  Send,
  X,
  FileCheck,
  Sliders,
  TrendingDown,
  ArrowRight,
  Scale,
  Clock,
  Building,
  Crown,
} from 'lucide-react';
import { StaffPersonnel, UserRole } from '../../types';
import { printHtmlElement } from '../../services/printService';
import { formatCfa } from '../../services/crypto';
import { generateUniversalAdministrativeDocx } from '../../services/docxGenerator';

export const AdminPersonnelModule: React.FC = () => {
  const {
    staff,
    updateStaffCredentials,
    openPrintModal,
    showNotification,
    setActiveModule,
    theme,
  } = useApp();

  // Active main tab
  const [activeTab, setActiveTab] = useState<'vault' | 'tenancier_cycle' | 'tutorial' | 'badges' | 'rbac'>('vault');

  // Search & Filters for Vault
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Edit Credentials Modal / State
  const [editingAgent, setEditingAgent] = useState<StaffPersonnel | null>(null);
  const [editLoginId, setEditLoginId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPin, setEditPin] = useState('');

  // Individual Access Slip Preview Modal
  const [slipAgent, setSlipAgent] = useState<StaffPersonnel | null>(null);

  // Copy Feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tutorial chapter filter
  const [tutorialSearch, setTutorialSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [expandedTutorialModules, setExpandedTutorialModules] = useState<Record<string, boolean>>({
    'mod-01': true,
    'mod-02': true,
  });

  const isLight = theme === 'light';

  // Toggle reveal per agent
  const toggleReveal = (agentId: string) => {
    setRevealedIds((prev) => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  // Copy helper
  const handleCopy = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showNotification('success', `${label} copié dans le presse-papier !`);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      showNotification('error', 'Impossible de copier.');
    }
  };

  // Copy formatted SMS / WhatsApp message to send directly to agent
  const handleCopyTransmissionMessage = (agent: StaffPersonnel) => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ddl-pn.gouv.cg';
    const message = `🏛️ RÉPUBLIQUE DU CONGO • DDL POINTE-NOIRE
Vos Accès Confidentiels à la Plateforme Souveraine (Loi N° 21-2019) :

• Agent : ${agent.nomComplet}
• Fonction : ${agent.fonction} (${agent.service})
• Matricule : ${agent.matricule}
----------------------------------------
🔑 IDENTIFIANT : ${agent.loginId || agent.matricule}
🔒 MOT DE PASSE : ${agent.password || agent.pin || '2026'}
🔢 CODE PIN SECOURS : ${agent.pin || '2026'}
----------------------------------------
🌐 Portail de Connexion : ${currentOrigin}

⚠️ AVERTISSEMENT : Identifiants strictement personnels et nominatifs. Ne les communiquez à aucun tiers.`;

    handleCopy(message, `msg-${agent.id}`, `Message d'accès pour ${agent.nomComplet}`);
  };

  // Open Edit Modal
  const openEditCredentials = (agent: StaffPersonnel) => {
    setEditingAgent(agent);
    setEditLoginId(agent.loginId || agent.matricule.toLowerCase());
    setEditPassword(agent.password || '2026');
    setEditPin(agent.pin || '2026');
  };

  // Save Credentials
  const handleSaveCredentials = () => {
    if (!editingAgent) return;
    if (!editLoginId.trim()) {
      showNotification('warning', "L'identifiant ne peut pas être vide.");
      return;
    }
    if (!editPassword.trim()) {
      showNotification('warning', 'Le mot de passe ne peut pas être vide.');
      return;
    }

    updateStaffCredentials(editingAgent.id, {
      loginId: editLoginId.trim(),
      password: editPassword.trim(),
      pin: editPin.trim() || '2026',
    });

    showNotification(
      'success',
      `Identifiants mis à jour avec succès pour ${editingAgent.nomComplet}.`
    );
    setEditingAgent(null);
  };

  // Auto-generate strong secure password for agent
  const generateRandomPassword = (agentNom: string) => {
    const baseName = agentNom.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'Agent';
    const cleanBase = baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${cleanBase}#${randomDigits}`;
  };

  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const handleExportProcedureDocx = async () => {
    try {
      setIsExportingDocx(true);
      showNotification('info', 'Génération du document Word officiel de la démarche en cours...');
      await generateUniversalAdministrativeDocx({
        titreActe: "PROTOCOLE ET DÉMARCHE OPÉRATIONNELLE DE RÉGULARISATION DU TENANCIER D'ÉTABLISSEMENT DE LOISIRS",
        numeroActe: 'DDL-PN/DIR/REG-2026/PROT-01',
        dateLieu: 'Pointe-Noire, République du Congo',
        emetteurTitre: 'LE DIRECTEUR DÉPARTEMENTAL DES LOISIRS',
        reference: 'Loi N° 21-2019 • Note de Service N° 151/MTL-CAB',
        objet: "Directives administratives fixant la chaîne complète : repérage terrain, convocation forfaitaire (50 000 FCFA), négociation motivée, encaissement fractionné et délivrance des titres",
        sections: [
          {
            titre: "Article 1 : Principe du Repérage In Situ et Notification de la Convocation Forfaitaire",
            contenu: "Tout établissement informel identifié sur le territoire des six arrondissements de Pointe-Noire (Lumumba, Mvou-Mvou, Tié-Tié, Loandjili, Mongo-Mpoukou, Ngoyo) fait l'objet d'un recensement immédiat avec coordonnées GPS par la Brigade Mobile SAA. L'agent notifie sur-le-champ au tenancier une Convocation Administrative Officielle A4 munie d'un QR Code de sécurité infalsifiable. Le montant réglementaire initial de référence est fixé au forfait de 50 000 FCFA conformément à la Note de service N° 151/MTL-CAB. Un délai de comparution de huit (08) jours est accordé.",
          },
          {
            titre: "Article 2 : Comparution Obligatoire à la Direction Départementale",
            contenu: "Le promoteur ou tenancier est tenu de déférer à la convocation en se présentant au siège de la Direction Départementale des Loisirs (Bâtiment de la Préfecture, sis au Centre-Ville, en face du Trésor Public, au rez-de-chaussée, Tél: +242 06 186 4275, Email: ddloisirs_pnr@loisirs.cg) muni de sa convocation, de sa pièce d'identité (CNI ou Passeport), du bail commercial ou titre d'occupation du domaine, et de son numéro RCCM ou récépissé s'il en dispose.",
          },
          {
            titre: "Article 3 : Faculté de Négociation Motivée et Révision à la Baisse de la Redevance",
            contenu: "Au cours de l'audience de régularisation, compte tenu des réalités économiques, de la superficie modeste ou du caractère saisonnier de l'activité, la Direction Départementale et le tenancier peuvent convenir d'une minoration du montant forfaitaire (pouvant être ramené à 30 000 FCFA ou 35 000 FCFA). Toute minoration arrêtée doit être formellement motivée et fait l'objet d'une inscription cryptographique horodatée dans le Journal d'Audit SHA-256 de la Régie.",
          },
          {
            titre: "Article 4 : Modalités de Règlement (Comptant, Acompte ou Rendez-vous Ferme)",
            contenu: "Le tenancier peut s'acquitter de ses droits soit au guichet de la Régie SAF (espèces ou virement Trésor Public), soit directement sur le terrain auprès de la Brigade Mobile SAA (espèces ou Mobile Money). En cas de versement d'un acompte partiel, l'agent ou le régisseur fixe obligatoirement et immédiatement la date et l'heure de la prochaine échéance dans le calendrier officiel de l'application.",
          },
          {
            titre: "Article 5 : Clôture Définitive à Solde Zéro et Délivrance des Actes Républicains",
            contenu: "Dès constatation du solde intégral (reste à payer égal à 0 FCFA), l'établissement acquiert le statut définitif 'En Règle'. Le Directeur Départemental délivre l'Attestation Provisoire de Dépôt ou l'Autorisation Départementale d'Exploitation avec visa légal et QR Code de contrôle de validité.",
          },
        ],
        signataireNom: 'NTSEKE NGOUAKA Jean Richard',
        signataireTitre: 'Directeur Départemental des Loisirs de Pointe-Noire',
        ampliations: [
          "Cabinet du Ministre de l'Industrie Touristique et des Loisirs (Pour information)",
          'Direction Générale des Loisirs (DGL)',
          'Préfecture du Département de Pointe-Noire',
          'Brigades Mobiles de Contrôle SAA',
          'Régie des Recettes SAF',
          'Archives et Dossiers Promoteurs',
        ],
      });
      showNotification('success', 'Protocole officiel téléchargé au format Word (.docx) avec succès !');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erreur lors de la génération du document Word.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchSearch =
        s.nomComplet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.loginId && s.loginId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.fonction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.telephone.includes(searchQuery);

      const matchService = selectedService === 'all' || s.service === selectedService;

      return matchSearch && matchService;
    });
  }, [staff, searchQuery, selectedService]);

  // Count stats
  const stats = useMemo(() => {
    const total = staff.length;
    const saa = staff.filter((s) => s.service === 'SAA').length;
    const direction = staff.filter((s) => s.service === 'Direction' || s.role === 'directeur').length;
    const others = total - saa - direction;
    return { total, saa, direction, others };
  }, [staff]);

  const handlePrintBadge = (agent: StaffPersonnel) => {
    openPrintModal('staff_badge', agent);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Sovereign Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              MOD-14 • ESPACE ADMINISTRATEUR
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
              Direction & Sécurité Souveraine
            </span>
          </div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Gestion des Identifiants Agents & Manuel Complet d'Exploitation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coffre-fort des mots de passe des agents de terrain, fiches individuelles de remise et tutoriel pas-à-pas de l'application
          </p>
        </div>

        {/* Global Action / Quick Summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTab('tenancier_cycle');
              showNotification('info', "Affichage de la démarche officielle de régularisation du tenancier.");
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Démarche Tenancier (50 000 FCFA & Solde)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tutorial');
              showNotification('info', "Affichage du manuel complet d'utilisation de l'application.");
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Consulter le Manuel d'Exploitation</span>
          </button>
        </div>
      </div>

      {/* Direction Départementale Official Institutional Identity Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white border border-emerald-800/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shrink-0 border border-amber-400/40">
            <Crown className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                Direction Départementale des Loisirs de Pointe-Noire
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-bold">
                MCAPNIT • DGL
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold font-cinzel text-slate-100 mt-0.5">
              Directeur Départemental : Monsieur NTSEKE NGOUAKA Jean Richard
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Bâtiment de la Préfecture, sis au Centre-Ville, en face du Trésor Public, au rez-de-chaussée</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shrink-0">
          <a
            href="tel:+242061864275"
            className="flex items-center gap-1.5 hover:text-emerald-400 transition"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-bold text-white">+242 06 186 4275</span>
          </a>
          <div className="hidden sm:block w-[1px] h-4 bg-slate-700" />
          <a
            href="mailto:ddloisirs_pnr@loisirs.cg"
            className="flex items-center gap-1.5 hover:text-emerald-400 transition"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-slate-200">ddloisirs_pnr@loisirs.cg</span>
          </a>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl p-1 gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-[140px] ${
            activeTab === 'vault'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-500" />
          <span>Coffre-Fort ({staff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tenancier_cycle')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-[170px] ${
            activeTab === 'tenancier_cycle'
              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 shadow-sm border border-amber-500/40 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-500" />
          <span>Démarche Tenancier (Cycle Complet)</span>
        </button>

        <button
          onClick={() => setActiveTab('tutorial')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-[140px] ${
            activeTab === 'tutorial'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>Manuel des 18 Modules</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-[140px] ${
            activeTab === 'badges'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-500" />
          <span>Badges & Cartes</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-w-[140px] ${
            activeTab === 'rbac'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-500" />
          <span>Habilitations RBAC</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COFFRE-FORT DES IDENTIFIANTS & MOTS DE PASSE                       */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-5">
          {/* Top Admin Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Comptes Logés</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold font-cinzel mt-2 text-slate-900 dark:text-slate-100">
                {stats.total}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Officiers et administrateurs habilités
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Brigades Mobiles (SAA)</span>
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold font-cinzel mt-2 text-blue-600 dark:text-blue-400">
                {stats.saa}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Agents de terrain (accès cloisonné)
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Super-Admin & Direction</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold font-cinzel mt-2 text-amber-600 dark:text-amber-400">
                {stats.direction}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Vue exhaustive départementale
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Services d'Appui (SAF/SPA/SSID)</span>
                <DollarSign className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold font-cinzel mt-2 text-purple-600 dark:text-purple-400">
                {stats.others}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Régie, promotion et statistiques
              </p>
            </div>
          </div>

          {/* Confidential Notice */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Espace Réservé à l'Administrateur / Directeur Général
                </p>
                <p className="text-[11px] mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                  Conformément à vos consignes, <strong>la page publique de connexion ne contient aucun identifiant ni raccourci</strong>.
                  Vous êtes la seule personne habilitée à remettre à chaque agent son identifiant officiel et son mot de passe ci-dessous.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
            >
              {showAllPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showAllPasswords ? 'Masquer Tous les Mots de Passe' : 'Afficher Tous les Mots de Passe'}</span>
            </button>
          </div>

          {/* Search & Service Filter Toolbar */}
          <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher agent, matricule, identifiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Filtrer par service :</span>
              {['all', 'SAA', 'SAF', 'SPA', 'SSID', 'Direction'].map((srv) => (
                <button
                  key={srv}
                  onClick={() => setSelectedService(srv)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition shrink-0 cursor-pointer ${
                    selectedService === srv
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {srv === 'all' ? 'Tous' : srv}
                </button>
              ))}
            </div>
          </div>

          {/* Master Table of Credentials */}
          <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Agent / Officier</th>
                    <th className="p-3.5">Service & Rôle</th>
                    <th className="p-3.5">Identifiant de Connexion</th>
                    <th className="p-3.5">Mot de Passe Sécurisé</th>
                    <th className="p-3.5">Contact Professionnel</th>
                    <th className="p-3.5 text-right">Actions de Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStaff.map((agent) => {
                    const isRevealed = showAllPasswords || !!revealedIds[agent.id];
                    const isAdmin = agent.role === 'directeur' || agent.role === 'administrateur';
                    const activeLogin = agent.loginId || agent.matricule.toLowerCase();
                    const activePass = agent.password || agent.pin || '2026';

                    return (
                      <tr
                        key={agent.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                      >
                        {/* Column 1: Agent & Photo */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {agent.photoUrl ? (
                              <img
                                src={agent.photoUrl}
                                alt={agent.nomComplet}
                                className="w-9 h-9 rounded-full object-cover border border-emerald-500/40"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isAdmin
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {agent.nomComplet
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{agent.nomComplet}</span>
                                {isAdmin && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{agent.fonction}</p>
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {agent.matricule}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Service & Role */}
                        <td className="p-3.5">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {agent.service}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {agent.brigadeAffectee || 'Section Centrale'}
                            </p>
                            <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {isAdmin ? 'Vue Globale' : 'Cloisonné'}
                            </span>
                          </div>
                        </td>

                        {/* Column 3: Identifiant Officiel (with copy) */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-950 font-mono text-emerald-700 dark:text-emerald-300 font-bold border border-slate-200 dark:border-slate-800 select-all">
                              {activeLogin}
                            </span>
                            <button
                              onClick={() => handleCopy(activeLogin, `login-${agent.id}`, `Identifiant ${agent.nomComplet}`)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                              title="Copier l'identifiant"
                            >
                              {copiedKey === `login-${agent.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ou matricule : {agent.matricule}
                          </span>
                        </td>

                        {/* Column 4: Mot de Passe Confidentiel */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 font-mono text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 select-all">
                              {isRevealed ? activePass : '••••••••••••'}
                            </span>
                            <button
                              onClick={() => toggleReveal(agent.id)}
                              className="p-1 rounded text-slate-400 hover:text-amber-500 transition cursor-pointer"
                              title={isRevealed ? 'Masquer' : 'Afficher'}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(activePass, `pass-${agent.id}`, `Mot de passe ${agent.nomComplet}`)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                              title="Copier le mot de passe"
                            >
                              {copiedKey === `pass-${agent.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => openEditCredentials(agent)}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 cursor-pointer block"
                          >
                            Modifier / Réinitialiser
                          </button>
                        </td>

                        {/* Column 5: Contact Pro */}
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <p className="font-mono text-slate-700 dark:text-slate-300">
                              {agent.telephone}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {agent.email}
                            </p>
                          </div>
                        </td>

                        {/* Column 6: Actions de distribution */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Bouton SMS/WhatsApp copy */}
                            <button
                              onClick={() => handleCopyTransmissionMessage(agent)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-emerald-500/20"
                              title="Copier le message officiel à envoyer à l'agent"
                            >
                              {copiedKey === `msg-${agent.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Transmettre</span>
                            </button>

                            {/* Bouton Fiche d'accès individuelle */}
                            <button
                              onClick={() => setSlipAgent(agent)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Voir et imprimer la fiche individuelle de remise"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                              <span>Fiche</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1.5: DÉMARCHE & PROTOCOLE DE RÉGULARISATION DU TENANCIER               */}
      {/* ========================================================================= */}
      {activeTab === 'tenancier_cycle' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner Solennel */}
          <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 text-white border border-amber-800/80 shadow-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase border border-amber-500/30">
                  RÉFÉRENTIEL OPÉRATIONNEL DDL-PN
                </span>
                <span className="text-[10px] font-mono text-amber-200">
                  Loi N° 21-2019 • Note N° 151/MTL-CAB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportProcedureDocx}
                  disabled={isExportingDocx}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingDocx ? 'Génération Word...' : 'Exporter Protocole (.DOCX)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer la Démarche</span>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold font-cinzel text-amber-100">
                Protocole Officiel de Régularisation du Tenancier d'Établissement de Loisirs
              </h2>
              <p className="text-xs text-amber-200/90 max-w-4xl leading-relaxed mt-1">
                Guide méthodologique transverse destiné à la Direction Départementale, aux inspecteurs de brigade SAA et aux régisseurs SAF. 
                Ce protocole détaille la chaîne complète depuis le repérage de l'établissement informel jusqu'au solde définitif et à la délivrance des titres d'exploitation.
              </p>
            </div>

            {/* Ruban Républicain Congolais */}
            <div className="h-1.5 w-full rounded-full flex overflow-hidden shadow-xs">
              <div className="flex-1 bg-[#009543]" />
              <div className="flex-1 bg-[#fbde4a]" />
              <div className="flex-1 bg-[#dc241f]" />
            </div>
          </div>

          {/* Synthèse du Processus en 5 Points Clés */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs uppercase font-mono">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Résumé Opérationnel du Parcours Tenancier</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>1. Repérage in situ :</strong> L'agent SAA repère l'établissement informel et lui délivre sur le champ une <strong>convocation officielle au forfait informel fixé à 50 000 FCFA</strong> avec QR Code et date de comparution.<br />
              <strong>2. Comparution à la Direction :</strong> Le tenancier se présente à la Direction muni de ses pièces administratives (CNI, bail commercial, RCCM éventuel).<br />
              <strong>3. Négociation motivée :</strong> La Direction et le promoteur peuvent <strong>négocier le prix à la baisse</strong> (ex: de 50 000 à 35 000 FCFA) avec justification obligatoire archivée au Journal d'Audit SHA-256.<br />
              <strong>4. Paiement au bureau ou sur place :</strong> Le tenancier verse soit un <strong>acompte</strong> (au bureau SAF ou sur le terrain à la brigade mobile), soit donne un <strong>rendez-vous ferme</strong> pour le paiement.<br />
              <strong>5. Solde intégral :</strong> Dès que le reste à payer atteint 0 FCFA, l'établissement est classé <strong>En règle</strong> et reçoit son Attestation Provisoire ou son Autorisation Départementale.
            </p>
          </div>

          {/* Schéma Interactif des 5 Étapes du Cycle */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-cinzel text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Les 5 Étapes Chronologiques de la Régularisation</span>
            </h3>

            {/* ÉTAPE 1 */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Repérage In Situ & Forfait Informel Standard</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                        50 000 FCFA
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Brigade Mobile de Contrôle SAA • Sur le terrain</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('MOD-02')}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Aller au Recensement (MOD-02)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 text-xs space-y-3 text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Opérateur Responsable</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Inspecteur Chef de Brigade SAA</p>
                    <p className="text-[11px] text-slate-500">Tournée nocturne ou diurne dans l'arrondissement.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Acte Administratif Émis</span>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">Convocation Officielle A4</p>
                    <p className="text-[11px] text-slate-500">Générée instantanément avec QR Code et référence CONV-2026-PN.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Statut Système Attribué</span>
                    <p className="font-semibold font-mono text-amber-700 dark:text-amber-300">convocation_delivree</p>
                    <p className="text-[11px] text-slate-500">Délai de comparution fixé à 8 jours par défaut.</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-[11px] space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    📋 Contenu légal notifié dans la convocation :
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                    <li>Montant forfaitaire réglementaire notifié : <strong>50 000 FCFA</strong> (base informelle Note 151/MTL-CAB).</li>
                    <li>Date, heure et lieu de comparution (Direction Départementale des Loisirs, Bâtiment de la Préfecture, Centre-Ville, en face du Trésor Public, au rez-de-chaussée).</li>
                    <li>Liste des documents à fournir : CNI/Passeport du gérant, titre d'occupation/bail, RCCM si disponible.</li>
                    <li>Avertissement légal : Sanction de fermeture conservatoire sous 48h selon la Loi 21-2019 en cas de défaut de présentation.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ÉTAPE 2 */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Comparution du Tenancier & Dépôt des Documents
                    </h4>
                    <p className="text-[11px] text-slate-500">Direction Départementale des Loisirs (Bâtiment de la Préfecture, RDC) • Guichet SAA</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/20">
                  Délai : 8 à 15 jours
                </span>
              </div>
              <div className="p-4 text-xs space-y-3 text-slate-600 dark:text-slate-300">
                <p>
                  Le tenancier se présente à la Direction Départementale des Loisirs avec sa convocation officielle. 
                  L'inspecteur de permanence ou l'agent d'accueil examine les pièces présentées et procède à la vérification d'identité et de localisation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">📄 Pièces administratives réceptionnées :</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                      <li>Copie CNI ou Passeport du promoteur / gérant</li>
                      <li>Contrat de bail ou titre d'occupation du site</li>
                      <li>RCCM ou déclaration d'activité (si existant)</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">⚙️ Enregistrement au système :</span>
                    <p className="text-[11px] text-slate-500">
                      L'agent recherche le dossier dans le système par son nom ou son QR Code, actualise les coordonnées téléphoniques et valide les pièces fournies dans la checklist.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ÉTAPE 3 */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-purple-50/80 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Négociation Motivée & Révision du Forfait à la Baisse</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold border border-purple-500/30">
                        Arbitrage Souverain
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Direction Départementale • Audience de régularisation</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                  Bouton « Négocier Forfait »
                </span>
              </div>
              <div className="p-4 text-xs space-y-3 text-slate-600 dark:text-slate-300">
                <p>
                  Conformément à la réalité socio-économique du terrain, le promoteur peut justifier de sa faible capacité d'accueil ou de son chiffre d'affaires modeste pour <strong>négocier le forfait à la baisse</strong>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">Tarif Négocié Type</span>
                    <p className="font-bold text-base font-mono text-purple-700 dark:text-purple-300">30 000 à 45 000 FCFA</p>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400">Minoration de 10% à 40% sur le forfait initial.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">Motif Obligatoire</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Justification économique</p>
                    <p className="text-[10px] text-slate-500">Ex: Petite terrasse de quartier, début d'exploitation, accord de conciliation.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">Traçabilité & Audit</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">Journal SHA-256</p>
                    <p className="text-[10px] text-slate-500">Archivage nominatif avec identifiant de l'agent validateur.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/5 text-[11px] text-purple-800 dark:text-purple-300">
                  💡 <strong>Impact dans l'application :</strong> L'ouverture du modal <code>NegotiationModal</code> recalcule automatiquement le nouveau solde restant dû et met à jour le statut en <code>negociation_en_cours</code> ou <code>acompte_verse</code> selon les versements antérieurs.
                </div>
              </div>
            </div>

            {/* ÉTAPE 4 */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-teal-50/80 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-800/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Paiement Fractionné (Acompte) ou Prise de Rendez-vous</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-300 font-bold border border-teal-500/30">
                        Bureau SAF ou Sur le Terrain
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Régie Financière SAF • Caisse Trésor ou Brigade Mobile SAA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModule('MOD-01')}
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Agenda SAA (MOD-01)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModule('MOD-04')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Caisse SAF (MOD-04)</span>
                  </button>
                </div>
              </div>
              <div className="p-4 text-xs space-y-3 text-slate-600 dark:text-slate-300">
                <p>
                  Le tenancier dispose de trois options pratiques pour commencer à honorer ses frais d'exploitation :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Building className="w-4 h-4 text-teal-500" />
                      <span>Option A : Au Bureau (Caisse SAF)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Paiement en espèces ou virement Trésor. Le caissier régisseur SAF émet immédiatement la quittance certifiée SHA-256.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span>Option B : Sur Place / Sur le Terrain</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Paiement direct à la brigade mobile lors de sa tournée, en espèces avec reçu immédiat ou via Airtel Money / MTN MoMo.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>Option C : Échéancier avec Rendez-vous</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Si le promoteur donne un rendez-vous ferme, la date et l'heure sont inscrites directement dans l'agenda de la brigade.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] space-y-1 text-teal-900 dark:text-teal-200">
                  <p className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Règle d'or de l'échéancier dans l'application :
                  </p>
                  <p>
                    Dès qu'un acompte est saisi (ex: 20 000 FCFA) et que le solde restant est supérieur à 0, l'application <strong>oblige la fixation de la date et de l'heure du prochain rendez-vous</strong>. 
                    L'établissement disparaît des tâches d'aujourd'hui et est reclassé automatiquement sur la date future convenue dans le calendrier de l'agent.
                  </p>
                </div>
              </div>
            </div>

            {/* ÉTAPE 5 */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                    5
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Solde Intégral & Délivrance des Titres Républicains</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30">
                        Reste à payer : 0 FCFA
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Direction Départementale • Guichet des Titres (MOD-03) & Actes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('MOD-03')}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Guichet des Titres (MOD-03)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 text-xs space-y-3 text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Statut Réglementaire</span>
                    <p className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">en_regle</p>
                    <p className="text-[10px] text-slate-500">Établissement intégralement affranchi de ses redevances pour l'année 2026.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Titres Disponibles</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Attestation & Autorisation</p>
                    <p className="text-[10px] text-slate-500">Impression A4 haute fidélité avec sceaux officiels et export Word .docx.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Reconduction Annuelle</span>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Exercice N+1 (2027)</p>
                    <p className="text-[10px] text-slate-500">Programmation automatique à la date anniversaire du premier versement.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau Récapitulatif des Statuts et Actions Système */}
          <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <h4 className="font-bold text-sm font-cinzel text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span>Matrice de Correspondance des Statuts dans l'Application</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-400 font-bold bg-slate-50 dark:bg-slate-950">
                    <th className="p-2.5">Code Statut</th>
                    <th className="p-2.5">Étape du Cycle</th>
                    <th className="p-2.5">Montant Redevance</th>
                    <th className="p-2.5">Document Édité</th>
                    <th className="p-2.5">Action Immédiate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  <tr>
                    <td className="p-2.5 font-bold text-amber-600">convocation_delivree</td>
                    <td className="p-2.5 font-sans">Étape 1 : Repérage terrain</td>
                    <td className="p-2.5">50 000 FCFA (Forfait initial)</td>
                    <td className="p-2.5 font-sans">Convocation Officielle A4 (QR Code)</td>
                    <td className="p-2.5 font-sans text-slate-500">Attente comparution sous 8 jours</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-purple-600">negociation_en_cours</td>
                    <td className="p-2.5 font-sans">Étape 3 : Négociation à la baisse</td>
                    <td className="p-2.5">Prix convenu (ex: 35 000 FCFA)</td>
                    <td className="p-2.5 font-sans">Avenant & Journal d'Audit SHA-256</td>
                    <td className="p-2.5 font-sans text-slate-500">Motif de minoration validé</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-blue-600">acompte_verse</td>
                    <td className="p-2.5 font-sans">Étape 4 : Paiement partiel</td>
                    <td className="p-2.5">Solde &gt; 0 FCFA</td>
                    <td className="p-2.5 font-sans">Quittance SAF Trésor + Date de RDV</td>
                    <td className="p-2.5 font-sans text-slate-500">Programmation suite tournée</td>
                  </tr>
                  <tr className="bg-emerald-500/5">
                    <td className="p-2.5 font-bold text-emerald-600">en_regle</td>
                    <td className="p-2.5 font-sans">Étape 5 : Solde intégral</td>
                    <td className="p-2.5 text-emerald-600 font-bold">0 FCFA restant</td>
                    <td className="p-2.5 font-sans">Attestation & Autorisation A4 / .docx</td>
                    <td className="p-2.5 font-sans text-emerald-600 font-bold">Titres d'exploitation délivrés</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TUTORIEL COMPLET & MANUEL D'EXPLOITATION DDL-PN                    */}
      {/* ========================================================================= */}
      {activeTab === 'tutorial' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border border-emerald-800 shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                MANUEL OFFICIEL DU SYSTÈME DDL-PN
              </span>
              <span className="text-[10px] font-mono text-emerald-300">
                Version 3.0 Souveraine
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-cinzel">
              Guide & Tutoriel Complet d'Exploitation de l'Application
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Ce document constitue le référentiel officiel destiné à l'Administrateur Départemental,
              aux chefs de brigades et aux agents de terrain. Il détaille la manipulation de l'ensemble des
              18 modules souverains, la gestion de la sécurité, le recouvrement des redevances et l'usage des outils d'inspection.
            </p>
          </div>

          {/* Table des Matières / Chapitres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase">Partie 1</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Architecture & Sécurité</h3>
              <p className="text-[11px] text-slate-500">Cloisonnement strict RBAC et distribution des accès.</p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-blue-500 uppercase">Partie 2</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Recensement & SIG</h3>
              <p className="text-[11px] text-slate-500">Cartographie des 6 arrondissements et saisie mobile GPS.</p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Partie 3</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Police Administrative</h3>
              <p className="text-[11px] text-slate-500">Contrôle sonométrique, mises en demeure 72h et fermetures.</p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-purple-500 uppercase">Partie 4</span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Régie Financière & SAF</h3>
              <p className="text-[11px] text-slate-500">Encaissements, quittances sécurisées SHA-256 et rapports DGL.</p>
            </div>
          </div>

          {/* Détail Complet Module par Module */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-cinzel text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Guide Pas-à-Pas des 18 Modules Souverains</span>
            </h3>

            {/* MODULE 1: DASHBOARD */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-01
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Tableau de Bord Stratégique & Météo Financière
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Vue Direction & Chefs de Service</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong>Objectif :</strong> Offrir une vision consolidée en temps réel de la campagne de régularisation 2026 à Pointe-Noire.
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Taux de recouvrement :</strong> Ratio entre le montant total des redevances attendues et le montant effectivement encaissé par la Régie SAF.</li>
                  <li><strong>Diagramme D3 par Arrondissement :</strong> Répartition des établissements recensés sur les 6 arrondissements (Lumumba, Mvou-Mvou, Tié-Tié, Loandjili, Mongo-Mpoukou, Ngoyo).</li>
                  <li><strong>Radar des Infractions Acoustiques :</strong> Signalement immédiat des établissements en infraction sonométrique (dépassement des 75 dB(A) nocturnes).</li>
                </ul>
              </div>
            </div>

            {/* MODULE 2: FIELD RECENSEMENT */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-02
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Recensement Mobile de Terrain & Géolocalisation GPS
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Officiers SAA de Terrain</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong>Procédure pour l'Agent de Terrain :</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-2">
                  <li>Se connecter avec son <strong>Identifiant</strong> et son <strong>Mot de Passe</strong> personnel.</li>
                  <li>Ouvrir le module <strong>Recensement Terrain</strong> (MOD-02).</li>
                  <li>Cliquer sur <strong>« Capturer Coordonnées GPS »</strong> pour géoréférencer précisément l'établissement sur le terrain.</li>
                  <li>Sélectionner la catégorie (Discothèque, Bar Dancing, Lounge Bar, Snack-Bar, Complexe Piscine).</li>
                  <li>Sélectionner le régime fiscal :
                    <span className="block pl-4 text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                      • Formel Proportionnel : Calcul automatique selon la surface commerciale (m²).
                    </span>
                    <span className="block pl-4 text-amber-600 dark:text-amber-400 font-semibold">
                      • Informel Forfaitaire : Forfait annuel fixé selon la grille municipale.
                    </span>
                  </li>
                  <li>Enregistrer la fiche : si le réseau est faible, la fiche est stockée localement dans le téléphone et se synchronise automatiquement avec Firestore dès le retour du signal.</li>
                </ol>
              </div>
            </div>

            {/* MODULE 3: AGENDA */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-03
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Agenda Mobile & Calendrier des Tournées de Contrôle
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Brigades & Inspecteurs</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong>Fonctionnalités clés :</strong>
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>Chaque inspecteur visualise ses rendez-vous d'encaissement et ses tournées nocturnes de contrôle sonométrique.</li>
                  <li>Suivi des dates d'échéance des acomptes accordés aux promoteurs.</li>
                  <li>Synchronisation directe avec Google Calendar via la passerelle Google Workspace.</li>
                </ul>
              </div>
            </div>

            {/* MODULE 4: GOOGLE WORKSPACE */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-04
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Passerelle Google Workspace (Gmail, Agenda & Docs)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Communication Officielle</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Gmail Officiel :</strong> Envoi des convocations et notifications de régularisation directement sur la boîte mail du promoteur avec en-tête de la République du Congo.</li>
                  <li><strong>Google Docs :</strong> Génération instantanée des procès-verbaux d'inspection au format Google Docs avec lien d'ouverture directe.</li>
                  <li><strong>Authentification Google :</strong> Le Directeur peut connecter son compte Google Workspace ou utiliser la session interne instantanée.</li>
                </ul>
              </div>
            </div>

            {/* MODULE 5: JURIDIQUE & POLICE */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-05
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Générateur d'Actes Juridiques & Mises en Demeure 72h
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Pouvoir Régalien & Police Administrative</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Ce module génère automatiquement les actes administratifs juridiquement irréprochables :
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Mise en Demeure sous 72 Heures :</strong> Compte à rebours temps réel, sommation formelle de pose de limiteur acoustique ou paiement.</li>
                  <li><strong>Arrêté de Fermeture Administrative :</strong> Notification de fermeture avec réquisition de la force publique et pose de scellés.</li>
                  <li><strong>Attestation Provisoire de Dépôt :</strong> Titre temporaire délivré aux exploitants en cours de constitution de dossier d'agrément.</li>
                  <li><strong>Certificat de Conformité Acoustique :</strong> Délivré après étalonnage et pose d'un limiteur sonore agréé.</li>
                </ul>
              </div>
            </div>

            {/* MODULE 7: SIG MAP */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-07
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Système d'Information Géographique (SIG) & Cartographie
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Cartographie Interactive Leaflet</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Visualisation sur carte Leaflet des établissements de nuit et de loisirs à Pointe-Noire :
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>Codes couleur normalisés : 🟢 En Règle | 🔵 Attestation Provisoire | 🟠 Mise en Demeure 72h | 🔴 Fermeture Contentieuse.</li>
                  <li>Filtre par arrondissement (Lumumba, Mvou-Mvou, Tié-Tié, Loandjili, Mongo-Mpoukou, Ngoyo).</li>
                  <li>Clic sur un marqueur pour afficher la fiche complète, le solde restant dû et déclencher l'impression de la quittance.</li>
                </ul>
              </div>
            </div>

            {/* MODULE 10: SAF RÉGIE */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-10
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Régie des Recettes (SAF) & Journal des Versements
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Service Administratif et Financier</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Gestion rigoureuse et infalsifiable des deniers publics :
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>Enregistrement des versements en espèces ou virements bancaires.</li>
                  <li>Calcul instantané du reliquat dû par le promoteur.</li>
                  <li>Ventilation comptable entre les comptes du Trésor Public et la Régie Départementale.</li>
                </ul>
              </div>
            </div>

            {/* MODULE 11: TITRES & QUITTANCES */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-11
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Titres d'Exploitation & Quittances Sécurisées SHA-256
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Sécurité Anti-Fraude</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Chaque paiement génère un document officiel muni d'un <strong>QR Code dynamique</strong> et d'une empreinte cryptographique SHA-256 :
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Format A4 Administratif :</strong> Pour archivage dans le dossier physique du promoteur.</li>
                  <li><strong>Format Ticket POS 58mm :</strong> Pour délivrance immédiate sur le terrain avec imprimante thermique portable Bluetooth.</li>
                </ul>
              </div>
            </div>

            {/* MODULE 18: IMPORT SUPABASE */}
            <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    MOD-18
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Migration & Synchronisation des Données Supabase vers Firestore
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Intégrité des Données</span>
              </div>
              <div className="p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Permet la migration en direct des 62 établissements historiques, des fiches de terrain et des agents depuis Supabase directement vers la base de données Firestore souveraine de l'application.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BADGES & CARTES PROFESSIONNELLES                                  */}
      {/* ========================================================================= */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Cartes d'Identité Professionnelles & Badges d'Inspecteurs Assermentés
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Format carte PVC officiel avec serment TGI Pointe-Noire et QR Code de vérification
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  {agent.photoUrl ? (
                    <img
                      src={agent.photoUrl}
                      alt={agent.nomComplet}
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {agent.nomComplet.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {agent.nomComplet}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{agent.fonction}</p>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {agent.matricule}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1 text-slate-500">
                  <p>Prestation TGI : <strong className="font-mono text-slate-700 dark:text-slate-300">{agent.assermentationNumero}</strong></p>
                  <p>Service : <strong className="text-slate-700 dark:text-slate-300">{agent.service}</strong></p>
                </div>

                <button
                  onClick={() => handlePrintBadge(agent)}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer le Badge Officiel</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HABILITATIONS & MODÈLE RBAC                                       */}
      {/* ========================================================================= */}
      {activeTab === 'rbac' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Cloisonnement & Matrice des Habilitations (RBAC)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Le système souverain DDL-PN garantit l'étanchéité des compétences régaliennes :
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                1. Directeur Départemental (Super-Admin)
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Accès sans restriction à l'ensemble des 6 arrondissements de Pointe-Noire.
                Signature exclusive des actes de fermeture administrative, ordonnancement des recettes et visas ministériels.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                2. Inspecteurs SAA (Agents de Terrain)
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Cloisonnement strict : chaque agent ne visualise <strong>exclusivement</strong> que les établissements
                qu'il a lui-même recensés et pour lesquels il a été désigné inspecteur responsable.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                3. Régie des Recettes (SAF)
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Compétence exclusive pour encaisser les fonds, valider les quittances sécurisées et émettre les bordereaux comptables.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
                4. Service Promotion & Animation (SPA)
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Sensibilisation des promoteurs culturels, organisation des salons récréatifs et labellisation citoyenne.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MODIFIER LES IDENTIFIANTS D'UN AGENT                             */}
      {/* ========================================================================= */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Modifier les Accès de l'Agent
                </h3>
              </div>
              <button
                onClick={() => setEditingAgent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                {editingAgent.nomComplet.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{editingAgent.nomComplet}</p>
                <p className="text-[11px] text-slate-500">{editingAgent.fonction} • {editingAgent.matricule}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Identifiant Officiel de Connexion :
                </label>
                <input
                  type="text"
                  value={editLoginId}
                  onChange={(e) => setEditLoginId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Mot de Passe Confidentiel :
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateRandomPassword(editingAgent.nomComplet))}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Générer un mot de passe robuste</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-amber-600 dark:text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Code PIN Numérique de Secours (4-6 chiffres) :
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer les Accès</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FICHE INDIVIDUELLE DE REMISE D'ACCÈS                            */}
      {/* ========================================================================= */}
      {slipAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Fiche Individuelle de Remise des Accès</span>
              </h3>
              <button
                onClick={() => setSlipAgent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fiche Format Document Officiel */}
            <div
              id="printable-slip-agent"
              className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 space-y-4 text-xs font-sans"
            >
              <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800 space-y-0.5">
                <p className="font-bold text-[11px] uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  RÉPUBLIQUE DU CONGO • MCAPNIT • DGL
                </p>
                <p className="font-cinzel font-bold text-xs text-emerald-700 dark:text-emerald-400">
                  Direction Départementale des Loisirs de Pointe-Noire
                </p>
                <p className="text-[10px] text-slate-500">
                  Fiche Confidentielle de Dotation Numérique • Exercice 2026
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nom & Prénom de l'Agent :</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{slipAgent.nomComplet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Matricule Officiel :</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{slipAgent.matricule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fonction & Service :</span>
                  <span className="font-semibold">{slipAgent.fonction} ({slipAgent.service})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prestation Serment TGI :</span>
                  <span className="font-mono">{slipAgent.assermentationNumero}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Identifiant de Connexion :</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                    {slipAgent.loginId || slipAgent.matricule.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Mot de Passe Attribué :</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm">
                    {slipAgent.password || slipAgent.pin || '2026'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 text-center leading-relaxed italic">
                Ce document est strictement personnel. L'agent s'engage à ne pas divulguer ses identifiants et à respecter les obligations de réserve et de secret professionnel.
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleCopyTransmissionMessage(slipAgent)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copier Texte SMS</span>
              </button>

              <button
                onClick={() => {
                  printHtmlElement('printable-slip-agent', `Fiche_Remise_${slipAgent?.matricule || 'Agent'}`);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la Fiche de Remise</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
