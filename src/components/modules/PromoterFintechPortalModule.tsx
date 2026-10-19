import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  CreditCard,
  Download,
  Printer,
  CheckCircle2,
  FileCheck2,
  Upload,
  ArrowRight,
  ShieldCheck,
  Lock,
  X,
  CalendarClock,
  Clock,
} from 'lucide-react';
import { formatCfa } from '../../services/crypto';
import { generateAttestationDocx } from '../../services/docxGenerator';
import { CashReceipt } from '../../types';

export const PromoterFintechPortalModule: React.FC = () => {
  const {
    establishments,
    addReceipt,
    updateEstablishment,
    rescheduleAppointment,
    openPrintModal,
    showNotification,
  } = useApp();

  const [selectedEstId, setSelectedEstId] = useState(establishments[0]?.id || '');
  const [momoNumber, setMomoNumber] = useState('+242 06 654 22 10');
  const [montantPaiement, setMontantPaiement] = useState<number>(50000);
  const [operator, setOperator] = useState<'momo_mtn' | 'airtel_money'>('momo_mtn');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showUssdModal, setShowUssdModal] = useState(false);
  const [ussdPin, setUssdPin] = useState('');
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<CashReceipt | null>(null);

  // Certificat upload simulation
  const [limiteurFileName, setLimiteurFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Modal Report RDV Tenancier
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [promoterNewDate, setPromoterNewDate] = useState('');
  const [promoterNewHeure, setPromoterNewHeure] = useState('10:00');
  const [promoterReason, setPromoterReason] = useState('Demande de délai pour trésorerie / acompte');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const est = establishments.find((x) => x.id === selectedEstId) || establishments[0];

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!est) return;
    setShowUssdModal(true);
  };

  const handleConfirmUssd = async () => {
    if (!ussdPin) {
      showNotification('warning', 'Veuillez saisir votre code PIN Mobile Money pour valider.');
      return;
    }

    setIsProcessingPayment(true);
    setShowUssdModal(false);

    // Simulate instant secure gateway execution
    setTimeout(async () => {
      try {
        const transRef = `${operator === 'momo_mtn' ? 'MTN' : 'AIRTEL'}-CG-${Date.now().toString().slice(-6)}`;
        const newRec = await addReceipt({
          datePaiement: new Date().toISOString().replace('T', ' ').substring(0, 16),
          etablissementId: est.id,
          etablissementNom: est.nomCommercial,
          promoteurNom: est.promoteurNom,
          arrondissement: est.arrondissement,
          montantVerse: Number(montantPaiement),
          resteAPayer: Math.max(0, est.soldeRestantDu - montantPaiement),
          modePaiement: operator,
          referenceTransaction: transRef,
          inspecteurOuCaissier: 'Guichet Électronique Télépaiement DDL-PN',
          brigadeCode: 'FINTECH-PORTAL',
          natureRecette: est.regimeFiscal === 'informel_forfaitaire' ? 'Forfait Informel SAA' : 'Redevance Proportionnelle',
        });

        if (!est.numeroAttestation) {
          await updateEstablishment(est.id, {
            numeroAttestation: `${est.id.slice(-3)}/2026`,
            dateDelivranceAttestation: new Date().toISOString().substring(0, 10),
          });
        }

        setPaymentSuccessReceipt(newRec);
        showNotification('success', `Télépaiement réussi ! Quittance ${newRec.numeroQuittance} générée.`);
      } catch (err: any) {
        showNotification('error', `Échec du télépaiement: ${err.message}`);
      } finally {
        setIsProcessingPayment(false);
        setUssdPin('');
      }
    }, 1200);
  };

  const handleUploadCertificat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(async () => {
        setLimiteurFileName(file.name);
        await updateEstablishment(est.id, { limiteurInstalle: true });
        setIsUploading(false);
        showNotification('success', `Certificat acoustique "${file.name}" transmis avec succès à la Direction !`);
      }, 1000);
    }
  };

  const handleOpenPromoterReschedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setPromoterNewDate(est.prochainRdvDate || tomorrow.toISOString().substring(0, 10));
    setPromoterNewHeure(est.prochainRdvHeure || '10:00');
    setPromoterReason('Demande de délai pour trésorerie / versement acompte');
    setShowRescheduleModal(true);
  };

  const handleConfirmPromoterReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!est) return;
    if (!promoterNewDate) {
      showNotification('error', 'Veuillez sélectionner une date valide.');
      return;
    }
    setIsSubmittingReschedule(true);
    try {
      await rescheduleAppointment({
        establishmentId: est.id,
        nextRdvDate: promoterNewDate,
        nextRdvHeure: promoterNewHeure,
        nextRdvMotif: `Demande de report promoteur: ${promoterReason}`,
      });
      showNotification('success', `Rendez-vous reprogrammé au ${promoterNewDate} à ${promoterNewHeure}. Votre inspecteur en est notifié.`);
      setShowRescheduleModal(false);
    } catch (err: any) {
      showNotification('error', `Erreur: ${err.message || 'Impossible de reprogrammer'}`);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-17
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              Portail Télépaiement & Espace Promoteur
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interface autonome des promoteurs : consultation du solde, télépaiement MTN MoMo / Airtel Money & télédéclaration acoustique
          </p>
        </div>
      </div>

      {/* Select active establishment for promoter view */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Établissement actif :</span>
          <select
            value={selectedEstId}
            onChange={(e) => {
              setSelectedEstId(e.target.value);
              setPaymentSuccessReceipt(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-bold"
          >
            {establishments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nomCommercial} — {e.arrondissement} (Solde restant : {formatCfa(e.soldeRestantDu)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase font-mono ${
              est.statut === 'en_regle'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            Statut : {est.statut.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Bannière de Rendez-vous / Convocations */}
      {est.prochainRdvDate && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100 text-sm">
                Rendez-vous convenu avec l'Inspecteur DDL-PN
              </p>
              <p className="text-purple-300 text-xs mt-0.5">
                Passage prévu le <strong>{est.prochainRdvDate}</strong> à <strong>{est.prochainRdvHeure || '10:00'}</strong> — Motif : {est.prochainRdvMotif || 'Contrôle et versement d\'acompte'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenPromoterReschedule}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Reprogrammer ce RDV</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Télépaiement MoMo / Airtel (6 colonnes) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Régler ma Redevance en Ligne (Mobile Money)</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">100% Sécurisé</span>
          </div>

          <form onSubmit={handleInitiatePayment} className="space-y-4 text-xs">
            {/* Operator choice */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOperator('momo_mtn')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                  operator === 'momo_mtn'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-slate-950 font-bold flex items-center justify-center font-mono text-xs">
                  MoMo
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-100">MTN MoMo</p>
                  <p className="text-[10px] text-slate-400">*105#</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOperator('airtel_money')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                  operator === 'airtel_money'
                    ? 'bg-red-500/20 border-red-500 text-red-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center font-mono text-xs">
                  Airtel
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-100">Airtel Money</p>
                  <p className="text-[10px] text-slate-400">*128#</p>
                </div>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Numéro Mobile Money (Congo +242)</label>
              <input
                type="text"
                required
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder="+242 06 000 00 00"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Montant à Régler (FCFA)</label>
              <input
                type="number"
                required
                value={montantPaiement}
                onChange={(e) => setMontantPaiement(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-base font-bold text-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessingPayment}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isProcessingPayment
                  ? 'Traitement en cours...'
                  : `Initier le Débit de ${formatCfa(montantPaiement)} via ${operator === 'momo_mtn' ? 'MTN MoMo' : 'Airtel Money'}`}
              </span>
            </button>
          </form>

          {/* Quittance Instantanée */}
          {paymentSuccessReceipt && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Quittance Électronique Validée !</span>
              </div>
              <p className="font-mono text-slate-300">
                Numéro : <strong>{paymentSuccessReceipt.numeroQuittance}</strong>
              </p>
              <p className="font-mono text-slate-400 text-[11px]">
                Réf Transaction : {paymentSuccessReceipt.referenceTransaction}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openPrintModal('pos_receipt', paymentSuccessReceipt)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Voir Reçu Thermique 58mm
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Colonne Droite : Attestation Immédiate & Télédéclaration Limiteur (6 colonnes) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Téléchargement de l'Attestation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Mon Attestation Provisoire de Dépôt 2026</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Votre titre officiel d'exploitation transitoire est disponible immédiatement dès régularisation.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => openPrintModal('a4_attestation', est)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                Imprimer Attestation A4
              </button>
              <button
                onClick={() => generateAttestationDocx(est)}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                Télécharger Word (.docx)
              </button>
            </div>
          </div>

          {/* Télédéclaration Limiteur de Bruit */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Télédéclaration Certificat Acoustique / Limiteur</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Téléversez le certificat d'installation de votre limiteur de son pour éviter toute mise en demeure de police administrative.
            </p>

            <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center space-y-2">
              <input
                type="file"
                id="certifFile"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleUploadCertificat}
                className="hidden"
              />
              <label
                htmlFor="certifFile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition border border-slate-700"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{isUploading ? 'Transmission en cours...' : 'Sélectionner le Fichier Certificat'}</span>
              </label>

              {limiteurFileName ? (
                <p className="text-[11px] text-emerald-400 font-mono">
                  ✓ Fichier transmis : {limiteurFileName}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500">Formats acceptés: PDF, PNG, JPG (Max 10 Mo)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* USSD Modal Simulation */}
      {showUssdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-slate-100">
                  {operator === 'momo_mtn' ? 'MTN MoMo (*105#)' : 'Airtel Money (*128#)'}
                </span>
              </div>
              <button
                onClick={() => setShowUssdModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-2">
              <p>
                Autorisez-vous le paiement de{' '}
                <strong className="text-emerald-400">{formatCfa(montantPaiement)}</strong> à la{' '}
                <strong>DDL-PN Régie des Recettes</strong> ?
              </p>
              <p className="text-[11px] text-slate-400">Numéro débité : {momoNumber}</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-slate-300 font-semibold">Entrez votre code secret PIN :</label>
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={ussdPin}
                onChange={(e) => setUssdPin(e.target.value)}
                placeholder="****"
                className="w-full text-center tracking-widest text-lg px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUssdModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUssd}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow"
              >
                Confirmer le débit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORT / REPROGRAMMATION DU TENANCIER */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-purple-400" />
                <span>Demande de Report / Reprogrammation</span>
              </h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <p className="font-bold text-slate-200">{est.nomCommercial}</p>
              <p className="text-slate-400">Promoteur : {est.promoteurNom} • {est.arrondissement}</p>
              {est.prochainRdvDate && (
                <p className="text-purple-300 text-[11px] pt-1 border-t border-slate-800">
                  Rendez-vous actuel : {est.prochainRdvDate} à {est.prochainRdvHeure || '10:00'}
                </p>
              )}
            </div>

            <form onSubmit={handleConfirmPromoterReschedule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Nouvelle date souhaitée *</label>
                  <input
                    type="date"
                    required
                    value={promoterNewDate}
                    onChange={(e) => setPromoterNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Heure souhaitée *</label>
                  <input
                    type="time"
                    required
                    value={promoterNewHeure}
                    onChange={(e) => setPromoterNewHeure(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Motif du report / Proposition</label>
                <select
                  value={promoterReason}
                  onChange={(e) => setPromoterReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                >
                  <option value="Demande de délai pour trésorerie / acompte">Demande de délai pour trésorerie / versement acompte</option>
                  <option value="Promoteur en déplacement / Absence temporaire">Promoteur en déplacement / Absence temporaire</option>
                  <option value="Attente de pièces administratives du dossier">Attente de pièces administratives du dossier</option>
                  <option value="Travaux d'insonorisation et limiteur en cours">Travaux d'insonorisation et limiteur en cours</option>
                  <option value="Autre arrangement avec l'agent de brigade">Autre arrangement avec l'agent de brigade</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  {isSubmittingReschedule ? 'Enregistrement...' : 'Valider la Reprogrammation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
