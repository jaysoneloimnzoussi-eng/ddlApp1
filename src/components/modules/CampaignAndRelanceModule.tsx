import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DdlLogo } from '../common/DdlLogo';
import {
  CampaignTargetSegment,
  CampaignType,
  CommunicationChannel,
  Establishment,
} from '../../types';
import { OFFICIAL_CAMPAIGN_TEMPLATES, CampaignTemplate } from '../../data/campaignSeedData';
import { formatCfa } from '../../services/crypto';
import {
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  Users,
  Calendar,
  Layers,
  Copy,
  Check,
  Building,
  ExternalLink,
  ShieldAlert,
  Flame,
  BadgeAlert,
  RefreshCw,
  Crown,
  FileSpreadsheet,
} from 'lucide-react';

export const CampaignAndRelanceModule: React.FC = () => {
  const {
    establishments,
    receipts,
    campaignBatches,
    campaignMessages,
    sendCampaignMessage,
    sendBatchCampaign,
    currentAgent,
    currentUserRole,
    openPrintModal,
    showNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'campagnes' | 'base_cibles' | 'journal'>('campagnes');

  // Contexte temporel sélectionné
  const [temporalContext, setTemporalContext] = useState<'decembre_2026' | 'janvier_2027' | 'courant'>('decembre_2026');

  // Modèle de campagne sélectionné pour diffusion
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-voeux-dec-2026');
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel>('whatsapp');
  const [customMessageBody, setCustomMessageBody] = useState<string>('');
  const [targetSegmentFilter, setTargetSegmentFilter] = useState<CampaignTargetSegment>('all');
  const [arrondissementFilter, setArrondissementFilter] = useState<string>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Filtres pour l'onglet Base Cibles
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'zero_entree' | 'acompte' | 'solde'>('all');
  const [arrondissementTargetFilter, setArrondissementTargetFilter] = useState<string>('all');

  // Modal d'envoi unitaire
  const [quickSendEst, setQuickSendEst] = useState<Establishment | null>(null);
  const [quickMessageText, setQuickMessageText] = useState('');
  const [quickChannel, setQuickChannel] = useState<CommunicationChannel>('whatsapp');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template courant
  const activeTemplate = useMemo(() => {
    return OFFICIAL_CAMPAIGN_TEMPLATES.find((t) => t.id === selectedTemplateId) || OFFICIAL_CAMPAIGN_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Synchronisation initiale du corps du texte selon le template
  React.useEffect(() => {
    if (activeTemplate) {
      setCustomMessageBody(activeTemplate.corpsTexte);
      setTargetSegmentFilter(activeTemplate.cibleDefaut);
      setSelectedChannel(activeTemplate.canalRecommande);
      setTemporalContext(activeTemplate.periode);
    }
  }, [activeTemplate]);

  // Calcul financier dynamique par établissement
  const establishmentsWithFinancials = useMemo(() => {
    return establishments.map((est) => {
      const estReceipts = receipts.filter((r) => r.etablissementId === est.id);
      const paid = estReceipts.reduce((sum, r) => sum + r.montantVerse, 0) || est.montantEncaisse || 0;
      const due = est.montantRedevanceAnnuelle || 150000;
      const remaining = Math.max(0, due - paid);

      let statutPaiement: 'zero_entree' | 'acompte' | 'solde' = 'zero_entree';
      if (paid === 0) {
        statutPaiement = 'zero_entree';
      } else if (paid < due) {
        statutPaiement = 'acompte';
      } else {
        statutPaiement = 'solde';
      }

      return {
        ...est,
        montantPayeCalcule: paid,
        redevanceDueCalculee: due,
        resteAPayerCalcule: remaining,
        statutPaiementCalcule: statutPaiement,
      };
    });
  }, [establishments, receipts]);

  // Statistiques globales
  const stats = useMemo(() => {
    const total = establishmentsWithFinancials.length;
    const zeroEntree = establishmentsWithFinancials.filter((e) => e.statutPaiementCalcule === 'zero_entree').length;
    const acomptes = establishmentsWithFinancials.filter((e) => e.statutPaiementCalcule === 'acompte').length;
    const soldes = establishmentsWithFinancials.filter((e) => e.statutPaiementCalcule === 'solde').length;

    const totalMessages = campaignMessages.length;
    const totalBatches = campaignBatches.length;

    const detteTotaleRecouvrer = establishmentsWithFinancials
      .filter((e) => e.statutPaiementCalcule === 'zero_entree')
      .reduce((s, e) => s + e.resteAPayerCalcule, 0);

    return { total, zeroEntree, acomptes, soldes, totalMessages, totalBatches, detteTotaleRecouvrer };
  }, [establishmentsWithFinancials, campaignMessages, campaignBatches]);

  // Cibles filtrées pour la diffusion de campagne (Onglet 1)
  const campaignFilteredTargets = useMemo(() => {
    return establishmentsWithFinancials.filter((est) => {
      if (arrondissementFilter !== 'all' && est.arrondissement !== arrondissementFilter) {
        return false;
      }
      if (targetSegmentFilter === 'zero_entree') {
        return est.statutPaiementCalcule === 'zero_entree';
      } else if (targetSegmentFilter === 'en_cours_acompte') {
        return est.statutPaiementCalcule === 'acompte';
      } else if (targetSegmentFilter === 'solde_en_regle') {
        return est.statutPaiementCalcule === 'solde';
      }
      return true;
    });
  }, [establishmentsWithFinancials, targetSegmentFilter, arrondissementFilter]);

  // Établissements filtrés pour l'Onglet 2 (Base & Relance)
  const targetTableFiltered = useMemo(() => {
    return establishmentsWithFinancials.filter((est) => {
      const matchesSearch =
        est.nomCommercial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        est.promoteurNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        est.codeDossier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (est.promoteurTelephone && est.promoteurTelephone.includes(searchQuery));

      const matchesStatus = statusFilter === 'all' || est.statutPaiementCalcule === statusFilter;
      const matchesArr = arrondissementTargetFilter === 'all' || est.arrondissement === arrondissementTargetFilter;

      return matchesSearch && matchesStatus && matchesArr;
    });
  }, [establishmentsWithFinancials, searchQuery, statusFilter, arrondissementTargetFilter]);

  // Lancement d'une campagne de diffusion groupée
  const handleLaunchBatchCampaign = async () => {
    if (campaignFilteredTargets.length === 0) {
      showNotification('warning', 'Aucun établissement ne correspond aux critères de ciblage sélectionnés.');
      return;
    }

    setIsBroadcasting(true);
    try {
      await sendBatchCampaign({
        titre: activeTemplate.titre,
        campaignType: activeTemplate.typeCampagne,
        channel: selectedChannel,
        messageTemplate: customMessageBody || activeTemplate.corpsTexte,
        targetSegment: targetSegmentFilter,
        arrondissementFilter: arrondissementFilter,
        periodeCible: temporalContext,
      });
      setActiveTab('journal');
    } catch (err: any) {
      showNotification('error', `Erreur lors de la diffusion : ${err?.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Préparation d'un message WhatsApp unitaire avec redirection
  const handleOpenWhatsAppDirect = (est: typeof establishmentsWithFinancials[0]) => {
    // Nettoyer le numéro de téléphone pour le Congo (+242)
    let rawPhone = (est.promoteurTelephone || '').replace(/[^0-9]/g, '');
    if (rawPhone.startsWith('0')) {
      rawPhone = '242' + rawPhone;
    } else if (!rawPhone.startsWith('242') && rawPhone.length === 9) {
      rawPhone = '242' + rawPhone;
    }

    // Choisir le texte approprié selon le statut
    let templateText = activeTemplate.corpsTexte;
    if (est.statutPaiementCalcule === 'zero_entree') {
      const zeroTmpl = OFFICIAL_CAMPAIGN_TEMPLATES.find((t) => t.id === 'tmpl-recouvrement-jan-2027-zero');
      if (zeroTmpl) templateText = zeroTmpl.corpsTexte;
    }

    const message = templateText
      .replace(/\{NOM_PROMOTEUR\}/g, est.promoteurNom || 'Promoteur')
      .replace(/\{NOM_ETABLISSEMENT\}/g, est.nomCommercial)
      .replace(/\{ARRONDISSEMENT\}/g, est.arrondissement)
      .replace(/\{CODE_DOSSIER\}/g, est.codeDossier)
      .replace(/\{MONTANT_REDEVANCE\}/g, formatCfa(est.redevanceDueCalculee))
      .replace(/\{MONTANT_PAYE\}/g, formatCfa(est.montantPayeCalcule))
      .replace(/\{RESTE_A_PAYER\}/g, formatCfa(est.resteAPayerCalcule))
      .replace(
        /\{STATUT_PAIEMENT\}/g,
        est.statutPaiementCalcule === 'zero_entree'
          ? '0 FCFA versé (Non réglé)'
          : est.statutPaiementCalcule === 'acompte'
          ? 'Acomptes partiels'
          : 'Intégralement soldé'
      );

    // Enregistrer le message dans l'historique DDL-PN
    sendCampaignMessage({
      campagneId: 'direct-whatsapp',
      campaignType:
        est.statutPaiementCalcule === 'zero_entree'
          ? 'recouvrement_janvier_2027_zero'
          : temporalContext === 'decembre_2026'
          ? 'voeux_decembre_2026'
          : 'rappel_echeance_janvier_2027_solde',
      channel: 'whatsapp',
      establishmentId: est.id,
      etablissementNom: est.nomCommercial,
      promoteurNom: est.promoteurNom,
      promoteurTelephone: est.promoteurTelephone,
      promoteurEmail: est.promoteurEmail,
      arrondissement: est.arrondissement,
      categorie: est.categorie,
      statutPaiement: est.statutPaiementCalcule,
      montantRedevance: est.redevanceDueCalculee,
      montantPaye: est.montantPayeCalcule,
      resteAPayer: est.resteAPayerCalcule,
      messageContent: message,
      statutEnvoi: 'delivre',
      expediteurNom: currentAgent?.nomComplet || 'Jacques MATOKO (Directeur)',
    });

    const waUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Envoi rapide SMS simulé
  const handleQuickSendSms = async (est: typeof establishmentsWithFinancials[0]) => {
    let templateText = activeTemplate.corpsTexte;
    if (est.statutPaiementCalcule === 'zero_entree') {
      const zeroTmpl = OFFICIAL_CAMPAIGN_TEMPLATES.find((t) => t.id === 'tmpl-recouvrement-jan-2027-zero');
      if (zeroTmpl) templateText = zeroTmpl.corpsTexte;
    }

    const message = templateText
      .replace(/\{NOM_PROMOTEUR\}/g, est.promoteurNom || 'Promoteur')
      .replace(/\{NOM_ETABLISSEMENT\}/g, est.nomCommercial)
      .replace(/\{ARRONDISSEMENT\}/g, est.arrondissement)
      .replace(/\{CODE_DOSSIER\}/g, est.codeDossier)
      .replace(/\{MONTANT_REDEVANCE\}/g, formatCfa(est.redevanceDueCalculee))
      .replace(/\{MONTANT_PAYE\}/g, formatCfa(est.montantPayeCalcule))
      .replace(/\{RESTE_A_PAYER\}/g, formatCfa(est.resteAPayerCalcule));

    await sendCampaignMessage({
      campagneId: 'direct-sms',
      campaignType:
        est.statutPaiementCalcule === 'zero_entree'
          ? 'recouvrement_janvier_2027_zero'
          : temporalContext === 'decembre_2026'
          ? 'voeux_decembre_2026'
          : 'rappel_echeance_janvier_2027_solde',
      channel: 'sms',
      establishmentId: est.id,
      etablissementNom: est.nomCommercial,
      promoteurNom: est.promoteurNom,
      promoteurTelephone: est.promoteurTelephone,
      promoteurEmail: est.promoteurEmail,
      arrondissement: est.arrondissement,
      categorie: est.categorie,
      statutPaiement: est.statutPaiementCalcule,
      montantRedevance: est.redevanceDueCalculee,
      montantPaye: est.montantPayeCalcule,
      resteAPayer: est.resteAPayerCalcule,
      messageContent: message,
      statutEnvoi: 'delivre',
      expediteurNom: currentAgent?.nomComplet || 'Jacques MATOKO (Directeur)',
    });

    showNotification('success', `SMS officiel envoyé avec succès au ${est.promoteurTelephone} (${est.nomCommercial}) !`);
  };

  // Impression de l'Avis de Recouvrement A4 officiel
  const handlePrintAvisRecouvrement = (est: typeof establishmentsWithFinancials[0]) => {
    openPrintModal('a4_recovery_notice', {
      ...est,
      referenceRelance: `REL-2027-JAN-${Math.floor(1000 + Math.random() * 9000)}`,
      dateEnvoi: new Date().toISOString(),
      statutPaiement: est.statutPaiementCalcule,
      montantRedevance: est.redevanceDueCalculee,
      montantPaye: est.montantPayeCalcule,
      resteAPayer: est.resteAPayerCalcule,
      documentHash: 'e89a3f2b4c10d7a5b678901234567890abcdef1234567890abcdef1234567890',
    });
  };

  // Copier le texte
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showNotification('info', 'Texte officiel copié dans le presse-papier !');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Ouverture du modal de personnalisation & envoi unitaire
  const handleOpenQuickSendModal = (est: typeof establishmentsWithFinancials[0]) => {
    setQuickSendEst(est);
    let templateText = activeTemplate.corpsTexte;
    if (est.statutPaiementCalcule === 'zero_entree') {
      const zeroTmpl = OFFICIAL_CAMPAIGN_TEMPLATES.find((t) => t.id === 'tmpl-recouvrement-jan-2027-zero');
      if (zeroTmpl) templateText = zeroTmpl.corpsTexte;
    }

    const message = templateText
      .replace(/\{NOM_PROMOTEUR\}/g, est.promoteurNom || 'Promoteur')
      .replace(/\{NOM_ETABLISSEMENT\}/g, est.nomCommercial)
      .replace(/\{ARRONDISSEMENT\}/g, est.arrondissement)
      .replace(/\{CODE_DOSSIER\}/g, est.codeDossier)
      .replace(/\{MONTANT_REDEVANCE\}/g, formatCfa(est.redevanceDueCalculee))
      .replace(/\{MONTANT_PAYE\}/g, formatCfa(est.montantPayeCalcule))
      .replace(/\{RESTE_A_PAYER\}/g, formatCfa(est.resteAPayerCalcule))
      .replace(
        /\{STATUT_PAIEMENT\}/g,
        est.statutPaiementCalcule === 'zero_entree'
          ? '0 FCFA versé (Non réglé)'
          : est.statutPaiementCalcule === 'acompte'
          ? 'Acomptes partiels'
          : 'Intégralement soldé'
      );

    setQuickMessageText(message);
    setQuickChannel('whatsapp');
  };

  // Exécution de l'envoi unitaire personnalisé
  const handleExecuteQuickSend = async () => {
    if (!quickSendEst) return;
    const est = establishmentsWithFinancials.find((e) => e.id === quickSendEst.id) || (quickSendEst as any);

    if (quickChannel === 'whatsapp') {
      let rawPhone = (est.promoteurTelephone || '').replace(/[^0-9]/g, '');
      if (rawPhone.startsWith('0')) {
        rawPhone = '242' + rawPhone;
      } else if (!rawPhone.startsWith('242') && rawPhone.length === 9) {
        rawPhone = '242' + rawPhone;
      }

      await sendCampaignMessage({
        campagneId: 'direct-whatsapp-custom',
        campaignType:
          est.statutPaiementCalcule === 'zero_entree'
            ? 'recouvrement_janvier_2027_zero'
            : temporalContext === 'decembre_2026'
            ? 'voeux_decembre_2026'
            : 'rappel_echeance_janvier_2027_solde',
        channel: 'whatsapp',
        establishmentId: est.id,
        etablissementNom: est.nomCommercial,
        promoteurNom: est.promoteurNom,
        promoteurTelephone: est.promoteurTelephone,
        promoteurEmail: est.promoteurEmail,
        arrondissement: est.arrondissement,
        categorie: est.categorie,
        statutPaiement: est.statutPaiementCalcule || 'zero_entree',
        montantRedevance: est.redevanceDueCalculee || est.montantRedevanceAnnuelle || 150000,
        montantPaye: est.montantPayeCalcule || est.montantEncaisse || 0,
        resteAPayer: est.resteAPayerCalcule || (est.montantRedevanceAnnuelle || 150000),
        messageContent: quickMessageText,
        statutEnvoi: 'delivre',
        expediteurNom: currentAgent?.nomComplet || 'Jacques MATOKO (Directeur)',
      });

      const waUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(quickMessageText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      showNotification('success', `Message WhatsApp préparé pour ${est.nomCommercial} !`);
    } else {
      await sendCampaignMessage({
        campagneId: 'direct-sms-custom',
        campaignType:
          est.statutPaiementCalcule === 'zero_entree'
            ? 'recouvrement_janvier_2027_zero'
            : temporalContext === 'decembre_2026'
            ? 'voeux_decembre_2026'
            : 'rappel_echeance_janvier_2027_solde',
        channel: 'sms',
        establishmentId: est.id,
        etablissementNom: est.nomCommercial,
        promoteurNom: est.promoteurNom,
        promoteurTelephone: est.promoteurTelephone,
        promoteurEmail: est.promoteurEmail,
        arrondissement: est.arrondissement,
        categorie: est.categorie,
        statutPaiement: est.statutPaiementCalcule || 'zero_entree',
        montantRedevance: est.redevanceDueCalculee || est.montantRedevanceAnnuelle || 150000,
        montantPaye: est.montantPayeCalcule || est.montantEncaisse || 0,
        resteAPayer: est.resteAPayerCalcule || (est.montantRedevanceAnnuelle || 150000),
        messageContent: quickMessageText,
        statutEnvoi: 'delivre',
        expediteurNom: currentAgent?.nomComplet || 'Jacques MATOKO (Directeur)',
      });

      showNotification('success', `SMS officiel transmis pour ${est.nomCommercial} !`);
    }

    setQuickSendEst(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Régalien & Présentation du Système de Relance */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950/80 border border-rose-600/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Congolese National Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex z-10">
          <div className="flex-1 bg-[#009543]" />
          <div className="flex-1 bg-[#fbde4a]" />
          <div className="flex-1 bg-[#dc241f]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
          <div className="flex items-start gap-4">
            <DdlLogo size="md" rounded="2xl" bordered={true} className="w-16 h-16 shadow-lg shrink-0 border-rose-500/40" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  MOD-21
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Vœux 2026 & Recouvrement 2027
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Loi N° 21-2019 • Note 151
                </span>
              </div>
              <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100 tracking-wide">
                Plateforme de Relance & Messagerie Républicaine
              </h1>
              <p className="font-garamond text-sm md:text-base text-slate-300 italic leading-relaxed">
                Pilotage proactif de la base d'établissements : meilleurs vœux de fin d'année 2026, rappels d'échéances et sommations impérieuses d'apurement pour le nouvel exercice 2027.
              </p>
            </div>
          </div>

          {/* Sélecteur de Contexte Temporel */}
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-700/80 flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase text-center">
              Période Opérationnelle Ciblée :
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTemporalContext('decembre_2026')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  temporalContext === 'decembre_2026'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Déc. 2026 (Vœux)
              </button>
              <button
                onClick={() => setTemporalContext('janvier_2027')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  temporalContext === 'janvier_2027'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                Janv. 2027 (Recouvrement)
              </button>
            </div>
          </div>
        </div>

        {/* 4 Indicateurs Stratégiques en Temps Réel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Total Établissements en Base</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-slate-100">{stats.total}</span>
              <span className="text-[11px] text-slate-500 font-medium">enregistrés</span>
            </div>
          </div>

          <div className="bg-rose-950/30 rounded-xl p-3.5 border border-rose-500/40">
            <span className="text-xs text-rose-300 block font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Zéro Entrée (0 FCFA versé)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-rose-400">{stats.zeroEntree}</span>
              <span className="text-[11px] text-rose-300/80 font-medium">Avis Janv. 2027</span>
            </div>
            <span className="text-[10px] text-rose-400 font-mono block mt-0.5">
              Dette : {formatCfa(stats.detteTotaleRecouvrer)}
            </span>
          </div>

          <div className="bg-amber-950/30 rounded-xl p-3.5 border border-amber-500/40">
            <span className="text-xs text-amber-300 block font-medium">Acomptes / En Instance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400">{stats.acomptes}</span>
              <span className="text-[11px] text-amber-300/80 font-medium">soldes partiels</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Rappels échéance 2027</span>
          </div>

          <div className="bg-emerald-950/30 rounded-xl p-3.5 border border-emerald-500/40">
            <span className="text-xs text-emerald-300 block font-medium">Soldés & En Règle 2026</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">{stats.soldes}</span>
              <span className="text-[11px] text-emerald-300/80 font-medium">civisme total</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Vœux de Décembre 2026</span>
          </div>
        </div>
      </div>

      {/* 2. Onglets de Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('campagnes')}
          className={`px-5 py-3 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'campagnes'
              ? 'bg-slate-800/90 text-rose-400 border-b-2 border-rose-500 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Send className="w-4 h-4" />
          Campagnes de Diffusion Groupée ({campaignBatches.length})
        </button>

        <button
          onClick={() => setActiveTab('base_cibles')}
          className={`px-5 py-3 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'base_cibles'
              ? 'bg-slate-800/90 text-rose-400 border-b-2 border-rose-500 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Building className="w-4 h-4" />
          Base des Établissements & Relance Directe ({establishments.length})
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`px-5 py-3 font-medium text-sm rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-slate-800/90 text-rose-400 border-b-2 border-rose-500 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Journal des Messages & Preuves d'Envoi ({campaignMessages.length})
        </button>
      </div>

      {/* TAB 1: CAMPAGNES DE DIFFUSION GROUPÉE */}
      {activeTab === 'campagnes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne Gauche: Choix du Template & Ciblage */}
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  1. Modèles de Campagnes Républicaines
                </h3>

                <div className="space-y-2.5">
                  {OFFICIAL_CAMPAIGN_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedTemplateId === tmpl.id
                          ? tmpl.typeCampagne === 'recouvrement_janvier_2027_zero'
                            ? 'bg-rose-950/40 border-rose-500 shadow-md'
                            : 'bg-amber-950/40 border-amber-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200 block">
                          {tmpl.titre}
                        </span>
                        {tmpl.periode === 'decembre_2026' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            Déc. 2026
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                            Janv. 2027
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 font-garamond italic">
                        {tmpl.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtres de Ciblage */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  2. Segmentation de la Base Cible
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Statut Financier Cible
                  </label>
                  <select
                    value={targetSegmentFilter}
                    onChange={(e) => setTargetSegmentFilter(e.target.value as CampaignTargetSegment)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium"
                  >
                    <option value="all">Tous les Établissements (Campagne Globale)</option>
                    <option value="zero_entree">🚨 Zéro Entrée Uniquement (0 FCFA versé)</option>
                    <option value="en_cours_acompte">⏳ En Cours / Acomptes Partiels</option>
                    <option value="solde_en_regle">✅ Entièrement Soldés & En Règle</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Arrondissement de Pointe-Noire
                  </label>
                  <select
                    value={arrondissementFilter}
                    onChange={(e) => setArrondissementFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium"
                  >
                    <option value="all">Tous les 6 Arrondissements</option>
                    <option value="Lumumba">Arrondissement 1 : Lumumba</option>
                    <option value="Mvou-Mvou">Arrondissement 2 : Mvou-Mvou</option>
                    <option value="Tié-Tié">Arrondissement 3 : Tié-Tié</option>
                    <option value="Loandjili">Arrondissement 4 : Loandjili</option>
                    <option value="Mongo-Mpoukou">Arrondissement 5 : Mongo-Mpoukou</option>
                    <option value="Ngoyo">Arrondissement 6 : Ngoyo</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Canal Principal de Diffusion
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChannel('whatsapp')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedChannel === 'whatsapp'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp Web
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedChannel('sms')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedChannel === 'sms'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      SMS Républicain
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Destinataires qualifiés :</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    {campaignFilteredTargets.length} établissement(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Colonne Droite: Éditeur & Prévisualisation Dynamique */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-cinzel text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Send className="w-4 h-4 text-rose-400" />
                      3. Éditeur du Message Républicain Officiel
                    </h3>
                    <p className="text-xs text-slate-400 font-garamond italic">
                      Les balises entre accolades {'{NOM_PROMOTEUR}'}, {'{NOM_ETABLISSEMENT}'}, {'{ARRONDISSEMENT}'}, {'{RESTE_A_PAYER}'} seront remplacées automatiquement pour chaque exploitant.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(customMessageBody, 'editor-text')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 self-start cursor-pointer"
                  >
                    {copiedId === 'editor-text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copier le texte
                  </button>
                </div>

                {/* Zone de Texte Personnalisable */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Texte Intégral du Message
                  </label>
                  <textarea
                    rows={12}
                    value={customMessageBody}
                    onChange={(e) => setCustomMessageBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 text-xs font-mono leading-relaxed focus:border-rose-500 focus:outline-none"
                    placeholder="Saisissez ici le texte officiel à envoyer..."
                  />
                </div>

                {/* Balises Dynamiques Disponibles */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                    Variables Républicaines Insérées Automatiquement :
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">{'{NOM_PROMOTEUR}'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">{'{NOM_ETABLISSEMENT}'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">{'{ARRONDISSEMENT}'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">{'{CODE_DOSSIER}'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">{'{MONTANT_REDEVANCE}'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">{'{MONTANT_PAYE}'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-red-400 border border-slate-700">{'{RESTE_A_PAYER}'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-yellow-300 border border-slate-700">{'{STATUT_PAIEMENT}'}</span>
                  </div>
                </div>

                {/* Actions de Diffusion */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Diffusion programmée pour : <strong className="text-slate-100">{campaignFilteredTargets.length} destinataire(s)</strong>
                  </div>

                  <button
                    type="button"
                    disabled={isBroadcasting || campaignFilteredTargets.length === 0}
                    onClick={handleLaunchBatchCampaign}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xl flex items-center justify-center gap-2 transition hover:scale-102 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {isBroadcasting
                      ? 'Diffusion en cours...'
                      : `Diffuser la Vague (${campaignFilteredTargets.length} cibles)`}
                  </button>
                </div>
              </div>

              {/* Historique des Vagues Lancées */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <h4 className="font-cinzel text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Campagnes Récemment Diffusées ({campaignBatches.length})
                </h4>

                <div className="space-y-2">
                  {campaignBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{batch.titre}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {batch.periodeCible === 'decembre_2026' ? 'Décembre 2026' : 'Janvier 2027'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Par {batch.auteurNom} • {new Date(batch.dateCreation).toLocaleString('fr-FR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-bold">
                          ✓ {batch.totalEnvoyes} envoyé(s) via {batch.canalPrincipal.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BASE DES ÉTABLISSEMENTS & RELANCE UNITAIRE */}
      {activeTab === 'base_cibles' && (
        <div className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par établissement, exploitant, téléphone ou code dossier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="all">Tous les Statuts Fiscaux</option>
                <option value="zero_entree">🚨 Zéro Entrée (0 FCFA versé)</option>
                <option value="acompte">⏳ Acomptes Partiels</option>
                <option value="solde">✅ Entièrement Soldé</option>
              </select>

              <select
                value={arrondissementTargetFilter}
                onChange={(e) => setArrondissementTargetFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="all">Tous les Arrondissements</option>
                <option value="Lumumba">Lumumba</option>
                <option value="Mvou-Mvou">Mvou-Mvou</option>
                <option value="Tié-Tié">Tié-Tié</option>
                <option value="Loandjili">Loandjili</option>
                <option value="Mongo-Mpoukou">Mongo-Mpoukou</option>
                <option value="Ngoyo">Ngoyo</option>
              </select>
            </div>
          </div>

          {/* Grille / Liste des Établissements */}
          <div className="space-y-3">
            {targetTableFiltered.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Aucun établissement ne correspond à ces critères.</p>
              </div>
            ) : (
              targetTableFiltered.map((est) => {
                const isZero = est.statutPaiementCalcule === 'zero_entree';
                const isAcompte = est.statutPaiementCalcule === 'acompte';
                const isSolde = est.statutPaiementCalcule === 'solde';

                return (
                  <div
                    key={est.id}
                    className={`bg-slate-900/90 border rounded-2xl p-4 shadow-lg transition-all space-y-3 ${
                      isZero
                        ? 'border-rose-600/40 hover:border-rose-500'
                        : isAcompte
                        ? 'border-amber-600/30 hover:border-amber-500'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full">
                            {est.codeDossier}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {est.arrondissement} ({est.quartier})
                          </span>
                          {isZero ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase flex items-center gap-1">
                              <BadgeAlert className="w-3.5 h-3.5 text-rose-400" />
                              Zéro Entrée Constatée
                            </span>
                          ) : isAcompte ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Acompte Partiel
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Soldé & En Règle
                            </span>
                          )}
                        </div>

                        <h3 className="font-cinzel text-base font-bold text-slate-100 mt-1">
                          {est.nomCommercial}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Exploitant : <strong className="text-slate-200">{est.promoteurNom}</strong> • Téléphone : <strong className="font-mono text-slate-300">{est.promoteurTelephone}</strong>
                        </p>
                      </div>

                      {/* Boutons d'Action Directe */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 0. Personnaliser */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickSendModal(est)}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          title="Personnaliser et prévisualiser le message avant envoi"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          Personnaliser
                        </button>

                        {/* 1. Bouton WhatsApp Direct */}
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppDirect(est)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
                          title="Ouvrir WhatsApp avec message officiel personnalisé"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>

                        {/* 2. Bouton SMS */}
                        <button
                          type="button"
                          onClick={() => handleQuickSendSms(est)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
                          title="Envoyer un SMS républicain via la passerelle DDL-PN"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          SMS
                        </button>

                        {/* 3. Avis de Recouvrement A4 pour les 0 entrée */}
                        {isZero && (
                          <button
                            type="button"
                            onClick={() => handlePrintAvisRecouvrement(est)}
                            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
                            title="Générer l'Avis de Recouvrement officiel A4 avec Sommation"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Avis A4
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Données Financières */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Catégorie Activité :</span>
                        <span className="text-slate-300">{est.categorie}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Redevance Annuelle :</span>
                        <span className="font-mono text-slate-200 font-semibold">{formatCfa(est.redevanceDueCalculee)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Montant Versé Constaté :</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatCfa(est.montantPayeCalcule)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Reste à Recouvrer :</span>
                        <span className={`font-mono font-bold ${isZero ? 'text-rose-400 text-sm' : isAcompte ? 'text-amber-400' : 'text-slate-400'}`}>
                          {formatCfa(est.resteAPayerCalcule)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: JOURNAL DES MESSAGES & PREUVES D'ENVOI */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Journal Républicain des Notifications & Preuves d'Envoi
                </h3>
                <p className="text-xs text-slate-400 font-garamond italic">
                  Chaque notification est tracée avec sa référence officielle, son canal de diffusion, l'horodatage et l'accusé de réception.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                {campaignMessages.length} message(s) tracé(s)
              </span>
            </div>

            <div className="space-y-2.5">
              {campaignMessages.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Aucun message de relance n'a encore été diffusé.</p>
                </div>
              ) : (
                campaignMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 transition space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          {msg.referenceRelance}
                        </span>
                        <span className="font-bold text-slate-200">
                          {msg.etablissementNom}
                        </span>
                        <span className="text-slate-400">
                          ({msg.promoteurNom} • {msg.promoteurTelephone})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(msg.dateEnvoi).toLocaleString('fr-FR')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                          ✓ {msg.channel.toUpperCase()} DELIVRÉ
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {msg.messageContent}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>Expéditeur : <strong className="text-slate-400">{msg.expediteurNom}</strong></span>
                      <span>Arrondissement : <strong>{msg.arrondissement}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL D'ENVOI UNITAIRE & PERSONNALISATION RAPIDE */}
      {quickSendEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                  <Send className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-slate-100">
                    Notification Républicaine Directe
                  </h3>
                  <p className="text-xs text-slate-400 font-garamond italic">
                    {quickSendEst.nomCommercial} • {quickSendEst.promoteurNom} ({quickSendEst.promoteurTelephone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickSendEst(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Choix du Canal */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickChannel('whatsapp')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                  quickChannel === 'whatsapp'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Web
              </button>

              <button
                type="button"
                onClick={() => setQuickChannel('sms')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                  quickChannel === 'sms'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Phone className="w-4 h-4" />
                SMS Passerelle DDL
              </button>
            </div>

            {/* Éditeur de Message Personnalisé */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">
                  Message Personnalisé pour l'Exploitant
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyText(quickMessageText, 'quick-text')}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  {copiedId === 'quick-text' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copier
                </button>
              </div>
              <textarea
                rows={10}
                value={quickMessageText}
                onChange={(e) => setQuickMessageText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs font-mono text-slate-100 leading-relaxed focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Récapitulatif Destinataire */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[10px]">Numéro officiel :</span>
                <span className="font-mono font-bold text-slate-200">{quickSendEst.promoteurTelephone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Dossier :</span>
                <span className="font-mono text-amber-400">{quickSendEst.codeDossier}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Période :</span>
                <span className="font-semibold text-slate-300">
                  {temporalContext === 'decembre_2026' ? 'Décembre 2026' : 'Janvier 2027'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickSendEst(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickSend}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-1.5 transition hover:scale-102 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {quickChannel === 'whatsapp' ? 'Ouvrir & Envoyer sur WhatsApp' : 'Expédier par SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
