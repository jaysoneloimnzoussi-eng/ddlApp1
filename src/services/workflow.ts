import { ComplianceStatus, Establishment, InspectionSchedule } from '../types';

/**
 * The operational lifecycle is deliberately kept in one place.  Screens may
 * initiate an action, but only this module decides the resulting business
 * state.  It prevents the calendar, cash desk and authorisation modules from
 * calculating the same facts differently.
 */
export const ACTIVE_SCHEDULE_STATUSES: InspectionSchedule['statut'][] = [
  'planifie',
  'en_cours',
];

export const calculatePaymentState = (
  establishment: Pick<Establishment, 'montantRedevanceAnnuelle' | 'montantEncaisse' | 'statut'>,
  amount: number,
): Pick<Establishment, 'montantEncaisse' | 'soldeRestantDu' | 'statut'> => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Le montant versé doit être supérieur à zéro.');
  }

  const due = Math.max(0, Number(establishment.montantRedevanceAnnuelle) || 0);
  const paid = Math.max(0, Number(establishment.montantEncaisse) || 0);
  const remainingBeforePayment = Math.max(0, due - paid);

  if (amount > remainingBeforePayment) {
    throw new Error(`Le versement dépasse le solde dû (${remainingBeforePayment.toLocaleString('fr-FR')} FCFA).`);
  }

  const montantEncaisse = paid + amount;
  const soldeRestantDu = Math.max(0, due - montantEncaisse);
  const statut: ComplianceStatus = soldeRestantDu === 0
    ? 'en_regle'
    : establishment.statut === 'attestation_provisoire'
      ? 'attestation_provisoire'
      : 'acompte_verse';

  return { montantEncaisse, soldeRestantDu, statut };
};

export const hasActiveScheduleConflict = (
  schedules: InspectionSchedule[],
  candidate: Pick<InspectionSchedule, 'etablissementId' | 'dateTournee' | 'heure' | 'typeMission'>,
  excludedScheduleId?: string,
): boolean => schedules.some((schedule) =>
  schedule.id !== excludedScheduleId
  && schedule.etablissementId === candidate.etablissementId
  && schedule.dateTournee === candidate.dateTournee
  && schedule.heure === candidate.heure
  && schedule.typeMission === candidate.typeMission
  && ACTIVE_SCHEDULE_STATUSES.includes(schedule.statut),
);

export const canIssueAuthorisation = (establishment: Establishment): boolean =>
  !establishment.estEteintOuFerme
  && establishment.soldeRestantDu === 0
  && establishment.statut === 'en_regle';

export const assertAuthorisationCanBeDelivered = (establishment: Establishment): void => {
  if (!canIssueAuthorisation(establishment)) {
    throw new Error(
      'L’autorisation ne peut être délivrée qu’après règlement intégral et validation du dossier.',
    );
  }
};
