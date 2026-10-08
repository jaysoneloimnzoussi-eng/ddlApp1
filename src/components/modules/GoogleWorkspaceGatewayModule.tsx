import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CloudCog,
  Calendar,
  Mail,
  FileText,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  createGoogleCalendarEvent,
  listGoogleCalendarEvents,
  sendOfficialGmail,
  createOfficialGoogleDoc,
  GoogleDocResult,
} from '../../services/googleWorkspace';

export const GoogleWorkspaceGatewayModule: React.FC = () => {
  const {
    googleUser,
    googleAccessToken,
    handleGoogleSignIn,
    setShowDomainAuthModal,
    establishments,
    receipts,
    schedules,
    showNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'calendar' | 'gmail' | 'docs'>('calendar');

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Gmail State
  const [emailTo, setEmailTo] = useState(establishments[0]?.promoteurEmail || 'promoteur@congo-loisirs.cg');
  const [emailSubject, setEmailSubject] = useState('[DDL-PN / MCAPNIT] Notification Officielle de Régularisation Administrative');
  const [emailTemplate, setEmailTemplate] = useState<'convocation' | 'mise_en_demeure' | 'quittance'>('convocation');
  const [emailContent, setEmailContent] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showConfirmSendEmail, setShowConfirmSendEmail] = useState(false);

  // Docs State
  const [docTitle, setDocTitle] = useState(`Rapport_Inspection_DDL_PN_${new Date().toISOString().substring(0, 10)}`);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocResult, setCreatedDocResult] = useState<GoogleDocResult | null>(null);

  // Load template content when template changes
  useEffect(() => {
    if (emailTemplate === 'convocation') {
      setEmailSubject('[DDL-PN / SAA] Convocation officielle pour régularisation de titre d\'exploitation');
      setEmailContent(
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #047857;">DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</h2>
          <p><strong>RÉPUBLIQUE DU CONGO</strong> • Unité - Travail - Progrès</p>
          <hr style="border: 1px solid #cbd5e1; margin: 15px 0;" />
          <p>Madame, Monsieur le Promoteur,</p>
          <p>Dans le cadre de la campagne annuelle de régularisation administrative des établissements de loisirs de Pointe-Noire (Loi N° 21-2019), nous vous prions de bien vouloir vous présenter au Guichet Unique de la Direction Départementale des Loisirs (sis au Centre-Ville Administratif, Rond-point de la République) muni des pièces techniques suivantes :</p>
          <ul>
            <li>Fiche technique d'identification de l'établissement ;</li>
            <li>Certificat de conformité ou d'installation d'un limiteur acoustique agréé ;</li>
            <li>Justificatif d'acquittement de la redevance départementale.</li>
          </ul>
          <p>Cette démarche vous permettra d'obtenir immédiatement votre <strong>Attestation Provisoire de Dépôt 2026</strong> en attendant votre Agrément Ministériel.</p>
          <p>Veuillez agréer l'expression de nos salutations distinguées.</p>
          <p><strong>Gildas AMBETOS</strong><br/>Chef de Service Animation & Agréments (SAA)</p>
        </div>`
      );
    } else if (emailTemplate === 'mise_en_demeure') {
      setEmailSubject('[URGENT - DDL-PN] Mise en Demeure sous 72 heures - Infraction Sonométrique');
      setEmailContent(
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #b91c1c;">DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</h2>
          <p style="color: #b91c1c; font-weight: bold;">POLICE ADMINISTRATIVE DES LOISIRS & CONTENTIEUX</p>
          <hr style="border: 1px solid #cbd5e1; margin: 15px 0;" />
          <p><strong>À L'ATTENTION DU PROMOTEUR :</strong></p>
          <p>Les services assermentés de la Brigade Mobile SAA ont dressé procès-verbal constatant des émergences sonores anormales et un dépassement critique des seuils réglementaires nocturnes prescrits par l'Arrêté Préfectoral N° 045/P-PNR/CAB.</p>
          <p style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px;">
            <strong>INJONCTION FORMELLE :</strong> Il vous est imparti un délai de <strong>soixante-douze (72) heures</strong> pour procéder à la mise en conformité de vos installations et à la pose d'un limiteur de pression acoustique homologué.
          </p>
          <p>À défaut, il sera fait application stricte des sanctions prévues par la Loi N° 21-2019, notamment la fermeture administrative immédiate avec pose de scellés et réquisition de la force publique.</p>
          <p><strong>Le Directeur Départemental des Loisirs de Pointe-Noire</strong></p>
        </div>`
      );
    } else {
      setEmailSubject('[DDL-PN / SAF] Confirmation de versement et Quittance de régie');
      setEmailContent(
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
          <h2 style="color: #047857;">DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE</h2>
          <p>RÉGIE DES RECETTES DU SERVICE ADMINISTRATIF ET FINANCIER (SAF)</p>
          <hr style="border: 1px solid #cbd5e1; margin: 15px 0;" />
          <p>Madame, Monsieur le Promoteur,</p>
          <p>La Régie Financière certifie avoir reçu votre versement au titre de la redevance d'exploitation départementale pour l'exercice 2026.</p>
          <p>Votre quittance officielle a été générée avec empreinte numérique infalsifiable.</p>
          <p>Merci pour votre civisme républicain.</p>
          <p><strong>Sylvain KIMBEMBE</strong><br/>Caissier Principal SAF</p>
        </div>`
      );
    }
  }, [emailTemplate]);

  // Load Google Calendar Events
  const fetchCalendar = async () => {
    if (!googleAccessToken) return;
    setIsLoadingCalendar(true);
    try {
      const items = await listGoogleCalendarEvents(googleAccessToken);
      setCalendarEvents(items);
    } catch (err: any) {
      console.warn('Erreur calendrier:', err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken) {
      fetchCalendar();
    }
  }, [googleAccessToken]);

  // Handle Send Email
  const handleExecuteSendEmail = async () => {
    if (!googleAccessToken) return;
    setIsSendingEmail(true);
    try {
      await sendOfficialGmail(googleAccessToken, emailTo, emailSubject, emailContent);
      showNotification('success', `Courriel officiel transmis avec succès à ${emailTo} !`);
      setShowConfirmSendEmail(false);
    } catch (err: any) {
      showNotification('error', `Échec de l'envoi Gmail : ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Create Google Doc
  const handleCreateGoogleDoc = async () => {
    if (!googleAccessToken) return;
    setIsCreatingDoc(true);
    try {
      const reportBody = `MINISTÈRE DE LA CULTURE, DES ARTS,
DU PATRIMOINE NATIONAL ET DE
L'INDUSTRIE TOURISTIQUE
———
DIRECTION GÉNÉRALE DES LOISIRS
———
DÉPARTEMENT DE POINTE-NOIRE
———
DIRECTION DÉPARTEMENTALE DES LOISIRS DE POINTE-NOIRE
———
RÉPUBLIQUE DU CONGO
Unité – Travail – Progrès

${docTitle.toUpperCase()}
Date d'édition : ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}

I. SITUATION TERRITORIALE DU DÉPARTEMENT DE POINTE-NOIRE
Nombre d'établissements recensés : ${establishments.length}
Montant global des redevances recouvrées : ${receipts.reduce((a, b) => a + b.montantVerse, 0).toLocaleString('fr-FR')} FCFA
Établissements en règle : ${establishments.filter(e => e.statut === 'en_regle').length}
Établissements sous mise en demeure : ${establishments.filter(e => e.statut === 'mise_en_demeure').length}

II. RECOMMANDATIONS DU COMMANDEMENT TERRITORIAL SAA
1. Renforcement des patrouilles nocturnes sonométriques dans Tié-Tié et Ngoyo.
2. Extension de l'obligation de limiteur de bruit aux espaces ouverts et terrasses.
3. Transmission de la prochaine vague de dossiers d'agrément définitif à la Direction Générale à Brazzaville.

Fait à Pointe-Noire,
Le Directeur Départemental des Loisirs
Jean Richard NTSEKE NGOUAKA`;

      const result = await createOfficialGoogleDoc(googleAccessToken, docTitle, reportBody);
      setCreatedDocResult(result);
      showNotification('success', `Document Google Docs créé avec succès !`);
    } catch (err: any) {
      showNotification('error', `Erreur création Google Doc : ${err.message}`);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-04
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Passerelle Google Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interconnexion souveraine avec Google Calendar, Gmail administratif et Google Docs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {googleAccessToken ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Connecté en tant que {googleUser?.email}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
              >
                <span>Se connecter à Google Workspace</span>
              </button>
              <button
                onClick={() => setShowDomainAuthModal(true)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                title="Aide configuration domaine Firebase Authentication"
              >
                Aide Domaine Firebase
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'calendar'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Google Calendar (Tournées & Missions)</span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'gmail'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail (Notifications & Mises en Demeure)</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'docs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Google Docs (Rapports Administratifs Cloud)</span>
        </button>
      </div>

      {/* TAB 1: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Événements & Descentes Synchronisées dans Google Calendar</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Vos missions enregistrées dans l'agenda officiel de la direction
              </p>
            </div>
            <button
              onClick={fetchCalendar}
              disabled={isLoadingCalendar || !googleAccessToken}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
              Actualiser Google Calendar
            </button>
          </div>

          {!googleAccessToken ? (
            <div className="text-center py-10 space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Connectez-vous à votre compte Google Workspace pour voir et synchroniser vos tournées d'inspection directement dans votre agenda officiel.
              </p>
              <button
                onClick={handleGoogleSignIn}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-slate-950 font-bold text-xs"
              >
                Activer Google Calendar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {calendarEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Aucun événement à venir détecté dans Google Calendar ou synchronisation en cours.
                </div>
              ) : (
                calendarEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        <span>{evt.summary || 'Mission DDL-PN'}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Lieu: {evt.location || 'Pointe-Noire'} • Début :{' '}
                        {new Date(evt.start?.dateTime || evt.start?.date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {evt.htmlLink && (
                      <a
                        href={evt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <span>Ouvrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GMAIL */}
      {activeTab === 'gmail' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Envoi de Notifications & Mises en Demeure Officielles par Gmail</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Transmission électronique instantanée avec valeur de notification administrative
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Choisir le destinataire */}
            <div className="space-y-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-slate-300 font-semibold block">Sélectionner un Établissement</label>
              <select
                onChange={(e) => {
                  const est = establishments.find((x) => x.id === e.target.value);
                  if (est && est.promoteurEmail) {
                    setEmailTo(est.promoteurEmail);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
              >
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nomCommercial} ({est.promoteurNom})
                  </option>
                ))}
              </select>

              <label className="text-slate-300 font-semibold block pt-2">Modèle de Courriel Officiel</label>
              <div className="space-y-1.5">
                {(['convocation', 'mise_en_demeure', 'quittance'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEmailTemplate(t)}
                    className={`w-full py-2 px-3 rounded-lg text-left font-semibold text-xs transition border ${
                      emailTemplate === t
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t === 'convocation' && "1. Convocation Régularisation"}
                    {t === 'mise_en_demeure' && "2. Mise en Demeure 72h (Alerte)"}
                    {t === 'quittance' && "3. Confirmation Quittance Trésor"}
                  </button>
                ))}
              </div>
            </div>

            {/* Éditeur de Courriel */}
            <div className="lg:col-span-2 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Destinataire (Email du Promoteur)</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Objet du Courriel</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Aperçu du Corps HTML du Message</label>
                <div
                  className="p-4 rounded-lg bg-white text-slate-950 text-xs max-h-60 overflow-y-auto border border-slate-300 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: emailContent }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmSendEmail(true)}
                disabled={!googleAccessToken || isSendingEmail}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer la Notification via Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Gmail as required by Workspace Skill */}
      {showConfirmSendEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              Confirmer l'envoi du courriel
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous certain de vouloir envoyer ce courriel officiel à <strong className="text-white">{emailTo}</strong> au nom de la Direction Départementale des Loisirs ?
            </p>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400">
              <p><strong>Objet :</strong> {emailSubject}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSendEmail(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleExecuteSendEmail}
                disabled={isSendingEmail}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5"
              >
                {isSendingEmail ? 'Envoi en cours...' : 'Confirmer et Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE DOCS */}
      {activeTab === 'docs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Génération & Export Automatique vers Google Docs</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Création directe d'un document administratif Google Docs hébergé sur votre Google Drive
              </p>
            </div>
          </div>

          <div className="max-w-xl space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Titre du Document Google Docs</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold"
              />
            </div>

            <p className="text-slate-400 text-[11px]">
              Ce document inclura la synthèse départementale chiffrée, la répartition par arrondissement, et les avis techniques du SAA formatés pour signature.
            </p>

            <button
              onClick={handleCreateGoogleDoc}
              disabled={!googleAccessToken || isCreatingDoc}
              className="py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingDoc ? 'Création sur Google Docs...' : 'Créer le Document sur Google Docs'}</span>
            </button>

            {createdDocResult && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl space-y-2 mt-4">
                <p className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Document généré avec succès !
                </p>
                <p className="text-[11px] text-slate-300">
                  Titre : <strong>{createdDocResult.title}</strong>
                </p>
                <a
                  href={createdDocResult.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition mt-2"
                >
                  <span>Ouvrir dans Google Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
