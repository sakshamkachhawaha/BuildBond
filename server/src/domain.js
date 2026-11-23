import { HttpError } from './http.js';

export const PROJECT_STATUS = Object.freeze({
  OPEN: 'OPEN',
  ACTIVE: 'ACTIVE',
  DISPUTED: 'DISPUTED',
  COMPLETED: 'COMPLETED',
});

export const MILESTONE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  REJECTED: 'REJECTED',
  RELEASED: 'RELEASED',
});

export const PROOF_STATUS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

export const DISPUTE_STATUS = Object.freeze({
  OPEN: 'OPEN',
  WITHDRAWN: 'WITHDRAWN',
});

export const LEDGER_KIND = Object.freeze({
  DEPOSIT: 'DEPOSIT',
  RELEASE: 'RELEASE',
});

export const MILESTONE_TRANSITIONS = Object.freeze({
  PENDING: ['SUBMITTED'],
  SUBMITTED: ['RELEASED', 'REJECTED'],
  REJECTED: ['SUBMITTED'],
  RELEASED: [],
});

export function assertMilestoneTransition(from, to) {
  const allowed = MILESTONE_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new HttpError(
      409,
      `A milestone cannot move from ${from} to ${to}.`,
    );
  }
}

export function summarizeLedger(entries) {
  let deposited = 0;
  let released = 0;

  for (const entry of entries) {
    if (entry.kind === LEDGER_KIND.DEPOSIT) {
      deposited += entry.amount_paise;
    } else if (entry.kind === LEDGER_KIND.RELEASE) {
      released += entry.amount_paise;
    }
  }

  return {
    deposited,
    released,
    held: deposited - released,
    funded: deposited > 0,
  };
}